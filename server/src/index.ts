import express from "express";
import helmet from "helmet";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { readFile } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import aiRouter from "./routes/ai.js";
import authRouter from "./routes/auth.js";
import researchRouter from "./routes/research.js";
import workspaceRouter from "./routes/workspace.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const serverDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(serverDirectory, "../..");
const clientRoot = resolve(projectRoot, "client");
const clientBuild = resolve(clientRoot, "dist");
const appEntry = await readFile(resolve(clientRoot, "index.html"), "utf8");

// Preview is embedded in a cross-site iframe: retain same-origin app isolation but do not
// emit restrictive frame headers or a default CSP that blocks WebGL/Preview resources.
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, frameguard: false }));
app.use(express.json({ limit: "192kb", strict: true }));
app.get("/health", (_req, res) => res.status(200).type("text/plain").send("ok"));
app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));
app.use("/api/ai", aiRouter);
app.use("/api/auth", authRouter);
app.use("/api/research", researchRouter);
app.use("/api/workspace", workspaceRouter);

let vite: ViteDevServer | undefined;
let cachedRender: ((url: string) => string) | undefined;
if (!isProduction) {
  vite = await createViteServer({
    root: clientRoot,
    configFile: resolve(clientRoot, "vite.config.ts"),
    server: { middlewareMode: true, host: "0.0.0.0", allowedHosts: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(clientBuild, { index: false, fallthrough: true, maxAge: "1h" }));
  app.get("/manus-routes.json", async (_req, res, next) => {
    try { res.type("application/json").send(await readFile(join(clientBuild, "manus-routes.json"))); }
    catch (error) { next(error); }
  });
}

async function render(url: string): Promise<string> {
  if (vite) {
    const entry = await vite.ssrLoadModule("/src/entry-server.tsx") as { render: (location: string) => string };
    return entry.render(url);
  }
  if (!cachedRender) {
    const serverEntry = pathToFileURL(resolve(clientBuild, "server/entry-server.js")).href;
    const loaded = await import(serverEntry) as { render: (location: string) => string };
    cachedRender = loaded.render;
  }
  return cachedRender(url);
}

const titles: Record<string, { title: string; description: string }> = {
  "/": { title: "NOVA — Explore Beyond What You Know", description: "An interactive workspace for science learning, research and exploration." },
  "/ai": { title: "NOVA AI · Science assistant", description: "Explore scientific questions with NOVA's provider-backed AI assistant when the Gemini key is configured." },
  "/explore": { title: "Science Explorer · NOVA", description: "Explore sourced topic guides across physics, chemistry, biology, mathematics and Earth science." },
  "/labs": { title: "Virtual Laboratories · NOVA", description: "Open safe, interactive science laboratory workspaces and educational models." },
  "/simulations": { title: "Scientific Simulations · NOVA", description: "Adjust model variables, inspect outputs and understand where a scientific simulation simplifies reality." },
  "/space": { title: "Space Explorer · NOVA", description: "Explore a stylized solar system and NASA-attributed telescope imagery." },
  "/biology": { title: "Human Biology · NOVA", description: "Explore sourced biology explanations and interactive, schematic 3D organ-system models." },
  "/chemistry": { title: "Chemistry Lab · NOVA", description: "Explore the periodic table and a constrained chemical-equation balancing tool." },
  "/physics": { title: "Physics Lab · NOVA", description: "Adjust projectile-model inputs and inspect a plotted idealized trajectory." },
  "/math": { title: "Mathematics Studio · NOVA", description: "Explore scientific calculations, formulas, unit conversion and mathematical learning tools." },
  "/earth": { title: "Earth and Environment · NOVA", description: "Explore Earth science topics, climate, environmental systems and their source records." },
  "/engineering": { title: "Engineering Studio · NOVA", description: "Explore transparent first-principle engineering examples; not a design or safety check." },
  "/research": { title: "Research Center · NOVA", description: "Search Crossref-deposited scholarly metadata and keep a research notebook." },
  "/discoveries": { title: "Discoveries · NOVA", description: "Browse source-linked science discoveries and original public research records." },
  "/news": { title: "Scientific News · NOVA", description: "Read source-linked science stories; this curated set is not a live news feed." },
  "/learn": { title: "Learning Center · NOVA", description: "Explore adjustable science lessons, practice questions and local learning progress." },
  "/projects": { title: "Science Projects · NOVA", description: "Organize educational science-project drafts, research notes and calculations on this device." },
  "/library": { title: "Knowledge Library · NOVA", description: "Search scientific concepts, definitions, equations and source-linked learning resources." },
  "/community": { title: "Community · NOVA", description: "Create and manage private learning notes; no public posting occurs without an actual publishing feature." },
  "/dashboard": { title: "Your Dashboard · NOVA", description: "Review local NOVA learning activity and account settings." },
  "/settings": { title: "Settings · NOVA", description: "Configure NOVA display preferences and review data and privacy options." },
};
const dynamicRoutes = [/^\/learn\/[^/]+$/, /^\/discoveries\/[^/]+$/, /^\/news\/[^/]+$/, /^\/research\/[^/]+$/, /^\/projects\/[^/]+$/, /^\/library\/[^/]+$/];

app.get("*path", async (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/manus-storage/") || req.path.startsWith("/__")) return next();
  try {
    let template = appEntry;
    if (vite) template = await vite.transformIndexHtml(req.originalUrl, appEntry);
    const html = await render(req.originalUrl);
    const knownRoute = Object.hasOwn(titles, req.path) || dynamicRoutes.some((pattern) => pattern.test(req.path));
    const route = titles[req.path] ?? (req.path.startsWith("/learn/") ? titles["/learn"]! : req.path.startsWith("/discoveries/") ? titles["/discoveries"]! : req.path.startsWith("/news/") ? titles["/news"]! : req.path.startsWith("/research/") ? titles["/research"]! : req.path.startsWith("/projects/") ? titles["/projects"]! : req.path.startsWith("/library/") ? titles["/library"]! : { title: "Page not found · NOVA", description: "The requested path does not match a NOVA science page." });
    template = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`);
    template = template.replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(route.description)}$2`);
    template = template.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(route.title)}$2`);
    template = template.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeHtml(route.description)}$2`);
    template = template.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeHtml(route.title)}$2`);
    template = template.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeHtml(route.description)}$2`);
    const publicUrl = process.env.PUBLIC_SITE_URL;
    let site: URL | undefined;
    try { if (publicUrl) { const candidate = new URL(publicUrl); if (candidate.protocol === "https:" && candidate.pathname === "/" && !candidate.search && !candidate.hash) site = candidate; } } catch { /* Omit canonical/social URLs until configured with a real origin. */ }
    if (site) {
      const canonical = new URL(req.path, site).toString();
      const imageUrl = new URL("/images/pillars-of-creation-comparison.webp", site).toString();
      template = template.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${escapeHtml(imageUrl)}$2`);
      template = template.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${escapeHtml(imageUrl)}$2`);
      template = template.replace("</head>", `<link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:url" content="${escapeHtml(canonical)}"></head>`);
    }
    if (!knownRoute) template = template.replace("</head>", '<meta name="robots" content="noindex, nofollow"></head>');
    template = template.replace("<!--ssr-outlet-->", html);
    res.status(knownRoute ? 200 : 404).type("html").send(template);
  } catch (error) {
    vite?.ssrFixStacktrace(error as Error);
    next(error);
  }
});
function escapeHtml(value: string): string { return value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!); }
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (res.headersSent) return;
  const status = typeof error === "object" && error && "status" in error && typeof error.status === "number" ? error.status : 500;
  if (!isProduction) console.error(error);
  res.status(status).type("text/plain").send(status === 404 ? "Not found" : "NOVA could not complete this request.");
});

const server = app.listen(port, "0.0.0.0", () => console.log(`NOVA listening on 0.0.0.0:${port} (${isProduction ? "production" : "development"})`));
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => {
  server.close(() => { void vite?.close().finally(() => process.exit(0)); });
});
