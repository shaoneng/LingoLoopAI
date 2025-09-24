import type { PrismaClient } from '@prisma/client/edge';

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
} as const;

export async function recordAuditLog({
  prisma,
  userId = null,
  kind,
  targetId = null,
  meta = null,
}: {
  prisma: PrismaClient;
  userId?: string | null;
  kind: (typeof AuditKinds)[keyof typeof AuditKinds] | string;
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  if (!kind) return null;
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        kind,
        targetId,
        meta,
      },
    });
  } catch (error) {
    console.warn('Failed to record audit log', { error, kind });
    return null;
  }
}
