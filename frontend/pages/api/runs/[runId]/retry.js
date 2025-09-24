import { setCors } from '../../../../lib/cors'
import prisma from '../../../../lib/prisma'
import { requireAuth, enforceSoftDelete } from '../../../../lib/middleware/auth'
import { runSynchronousGoogleTranscription } from '../../../../lib/transcriptRuns'
import { AuditKinds, recordAuditLog } from '../../../../lib/audit'

export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { user } = await requireAuth(req)
    const runId = req.query?.runId?.toString()
    if (!runId) return res.status(400).json({ error: '缺少有效的 runId。' })

    const run = await prisma.transcriptRun.findFirst({
      where: { id: runId, audio: { userId: user.id } },
      include: { audio: true },
    })

    if (!run || !run.audio) {
      return res.status(404).json({ error: '转写记录不存在或无权访问。' })
    }
    enforceSoftDelete(run.audio, '音频不存在或已删除。')

    const params = run.params || {}
    const language = params.language || run.audio.language || 'en-US'
    const diarize = params.diarize !== false
    const minSpeakerCount = params.minSpeakerCount
    const maxSpeakerCount = params.maxSpeakerCount
    const gapSec = params.gapSec
    const maxSegmentSec = params.maxSegmentSec
    const model = params.model || 'short'

    const result = await runSynchronousGoogleTranscription({
      audio: run.audio,
      userId: user.id,
      prismaClient: prisma,
      language,
      diarize,
      minSpeakerCount,
      maxSpeakerCount,
      gapSec,
      maxSegmentSec,
      model,
      force: true,
    })

    if (result.queued) {
      const { run: nextRun, job } = result
      recordAuditLog({
        userId: user.id,
        kind: AuditKinds.TRANSCRIBE_QUEUED,
        targetId: nextRun.id,
        meta: { audioId: nextRun.audioId, jobId: job?.id || null, retryOf: run.id },
      }).catch(() => undefined)

      return res.status(202).json({
        audioId: nextRun.audioId,
        runId: nextRun.id,
        jobId: job?.id || null,
        status: nextRun.status,
        queued: true,
      })
    }

    const { run: nextRun } = result
    recordAuditLog({
      userId: user.id,
      kind: AuditKinds.TRANSCRIBE_END,
      targetId: nextRun.id,
      meta: { audioId: nextRun.audioId, retryOf: run.id, status: nextRun.status },
    }).catch(() => undefined)

    return res.status(200).json({
      audioId: nextRun.audioId,
      runId: nextRun.id,
      status: nextRun.status,
      engine: nextRun.engine,
      version: nextRun.version,
      language,
      text: nextRun.text,
      segments: nextRun.segments,
      speakerCount: nextRun.speakerCount,
      confidence: nextRun.confidence,
      completedAt: nextRun.completedAt,
      reused: false,
    })
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' })
    }
    console.error('Retry run error:', error)
    return res.status(500).json({ error: '重试失败，请稍后再试。' })
  }
}

