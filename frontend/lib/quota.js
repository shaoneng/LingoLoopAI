import prisma from './prisma';

const DEFAULT_PER_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const DEFAULT_PER_FILE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_DAILY_UPLOAD_LIMIT = 10;
const DEFAULT_DAILY_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_INT_VALUE = 2_147_483_647;

export class QuotaError extends Error {
  constructor(message, { statusCode = 429, code = 'UPLOAD_429', details } = {}) {
    super(message);
    this.name = 'QuotaError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details || null;
  }
}

function readLimit(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  if (num <= 0) {
    return Infinity;
  }
  return num;
}

export function getQuotaConfig() {
  return {
    perFileSizeBytes: readLimit(process.env.QUOTA_PER_FILE_SIZE_BYTES, DEFAULT_PER_FILE_SIZE_BYTES),
    perFileDurationMs: readLimit(process.env.QUOTA_PER_FILE_DURATION_MS, DEFAULT_PER_FILE_DURATION_MS),
    dailyUploadLimit: readLimit(process.env.QUOTA_DAILY_UPLOAD_LIMIT, DEFAULT_DAILY_UPLOAD_LIMIT),
    dailyDurationMs: readLimit(process.env.QUOTA_DAILY_DURATION_LIMIT_MS, DEFAULT_DAILY_DURATION_MS),
  };
}

export function startOfUtcDay(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function fetchUsageForDay({ prismaClient = prisma, userId, day }) {
  if (!userId) return null;
  const targetDay = day instanceof Date ? day : startOfUtcDay(day);
  return prismaClient.usageLog.findUnique({
    where: {
      userId_day: {
        userId,
        day: targetDay,
      },
    },
  });
}

export async function assertDailyUploadQuota({ prismaClient = prisma, userId, day = startOfUtcDay(), additionalUploads = 0, config = getQuotaConfig() }) {
  const limit = config.dailyUploadLimit;
  if (!Number.isFinite(limit) || limit <= 0) {
    return null;
  }
  const usage = await fetchUsageForDay({ prismaClient, userId, day });
  const currentCount = usage?.uploadCount ?? 0;
  if (currentCount + additionalUploads > limit) {
    throw new QuotaError('已超出当日上传次数配额。', {
      details: {
        limit,
        remaining: Math.max(0, limit - currentCount),
        day: startOfUtcDay(day).toISOString(),
      },
    });
  }
  return usage;
}

export function assertPerFileDuration(durationMs, config = getQuotaConfig()) {
  const limit = config.perFileDurationMs;
  if (!durationMs || !Number.isFinite(durationMs)) return;
  if (Number.isFinite(limit) && limit > 0 && durationMs > limit) {
    throw new QuotaError('单个音频时长超出限制。', {
      details: {
        limitMs: limit,
        durationMs,
      },
    });
  }
}

export function assertPerFileSize(sizeBytes, config = getQuotaConfig()) {
  const limit = config.perFileSizeBytes;
  if (!Number.isFinite(limit) || limit <= 0) return;
  if (Number.isFinite(sizeBytes) && sizeBytes > limit) {
    throw new QuotaError('文件大小超出限制。', {
      details: {
        limitBytes: limit,
        sizeBytes,
      },
    });
  }
}

export async function applyDailyUsage({
  prismaClient = prisma,
  userId,
  day = startOfUtcDay(),
  uploadDelta = 0,
  durationDeltaMs = 0,
  config = getQuotaConfig(),
}) {
  if (!userId) {
    throw new Error('userId is required to apply usage.');
  }
  const targetDay = day instanceof Date ? startOfUtcDay(day) : startOfUtcDay(new Date(day));

  const usage = await prismaClient.usageLog.upsert({
    where: {
      userId_day: {
        userId,
        day: targetDay,
      },
    },
    create: {
      userId,
      day: targetDay,
      uploadCount: 0,
      durationMs: 0,
    },
    update: {},
  });

  const nextUploadCount = usage.uploadCount + uploadDelta;
  const nextDurationMs = usage.durationMs + (durationDeltaMs || 0);

  const { dailyUploadLimit, dailyDurationMs } = config;
  if (Number.isFinite(dailyUploadLimit) && dailyUploadLimit > 0 && nextUploadCount > dailyUploadLimit) {
    throw new QuotaError('已超出当日上传次数配额。', {
      details: {
        limit: dailyUploadLimit,
        current: usage.uploadCount,
        attempted: uploadDelta,
        day: targetDay.toISOString(),
      },
    });
  }
  if (Number.isFinite(dailyDurationMs) && dailyDurationMs > 0 && nextDurationMs > dailyDurationMs) {
    throw new QuotaError('已超出当日总时长配额。', {
      details: {
        limitMs: dailyDurationMs,
        currentMs: usage.durationMs,
        attemptedMs: durationDeltaMs,
        day: targetDay.toISOString(),
      },
    });
  }

  return prismaClient.usageLog.update({
    where: { id: usage.id },
    data: {
      uploadCount: nextUploadCount,
      durationMs: Math.min(nextDurationMs, MAX_INT_VALUE),
    },
  });
}
