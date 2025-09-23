import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { verifyAccessToken } from '../../../../lib/auth';
import { enforceSoftDelete } from '../../../../lib/middleware/auth';

function sendEvent(res, { event, data }) {
  if (event) res.write(`event: ${event}\n`);
  if (data !== undefined) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    res.write(`data: ${payload}\n`);
  }
  res.write('\n');
}

async function authenticateFromQuery(req) {
  const token = req.query?.access_token?.toString() || null;
  if (!token) return { user: null, payload: null };
  const payload = verifyAccessToken(token);
  if (!payload?.sub) return { user: null, payload: null };
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return { user: null, payload: null };
  return { user, payload };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // For proxies that might buffer
  res.flushHeaders?.();

  try {
    const { user } = await authenticateFromQuery(req);
    if (!user) {
      res.writeHead(401);
      sendEvent(res, { event: 'error', data: { error: '未认证请求' } });
      return res.end();
    }

    const runId = req.query?.runId?.toString();
    if (!runId) {
      res.writeHead(400);
      sendEvent(res, { event: 'error', data: { error: '缺少有效的 runId。' } });
      return res.end();
    }

    const run = await prisma.transcriptRun.findFirst({
      where: { id: runId, audio: { userId: user.id } },
      include: { audio: { select: { id: true, deletedAt: true } } },
    });

    if (!run || !run.audio) {
      res.writeHead(404);
      sendEvent(res, { event: 'error', data: { error: '转写记录不存在或无权访问。' } });
      return res.end();
    }
    enforceSoftDelete(run.audio, '音频不存在或已删除。');

    let lastStatus = run.status;
    let closed = false;

    // initial payload
    sendEvent(res, {
      event: 'init',
      data: { runId: run.id, audioId: run.audioId, status: run.status, completedAt: run.completedAt },
    });

    // keepalive ping
    const pingTimer = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (_) {}
    }, 25000);

    // poll for updates
    const pollTimer = setInterval(async () => {
      try {
        const next = await prisma.transcriptRun.findUnique({
          where: { id: runId },
          select: { status: true, completedAt: true },
        });
        if (!next) return;
        if (next.status !== lastStatus) {
          lastStatus = next.status;
          sendEvent(res, { event: 'update', data: { runId, status: next.status, completedAt: next.completedAt } });
        }
        if (next.status === 'succeeded' || next.status === 'failed') {
          sendEvent(res, { event: 'done', data: { runId, status: next.status, completedAt: next.completedAt } });
          clearInterval(pollTimer);
          clearInterval(pingTimer);
          closed = true;
          res.end();
        }
      } catch (e) {
        // transient DB error: emit error and close
        sendEvent(res, { event: 'error', data: { error: e.message || '查询失败' } });
        clearInterval(pollTimer);
        clearInterval(pingTimer);
        closed = true;
        res.end();
      }
    }, 1000);

    req.on('close', () => {
      if (!closed) {
        clearInterval(pollTimer);
        clearInterval(pingTimer);
      }
    });
  } catch (error) {
    try {
      sendEvent(res, { event: 'error', data: { error: error.message || '服务器错误' } });
    } finally {
      res.end();
    }
  }
}

