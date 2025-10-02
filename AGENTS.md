# Repository Guidelines

## Project Structure & Module Organization
- `pages/` contains Next.js routes and API handlers; UI state lives in these entry points.
- `components/`, `contexts/`, and `hooks/` expose reusable client logic; avoid duplicating stateful code across pages.
- `workers/` hosts the Cloudflare Worker (Hono + Prisma Edge); only `/api/auth/*` is fully migrated today.
- `prisma/` stores the schema and migration history; run generators from the repository root.
- `docs/` aggregates deployment and operations guides; update alongside any behaviour changes.

## Build, Test, and Development Commands
- `npm run dev` — start the Next.js app on port 3000 using the local API routes.
- `npm run build && npm run export` — produce the static bundle consumed by Cloudflare Pages.
- `npx prisma generate && npx prisma db push` — regenerate Prisma clients and sync schema to the configured Postgres instance.
- `cd workers && npx wrangler dev` — emulate the Worker locally (only auth endpoints currently respond).

## Coding Style & Naming Conventions
- JavaScript/React with 2-space indentation; semicolons are typically omitted.
- Use PascalCase for components, camelCase for helpers, and kebab-case for file names when exporting single utilities.
- Prefer functional components with hooks; keep server logic stateless and colocate shared utilities under `lib/`.

## Testing Guidelines
- A dedicated test runner is not yet configured. When adding suites, mirror source paths under `__tests__/` and use descriptive filenames such as `transcriptRuns.test.js`.
- Cover auth, upload quota edges, and long-audio fallbacks; document gaps inside PRs until tooling lands.

## Commit & Pull Request Guidelines
- Follow imperative, conventional-style messages (e.g., `fix: handle GCS upload failures`).
- PRs should explain scope, note schema or env changes, include manual test steps, and attach UI screenshots for visual updates.

## Security & Configuration Tips
- Required secrets: `DATABASE_URL`, `DIRECT_URL`, `AUTH_JWT_SECRET`, `GCS_BUCKET`, `GCP_*`, `GEMINI_API_KEY`, and `CORS_ORIGIN` for Worker deployments.
- Avoid committing service-account JSON; store private keys in Cloudflare Secrets or local `.env` files excluded from git.
- Soft-delete support relies on `deletedAt` checks; enforce this guard when extending Prisma queries.
