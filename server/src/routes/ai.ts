import { Router, type Request, type Response, type Router as ExpressRouter } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { GeminiProvider, GeminiUpstreamError } from "../ai/gemini-provider.js";
import type { ChatTurn } from "../ai/types.js";

const MAX_BODY_BYTES = 48 * 1024;
const turnsSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(8_000),
  }).strict()).min(1).max(20),
}).strict();

const router: ExpressRouter = Router();
const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many chat requests. Please try again shortly." },
});

function sendEvent(res: Response, event: "delta" | "done" | "error", data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

router.get("/status", (_req, res) => {
  res.json({ available: Boolean(process.env.GEMINI_API_KEY) });
});

router.post("/chat", chatLimiter, async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI chat is not configured." });
    return;
  }

  const advertisedSize = Number(req.get("content-length") || 0);
  if (advertisedSize > MAX_BODY_BYTES) {
    res.status(413).json({ error: "Chat request is too large." });
    return;
  }
  let encodedSize: number;
  try {
    encodedSize = Buffer.byteLength(JSON.stringify(req.body));
  } catch {
    res.status(400).json({ error: "Invalid chat request." });
    return;
  }
  if (encodedSize > MAX_BODY_BYTES) {
    res.status(413).json({ error: "Chat request is too large." });
    return;
  }

  const parsed = turnsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid chat request. Provide 1–20 messages with valid roles and text." });
    return;
  }

  const turns: ChatTurn[] = parsed.data.messages;
  const controller = new AbortController();
  // Response close, not request close: incoming requests may finish before SSE output does.
  res.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  try {
    const provider = new GeminiProvider({ apiKey, model: process.env.GEMINI_MODEL || "gemini-3.8-flash" });
    for await (const chunk of provider.streamChat(turns, controller.signal)) {
      if (controller.signal.aborted || res.destroyed) return;
      // Guard against accidental credential echo in any model output.
      const safeChunk = chunk.split(apiKey).join("[redacted]");
      sendEvent(res, "delta", { text: safeChunk });
    }
    if (!controller.signal.aborted && !res.destroyed) sendEvent(res, "done", { ok: true });
  } catch (error) {
    if (controller.signal.aborted || res.destroyed) return;
    const message = error instanceof GeminiUpstreamError
      ? "The AI provider is temporarily unavailable. Please try again."
      : "The AI request could not be completed.";
    sendEvent(res, "error", { error: message });
  } finally {
    if (!res.writableEnded && !res.destroyed) res.end();
  }
});

export { router };
export default router;
