import os from 'os';
import path from 'path';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import { pipeline } from 'stream/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../lib/middleware/auth';
import { AuditKinds, recordAuditLog } from '../../../lib/audit';
import {
  buildAudioObjectKey,
  getBucket,
  parseGcsUri,
  requireBucketName,
} from '../../../lib/uploads';
import {
  QuotaError,
  applyDailyUsage,
  assertPerFileDuration,
  assertPerFileSize,
  getQuotaConfig,
  startOfUtcDay,
} from '../../../lib/quota';

const execFileAsync = promisify(execFile);

function isHex(str, length) {
  return typeof str === 'string' && (!length || str.length === length) && /^[0-9a-f]+$/i.test(str);
}

function ensureString(value, field) {
  if (!value || typeof value !== 'string') {
    const error = new Error(`${field} 参数缺失或无效`);
    error.statusCode = 400;
    throw error;
  }
  return value;
}

async function downloadObjectToTemp({ file, filename }) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lingoloop-audio-'));
  const targetName = filename && typeof filename === 'string' ? path.basename(filename) : 'audio.raw';
  const tmpPath = path.join(tmpDir, targetName);

  try {
    await pipeline(file.createReadStream(), createWriteStream(tmpPath));
    return {
      path: tmpPath,
      cleanup: async () => {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
      },
    };
  } catch (error) {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }
}

async function runFfprobe(filePath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ]);
    const payload = JSON.parse(stdout || '{}');
    const durationSecRaw = payload?.format?.duration;
    const durationSec = durationSecRaw ? Number(durationSecRaw) : null;
    const durationMs = Number.isFinite(durationSec) ? Math.round(durationSec * 1000) : null;
    const audioStream = Array.isArray(payload?.streams)
      ? payload.streams.find((stream) => stream.codec_type === 'audio')
      : null;
    return {
      durationMs,
      format: payload?.format || null,
      audioStream: audioStream || null,
    };
  } catch (error) {
    const probeError = new Error('ffprobe 调用失败，请确认服务器已安装 ffprobe');
    probeError.statusCode = 500;
    probeError.cause = error;
    throw probeError;
  }
}

function mergeMeta(currentMeta, patch) {
  const base = currentMeta && typeof currentMeta === 'object' ? currentMeta : {};
  return {
    ...base,
    ...patch,
    gcsObject: {
      ...(base.gcsObject || {}),
      ...(patch.gcsObject || {}),
    },
    ffprobe: {
      ...(base.ffprobe || {}),
      ...(patch.ffprobe || {}),
    },
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user } = await requireAuth(req);

    const audioId = ensureString(req.body?.audioId, 'audioId');
    const providedGcsKey = ensureString(req.body?.gcsKey, 'gcsKey');
    const sha256 = req.body?.sha256 ? req.body.sha256.toString().toLowerCase() : null;
    if (sha256 && !isHex(sha256, 64)) {
      return res.status(400).json({ error: 'sha256 必须为 64 位十六进制字符串' });
    }

    const audio = await prisma.audioFile.findFirst({ where: { id: audioId, userId: user.id } });
    enforceSoftDelete(audio, '音频不存在或已删除');

    const bucketName = requireBucketName();
    const uriParts = parseGcsUri(audio.gcsUri);
    if (!uriParts || uriParts.bucket !== bucketName) {
      return res.status(400).json({ error: '音频存储位置异常，请重新上传' });
    }

    const expectedKey = uriParts.key || buildAudioObjectKey({
      userId: user.id,
      audioId: audio.id,
      filename: audio.filename,
    });

    if (expectedKey !== providedGcsKey) {
      return res.status(400).json({ error: 'gcsKey 与记录不匹配' });
    }

    const bucket = getBucket();
    const file = bucket.file(expectedKey);

    let metadata;
    try {
      [metadata] = await file.getMetadata();
    } catch (error) {
      if (error?.code === 404) {
        return res.status(404).json({ error: '对象不存在或尚未上传完成' });
      }
      throw error;
    }

    const objectSizeStr = metadata?.size;
    const objectSize = objectSizeStr ? BigInt(objectSizeStr) : null;
    if (!objectSize || objectSize <= 0n) {
      return res.status(400).json({ error: '对象大小为 0，可能上传未完成' });
    }

    const quotaConfig = getQuotaConfig();
    const numericSize = Number(objectSize);
    if (Number.isFinite(numericSize)) {
      assertPerFileSize(numericSize, quotaConfig);
    }

    const customMeta = metadata?.metadata || {};
    if (customMeta.audioId && customMeta.audioId !== audioId) {
      return res.status(400).json({ error: '对象 metadata 中 audioId 不匹配' });
    }
    if (customMeta.userId && customMeta.userId !== user.id) {
      return res.status(403).json({ error: '对象归属用户不匹配' });
    }

    const shouldUpdateCustomMeta = sha256 && customMeta.sha256 !== sha256;
    if (shouldUpdateCustomMeta) {
      await file.setMetadata({
        metadata: {
          ...customMeta,
          sha256,
        },
      });
    }

    const download = await downloadObjectToTemp({ file, filename: audio.filename });
    let probe;
    try {
      probe = await runFfprobe(download.path);
    } finally {
      await download.cleanup();
    }

    const durationMs = typeof probe.durationMs === 'number' && Number.isFinite(probe.durationMs)
      ? probe.durationMs
      : null;
    if (durationMs !== null) {
      assertPerFileDuration(durationMs, quotaConfig);
    }
    const usageDuration = durationMs !== null ? Math.max(0, Math.round(durationMs)) : 0;

    const nextMeta = mergeMeta(audio.meta, {
      gcsObject: {
        bucket: bucketName,
        key: expectedKey,
        size: objectSizeStr,
        updated: metadata?.updated || metadata?.timeCreated || new Date().toISOString(),
        contentType: metadata?.contentType || null,
        md5: metadata?.md5Hash || null,
        crc32c: metadata?.crc32c || null,
        storageClass: metadata?.storageClass || null,
      },
      sha256: sha256 || customMeta.sha256 || null,
      ffprobe: {
        durationMs: probe.durationMs,
        format: probe.format ? {
          format_name: probe.format.format_name,
          format_long_name: probe.format.format_long_name,
          bit_rate: probe.format.bit_rate,
        } : null,
        audioStream: probe.audioStream ? {
          codec_name: probe.audioStream.codec_name,
          sample_rate: probe.audioStream.sample_rate,
          channels: probe.audioStream.channels,
          channel_layout: probe.audioStream.channel_layout,
          bit_rate: probe.audioStream.bit_rate,
        } : null,
      },
      committedAt: new Date().toISOString(),
    });

    let updated;
    try {
      updated = await prisma.$transaction(async (tx) => {
        await applyDailyUsage({
          prismaClient: tx,
          userId: user.id,
          day: startOfUtcDay(),
          uploadDelta: 1,
          durationDeltaMs: usageDuration,
          config: quotaConfig,
        });

        return tx.audioFile.update({
          where: { id: audioId },
          data: {
            status: 'uploaded',
            durationMs: durationMs ?? audio.durationMs ?? null,
            sizeBytes: objectSize,
            meta: nextMeta,
          },
        });
      });
    } catch (error) {
      if (error instanceof QuotaError) {
        const quotaMeta = mergeMeta(nextMeta, {
          quotaRejectedAt: new Date().toISOString(),
          quotaDetails: error.details || null,
        });
        await prisma.audioFile.update({
          where: { id: audioId },
          data: {
            status: 'quota_exceeded',
            errorMessage: error.message,
            meta: quotaMeta,
          },
        }).catch(() => undefined);
        recordAuditLog({
          userId: user.id,
          kind: AuditKinds.UPLOAD_COMMIT,
          targetId: audioId,
          meta: {
            error: error.message,
            quota: error.details || null,
          },
        }).catch(() => undefined);
        throw error;
      }
      throw error;
    }

    recordAuditLog({
      userId: user.id,
      kind: AuditKinds.UPLOAD_COMMIT,
      targetId: updated.id,
      meta: {
        gcsKey: expectedKey,
        sizeBytes: updated.sizeBytes ? updated.sizeBytes.toString() : null,
        durationMs: updated.durationMs,
      },
    }).catch(() => undefined);

    return res.status(200).json({
      audioId: updated.id,
      durationMs: updated.durationMs,
      language: updated.language,
      status: updated.status,
      sizeBytes: updated.sizeBytes ? updated.sizeBytes.toString() : null,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message || '请求失败',
        code: error.code,
        details: error.details || undefined,
      });
    }
    console.error('Commit upload failed', error);
    return res.status(500).json({ error: '确认上传失败，请稍后再试。' });
  }
}
