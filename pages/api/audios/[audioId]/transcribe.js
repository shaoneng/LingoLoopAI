import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../../lib/middleware/auth';
import { runSynchronousGoogleTranscription } from '../../../../lib/transcriptRuns';
import { AuditKinds, recordAuditLog } from '../../../../lib/audit';

function parseBoolean(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let currentUser = null;
  try {
    const { user } = await requireAuth(req);
    currentUser = user;
    const audioId = req.query?.audioId;
    if (!audioId || typeof audioId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 audioId。' });
    }

    const audio = await prisma.audioFile.findFirst({ where: { id: audioId, userId: user.id } });
    enforceSoftDelete(audio, '音频已删除。');
    if (!audio.gcsUri) {
      return res.status(400).json({ error: '音频尚未完成上传，无法转写。' });
    }

    const {
      engine = 'google-speech-v2',
      language = 'en-US',
      diarize = true,
      minSpeakerCount,
      maxSpeakerCount,
      gapSec,
      maxSegmentSec,
      force = false,
      model = 'short',
    } = req.body || {};

    if (engine !== 'google-speech-v2') {
      return res.status(400).json({ error: '当前仅支持 google-speech-v2 引擎。' });
    }

    const reuseDiarize = parseBoolean(diarize, true);
    const parsedForce = parseBoolean(force, false);

    recordAuditLog({
      userId: user.id,
      kind: AuditKinds.TRANSCRIBE_START,
      targetId: audio.id,
      meta: {
        engine,
        language,
        diarize: reuseDiarize,
        force: parsedForce,
      },
    }).catch(() => undefined);

    const result = await runSynchronousGoogleTranscription({
      audio,
      userId: user.id,
      language: typeof language === 'string' ? language : 'en-US',
      diarize: reuseDiarize,
      minSpeakerCount: reuseDiarize ? parseOptionalNumber(minSpeakerCount) : undefined,
      maxSpeakerCount: reuseDiarize ? parseOptionalNumber(maxSpeakerCount) : undefined,
      gapSec: parseOptionalNumber(gapSec),
      maxSegmentSec: parseOptionalNumber(maxSegmentSec),
      force: parsedForce,
      model: typeof model === 'string' ? model : 'short',
    });

    if (result.queued) {
      const { run, job } = result;
      recordAuditLog({
        userId: user.id,
        kind: AuditKinds.TRANSCRIBE_QUEUED,
        targetId: run.id,
        meta: {
          audioId: run.audioId,
          jobId: job?.id || null,
          engine,
          language,
        },
      }).catch(() => undefined);
      return res.status(202).json({
        audioId: run.audioId,
        runId: run.id,
        jobId: job?.id || null,
        status: run.status,
        queued: true,
        engine: run.engine,
        version: run.version,
      });
    }

    const { run, reused } = result;

    recordAuditLog({
      userId: user.id,
      kind: AuditKinds.TRANSCRIBE_END,
      targetId: run.id,
      meta: {
        audioId: run.audioId,
        reused,
        status: run.status,
      },
    }).catch(() => undefined);

    return res.status(200).json({
      audioId: run.audioId,
      runId: run.id,
      status: run.status,
      engine: run.engine,
      version: run.version,
      language,
      text: run.text,
      segments: run.segments,
      speakerCount: run.speakerCount,
      confidence: run.confidence,
      completedAt: run.completedAt,
      reused,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('Transcribe API error:', error);
    recordAuditLog({
      userId: currentUser?.id || null,
      kind: AuditKinds.TRANSCRIBE_FAILED,
      targetId: req.query?.audioId?.toString() || null,
      meta: { message: error.message },
    }).catch(() => undefined);
    return res.status(500).json({ error: error.message || '转写失败，请稍后再试。' });
  }
}
