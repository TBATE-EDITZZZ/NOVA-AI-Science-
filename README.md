# NOVA — Explore Beyond What You Know

NOVA is a responsive science-learning and research workspace built with React, TypeScript, Vite and an Express server. Its public modules include a lazy-loaded 3D solar-system view and 3D anatomical schematics, a 118-element periodic table, constrained chemical-equation balancing, idealized physics and engineering calculators, function graphs, quizzes, a source-linked science catalog, Crossref metadata search, and a streamed Google Gemini adapter. The app distinguishes modeled, sourced, local-only and credential-gated behavior instead of presenting simulated or unavailable data as real.

## Run locally

Use Node.js 22+ and the pinned pnpm workspace (`corepack pnpm install`). Start with `pnpm dev`; Vite SSR and API share port 3000. Check `http://localhost:3000/health`. Run `pnpm typecheck`, then `pnpm build` for production output. `pnpm start` serves the production build, honoring `PORT` and defaulting to 3000.

## Configure integrations

**Gemini AI:** set `GEMINI_API_KEY` with the project's protected secret input, for the server only. Never expose it through a browser-prefixed variable or commit it. `GEMINI_MODEL` can override the default. The server uses Gemini's streaming Interactions API and requests `store:false`; see Google's [Interactions API](https://ai.google.dev/gemini-api/docs/interactions) and [streaming guide](https://ai.google.dev/gemini-api/docs/streaming). Without credentials, the assistant reports that generation is unavailable rather than returning fabricated answers.

**Manus accounts and MySQL:** platform-provided Manus OAuth settings, `MANUS_JWT_SECRET`, `MANUS_PROJECT_ID`, and `DATABASE_URL` are required for persistent sign-in. Review `db/migrations/0001_initial_schema.sql`, then explicitly apply the additive `CREATE TABLE IF NOT EXISTS` migration to the intended managed project database with `pnpm db:migrate` before using account-backed features. This database is shared by development and the published application; do not run migrations against a database you do not control. The application uses the required `webdev_app_session` cookie. For public HTTPS Preview it uses `SameSite=None; Secure`; plain-HTTP localhost is handled separately.

Guest chats, bookmarks, projects, research notes, progress and settings remain in this browser's local storage. A signed-in user can explicitly merge local data into an account snapshot from the Dashboard; local values win matching keys. Restoring the account snapshot replaces matching local entries and asks for confirmation. The snapshot is private and bounded. The account export and account deletion endpoints are server-side; deletion permanently removes account-owned records. Login does not silently upload guest data.

**Research:** the server proxies Crossref's public works API with validation and an eight-second timeout. Results preserve provider metadata and source URLs; Crossref records can be incomplete. Network failures are reported instead of replaced with invented references.

**NASA:** Space Explorer uses the NASA Science record for the Pillars of Creation comparison. See `client/public/images/SOURCES.md` for attribution. The WebP asset preserves both telescope views and is substantially smaller than the source PNG. The planet scene is intentionally stylized, not to scale, and not a live ephemeris.

## Data, safety and offline behavior

Physics, chemistry, mathematics and engineering tools are educational models, not lab, medical, engineering or safety instructions. The projectile simulation ignores drag and assumes constant gravity. The pH calculation is an ideal dilute-concentration estimate. The neutral-formula balancer checks atom conservation, not whether a reaction is plausible. The anatomy scene is schematic, not to scale, and not diagnostic; generated biology imagery is illustrative.

Community drafts are private local notes; this build does not publish public posts. The service worker caches the public app shell only. It deliberately does not cache authenticated API responses, Gemini results or private `/manus-storage/` media. Search-engine canonical and social URLs are emitted only when an HTTPS `PUBLIC_SITE_URL` origin is explicitly configured; NOVA does not infer a canonical address from its internal Preview host.

## Project layout

- `client/src/App.tsx` — responsive navigation, search and route map.
- `client/src/features/ScientificPages.tsx` — scientific learning and workspace experiences.
- `client/src/features/space/SolarSystemScene.tsx` — interactive solar-system scene.
- `client/src/features/biology/AnatomyScene.tsx` — low-detail organ-system schematic with orbit controls.
- `client/src/data/` — science topic and element reference catalogs.
- `shared/src/science/engines.ts` — bounded arithmetic, unit, gas-state and projectile calculations.
- `server/src/routes/` — AI, authentication, Crossref research and account workspace APIs.
- `server/src/db/` and `db/migrations/` — MySQL schema and explicit additive migration.

## Further source documentation

- [Google Gemini text generation](https://ai.google.dev/gemini-api/docs/text-generation)
- [Google Gemini Interactions API](https://ai.google.dev/gemini-api/docs/interactions)
- [Google Gemini streaming](https://ai.google.dev/gemini-api/docs/streaming)
- [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [NASA Science: Pillars of Creation](https://science.nasa.gov/asset/webb/pillars-of-creation-hubble-and-webb-images-side-by-side/)
- [OpenStax Biology 2e](https://openstax.org/details/books/biology-2e)
- [OpenStax University Physics Volume 1](https://openstax.org/details/books/university-physics-volume-1)
