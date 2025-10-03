# Supabase Integration

This guide explains how to point the LingoLoop stack at a Supabase-hosted Postgres
instance and keep both the Next.js app and the Cloudflare Worker in sync.

## 1. Create the project in Supabase
- Sign in at <https://supabase.com> and create a new project.
- Supabase provisions two connection strings:
  - **Connection Pooling** (recommended for serverless/edge) – used for Prisma at runtime.
  - **Direct Connection** – used by Prisma CLI when pushing schema migratons.
- Grab the **service key** (Settings → API → `service_role`) for server-side access patterns.
- From the project **Settings → Database → Connection string** copy both URLs:
  - `postgres://postgres:<password>@db.<project>.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=60&sslmode=require`
  - `postgres://postgres:<password>@aws-0-<region>.supabase.co:5432/postgres?sslmode=require`

> ℹ️  Supabase hosts Postgres and wraps it with PgBouncer. Prisma Edge/Serverless must
> talk to PgBouncer (the 6543 port). Prisma CLI still needs the direct connection (5432)
> to run migrations.

## 2. Configure environment variables

Create or update the environment files used by the app and worker:

```env
# .env.local (Next.js)
DATABASE_URL="postgres://postgres:<password>@db.<project>.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=60&sslmode=require"
DIRECT_URL="postgres://postgres:<password>@aws-0-<region>.supabase.co:5432/postgres?sslmode=require"

# Optional: keep Prisma Accelerate around for Workers
PRISMA_ACCELERATE_URL=

# If you consume Supabase Auth/Storage from the UI later
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Worker bindings (wrangler.toml → [vars])
DATABASE_URL="postgres://postgres:<password>@db.<project>.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=60&sslmode=require"
DIRECT_URL="postgres://postgres:<password>@aws-0-<region>.supabase.co:5432/postgres?sslmode=require"
```

Keep `DATABASE_URL` and `DIRECT_URL` in sync across the app and worker so Prisma pulls
from the same database everywhere.

## 3. Push the Prisma schema to Supabase

Review `prisma/schema.prisma`; it already targets Postgres, so we only need to apply it
to the new database:

```bash
npm install

# Generate the edge client with the Supabase connection
npx prisma generate

# Push the schema to Supabase (creates tables/indices)
npx prisma db push

# (Optional) seed any starter data
npx prisma db seed
```

Once this completes, Supabase should list all tables (User, AudioFile, TranscriptRun, …)
under **Table editor**.

## 4. Validate locally
1. Launch the Next.js dev server:
   ```bash
   npm run dev
   ```
   Supabase credentials are read from `.env.local`. Test login/CRUD flows to confirm
   Prisma queries succeed.
2. If you run the Cloudflare Worker locally, export the same `DATABASE_URL` and
   `DIRECT_URL` in its `.dev.vars` or via `wrangler dev --env dev`.

## 5. Deployment adjustments

For Cloudflare Pages / Worker deployments:
- Add `DATABASE_URL`, `DIRECT_URL`, and `SUPABASE_SERVICE_ROLE_KEY` as project secrets (Pages → Settings → Environment variables; Worker → `wrangler secret put`).
- If you rely on Prisma Accelerate rather than direct DB access, set
  `PRISMA_ACCELERATE_URL` to the Accelerate endpoint that points at Supabase.
- Supabase enforces SSL; the query parameters above (`sslmode=require`) are required.

## 6. Optional: Supabase client helpers

If you later want the front-end to consume Supabase Auth, Storage, or Realtime
directly, create `utils/supabase/client.ts` (browser) and `utils/supabase/server.ts`
(server components/actions) using `@supabase/ssr`. This project still relies on
Prisma for database access, so the helpers are optional until you adopt more of the
Supabase platform.

## 7. Troubleshooting

- **`P1001` (database unreachable)** → re-check the connection strings and ensure the
  IP has access (Supabase allows all outbound connections by default).
- **`pgbouncer does not support PREPARE`** → ensure you are using the pooling string for
  runtime Prisma. The direct string only works with the CLI.
- **Worker runtime errors** → double-check that the worker environment exports the same
  `DATABASE_URL`. Restart the worker after updating secrets.

With these steps the existing Prisma-based data layer now runs on Supabase without code
changes to the queries or models.
