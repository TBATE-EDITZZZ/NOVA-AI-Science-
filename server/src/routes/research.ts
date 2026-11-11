import { Router } from "express";
import { z } from "zod";

const router: Router = Router();
const CROSSREF_WORKS_URL = "https://api.crossref.org/works";
const REQUEST_TIMEOUT_MS = 8_000;

const crossrefRecordSchema = z.object({
  DOI: z.string().trim().min(1).optional(),
  title: z.array(z.string()).optional(),
  author: z.array(z.object({
    given: z.string().optional(),
    family: z.string().optional(),
    name: z.string().optional(),
  }).passthrough()).optional(),
  published: z.object({
    "date-parts": z.array(z.array(z.number().int())).optional(),
  }).passthrough().optional(),
  "container-title": z.array(z.string()).optional(),
  publisher: z.string().optional(),
  URL: z.string().url().optional(),
  type: z.string().optional(),
}).passthrough();

const crossrefResponseSchema = z.object({
  status: z.string().optional(),
  message: z.object({
    items: z.array(z.unknown()),
  }).passthrough(),
}).passthrough();

type ResearchResult = {
  doi?: string;
  title?: string;
  authors?: string[];
  published?: number[][];
  containerTitle?: string;
  publisher?: string;
  url?: string;
  type?: string;
};

function mapRecord(input: unknown): ResearchResult | null {
  const parsed = crossrefRecordSchema.safeParse(input);
  if (!parsed.success) return null;
  const record = parsed.data;
  const result: ResearchResult = {};

  if (record.DOI) result.doi = record.DOI;
  if (record.title?.[0]) result.title = record.title[0];
  if (record.author?.length) {
    const authors = record.author
      .map((author) => author.name?.trim() || [author.given, author.family].filter(Boolean).join(" ").trim())
      .filter((name) => name.length > 0);
    if (authors.length) result.authors = authors;
  }
  const dateParts = record.published?.["date-parts"];
  if (dateParts?.length) result.published = dateParts;
  if (record["container-title"]?.[0]) result.containerTitle = record["container-title"][0];
  if (record.publisher) result.publisher = record.publisher;
  if (record.URL) result.url = record.URL;
  if (record.type) result.type = record.type;
  return result;
}

router.get("/", async (req, res) => {
  const rawQuery = req.query.q;
  const rawLimit = req.query.limit;

  if (typeof rawQuery !== "string") {
    return res.status(400).json({ error: "Invalid query: q must be a string of 2 to 200 characters." });
  }
  const q = rawQuery.trim();
  if (q.length < 2 || q.length > 200) {
    return res.status(400).json({ error: "Invalid query: q must be a string of 2 to 200 characters." });
  }

  let rows = 10;
  if (rawLimit !== undefined) {
    const limitText = typeof rawLimit === "string" ? rawLimit.trim() : "";
    if (!/^(?:[1-9]|1\d|20)$/.test(limitText)) {
      return res.status(400).json({ error: "Invalid limit: expected an integer from 1 to 20." });
    }
    rows = Number(limitText);
  }

  const providerUrl = new URL(CROSSREF_WORKS_URL);
  providerUrl.searchParams.set("query.bibliographic", q);
  providerUrl.searchParams.set("rows", String(rows));
  const resultLink = providerUrl.toString();

  try {
    const response = await fetch(resultLink, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      const unavailable = response.status === 429 || response.status >= 500;
      return res.status(unavailable ? 503 : 502).json({
        error: unavailable ? "Crossref is temporarily unavailable." : "Crossref returned an unsuccessful response.",
        source: "Crossref",
      });
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return res.status(502).json({ error: "Crossref returned invalid JSON.", source: "Crossref" });
    }

    const envelope = crossrefResponseSchema.safeParse(body);
    if (!envelope.success) {
      return res.status(502).json({ error: "Crossref returned an unexpected response.", source: "Crossref" });
    }

    const results = envelope.data.message.items
      .map(mapRecord)
      .filter((item): item is ResearchResult => item !== null);

    return res.json({ source: "Crossref", resultLink, results });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return res.status(503).json({
      error: timedOut ? "Crossref request timed out." : "Unable to reach Crossref.",
      source: "Crossref",
    });
  }
});

export default router;
