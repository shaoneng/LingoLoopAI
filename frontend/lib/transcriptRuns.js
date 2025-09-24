import crypto from 'crypto';
import prisma from './prisma';
import { getStorage, parseGcsUri } from './uploads';
import { recognizeBuffer, recognizeGcsUri, summarizeSegments } from './googleSpeech';
import { enqueueTranscriptionJob, shouldProcessInline } from './tasks';

const DEFAULT_GAP_SEC = Number(process.env.TRANSCRIBE_GAP_SEC || 0.8);
const DEFAULT_MAX_SEGMENT_SEC = Number(process.env.TRANSCRIBE_MAX_SEGMENT_SEC || 12);
const ENGINE_GOOGLE_SPEECH_V2 = 'google-speech-v2';
const SYNC_MAX_BYTES = Number(process.env.TRANSCRIBE_SYNC_MAX_BYTES || 10 * 1024 * 1024);
const SYNC_MAX_DURATION_MS = Number(process.env.TRANSCRIBE_SYNC_MAX_DURATION_MS || 60 * 1000);

function normalizeParams(input) {
  const cleaned = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === undefined || value === null) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${entries.join(',')}}`;
}

function hashParams(params) {
  return crypto.createHash('sha256').update(stableStringify(params)).digest('hex');
}

function mergeMeta(base, patch) {
  const src = base && typeof base === 'object' ? base : {};
  return {
    ...src,
    ...patch,
    transcription: {
      ...(src.transcription || {}),
      ...(patch.transcription || {}),
    },
  };
}

async function downloadAudioBuffer(gcsUri) {
  const parsed = parseGcsUri(gcsUri);
  if (!parsed) {
    throw new Error('音频文件存储位置无效 (gcsUri)');
  }
  const storage = getStorage();
  const file = storage.bucket(parsed.bucket).file(parsed.key);
  try {
    const [data] = await file.download();
    return data;
  } catch (error) {
    if (error?.code === 404) {
      throw new Error('音频文件在存储桶中不存在，无法转写。');
    }
    throw error;
  }
}

async function createProcessingRun({ prismaClient, audioId, userId, engine, params, paramsHash, status = 'processing' }) {
  const { _max } = await prismaClient.transcriptRun.aggregate({
    where: { audioId },
    _max: { version: true },
  });
  const version = (_max?.version ?? 0) + 1;
  return prismaClient.transcriptRun.create({
    data: {
      audioId,
      authorId: userId || null,
      engine,
      version,
      params,
      paramsHash,
      status,
    },
  });
}

async function createQueuedRun({
  audio,
  userId,
  params,
  paramsHash,
  prismaClient,
}) {
  const run = await createProcessingRun({
    prismaClient,
    audioId: audio.id,
    userId,
    engine: ENGINE_GOOGLE_SPEECH_V2,
    params,
    paramsHash,
    status: 'queued',
  });

  const job = await enqueueTranscriptionJob({
    runId: run.id,
    audioId: run.audioId,
    userId: userId || audio.userId,
    prismaClient,
  });

  return { run, job };
}

export async function runSynchronousGoogleTranscription({
  audio,
  userId,
  prismaClient = prisma,
  language = 'en-US',
  diarize = true,
  minSpeakerCount,
  maxSpeakerCount,
  gapSec,
  maxSegmentSec,
  force = false,
  model = 'short',
} = {}) {
  if (!audio || !audio.id) {
    throw new Error('audio 信息缺失，无法创建转写任务。');
  }

  const params = normalizeParams({
    engine: ENGINE_GOOGLE_SPEECH_V2,
    language,
    diarize,
    minSpeakerCount: diarize ? minSpeakerCount : undefined,
    maxSpeakerCount: diarize ? maxSpeakerCount : undefined,
    gapSec: gapSec ?? DEFAULT_GAP_SEC,
    maxSegmentSec: maxSegmentSec ?? DEFAULT_MAX_SEGMENT_SEC,
    model,
  });
  const paramsHash = hashParams(params);

  // 查找任何状态的相同参数 run（保障幂等），避免命中唯一键报错
  const existingAny = await prismaClient.transcriptRun.findFirst({
    where: { audioId: audio.id, paramsHash },
    orderBy: { createdAt: 'desc' },
  });
  if (existingAny && !force && existingAny.status === 'succeeded') {
    return { run: existingAny, reused: true };
  }

  const sizeBytes = typeof audio.sizeBytes === 'bigint' ? Number(audio.sizeBytes) : audio.sizeBytes;
  const isLargeFile = sizeBytes && SYNC_MAX_BYTES && sizeBytes > SYNC_MAX_BYTES;
  const isLongDuration = Number.isFinite(audio?.durationMs) && SYNC_MAX_DURATION_MS && audio.durationMs > SYNC_MAX_DURATION_MS;
  const explicitlyRequestsLong = params.model === 'long' || model === 'long';
  const inlineProcessing = shouldProcessInline();

  // For large files, always use async processing
  if ((explicitlyRequestsLong || isLargeFile || isLongDuration) && !inlineProcessing) {
    console.log(`Large file detected (${sizeBytes} bytes, ${audio.durationMs}ms), using async processing`);
    // 队列路径：若已有相同参数 run，复用并标记为 queued；否则新建
    if (existingAny) {
      let updated = existingAny;
      if (existingAny.status !== 'queued' && existingAny.status !== 'processing') {
        updated = await prismaClient.transcriptRun.update({
          where: { id: existingAny.id },
          data: { status: 'queued', error: null, completedAt: null },
        });
      }
      const job = await enqueueTranscriptionJob({
        runId: updated.id,
        audioId: updated.audioId,
        userId: userId || audio.userId,
        prismaClient,
      });
      console.log(`Reused existing run ${updated.id} for async processing, job ${job.id}`);
      return { run: updated, reused: false, queued: true, job };
    }
    const { run, job } = await createQueuedRun({ audio, userId, params, paramsHash, prismaClient });
    console.log(`Created new run ${run.id} for async processing, job ${job.id}`);
    return { run, reused: false, queued: true, job };
  }

  // 同步处理：若已有相同参数 run，直接复用，置为 processing；否则创建新 run
  const run = existingAny
    ? await prismaClient.transcriptRun.update({
        where: { id: existingAny.id },
        data: { status: 'processing', error: null, completedAt: null },
      })
    : await createProcessingRun({
        prismaClient,
        audioId: audio.id,
        userId,
        engine: ENGINE_GOOGLE_SPEECH_V2,
        params,
        paramsHash,
      });

  try {
    const shouldUseBatch = model === 'long' || isLargeFile || isLongDuration;

    const recognition = shouldUseBatch
      ? await recognizeGcsUri({
          uri: audio.gcsUri,
          language,
          model: 'long',
          minSpeakerCount: params.minSpeakerCount,
          maxSpeakerCount: params.maxSpeakerCount,
          gapSec: params.gapSec,
          maxDurSec: params.maxSegmentSec,
        })
      : await (async () => {
          const buffer = await downloadAudioBuffer(audio.gcsUri);
          if ((SYNC_MAX_BYTES && buffer.length > SYNC_MAX_BYTES) || isLongDuration) {
            return recognizeGcsUri({
              uri: audio.gcsUri,
              language,
              model: 'long',
              minSpeakerCount: params.minSpeakerCount,
              maxSpeakerCount: params.maxSpeakerCount,
              gapSec: params.gapSec,
              maxDurSec: params.maxSegmentSec,
            });
          }
          try {
            return await recognizeBuffer({
              buffer,
              language,
              model,
              minSpeakerCount: params.minSpeakerCount,
              maxSpeakerCount: params.maxSpeakerCount,
              gapSec: params.gapSec,
              maxDurSec: params.maxSegmentSec,
            });
          } catch (err) {
            const msg = (err && (err.message || String(err))) || '';
            // Fallback: if sync API rejects due to 60s cap or similar INVALID_ARGUMENT, retry with batch (long model)
            if (/maximum\s+of\s+60\s*seconds/i.test(msg) || /INVALID_ARGUMENT/i.test(msg)) {
              return recognizeGcsUri({
                uri: audio.gcsUri,
                language,
                model: 'long',
                minSpeakerCount: params.minSpeakerCount,
                maxSpeakerCount: params.maxSpeakerCount,
                gapSec: params.gapSec,
                maxDurSec: params.maxSegmentSec,
              });
            }
            throw err;
          }
        })();
    const { text, speakerCount } = summarizeSegments(recognition.segments);

    const updatedRun = await prismaClient.transcriptRun.update({
      where: { id: run.id },
      data: {
        status: 'succeeded',
        text,
        segments: recognition.segments,
        speakerCount,
        confidence: recognition.response?.results?.[0]?.alternatives?.[0]?.confidence || null,
        completedAt: new Date(),
      },
    });

    const nextMeta = mergeMeta(audio.meta, {
      transcription: {
        lastRunId: run.id,
        lastCompletedAt: updatedRun.completedAt?.toISOString(),
        lastEngine: ENGINE_GOOGLE_SPEECH_V2,
      },
    });

    await prismaClient.audioFile.update({
      where: { id: audio.id },
      data: {
        status: 'transcribed',
        language,
        gapSec: params.gapSec,
        mode: shouldUseBatch || model === 'long' ? 'long' : 'short',
        meta: nextMeta,
      },
    });

    return { run: updatedRun, reused: false };
  } catch (error) {
    await prismaClient.transcriptRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        error: error.message || '转写失败',
        completedAt: new Date(),
      },
    }).catch(() => undefined);
    throw error;
  }
}

export async function runQueuedTranscription({ runId, prismaClient = prisma } = {}) {
  if (!runId) throw new Error('runId is required to process queued transcription');

  console.log(`Starting queued transcription for run ${runId}`);

  const run = await prismaClient.transcriptRun.findUnique({
    where: { id: runId },
    include: {
      audio: true,
    },
  });

  if (!run || !run.audio) {
    throw new Error('转写任务不存在或音频已被删除');
  }

  if (run.status === 'succeeded') {
    console.log(`Run ${runId} already succeeded, skipping`);
    return { run, audio: run.audio };
  }

  if (run.status === 'processing') {
    console.log(`Run ${runId} already processing, skipping`);
    return { run, audio: run.audio };
  }

  if (run.status !== 'queued') {
    throw new Error(`无法处理当前状态的任务: ${run.status}`);
  }

  const { audio } = run;
  const params = run.params || {};
  const sizeBytes = typeof audio.sizeBytes === 'bigint' ? Number(audio.sizeBytes) : audio.sizeBytes;
  const isLargeFile = sizeBytes && SYNC_MAX_BYTES && sizeBytes > SYNC_MAX_BYTES;
  const model = params.model || (isLargeFile ? 'long' : 'short');

  console.log(`Processing run ${runId} with model ${model}, file size: ${sizeBytes} bytes`);

  // Update run status to processing
  await prismaClient.transcriptRun.update({
    where: { id: run.id },
    data: { status: 'processing' },
  });

  // Update audio status to processing
  await prismaClient.audioFile.update({
    where: { id: audio.id },
    data: { status: 'processing' },
  });

  try {
    console.log(`Starting Google Speech recognition for run ${runId}`);

    const recognized = await recognizeGcsUri({
      uri: audio.gcsUri,
      language: params.language || audio.language || 'en-US',
      model,
      minSpeakerCount: params.minSpeakerCount,
      maxSpeakerCount: params.maxSpeakerCount,
      gapSec: params.gapSec || DEFAULT_GAP_SEC,
      maxDurSec: params.maxSegmentSec || DEFAULT_MAX_SEGMENT_SEC,
    });

    console.log(`Recognition completed for run ${runId}, got ${recognized.segments?.length || 0} segments`);

    const { text, speakerCount } = summarizeSegments(recognized.segments);

    const completedRun = await prismaClient.transcriptRun.update({
      where: { id: run.id },
      data: {
        status: 'succeeded',
        text,
        segments: recognized.segments,
        speakerCount,
        confidence: recognized.response?.results?.[0]?.alternatives?.[0]?.confidence || null,
        completedAt: new Date(),
      },
    });

    const nextMeta = mergeMeta(audio.meta, {
      transcription: {
        lastRunId: run.id,
        lastCompletedAt: completedRun.completedAt?.toISOString(),
        lastEngine: ENGINE_GOOGLE_SPEECH_V2,
      },
    });

    await prismaClient.audioFile.update({
      where: { id: audio.id },
      data: {
        status: 'transcribed',
        language: params.language || audio.language,
        gapSec: params.gapSec || DEFAULT_GAP_SEC,
        mode: 'long',
        meta: nextMeta,
      },
    });

    console.log(`Run ${runId} completed successfully`);
    return { run: completedRun, audio };

  } catch (error) {
    console.error(`Error processing run ${runId}:`, error);

    await prismaClient.transcriptRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        error: error.message || '转写失败',
        completedAt: new Date(),
      },
    }).catch((updateError) => {
      console.error(`Failed to update run ${runId} status:`, updateError);
    });

    await prismaClient.audioFile.update({
      where: { id: audio.id },
      data: {
        status: 'failed',
        errorMessage: error.message || '转写失败',
      },
    }).catch((updateError) => {
      console.error(`Failed to update audio ${audio.id} status:`, updateError);
    });

    throw error;
  }
}
