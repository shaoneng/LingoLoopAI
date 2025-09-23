import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../../lib/middleware/auth';

function normalizeSegments(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user } = await requireAuth(req);
    const runId = req.query?.runId;
    if (!runId || typeof runId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 runId。' });
    }

    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const cursorIndex = Math.max(0, Number(req.query.cursor) || 0);

    // Check if this is a BBC resource request
    if (runId.startsWith('shared-bbc-')) {
      return await handleBBCResourceSegments(req, res, runId, user, limit, cursorIndex);
    }

    const [run, analyses] = await Promise.all([
      prisma.transcriptRun.findFirst({
        where: { id: runId, audio: { userId: user.id } },
        select: {
          id: true,
          segments: true,
          audio: { select: { deletedAt: true } },
        },
      }),
      prisma.analysis.findMany({
        where: { runId, kind: 'translation', status: 'succeeded' },
        select: { segmentIndex: true, result: true },
      }),
    ]);

    if (!run || !run.audio) {
      return res.status(404).json({ error: '转写记录不存在或无权访问。' });
    }
    enforceSoftDelete(run.audio, '音频不存在或已删除。');

    const translationMap = new Map();
    if (analyses) {
      for (const analysis of analyses) {
        if (analysis.segmentIndex != null && analysis.result?.zh) {
          translationMap.set(analysis.segmentIndex, analysis.result.zh);
        }
      }
    }

    const segments = normalizeSegments(run.segments);
    const itemsWithTranslation = segments.map((seg) => ({
      ...seg,
      translation: translationMap.get(seg.id) || ''
    }));

    const items = itemsWithTranslation.slice(cursorIndex, cursorIndex + limit);
    const nextCursor = cursorIndex + limit < itemsWithTranslation.length ? cursorIndex + limit : null;

    res.status(200).json({
      items,
      nextCursor,
      total: segments.length,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('List segments error:', error);
    return res.status(500).json({ error: '获取转写分段失败，请稍后再试。' });
  }
}

async function handleBBCResourceSegments(req, res, runId, user, limit, cursorIndex) {
  try {
    const resourceId = runId.replace('shared-bbc-', '');

    // Get the BBC resource
    const resource = await prisma.sharedBbcResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || !resource.isPublished) {
      return res.status(404).json({ error: '资源不存在' });
    }

    // Check user access for BBC resource
    const hasActiveSubscription = await checkUserSubscription(user.id);
    if (user.role !== 'ADMIN' && !hasActiveSubscription) {
      // Count how many published resources exist
      const totalCount = await prisma.sharedBbcResource.count({
        where: { isPublished: true },
      });

      // Count resources published before this one
      const beforeCount = await prisma.sharedBbcResource.count({
        where: {
          isPublished: true,
          OR: [
            { publishDate: { lt: resource.publishDate || resource.createdAt } },
            {
              publishDate: resource.publishDate || resource.createdAt,
              createdAt: { lt: resource.createdAt },
            },
          ],
        },
      });

      // If this resource is not in the first 5, deny access
      if (beforeCount >= 5) {
        return res.status(403).json({ error: '需要订阅才能访问此资源' });
      }
    }

    const segments = normalizeSegments(resource.segments);
    const items = segments.map((seg, index) => ({
      ...seg,
      id: seg.id || index,
      translation: ''
    }));

    const paginatedItems = items.slice(cursorIndex, cursorIndex + limit);
    const nextCursor = cursorIndex + limit < items.length ? cursorIndex + limit : null;

    res.status(200).json({
      items: paginatedItems,
      nextCursor,
      total: items.length,
    });
  } catch (error) {
    console.error('BBC resource segments error:', error);
    return res.status(500).json({ error: '获取BBC资源分段失败' });
  }
}

async function checkUserSubscription(userId) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    return subscription.status === 'ACTIVE' &&
           new Date(subscription.expiresAt) > new Date();
  } catch (error) {
    console.error('Check subscription error:', error);
    return false;
  }
}
