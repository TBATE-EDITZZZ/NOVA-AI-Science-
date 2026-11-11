import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { createDatabase } from "../db/connection.js";
import { requireAuth } from "./auth.js";

const router: Router = Router();
const syncLimit = rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: true, legacyHeaders: false });
const stateSchema = z.record(z.string(), z.string()).superRefine((state, ctx) => {
  const entries = Object.entries(state);
  if (entries.length > 60) ctx.addIssue({ code: "custom", message: "Too many workspace entries." });
  for (const [key, value] of entries) {
    if (!/^nova\.[A-Za-z0-9._:-]{1,120}$/.test(key)) ctx.addIssue({ code: "custom", message: "Workspace keys must be NOVA-owned local-storage keys." });
    if (value.length > 48_000) ctx.addIssue({ code: "custom", message: "A workspace entry is too large." });
  }
});

router.get("/", requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  const { pool } = createDatabase();
  try {
    const [rows] = await pool.execute<any[]>("SELECT state,updated_at AS updatedAt FROM workspace_snapshots WHERE user_id=? LIMIT 1", [req.user!.id]);
    if (!rows.length) return res.json({ state: null, updatedAt: null });
    const row = rows[0];
    const state = typeof row.state === "string" ? JSON.parse(row.state) : row.state;
    return res.json({ state: state && typeof state === "object" && !Array.isArray(state) ? state : {}, updatedAt: row.updatedAt });
  } catch { return res.status(500).json({ error: "Unable to load the account workspace." }); }
  finally { await pool.end(); }
});

router.put("/", requireAuth, syncLimit, async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  const parsed = z.object({ state: stateSchema }).strict().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Workspace data is invalid or exceeds its entry limits." });
  const serialized = JSON.stringify(parsed.data.state);
  if (Buffer.byteLength(serialized, "utf8") > 160 * 1024) return res.status(413).json({ error: "Workspace snapshot is too large. Export it locally and sync a smaller selection." });
  const { pool } = createDatabase();
  try {
    await pool.execute("INSERT INTO workspace_snapshots (user_id,state) VALUES (?,CAST(? AS JSON)) ON DUPLICATE KEY UPDATE state=VALUES(state)", [req.user!.id, serialized]);
    return res.json({ ok: true, updatedAt: new Date().toISOString(), entryCount: Object.keys(parsed.data.state).length });
  } catch { return res.status(500).json({ error: "Unable to save the account workspace." }); }
  finally { await pool.end(); }
});

export default router;
