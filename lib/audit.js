import { runQuery } from './db.js'

export const AuditKinds = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  UPLOAD_INIT: 'UPLOAD_INIT',
  UPLOAD_COMMIT: 'UPLOAD_COMMIT',
  TRANSCRIBE_START: 'TRANSCRIBE_START',
  TRANSCRIBE_END: 'TRANSCRIBE_END',
  TRANSCRIBE_FAILED: 'TRANSCRIBE_FAILED',
  TRANSCRIBE_QUEUED: 'TRANSCRIBE_QUEUED',
  ANALYZE_START: 'ANALYZE_START',
  ANALYZE_END: 'ANALYZE_END',
  ANALYZE_FAILED: 'ANALYZE_FAILED',
}

export async function recordAuditLog({
  userId = null,
  kind,
  targetId = null,
  meta = null,
  client,
  prismaClient,
}) {
  if (!kind) return null
  try {
    const rows = await runQuery(
      'INSERT INTO "AuditLog" ("userId", "kind", "targetId", "meta") VALUES ($1, $2, $3, $4) RETURNING "id"',
      [userId, kind, targetId, meta],
      { client: client || prismaClient }
    )
    return rows[0] || null
  } catch (error) {
    console.warn('Failed to record audit log', { kind, userId, targetId, error })
    return null
  }
}

