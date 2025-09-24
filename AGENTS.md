# Repository Guidelines

## Project Structure & Module Organization
- `pages/` holds Next.js routes; API handlers live under `pages/api/`, grouped by concern (e.g., `auth/`, `audios/`, `uploads/`).
- `components/` exposes reusable React UI (currently `TranscriptPlayer`, auth scaffolding). Page-level state belongs in `pages/`.
- `lib/` contains shared server utilities: Prisma client, auth helpers, quota/audit logic, uploads, transcription engines.
- `docs/` stores operational references (upload flow, dashboard, audit). Keep these synced with behaviour.
- Tests are expected under `__tests__/` mirroring the source path once a framework is added.

## Build, Test, and Development Commands
- `npm run dev` – start Next.js with HMR; default port 3000.
- `npm run build` – create the production bundle (prerenders pages, builds API routes).
- `npm start` – serve the production build locally.
- `npx prisma db push` – sync schema to the Postgres instance (`DATABASE_URL` required).
- `npx prisma studio` – inspect/edit database data via browser UI.

## Coding Style & Naming Conventions
- JavaScript/React with 2-space indentation; semicolons follow prevailing style (currently omitted in most files).
- Component files use PascalCase, utilities camelCase or kebab-case as appropriate.
- Prefer functional React components with hooks; avoid class components.
- Keep API handlers stateless; always invoke `setCors` and return explicit status codes.
- Shared logic belongs in `lib/`; avoid duplicating Prisma access patterns in route files.

## Testing Guidelines
- Testing framework is not yet configured. When introduced, place suites under `__tests__/path/to/module.test.js`.
- Target edge cases: upload quota breaches, missing auth, large-audio transcription fallback.
- Ensure new helpers expose pure functions to simplify unit testing once tooling lands.

## Commit & Pull Request Guidelines
- Use imperative commit messages (`feat:`, `fix:` patterns align with existing history).
- PRs should summarise scope, list env or schema changes, outline manual test steps, and attach UI screenshots for visible changes.
- Keep diffs focused; split unrelated refactors into separate PRs.

## Security & Configuration Tips
- Required env vars: `DATABASE_URL`, `AUTH_JWT_SECRET`, `GCS_BUCKET`, Google Cloud credentials (`GOOGLE_APPLICATION_CREDENTIALS`, `GCLOUD_PROJECT`).
- Upload + transcription APIs expect valid Bearer tokens; unauthenticated requests are rejected early.
- Signed audio playback uses short-lived V4 URLs; avoid logging full URLs in production.

## Agent-Specific Instructions
- When editing server code, guard Prisma selects with `deletedAt: null` for soft-delete support.
- Record audit events via `recordAuditLog` when introducing new user-visible actions.
- Update relevant docs (`docs/`) alongside code changes so operators stay informed.
