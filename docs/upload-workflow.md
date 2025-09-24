# Upload Workflow Guide

This document captures the current end-to-end flow for the direct-to-GCS upload endpoints delivered in M1.

## 1. Environment
- Ensure the backend runs with `GCS_BUCKET` configured. The handlers throw `500` if it is missing.
- Google Cloud service account credentials must be available (e.g. `GOOGLE_APPLICATION_CREDENTIALS`, `GCLOUD_PROJECT`).
- Install `ffprobe` on the host so `/api/uploads/commit` can extract duration metadata. On macOS:
  ```bash
  brew install ffmpeg   # ffprobe ships with ffmpeg
  ```
- Optional limits:
  - `UPLOAD_URL_TTL_SEC` (default 3600) controls how long the resumable upload URL is reported as valid.
  - Quota knobs (see §4) let you adjust per-file / daily limits:
    - `QUOTA_PER_FILE_SIZE_BYTES` (default 104_857_600 ≈ 100 MB)
    - `QUOTA_PER_FILE_DURATION_MS` (default 1_800_000 = 30 min)
    - `QUOTA_DAILY_UPLOAD_LIMIT` (default 10 uploads/day)
    - `QUOTA_DAILY_DURATION_LIMIT_MS` (default 7_200_000 = 120 min)

## 2. POST `/api/uploads/create`
- Requires `Authorization: Bearer <accessToken>`.
- Body: `{ filename: string, sizeBytes?: number, mime?: string }`.
- Response: `{ audioId, uploadUrl, gcsKey, expiresAt }`.
  - `audioId` is the UUID saved in Prisma (`AudioFile`).
  - `uploadUrl` is a GCS resumable session URL; the client uploads file chunks directly to GCS.
  - `gcsKey` mirrors the object path (also stored in `AudioFile.gcsUri`).
  - `expiresAt` is derived from `UPLOAD_URL_TTL_SEC` and currently defaults to 1 hour.
- Side effects:
  - Creates the `AudioFile` row with `status="uploading"` and records basic metadata.
  - Sets initial custom metadata (`audioId`, `userId`, `originalFilename`) on the target object.
  - Performs quota validation: rejects the request with `429` if the per-file size limit or daily upload quota would be exceeded (response includes `code` and `details`).
- 前端首页（`pages/index.jsx`）的“上传并转写”按钮已接入此流程：取得 `uploadUrl` 后直接在浏览器内完成文件上传，随后自动调用 `/commit` 与 `/api/audios/:audioId/transcribe` 并提示跳转 Dashboard。
- 播放场景可通过 `GET /api/audios/:audioId/download` 获取 10 分钟有效的 V4 签名 URL，在音频详情页 `<audio>` 控件中直接使用。

## 3. POST `/api/uploads/commit`
- Requires the same `Authorization` header.
- Body: `{ audioId, gcsKey, sha256? }`.
- Flow:
  1. Validates the authenticated user owns `audioId` and that the stored `gcsUri` matches `gcsKey`.
  2. Fetches the object metadata from GCS and (optionally) persists the SHA-256 checksum as custom metadata.
  3. Downloads the object to a temp file, runs `ffprobe`, and updates `AudioFile` with `durationMs`, `sizeBytes`, `status="uploaded"`, and structured metadata (GCS + probe summary).
- Response: `{ audioId, durationMs, language, status, sizeBytes }` (`sizeBytes` is returned as a string when present).
- If `ffprobe` is missing the API returns `500` with the message `ffprobe 调用失败，请确认服务器已安装 ffprobe`.
- Quota handling:
  - Validates the actual GCS object against per-file size and duration limits.
  - Updates the `usage_log` table atomically inside the Prisma transaction; limits trigger a `429` with `code` + `details` and persist `AudioFile.status="quota_exceeded"` for auditing.
  - `usage_log.uploadCount` increments by 1 per successful commit, and `usage_log.durationMs` accumulates the measured duration (ms, capped at 32-bit int).

## 4. Quota Summary

| Limit | Default | Env Override | Enforcement Stage |
| ----- | ------- | ------------ | ----------------- |
| Per-file size | 100 MB | `QUOTA_PER_FILE_SIZE_BYTES` (≤0 → unlimited) | `/create`, `/commit` (actual object) |
| Per-file duration | 30 min | `QUOTA_PER_FILE_DURATION_MS` (≤0 → unlimited) | `/commit` (ffprobe result) |
| Daily upload count | 10 | `QUOTA_DAILY_UPLOAD_LIMIT` (≤0 → unlimited) | `/create` (pre-flight), `/commit` (transaction) |
| Daily duration total | 120 min | `QUOTA_DAILY_DURATION_LIMIT_MS` (≤0 → unlimited) | `/commit` transaction |

Daily usage rolls up by UTC day (`startOfUtcDay`) and is stored in `usage_log (user_id, day)`.

Keep this guide updated as quota checks, background workers, or cancellation APIs are added.
