import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireInternalSecret } from '../../../../lib/middleware/internal';
import {
  findJobById,
  markJobProcessing,
  markJobSucceeded,
  markJobFailed,
} from '../../../../lib/tasks';
import { runQueuedTranscription } from '../../../../lib/transcriptRuns';
import { AuditKinds, recordAuditLog } from '../../../../lib/audit';

const DEFAULT_RETRY_SCHEDULE_MS = [5000, 30000, 120000];

function computeRetryDelay(retryCount) {
  const schedule = process.env.TASKS_RETRY_SCHEDULE_MS
    ? process.env.TASKS_RETRY_SCHEDULE_MS.split(',').map((x) => Number(x.trim())).filter(Number.isFinite)
    : DEFAULT_RETRY_SCHEDULE_MS;
  if (!schedule.length) return null;
  const index = Math.min(retryCount - 1, schedule.length - 1);
  return schedule[index];
}

const MAX_RETRIES = Number(process.env.TASKS_MAX_ATTEMPTS || 3);

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    requireInternalSecret(req);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || '内部认证失败' });
  }

  try {
    const { runId, jobId } = req.body || {};
    if (!runId || typeof runId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 runId。' });
    }

    let job = null;
    if (jobId) {
      job = await findJobById(jobId, { prismaClient: prisma });
      if (!job) {
        return res.status(404).json({ error: '指定的任务不存在。' });
      }
    } else {
      job = await prisma.job.findFirst({
        where: {
          runId,
          jobType: 'transcribe_long',
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (job && job.status === 'succeeded') {
      return res.status(200).json({ status: 'succeeded', runId, jobId: job.id });
    }

    if (job && job.status === 'queued') {
      job = await markJobProcessing({ jobId: job.id, prismaClient: prisma });
    }

    const { run, audio } = await runQueuedTranscription({ runId, prismaClient: prisma });

    if (job) {
      await markJobSucceeded({ jobId: job.id, prismaClient: prisma });
    }

    recordAuditLog({
      userId: audio.userId || null,
      kind: AuditKinds.TRANSCRIBE_END,
      targetId: run.id,
      meta: {
        audioId: run.audioId,
        status: run.status,
        queued: true,
      },
    }).catch(() => undefined);

    return res.status(200).json({
      status: run.status,
      runId: run.id,
      jobId: job?.id || null,
    });
  } catch (error) {
    console.error('Internal transcribe worker failed:', error);
    const runId = req.body?.runId;
    let job = null;
    if (req.body?.jobId) {
      job = await findJobById(req.body.jobId, { prismaClient: prisma }).catch(() => null);
    }
    if (!job && runId) {
      job = await prisma.job.findFirst({ where: { runId, jobType: 'transcribe_long' } });
    }

    if (job) {
      const attempts = job.retryCount;
      const shouldRetry = attempts < MAX_RETRIES;
      if (shouldRetry) {
        const delay = computeRetryDelay(attempts) || 0;
        await markJobFailed({
          jobId: job.id,
          errorMessage: error.message,
          delayMs: delay > 0 ? delay : null,
          prismaClient: prisma,
        }).catch(() => undefined);
      } else {
        await markJobFailed({
          jobId: job.id,
          errorMessage: error.message,
          delayMs: null,
          prismaClient: prisma,
        }).catch(() => undefined);
      }
    }

    let auditUserId = null;
    let auditTargetId = runId || null;
    if (job?.audioId) {
      const audioOwner = await prisma.audioFile.findUnique({
        where: { id: job.audioId },
        select: { id: true, userId: true },
      });
      if (audioOwner) {
        auditUserId = audioOwner.userId;
        if (!auditTargetId) auditTargetId = audioOwner.id;
      }
    }

    if (auditTargetId) {
      recordAuditLog({
        userId: auditUserId,
        kind: AuditKinds.TRANSCRIBE_FAILED,
        targetId: auditTargetId,
        meta: { message: error.message, queued: true },
      }).catch(() => undefined);
    }

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || '转写任务处理失败。' });
  }
}
