# NOVA — Implementation and Design Plan

## Product scope and delivery order

Deliver the full attached NOVA specification: an AI-powered science learning, research, discovery, and experimentation ecosystem, not just a landing page, chatbot, or game. Keep all 21 named product destinations and the complete feature scope in `TODO.md`; implement them as route-level, useful interfaces with working actions and connected data flows. Delivery order is an implementation sequence, not a cut to scope:

1. Establish the app shell, responsive navigation, design system, public route/content rendering, account/data foundations, preferences, search and dashboard.
2. Build NOVA AI and its provider boundary; topic explorer, knowledge library, research and trusted-source flows.
3. Build the physics, chemistry and biology labs plus reusable 2D/3D simulation controls, graphing, datasets, comparison, reset and model caveats.
4. Build space, human biology, mathematics, Earth/environment and engineering destinations with relevant interactive visualizations.
5. Build learning paths, quizzes and progress; research notebook, projects, community, notifications, custom dashboard widgets, settings and exports.
6. Complete multilingual/theme support, PWA/offline behavior for selected learning content, responsive and keyboard/touch accessibility, SEO, documentation and deployment configuration.

Real data sources must be attributable. Label educational approximations as simplified models. Never represent illustrative fixtures as live news, verified research, user records, citations or provider output. A third-party provider that is not configured or reachable must produce a clear recovery/setup state, not fabricated success. Preserve all attachment criteria in `TODO.md`; do not mark unsupported functionality complete.

## Architecture and data flow

Use a TypeScript monorepo with a React/Vite client and Node/Express server. React Router provides the navigable information architecture. Use Three.js / React Three Fiber for efficient lazy-loaded 3D scenes, native accessible SVG for responsive scientific plots, Framer Motion for restrained transitions, and KaTeX/MathJax for equations. Tailwind can support shared responsive tokens. The API validates and rate-limits requests before provider or database access. A modular server-side Gemini adapter reads a protected `GEMINI_API_KEY` environment variable; no Gemini secret ships to client JavaScript. AI prompts and UI labels separate established evidence, model limitations, hypotheses, uncertainty, and speculation. Support streaming only where the upstream/downstream flow can be cancelled correctly; guest conversations stay local and can move only through explicit workspace sync.

Use the enabled managed MySQL database for real user identity, OAuth linkage, application sessions and a bounded account-owned workspace snapshot. The shipped workspace explicitly keeps guest browser data local; a signed-in user can trigger a snapshot sync, restore it to another device, export account records, or delete the account and associated data. Keep this transfer deliberate rather than uploading on login. The migration also establishes normalized tables for chats/messages, bookmarks/collections, research, learning progress, projects and community, but those structured CRUD integrations remain future outcomes and must not be represented as connected merely because a table exists. Commit additive, deterministic migrations, record each completed migration, and keep private records owner-scoped. Use Manus OAuth for registration/login, validate its state/nonce and identity on the server, and issue the exact `webdev_app_session` HttpOnly application cookie with `SameSite=None; Secure` for HTTPS Preview/published delivery. Restrict redirects and private records to the authenticated owner. Keep uploads behind supported storage/API capabilities; never accept browser-local blob/file URLs as if publicly analyzable.

Public science/article/topic routes have route-specific content, metadata and crawlable initial HTML. Use server-side rendering or deterministic prerendered pages for public routes, while authenticated workspaces remain private. Generate route manifest, sitemap/robots behavior without inventing the deployment's canonical host; omit absolute canonical/social URLs until `PUBLIC_SITE_URL` is configured. Provide an app-owned web manifest and service worker that caches only public app assets and selected educational content; never cache signed-in/private API responses. Add rate limits, typed validation, safe Markdown, accessible focus states, reduced-motion behavior and mobile-efficient/lazy 3D rendering.

## Project structure

- `client/`: Vite/React entry, route definitions, shared shell/navigation, design tokens, pages for the NOVA destinations, reusable scientific controls, diagrams, charts and Three.js scenes.
- `server/`: Express setup, route handlers, OAuth/session boundary, validation/rate limits, Gemini provider adapter, external scientific-source adapters and export endpoints.
- `shared/`: API/domain types, safe scientific utilities, formulas, curated reference metadata and validators shared by client/server.
- `db/`: additive, versioned MySQL migrations and a completion ledger for accounts, OAuth sessions, owner-scoped records and the explicitly synced account workspace snapshot; normalized product tables are not yet wired to every local workspace feature.
- `public/`: manifest, service worker, app icons and generated/source-attributed visual assets.
- Root: `plan.md`, full-criteria `TODO.md`, route manifest, pinned package/tool configuration, `.env.example` containing names and descriptions only, and `README.md` with install, local development, migrations, provider setup, build and deployment instructions.

## Design system

**Design movement:** a precise scientific instrument interface crossed with a quiet, immersive orbital observatory; the three user-specified directions—minimal professional science, futuristic AI research lab, and immersive digital science—are balanced without game UI or neon overload.

**Core principles:** scientific clarity before decoration; depth and transparency used to establish information hierarchy; real data/controls visible beside visualizations; graceful performance and legibility across phone and desktop.

**Color philosophy:** near-black/blue-black and midnight ink establish focus; cool cyan signals active discovery and is NOVA's ownable ion-cyan; violet is used sparingly for AI and transitions; warm neutral text and clear semantic colors preserve long-reading comfort and scientific legibility. Light theme reverses surfaces while retaining the same semantic accents and contrast.

**Layout paradigm:** an expandable slim navigation rail anchors the left; content unfolds as an asymmetric working surface with an observation canvas and optional contextual inspector rather than a uniform card grid. Mobile turns this into a compact header, drawer and thumb-accessible bottom destinations with a persistent NOVA AI entry.

**Signature elements:** a bespoke orbital-star NOVA mark; fine orbital arcs and measurement ticks that frame scientific visualizations; restrained translucent instrument panels with a cyan focus edge.

**Interaction and animation:** direct manipulation, sliders, toggles, search and accessible controls change the model immediately; reset and experiment comparison remain explicit. Use short ease-out transitions, gentle orbit/particle movement and restrained panel depth. Respect reduced-motion settings, avoid continuous heavy mobile rendering and provide non-3D/2D alternatives.

**Typography:** Space Grotesk for confident, compact headings; Inter for interface and explanatory reading; IBM Plex Mono for values, units and equations. Establish a clear large display / section / body / annotation hierarchy, with line length optimized for science explanations.

**Brand essence:** an intelligent, source-conscious scientific workspace for learners and curious researchers that makes complex ideas explorable; precise, curious, expansive. **Voice:** clear and inviting, never overclaiming. Examples: “Explore Beyond What You Know.” “A model is a lens—not the whole universe.”

**Wordmark and mark:** a custom wordmark paired with a small central star enclosed by a tilted orbital path, designed to remain recognizable at app-icon scale; no default-type-only logo.

**Signature brand color:** ion cyan `#58D9E6`, used selectively for active discovery and interaction rather than broad neon glow.
