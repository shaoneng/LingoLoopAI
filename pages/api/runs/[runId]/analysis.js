import { setCors } from '../../../../lib/cors'
import prisma from '../../../../lib/prisma'
import { requireAuth, enforceSoftDelete } from '../../../../lib/middleware/auth'
import { analyzeSegmentWithGemini } from '../../../../lib/analysis'

export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  try {
    const { user } = await requireAuth(req)
    const runId = req.query?.runId?.toString()
    if (!runId) return res.status(400).json({ error: '缺少有效的 runId。' })

    const run = await prisma.transcriptRun.findFirst({
      where: { id: runId, audio: { userId: user.id } },
      include: { audio: { select: { deletedAt: true } } },
    })
    if (!run || !run.audio) return res.status(404).json({ error: '转写记录不存在或无权访问。' })
    enforceSoftDelete(run.audio, '音频不存在或已删除。')

    const ENGINE = 'gemini'
    const MODEL_ID = 'gemini-2.5-pro'
    const OVERVIEW_SEGMENT_INDEX = -1

    if (req.method === 'GET') {
      const existing = await prisma.analysis.findFirst({
        where: { runId, segmentIndex: OVERVIEW_SEGMENT_INDEX, kind: 'overview', status: 'succeeded' },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json({ item: existing || null })
    }

    if (req.method === 'POST') {
      const force = req.body?.force === true || String(req.body?.force).toLowerCase() === 'true'
      const text = run.text || ''
      if (!text.trim()) return res.status(400).json({ error: '当前转写缺少可分析文本。' })
      try {
        // 查缓存
        const cached = await prisma.analysis.findFirst({
          where: { runId, segmentIndex: OVERVIEW_SEGMENT_INDEX, kind: 'overview', engine: ENGINE },
          orderBy: { createdAt: 'desc' },
        })
        if (cached && !force && cached.status === 'succeeded') {
          return res.status(200).json({ item: cached })
        }

        // 调用生成
        const { analysis } = await analyzeSegmentWithGemini({
          runId,
          segmentIndex: OVERVIEW_SEGMENT_INDEX,
          kind: 'overview',
          text,
          language: run.audio?.language || 'en-US',
          engine: ENGINE,
          modelId: MODEL_ID,
          force,
          prismaClient: prisma,
          userId: user.id,
        })
        return res.status(200).json({ item: analysis })
      } catch (e) {
        const msg = e?.message || '分析失败'
        return res.status(500).json({ error: msg })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ error: error.message || '请求失败' })
    console.error('Run overview analysis error:', error)
    return res.status(500).json({ error: '分析失败，请稍后再试。' })
  }
}
