import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../../lib/middleware/auth';

function mapRun(run) {
  return {
    id: run.id,
    version: run.version,
    status: run.status,
    engine: run.engine,
    params: run.params,
    text: run.text,
    segments: run.segments,
    speakerCount: run.speakerCount,
    confidence: run.confidence,
    createdAt: run.createdAt,
    completedAt: run.completedAt,
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user } = await requireAuth(req);
    const audioId = req.query?.audioId;
    if (!audioId || typeof audioId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 audioId。' });
    }

    if (req.method === 'GET') {
      const audio = await prisma.audioFile.findFirst({
        where: { id: audioId, userId: user.id },
        include: {
          transcriptRuns: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      enforceSoftDelete(audio, '音频不存在或已删除。');

      const latestRun = audio.transcriptRuns?.[0] || null;

      return res.status(200).json({
        audio: {
          id: audio.id,
          filename: audio.filename,
          status: audio.status,
          language: audio.language,
          durationMs: audio.durationMs,
          sizeBytes: audio.sizeBytes ? audio.sizeBytes.toString() : null,
          gapSec: audio.gapSec,
          mode: audio.mode,
          gcsUri: audio.gcsUri,
          meta: audio.meta,
          createdAt: audio.createdAt,
          updatedAt: audio.updatedAt,
        },
        latestRun: latestRun ? mapRun(latestRun) : null,
        recentRuns: audio.transcriptRuns.map(mapRun),
      });
    }

    // DELETE
    const audio = await prisma.audioFile.findFirst({ where: { id: audioId, userId: user.id } });
    enforceSoftDelete(audio, '音频不存在或已删除。');

    const now = new Date();
    await prisma.audioFile.update({
      where: { id: audio.id },
      data: {
        status: 'deleted',
        deletedAt: now,
        meta: {
          ...(audio.meta || {}),
          deletedAt: now.toISOString(),
        },
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('Audio handler error:', error);
    const status = req.method === 'DELETE' ? 500 : 500;
    const message = req.method === 'DELETE' ? '删除音频失败，请稍后再试。' : '获取音频详情失败，请稍后再试。';
    return res.status(status).json({ error: message });
  }
}
