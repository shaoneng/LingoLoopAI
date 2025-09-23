import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/middleware/auth';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await requireAuth(req);
    const runId = req.query.runId;

    if (!runId) {
      return res.status(400).json({ error: '缺少 runId 参数' });
    }

    const run = await prisma.transcriptRun.findFirst({
      where: {
        id: runId,
        audio: { userId: user.id, deletedAt: null }
      },
      include: {
        audio: {
          select: {
            id: true,
            filename: true,
            durationMs: true,
            sizeBytes: true,
            status: true,
            createdAt: true
          }
        },
        jobs: {
          select: {
            id: true,
            jobType: true,
            status: true,
            retryCount: true,
            createdAt: true,
            updatedAt: true,
            errorMessage: true
          }
        }
      }
    });

    if (!run) {
      return res.status(404).json({ error: '转写任务不存在或无权访问' });
    }

    // Calculate progress percentage based on status
    let progress = 0;
    let estimatedTimeRemaining = null;

    switch (run.status) {
      case 'queued':
        progress = 10;
        break;
      case 'processing':
        progress = 50;
        // Rough estimate: 1 minute per 10 minutes of audio
        if (run.audio.durationMs) {
          const audioMinutes = run.audio.durationMs / (1000 * 60);
          estimatedTimeRemaining = Math.ceil(audioMinutes * 0.1 * 60); // in seconds
        }
        break;
      case 'succeeded':
        progress = 100;
        break;
      case 'failed':
        progress = 0;
        break;
      default:
        progress = 0;
    }

    // Calculate time elapsed
    const timeElapsed = run.createdAt ? Date.now() - new Date(run.createdAt).getTime() : 0;

    const response = {
      runId: run.id,
      audioId: run.audioId,
      status: run.status,
      progress,
      timeElapsed,
      estimatedTimeRemaining,
      audio: {
        id: run.audio.id,
        filename: run.audio.filename,
        durationMs: run.audio.durationMs,
        sizeBytes: run.audio.sizeBytes,
        status: run.audio.status,
        createdAt: run.audio.createdAt
      },
      jobs: run.jobs,
      createdAt: run.createdAt,
      completedAt: run.completedAt,
      error: run.error
    };

    return res.json(response);

  } catch (error) {
    console.error('Progress API error:', error);
    return res.status(500).json({ error: error.message || '服务器错误' });
  }
}