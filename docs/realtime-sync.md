# Realtime Sync Plan

## Core Data Domains

1. **AudioFile**
   - Represents user uploads and status transitions (`uploading` → `uploaded` → `processing`/`succeeded`/`failed`).
   - Critical surface: dashboard list, detail page, and worker-driven status changes.
2. **TranscriptRun**
   - Captures transcription jobs per audio file with status and transcript payload updates.
   - Critical surface: run history on audio detail page and background worker transitions.
3. **UsageLog** (derived metrics)
   - Needed for quota enforcement UI; updated when uploads commit.
   - Surfaced in progress/learning metrics dashboards.

## Realtime Semantics

- **Latency expectations**: UI reflects server changes within ~1–2 seconds (Supabase Realtime push interval).
- **Event types**:
  - `INSERT`/`UPDATE`/`DELETE` for `AudioFile` and `TranscriptRun` tables.
  - `UPDATE` for `UsageLog` (counts/duration).
- **Client reactions**:
  - Update in-memory cache and re-render lists/detail panels.
  - When current detail view references the mutated row, merge payload incrementally.

## Offline & Reconnect Strategy

- Maintain local cache (IndexedDB fallback to `localStorage`) for latest snapshots of audio files and transcript runs.
- Queue optimistic mutations initiated locally; replay after reconnection in original order.
- Detect connection state via Supabase realtime socket events; expose status (`connected`, `connecting`, `offline`).
- On reconnect, perform `sync` fetch (REST) to reconcile server state and clear queue.

## Conflict Resolution

- Apply **last-write-wins** using server `updatedAt` timestamp as source of truth.
- When optimistic mutation conflicts with newer server payload:
  - Keep server version.
  - Surface notification via `EventContext` for user visibility.
- For destructive actions (delete), optimistic removal remains; server rejection re-adds item from hydration fetch.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Browser-facing Supabase credentials for realtime subscriptions.
- `DB_POOL_MAX`, `DB_POOL_IDLE_MS`: Optional pg pool tuning for the new direct Postgres client.
- `NEXT_PUBLIC_SUPABASE_EVENTS_PER_SEC` (optional): Overrides realtime throttle; defaults to 10.

This document accompanies the staged migration away from Prisma toward Supabase-driven realtime data access.
