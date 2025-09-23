import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { verifyAccessToken } from '../../../lib/auth';

function send(res, { event, data }) {
  if (event) res.write(`event: ${event}\n`);
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`data: ${payload}\n\n`);
}

async function authenticate(req) {
  const token = req.query?.access_token?.toString() || null;
  if (!token) return { user: null };
  const payload = verifyAccessToken(token);
  if (!payload?.sub) return { user: null };
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return user ? { user } : { user: null };
}

async function listActiveRuns(userId) {
  return prisma.transcriptRun.findMany({
    where: { audio: { userId, deletedAt: null }, status: { in: ['queued', 'processing'] } },
    select: { id: true, audioId: true, status: true, completedAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const { user } = await authenticate(req);
    if (!user) {
      res.writeHead(401);
      send(res, { event: 'error', data: { error: '未认证请求' } });
      return res.end();
    }

    const state = new Map(); // runId -> { audioId, status }

    const bootstrap = await listActiveRuns(user.id);
    bootstrap.forEach((r) => state.set(r.id, { audioId: r.audioId, status: r.status }));
    send(res, { event: 'snapshot', data: { items: bootstrap } });

    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch (_) {}
    }, 25000);

    const poll = setInterval(async () => {
      try {
        const current = await listActiveRuns(user.id);
        const currentSet = new Set(current.map((r) => r.id));

        // additions and updates
        for (const r of current) {
          const prev = state.get(r.id);
          if (!prev) {
            state.set(r.id, { audioId: r.audioId, status: r.status });
            send(res, { event: 'update', data: { runId: r.id, audioId: r.audioId, status: r.status, completedAt: r.completedAt || null } });
            continue;
          }
          if (prev.status !== r.status) {
            prev.status = r.status;
            send(res, { event: 'update', data: { runId: r.id, audioId: r.audioId, status: r.status, completedAt: r.completedAt || null } });
          }
        }

        // removals (finished)
        for (const [runId, meta] of state.entries()) {
          if (currentSet.has(runId)) continue;
          const next = await prisma.transcriptRun.findUnique({
            where: { id: runId },
            select: { status: true, completedAt: true },
          });
          const status = next?.status || 'succeeded';
          send(res, { event: 'done', data: { runId, audioId: meta.audioId, status, completedAt: next?.completedAt || null } });
          state.delete(runId);
        }
      } catch (e) {
        send(res, { event: 'error', data: { error: e.message || '轮询失败' } });
      }
    }, 1000);

    req.on('close', () => {
      clearInterval(ping);
      clearInterval(poll);
    });
  } catch (error) {
    try { send(res, { event: 'error', data: { error: error.message || '服务器错误' } }); } finally { res.end(); }
  }
}
