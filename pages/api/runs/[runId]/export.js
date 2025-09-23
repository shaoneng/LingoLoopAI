import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../../lib/middleware/auth';

function toSeconds(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatSrtTimestamp(seconds) {
  const totalMs = Math.floor(toSeconds(seconds) * 1000);
  const hrs = Math.floor(totalMs / 3_600_000);
  const mins = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatVttTimestamp(seconds) {
  const totalMs = Math.floor(toSeconds(seconds) * 1000);
  const hrs = Math.floor(totalMs / 3_600_000);
  const mins = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
}

function buildPlainText(run) {
  const segments = ensureArray(run.segments);
  if (segments.length) {
    return segments.map((seg) => seg?.text || '').filter(Boolean).join('\n');
  }
  return run.text || '';
}

function buildJson(run) {
  const { audio, ...rest } = run;
  return JSON.stringify(rest, null, 2);
}

function buildSrt(run) {
  const segments = ensureArray(run.segments);
  if (!segments.length) {
    return (run.text || '').trim();
  }
  return segments
    .map((seg, idx) => {
      const start = formatSrtTimestamp(seg?.start);
      const end = formatSrtTimestamp(seg?.end);
      const text = (seg?.text || '').trim();
      return `${idx + 1}\n${start} --> ${end}\n${text}\n`;
    })
    .join('\n');
}

function buildVtt(run) {
  const segments = ensureArray(run.segments);
  const lines = ['WEBVTT', ''];
  if (!segments.length) {
    lines.push(run.text || '');
    return lines.join('\n');
  }
  segments.forEach((seg) => {
    const start = formatVttTimestamp(seg?.start);
    const end = formatVttTimestamp(seg?.end);
    const text = (seg?.text || '').trim();
    lines.push(`${start} --> ${end}`);
    lines.push(text);
    lines.push('');
  });
  return lines.join('\n');
}

function getFormatter(fmt) {
  switch ((fmt || 'txt').toLowerCase()) {
    case 'txt':
      return { build: buildPlainText, contentType: 'text/plain; charset=utf-8', ext: 'txt' };
    case 'json':
      return { build: buildJson, contentType: 'application/json; charset=utf-8', ext: 'json' };
    case 'srt':
      return { build: buildSrt, contentType: 'application/x-subrip; charset=utf-8', ext: 'srt' };
    case 'vtt':
      return { build: buildVtt, contentType: 'text/vtt; charset=utf-8', ext: 'vtt' };
    default:
      return null;
  }
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

    const formatter = getFormatter(req.query?.fmt);
    if (!formatter) {
      return res.status(400).json({ error: '不支持的导出格式，支持 txt|json|srt|vtt。' });
    }

    const run = await prisma.transcriptRun.findFirst({
      where: { id: runId, audio: { userId: user.id } },
      include: {
        audio: {
          select: { filename: true, deletedAt: true },
        },
      },
    });

    if (!run || !run.audio) {
      return res.status(404).json({ error: '转写记录不存在或无权访问。' });
    }

    enforceSoftDelete(run.audio, '音频不存在或无权访问。');

    const payload = formatter.build(run);
    const filenameBase = run.audio?.filename?.split('.')?.[0] || `run-${run.version || 'latest'}`;
    const filename = `${filenameBase}.${formatter.ext}`;

    res.setHeader('Content-Type', formatter.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    return res.status(200).send(payload);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('Export run error:', error);
    return res.status(500).json({ error: '导出失败，请稍后再试。' });
  }
}
