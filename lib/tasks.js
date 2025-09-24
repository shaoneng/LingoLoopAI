import prisma from './prisma';

function ensureJob(job) {
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }
  return job;
}

export async function enqueueTranscriptionJob({ runId, audioId, userId, prismaClient = prisma }) {
  if (!runId || !audioId || !userId) {
    throw new Error('runId, audioId, userId are required to enqueue transcription job.');
  }

  const existing = await prismaClient.job.findFirst({
    where: {
      runId,
      jobType: 'transcribe_long',
      status: { in: ['queued', 'processing'] },
    },
  });
  if (existing) {
    return existing;
  }

  return prismaClient.job.create({
    data: {
      runId,
      audioId,
      jobType: 'transcribe_long',
      status: 'queued',
      retryCount: 0,
      nextRetryAt: null,
      providerJobId: null,
    },
  });
}

export async function markJobProcessing({ jobId, prismaClient = prisma }) {
  if (!jobId) throw new Error('jobId required');
  const job = await prismaClient.job.update({
    where: { id: jobId },
    data: {
      status: 'processing',
      retryCount: { increment: 1 },
      nextRetryAt: null,
      errorMessage: null,
    },
  });
  return ensureJob(job);
}

export async function markJobSucceeded({ jobId, providerJobId = null, prismaClient = prisma }) {
  if (!jobId) throw new Error('jobId required');
  const job = await prismaClient.job.update({
    where: { id: jobId },
    data: {
      status: 'succeeded',
      providerJobId,
      nextRetryAt: null,
      errorMessage: null,
    },
  });
  return ensureJob(job);
}

export async function markJobFailed({ jobId, errorMessage, delayMs = null, prismaClient = prisma }) {
  if (!jobId) throw new Error('jobId required');
  const job = await prismaClient.job.update({
    where: { id: jobId },
    data: {
      status: delayMs ? 'queued' : 'failed',
      nextRetryAt: delayMs ? new Date(Date.now() + delayMs) : null,
      errorMessage: errorMessage || null,
    },
  });
  return ensureJob(job);
}

export async function updateJobStatus({ jobId, status, providerJobId, prismaClient = prisma }) {
  if (!jobId) throw new Error('jobId required');
  const job = await prismaClient.job.update({
    where: { id: jobId },
    data: {
      status,
      providerJobId: providerJobId ?? null,
    },
  });
  return ensureJob(job);
}

export async function findJobById(jobId, { prismaClient = prisma } = {}) {
  if (!jobId) return null;
  return prismaClient.job.findUnique({ where: { id: jobId } });
}

export async function listPendingTranscriptionJobs(limit = 50, { prismaClient = prisma } = {}) {
  return prismaClient.job.findMany({
    where: {
      jobType: 'transcribe_long',
      status: 'queued',
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: new Date() } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

export function shouldProcessInline() {
  return process.env.TASKS_INLINE_PROCESSING === '1';
}
