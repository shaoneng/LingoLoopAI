import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../lib/middleware/auth';

function mapRevision(revision) {
  return {
    id: revision.id,
    runId: revision.runId,
    title: revision.title,
    text: revision.text,
    segments: revision.segments,
    createdBy: revision.createdBy,
    createdAt: revision.createdAt,
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
    const revisionId = req.query?.revisionId;
    if (!revisionId || typeof revisionId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 revisionId。' });
    }

    const revision = await prisma.transcriptRevision.findFirst({
      where: { id: revisionId },
      include: {
        run: {
          include: {
            audio: { select: { userId: true, deletedAt: true } },
          },
        },
      },
    });

    if (!revision || !revision.run?.audio || revision.run.audio.userId !== user.id) {
      return res.status(404).json({ error: '修订不存在或无权访问。' });
    }
    enforceSoftDelete(revision.run.audio, '音频不存在或已删除。');

    if (req.method === 'PATCH') {
      const { title, text, segments } = req.body || {};
      const updateData = {};
      if (title !== undefined) updateData.title = title != null ? title.toString() : null;
      if (text !== undefined) {
        if (!text.toString().trim()) {
          return res.status(400).json({ error: '文本内容不能为空。' });
        }
        updateData.text = text.toString();
      }
      if (segments !== undefined) updateData.segments = segments;
      if (!Object.keys(updateData).length) {
        return res.status(400).json({ error: '至少提供一个可更新字段。' });
      }

      const updated = await prisma.transcriptRevision.update({
        where: { id: revisionId },
        data: updateData,
      });
      return res.status(200).json(mapRevision(updated));
    }

    if (req.method === 'DELETE') {
      await prisma.transcriptRevision.delete({ where: { id: revisionId } });
      return res.status(204).end();
    }
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('Revision detail handler error:', error);
    return res.status(500).json({ error: '处理修订请求失败，请稍后再试。' });
  }
}
