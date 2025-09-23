import crypto from 'crypto';
import path from 'path';
import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/middleware/auth';
import { AuditKinds, recordAuditLog } from '../../../lib/audit';
import { buildAudioObjectKey, getBucket, makeGcsUri, requireBucketName } from '../../../lib/uploads';
import {
  QuotaError,
  assertDailyUploadQuota,
  assertPerFileSize,
  getQuotaConfig,
  startOfUtcDay,
} from '../../../lib/quota';

const DEFAULT_UPLOAD_TTL_SEC = Number(process.env.UPLOAD_URL_TTL_SEC || 60 * 60);

function normalizeFilename(name) {
  if (!name || typeof name !== 'string') return 'audio';
  const base = path.basename(name);
  const cleaned = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-');
  const trimmed = cleaned.replace(/^-+|-+$/g, '').slice(0, 180) || 'audio';
  if (!path.extname(trimmed)) {
    return `${trimmed}.wav`;
  }
  return trimmed;
}

function parseSizeBytes(raw, { maxBytes }) {
  if (raw === undefined || raw === null || raw === '') return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    throw Object.assign(new Error('sizeBytes 必须为正整数'), { statusCode: 400 });
  }
  if (!Number.isInteger(num)) {
    throw Object.assign(new Error('sizeBytes 必须为整数'), { statusCode: 400 });
  }
  if (Number.isFinite(maxBytes) && maxBytes > 0 && num > maxBytes) {
    throw new QuotaError(`文件过大，单文件上限 ${maxBytes} 字节。`);
  }
  return num;
}

function computeExpiresAt(ttlSec = DEFAULT_UPLOAD_TTL_SEC) {
  const expiresMs = Date.now() + Math.max(60, ttlSec) * 1000;
  return new Date(expiresMs).toISOString();
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user } = await requireAuth(req);

    const { filename, sizeBytes, mime, metadata } = req.body || {};
    if (!filename) {
      return res.status(400).json({ error: '缺少文件名 filename。' });
    }

    const safeFilename = normalizeFilename(filename);
    const quotaConfig = getQuotaConfig();
    const parsedSize = parseSizeBytes(sizeBytes, { maxBytes: quotaConfig.perFileSizeBytes });
    if (parsedSize) {
      assertPerFileSize(parsedSize, quotaConfig);
    }
    const contentType = typeof mime === 'string' && mime.length > 0 ? mime : 'application/octet-stream';

    await assertDailyUploadQuota({
      prismaClient: prisma,
      userId: user.id,
      day: startOfUtcDay(),
      additionalUploads: 1,
      config: quotaConfig,
    });

    const bucketName = requireBucketName();
    const bucket = getBucket();

    const audioId = crypto.randomUUID();
    const gcsKey = buildAudioObjectKey({ userId: user.id, audioId, filename: safeFilename });
    const gcsUri = makeGcsUri(bucketName, gcsKey);

    const [uploadUrl] = await bucket.file(gcsKey).createResumableUpload({
      origin: req.headers.origin || undefined,
      contentType,
      metadata: {
        metadata: {
          userId: user.id,
          audioId,
          originalFilename: filename,
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
        },
      },
    });

    const expiresAt = computeExpiresAt();

    const audio = await prisma.audioFile.create({
      data: {
        id: audioId,
        userId: user.id,
        filename: safeFilename,
        gcsUri,
        status: 'uploading',
        sizeBytes: parsedSize ? BigInt(parsedSize) : null,
        meta: {
          originalFilename: filename,
          uploadRequestedAt: new Date().toISOString(),
          uploadExpiresAt: expiresAt,
          requestedMime: contentType,
        },
      },
    });

    recordAuditLog({
      userId: user.id,
      kind: AuditKinds.UPLOAD_INIT,
      targetId: audio.id,
      meta: {
        filename,
        gcsKey,
        sizeBytes: parsedSize,
      },
    }).catch(() => undefined);

    return res.status(201).json({
      audioId: audio.id,
      uploadUrl,
      gcsKey,
      expiresAt,
    });
  } catch (error) {
    if (error?.statusCode) {
      const status = error.statusCode;
      return res.status(status).json({
        error: error.message || '请求失败',
        code: error.code,
        details: error.details || undefined,
      });
    }
    console.error('Failed to create resumable upload', error);
    return res.status(500).json({ error: '创建上传会话失败，请稍后再试。' });
  }
}
