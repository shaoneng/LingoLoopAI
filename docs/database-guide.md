# Database Setup & Verification Guide

This guide explains how to bring up the local Postgres instance used by the app, verify that Prisma can connect to it, and confirm that all expected tables exist.

## 1. Environment & Configuration
- Primary connection string: `.env.local` → `postgresql://postgres:postgres@localhost:5432/lingoloop?schema=public`.
- Prisma proxy string (fallback): `.env` → `prisma+postgres://localhost:51213/...` (used only if `DATABASE_URL` from `.env.local` is absent).
- Ensure one of these URLs is exported, e.g. `source .env.local` before running Prisma commands.

## 2. Start Postgres
Choose one of the following setups:

**A. Local Postgres service (Homebrew)**
```bash
brew services start postgresql@15       # install first via `brew install postgresql@15`
createuser -s postgres || true          # ensure the default superuser exists
createdb lingoloop || true
psql -d lingoloop -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

**B. Docker container (re-using `.data/postgres`)**
```bash
mkdir -p .data/postgres

docker run \
  --name lingoloop-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lingoloop \
  -p 5432:5432 \
  -v "$(pwd)/.data/postgres:/var/lib/postgresql/data" \
  -d postgres:15
```
_Stop the container with `docker stop lingoloop-db` when finished._

## 3. Verify Connectivity
1. Check that the port is listening:
   ```bash
   lsof -nP -iTCP:5432 | grep LISTEN
   ```
2. (Optional) Ping using libpq tools:
   ```bash
   pg_isready -h localhost -p 5432 -d lingoloop
   psql postgresql://postgres:postgres@localhost:5432/lingoloop -c "SELECT 1;"
   ```
   _Install via `brew install libpq` and `brew link --force libpq` if the commands are missing._
3. Confirm Prisma can talk to the database:
   ```bash
   source .env.local
   npx prisma db pull --print
   ```
   This should output the schema from the live database; connection errors (P1001) mean Postgres is still unreachable.

## 4. Create/Sync Tables
Prisma models live in `prisma/schema.prisma`. After connectivity succeeds, apply the schema:
```bash
source .env.local
npx prisma migrate deploy   # if you have migrations
# otherwise
npx prisma db push
```
Prisma will create the tables (User, AuthSession, AudioFile, TranscriptRun, TranscriptRevision, Annotation, AudioTag, UsageLog, Job, AuditLog).

## 5. Inspect Data
- Launch Prisma Studio for a quick UI view:
  ```bash
  source .env.local
  npx prisma studio
  ```
- For SQL access, use `psql`:
  ```bash
  psql postgresql://postgres:postgres@localhost:5432/lingoloop
  \dt
  ```

## 6. Troubleshooting
- `postmaster.pid` exists but Postgres is not running → remove the file from `.data/postgres/` before restarting.
- Port conflicts → adjust the exposed port in `docker run` (e.g. `-p 5433:5432`) and update `DATABASE_URL` to match.
- Docker permission issues on macOS → ensure Docker Desktop is running, or switch to the Homebrew installation.
- Prisma errors (`P1001`) → re-check that the environment variables match the running Postgres instance and that the service is accepting connections.

Keep this document updated if the database configuration changes.
