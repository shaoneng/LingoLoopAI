import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../../lib/middleware/auth';

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

  try {
    const { user } = await requireAuth(req);
    const runId = req.query?.runId;
    if (!runId || typeof runId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 runId。' });
    }

    const run = await prisma.transcriptRun.findFirst({
      where: { id: runId, audio: { userId: user.id } },
      select: {
        id: true,
        audio: { select: { deletedAt: true } },
      },
    });

    if (!run || !run.audio) {
      return res.status(404).json({ error: '转写记录不存在或无权访问。' });
    }
    enforceSoftDelete(run.audio, '音频不存在或已删除。');

    if (req.method === 'GET') {
      const revisions = await prisma.transcriptRevision.findMany({
        where: { runId },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ items: revisions.map(mapRevision) });
    }

    if (req.method === 'POST') {
      const { title, text, segments } = req.body || {};
      if (!text || !text.toString().trim()) {
        return res.status(400).json({ error: '文本内容不能为空。' });
      }
      const created = await prisma.transcriptRevision.create({
        data: {
          runId,
          title: title?.toString() || null,
          text: text.toString(),
          segments: segments ?? null,
          createdBy: user.id,
        },
      });
      return res.status(201).json(mapRevision(created));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('Revisions handler error:', error);
    return res.status(500).json({ error: '处理修订请求失败，请稍后再试。' });
  }
}
