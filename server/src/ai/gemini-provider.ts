import type { AIProvider, ChatTurn, GeminiProviderOptions } from "./types.js";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const UPSTREAM_TIMEOUT_MS = 60_000;
const MAX_UPSTREAM_ERROR_BYTES = 1_024;

const SYSTEM_INSTRUCTIONS = `You are NOVA, an AI assistant. Distinguish established scientific knowledge from uncertainty, hypotheses, and speculation. Never fabricate sources or citations; say when you cannot verify a reference. Explain important model assumptions and simplifications. Do not casually present unsafe experiments or procedures; emphasize appropriate safety and qualified supervision.`;

export class GeminiUpstreamError extends Error {
  constructor() {
    super("The AI provider could not complete the request.");
    this.name = "GeminiUpstreamError";
  }
}

function toInput(turns: readonly ChatTurn[]): string {
  return `${SYSTEM_INSTRUCTIONS}\n\nConversation:\n${turns
    .map((turn) => `${turn.role === "assistant" ? "Assistant" : "User"}: ${turn.content}`)
    .join("\n")}\nAssistant:`;
}

function parseEventData(block: string): string | undefined {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""))
    .join("\n");
  return data || undefined;
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(options: GeminiProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || "gemini-3.8-flash";
  }

  async *streamChat(turns: readonly ChatTurn[], signal: AbortSignal): AsyncIterable<string> {
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), UPSTREAM_TIMEOUT_MS);
    const abortFromCaller = () => timeoutController.abort();
    signal.addEventListener("abort", abortFromCaller, { once: true });

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify({ model: this.model, input: toInput(turns), stream: true, store: false }),
        signal: timeoutController.signal,
      });
      if (!response.ok || !response.body) {
        // Consume only a small bounded amount; never relay provider error details.
        if (response.body) {
          const reader = response.body.getReader();
          try {
            const { value } = await reader.read();
            void value?.slice(0, MAX_UPSTREAM_ERROR_BYTES);
          } finally {
            await reader.cancel().catch(() => undefined);
          }
        }
        throw new GeminiUpstreamError();
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;
      const handleBlock = (block: string): { text?: string; terminal?: boolean } => {
        const data = parseEventData(block);
        if (!data || data === "[DONE]") return { terminal: data === "[DONE]" };
        try {
          const event: unknown = JSON.parse(data);
          if (!event || typeof event !== "object") return {};
          const item = event as { event_type?: unknown; delta?: { type?: unknown; text?: unknown } };
          if (item.event_type === "interaction.completed") return { terminal: true };
          if (item.event_type === "step.delta" && item.delta?.type === "text" && typeof item.delta.text === "string") {
            return { text: item.delta.text };
          }
          return {};
        } catch {
          return {};
        }
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          // A blank line terminates an SSE record; support both LF and CRLF.
          let boundary: RegExpExecArray | null;
          const delimiter = /\r?\n\r?\n/g;
          while ((boundary = delimiter.exec(buffer)) !== null) {
            const block = buffer.slice(0, boundary.index);
            buffer = buffer.slice(boundary.index + boundary[0].length);
            delimiter.lastIndex = 0;
            const parsed = handleBlock(block);
            if (parsed.text) yield parsed.text;
            if (parsed.terminal) { completed = true; break; }
          }
          if (completed || done) break;
        }
        // Process an event terminated only by EOF, rather than dropping the final record.
        if (!completed && buffer.trim()) {
          const parsed = handleBlock(buffer);
          if (parsed.text) yield parsed.text;
        }
        if (!completed) throw new GeminiUpstreamError();
      } finally {
        await reader.cancel().catch(() => undefined);
      }
    } catch (error) {
      if (signal.aborted) throw error;
      throw new GeminiUpstreamError();
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abortFromCaller);
    }
  }
}
