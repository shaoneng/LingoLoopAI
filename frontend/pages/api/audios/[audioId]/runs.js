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
    speakerCount: run.speakerCount,
    confidence: run.confidence,
    createdAt: run.createdAt,
    completedAt: run.completedAt,
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user } = await requireAuth(req);
    const audioId = req.query?.audioId;
    if (!audioId || typeof audioId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 audioId。' });
    }

    const audio = await prisma.audioFile.findFirst({
      where: { id: audioId, userId: user.id },
      select: { id: true, deletedAt: true },
    });

    enforceSoftDelete(audio, '音频不存在或已删除。');

    const limit = Math.min(50, Number(req.query.limit) || 10);
    const cursor = req.query.cursor ? { id: req.query.cursor.toString() } : undefined;

    const runs = await prisma.transcriptRun.findMany({
      where: { audioId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor,
      skip: cursor ? 1 : 0,
      select: {
        id: true,
        version: true,
        status: true,
        engine: true,
        params: true,
        text: true,
        speakerCount: true,
        confidence: true,
        createdAt: true,
        completedAt: true,
      },
    });

    const hasNext = runs.length > limit;
    const items = hasNext ? runs.slice(0, -1) : runs;
    const nextCursor = hasNext ? items[items.length - 1]?.id || null : null;

    res.status(200).json({
      items: items.map(mapRun),
      nextCursor,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('List runs error:', error);
    return res.status(500).json({ error: '获取转写历史失败，请稍后再试。' });
  }
}
