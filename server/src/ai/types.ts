export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface AIProvider {
  readonly name: string;
  streamChat(turns: readonly ChatTurn[], signal: AbortSignal): AsyncIterable<string>;
}

export interface GeminiProviderOptions {
  apiKey: string;
  model?: string;
}
