import { Router, type Request, type Response, type NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { createHash, createHmac, randomBytes, timingSafeEqual, randomUUID } from "node:crypto";
import { createDatabase } from "../db/connection.js";

export interface AuthenticatedUser {
  id: string;
  displayName: string | null;
  email: string | null;
  openId?: string;
}
type ResolvedSession = { user: AuthenticatedUser; sessionId?: string };
declare global {
  namespace Express {
    interface Request { user?: AuthenticatedUser; sessionId?: string; }
  }
}
export const authRouter: Router = Router();
const SESSION_COOKIE = "webdev_app_session";
const NONCE_COOKIE = "nova_oauth_nonce";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const nonceLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const callbackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const cookieOptions = (secure: boolean, maxAge?: number) => ({ httpOnly: true, secure, sameSite: secure ? "none" as const : "lax" as const, path: "/", ...(maxAge === undefined ? {} : { maxAge }) });
const config = () => {
  const { MANUS_PROJECT_ID, MANUS_OAUTH_PORTAL_URL, MANUS_OAUTH_API_URL, MANUS_JWT_SECRET } = process.env;
  if (!MANUS_PROJECT_ID || !MANUS_OAUTH_PORTAL_URL || !MANUS_OAUTH_API_URL || !MANUS_JWT_SECRET) throw new Error("Auth is not configured");
  return { clientId: MANUS_PROJECT_ID, portalUrl: MANUS_OAUTH_PORTAL_URL, apiUrl: MANUS_OAUTH_API_URL.replace(/\/$/, ""), jwtSecret: MANUS_JWT_SECRET };
};
function cookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) { try { return decodeURIComponent(value.join("=")); } catch { return undefined; } }
  }
  return undefined;
}
function secureEqual(a: string, b: string): boolean {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function verifyPreviewJwt(token: string, secret: string, clientId: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (header.alg !== "HS256" || typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000 || claims.appId !== clientId) return null;
    const expected = createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest("base64url");
    return secureEqual(parts[2], expected) ? claims : null;
  } catch { return null; }
}
async function identityUser(openId: string, name: string | null, email: string | null): Promise<AuthenticatedUser> {
  const { db, pool } = createDatabase();
  try {
    const [found] = await pool.execute<any[]>("SELECT u.id,u.display_name AS displayName,u.email FROM oauth_accounts oa JOIN users u ON u.id=oa.user_id WHERE oa.provider=? AND oa.provider_account_id=? LIMIT 1", ["manus", openId]);
    if (found.length) {
      await pool.execute("UPDATE users SET display_name=COALESCE(?,display_name), email=COALESCE(?,email) WHERE id=?", [name, email, found[0].id]);
      return { id: found[0].id, displayName: name ?? found[0].displayName, email: email ?? found[0].email, openId };
    }
    const userId = randomUUID();
    await pool.execute("INSERT INTO users (id,display_name,email) VALUES (?,?,?)", [userId, name, email]);
    try { await pool.execute("INSERT INTO oauth_accounts (id,user_id,provider,provider_account_id) VALUES (?,?,?,?)", [randomUUID(), userId, "manus", openId]); }
    catch (error) { await pool.execute("DELETE FROM users WHERE id=?", [userId]); throw error; }
    return { id: userId, displayName: name, email, openId };
  } finally { await pool.end(); }
}
async function createSession(user: AuthenticatedUser): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  const { pool } = createDatabase();
  try {
    await pool.execute("INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)", [randomUUID(), user.id, createHash("sha256").update(token).digest("hex"), expiresAt]);
  } finally { await pool.end(); }
  return token;
}
async function resolveUser(req: Request): Promise<ResolvedSession | null> {
  const token = cookie(req, SESSION_COOKIE);
  if (!token) return null;
  const { db, pool } = createDatabase();
  try {
    const { MANUS_JWT_SECRET, MANUS_PROJECT_ID } = process.env;
    if (MANUS_JWT_SECRET && MANUS_PROJECT_ID) {
      const claims = verifyPreviewJwt(token, MANUS_JWT_SECRET, MANUS_PROJECT_ID);
      const openId = claims && (typeof claims.openId === "string" ? claims.openId : typeof claims.sub === "string" ? claims.sub : undefined);
      if (openId) {
        // Resolve using verified identity only; identity metadata is refreshed by OAuth on the next login.
        const [account] = await pool.execute<any[]>("SELECT u.id,u.display_name AS displayName,u.email FROM oauth_accounts oa JOIN users u ON u.id=oa.user_id WHERE oa.provider=? AND oa.provider_account_id=? LIMIT 1", ["manus", openId]);
        if (account.length) return { user: { id: account[0].id, displayName: account[0].displayName, email: account[0].email, openId } };
      }
    }
    const hash = createHash("sha256").update(token).digest("hex");
    const [rows] = await pool.execute<any[]>("SELECT s.id AS sessionId,u.id,u.display_name AS displayName,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP(3) LIMIT 1", [hash]);
    return rows.length ? { user: { id: rows[0].id, displayName: rows[0].displayName, email: rows[0].email }, sessionId: rows[0].sessionId } : null;
  } finally { await pool.end(); }
}
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const resolved = await resolveUser(req);
    if (!resolved) { res.status(401).json({ error: "Authentication required." }); return; }
    req.user = resolved.user; if (resolved.sessionId) req.sessionId = resolved.sessionId; next();
  } catch { res.status(500).json({ error: "Unable to verify session." }); }
}
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try { const resolved = await resolveUser(req); if (resolved) { req.user = resolved.user; if (resolved.sessionId) req.sessionId = resolved.sessionId; } next(); }
  catch { next(); }
}
authRouter.post("/start", nonceLimiter, async (req, res) => {
  try {
    const { clientId, portalUrl } = config();
    const origin = req.body?.origin;
    if (typeof origin !== "string") return res.status(400).json({ error: "Invalid sign-in request." });
    let parsed: URL;
    try { parsed = new URL(origin); } catch { return res.status(400).json({ error: "Invalid sign-in request." }); }
    const local = parsed.protocol === "http:" && ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname);
    const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim() || req.get("host");
    const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
    const requestOrigin = (() => { try { if (!forwardedHost) return undefined; const proto = forwardedProto || (local ? "http" : "https"); return new URL(`${proto}://${forwardedHost}`).origin; } catch { return undefined; } })();
    const configuredOrigin = (() => { try { const value = process.env.PUBLIC_SITE_URL; if (!value) return undefined; const url = new URL(value); return url.protocol === "https:" && url.pathname === "/" ? url.origin : undefined; } catch { return undefined; } })();
    if ((!local && parsed.protocol !== "https:") || parsed.origin !== origin || parsed.username || parsed.password || ![requestOrigin, configuredOrigin].includes(parsed.origin)) return res.status(400).json({ error: "Invalid sign-in request." });
    const redirectUri = `${parsed.origin}/api/auth/callback`;
    const nonce = randomBytes(32).toString("base64url");
    const state = Buffer.from(JSON.stringify({ redirectUri, nonce })).toString("base64url");
    res.cookie(NONCE_COOKIE, nonce, cookieOptions(parsed.protocol === "https:", 10 * 60 * 1000));
    const url = new URL(`${portalUrl.replace(/\/+$/, "")}/app-auth`);
    url.searchParams.set("appId", clientId); url.searchParams.set("redirectUri", redirectUri); url.searchParams.set("state", state); url.searchParams.set("responseType", "code");
    return res.json({ url: url.toString() });
  } catch { return res.status(503).json({ error: "Sign-in is temporarily unavailable." }); }
});
authRouter.get("/callback", callbackLimiter, async (req, res) => {
  const nonce = cookie(req, NONCE_COOKIE);
  res.clearCookie(NONCE_COOKIE, { path: "/" });
  try {
    const { clientId, apiUrl } = config();
    const rawState = req.query.state;
    if (!nonce || typeof rawState !== "string" || rawState.length > 4096) return res.status(400).json({ error: "Sign-in could not be completed." });
    let state: any;
    try { state = JSON.parse(Buffer.from(rawState, "base64url").toString("utf8")); } catch { return res.status(400).json({ error: "Sign-in could not be completed." }); }
    if (!state || Object.keys(state).length !== 2 || typeof state.redirectUri !== "string" || typeof state.nonce !== "string" || !secureEqual(state.nonce, nonce)) return res.status(400).json({ error: "Sign-in could not be completed." });
    const callback = new URL(state.redirectUri);
    const local = callback.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(callback.hostname);
    if ((!local && callback.protocol !== "https:") || callback.pathname !== "/api/auth/callback" || callback.search || callback.hash || callback.origin + callback.pathname !== state.redirectUri) return res.status(400).json({ error: "Sign-in could not be completed." });
    const code = req.query.code;
    if (typeof code !== "string" || !code || code.length > 4096) return res.status(400).json({ error: "Sign-in could not be completed." });
    const exchangeResponse = await fetch(`${apiUrl}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientId, grantType: "authorization_code", code, redirectUri: state.redirectUri }), signal: AbortSignal.timeout(10000) });
    if (!exchangeResponse.ok) return res.status(401).json({ error: "Sign-in could not be completed." });
    const exchanged: any = await exchangeResponse.json();
    const accessToken = exchanged.accessToken;
    if (typeof accessToken !== "string" || !accessToken) return res.status(401).json({ error: "Sign-in could not be completed." });
    const infoResponse = await fetch(`${apiUrl}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accessToken }), signal: AbortSignal.timeout(10000) });
    if (!infoResponse.ok) return res.status(401).json({ error: "Sign-in could not be completed." });
    const info: any = await infoResponse.json();
    if (typeof info.openId !== "string" || !info.openId) return res.status(401).json({ error: "Sign-in could not be completed." });
    const user = await identityUser(info.openId, typeof info.name === "string" ? info.name.slice(0, 160) : null, typeof info.email === "string" ? info.email.slice(0, 320) : null);
    const token = await createSession(user);
    res.cookie(SESSION_COOKIE, token, cookieOptions(callback.protocol === "https:", SESSION_MS));
    return res.redirect(303, new URL("/", callback.origin).toString());
  } catch { return res.status(503).json({ error: "Sign-in could not be completed." }); }
});
authRouter.get("/session", requireAuth, (req, res) => res.json({ user: req.user }));
authRouter.post("/logout", async (req, res) => {
  try {
    const token = cookie(req, SESSION_COOKIE);
    if (token) {
      const { pool } = createDatabase();
      try { await pool.execute("DELETE FROM sessions WHERE token_hash=?", [createHash("sha256").update(token).digest("hex")]); }
      finally { await pool.end(); }
    }
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return res.json({ ok: true });
  } catch { res.clearCookie(SESSION_COOKIE, { path: "/" }); return res.json({ ok: true }); }
});
authRouter.delete("/account", requireAuth, async (req, res) => {
  try {
    const { pool } = createDatabase();
    try { await pool.execute("DELETE FROM users WHERE id=?", [req.user!.id]); }
    finally { await pool.end(); }
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return res.json({ ok: true });
  } catch { return res.status(500).json({ error: "Unable to delete account." }); }
});
authRouter.get("/export", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { pool } = createDatabase();
  try {
    const ownedTables = ["chats", "collections", "bookmarks", "research_notes", "learning_progress", "projects", "community_posts", "community_comments", "workspace_snapshots"] as const;
    const [users, accounts, ...owned] = await Promise.all([
      pool.execute<any[]>("SELECT id,display_name AS displayName,email,avatar_url AS avatarUrl,created_at AS createdAt,updated_at AS updatedAt FROM users WHERE id=?", [userId]),
      pool.execute<any[]>("SELECT provider,provider_account_id AS providerAccountId,created_at AS createdAt FROM oauth_accounts WHERE user_id=?", [userId]),
      ...ownedTables.map((table) => pool.execute<any[]>(`SELECT * FROM \`${table}\` WHERE user_id=?`, [userId])),
    ]);
    const userData: any[] = (users as any)[0]; const accountData: any[] = (accounts as any)[0];
    const data: Record<string, unknown> = { account: userData[0] ?? null, oauthAccounts: accountData };
    for (let i = 0; i < ownedTables.length; i++) { const table = ownedTables[i]; if (table) data[table] = (owned[i] as any)[0]; }
    const [chats] = await pool.execute<any[]>("SELECT id FROM chats WHERE user_id=?", [userId]);
    const chatIds = chats.map((row: any) => row.id);
    data.messages = chatIds.length ? (await pool.query("SELECT * FROM messages WHERE chat_id IN (?)", [chatIds]))[0] : [];
    const [notes] = await pool.execute<any[]>("SELECT id FROM research_notes WHERE user_id=?", [userId]);
    const noteIds = notes.map((row: any) => row.id);
    data.researchReferences = noteIds.length ? (await pool.query("SELECT * FROM research_references WHERE note_id IN (?)", [noteIds]))[0] : [];
    res.setHeader("Content-Disposition", "attachment; filename=account-export.json");
    return res.json({ exportedAt: new Date().toISOString(), data });
  } catch { return res.status(500).json({ error: "Unable to export account data." }); }
  finally { await pool.end(); }
});
export default authRouter;
