import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/middleware/auth';

function parsePositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function mapAudio(audio) {
  const latestRun = audio.transcriptRuns?.[0] || null;
  return {
    id: audio.id,
    filename: audio.filename,
    status: audio.status,
    language: audio.language,
    durationMs: audio.durationMs,
    sizeBytes: audio.sizeBytes ? audio.sizeBytes.toString() : null,
    createdAt: audio.createdAt,
    updatedAt: audio.updatedAt,
    latestRun: latestRun
      ? {
          id: latestRun.id,
          status: latestRun.status,
          engine: latestRun.engine,
          version: latestRun.version,
          completedAt: latestRun.completedAt,
        }
      : null,
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user } = await requireAuth(req);
    const page = Math.max(1, parsePositiveInt(req.query.page, 1));
    const pageSize = Math.min(50, parsePositiveInt(req.query.pageSize, 10));
    const search = req.query.q?.toString().trim();

    const where = {
      userId: user.id,
      deletedAt: null,
      ...(search
        ? {
            filename: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.audioFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          transcriptRuns: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.audioFile.count({ where }),
    ]);

    const mapped = items.map(mapAudio);

    res.status(200).json({
      items: mapped,
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('List audios error:', error);
    return res.status(500).json({ error: '获取音频列表失败，请稍后再试。' });
  }
}
