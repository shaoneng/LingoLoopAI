import { setCors } from '../../../../../lib/cors';
import prisma from '../../../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../../../lib/middleware/auth';

function mapAnnotation(annotation) {
  return {
    id: annotation.id,
    runId: annotation.runId,
    userId: annotation.userId,
    content: annotation.content,
    anchorType: annotation.anchorType,
    anchorValue: annotation.anchorValue,
    createdAt: annotation.createdAt,
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { user } = await requireAuth(req);
    const runId = req.query?.runId;
    if (!runId || typeof runId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 runId。' });
    }

    const run = await prisma.transcriptRun.findFirst({
      where: { id: runId, audio: { userId: user.id } },
      select: { id: true, audio: { select: { deletedAt: true } } },
    });
    if (!run || !run.audio) {
      return res.status(404).json({ error: '转写记录不存在或无权访问。' });
    }
    enforceSoftDelete(run.audio, '音频不存在或已删除。');

    if (req.method === 'GET') {
      const annotations = await prisma.annotation.findMany({
        where: { runId, isDeleted: false },
        orderBy: { createdAt: 'asc' },
      });
      return res.status(200).json({ items: annotations.map(mapAnnotation) });
    }

    if (req.method === 'POST') {
      const { content, anchorType, anchorValue } = req.body || {};
      if (!content || !anchorType || !anchorValue) {
        return res.status(400).json({ error: 'content、anchorType、anchorValue 均为必填。' });
      }
      const created = await prisma.annotation.create({
        data: {
          runId,
          userId: user.id,
          content: content.toString(),
          anchorType: anchorType.toString(),
          anchorValue: anchorValue.toString(),
        },
      });
      return res.status(201).json(mapAnnotation(created));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('Annotation handler error:', error);
    return res.status(500).json({ error: '处理注释请求失败，请稍后再试。' });
  }
}
