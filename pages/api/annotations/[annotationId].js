import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../lib/middleware/auth';

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
  if (!['PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user } = await requireAuth(req);
    const annotationId = req.query?.annotationId;
    if (!annotationId || typeof annotationId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 annotationId。' });
    }

    const annotation = await prisma.annotation.findFirst({
      where: { id: annotationId, userId: user.id },
      include: {
        run: {
          include: {
            audio: { select: { userId: true, deletedAt: true } },
          },
        },
      },
    });

    if (!annotation || !annotation.run?.audio || annotation.run.audio.userId !== user.id) {
      return res.status(404).json({ error: '注释不存在或无权访问。' });
    }
    enforceSoftDelete(annotation.run.audio, '音频不存在或已删除。');

    if (req.method === 'PATCH') {
      const { content, anchorType, anchorValue } = req.body || {};
      const updateData = {};
      if (content != null) updateData.content = content.toString();
      if (anchorType != null) updateData.anchorType = anchorType.toString();
      if (anchorValue != null) updateData.anchorValue = anchorValue.toString();

      if (!Object.keys(updateData).length) {
        return res.status(400).json({ error: '至少提供一个可更新字段。' });
      }

      const updated = await prisma.annotation.update({
        where: { id: annotationId },
        data: updateData,
      });
      return res.status(200).json(mapAnnotation(updated));
    }

    if (req.method === 'DELETE') {
      await prisma.annotation.update({
        where: { id: annotationId },
        data: { isDeleted: true },
      });
      return res.status(204).end();
    }
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('Annotation detail handler error:', error);
    return res.status(500).json({ error: '处理注释请求失败，请稍后再试。' });
  }
}
