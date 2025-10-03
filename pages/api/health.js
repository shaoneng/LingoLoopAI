import { setCors } from '../../lib/cors';
import { getSupabaseAdminClient } from '../../utils/supabase';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const startedAt = Date.now();
  let dbStatus = 'unknown';
  let dbError = null;

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('User')
      .select('id', { head: true, limit: 1 });

    if (error) {
      throw error;
    }

    dbStatus = 'ok';
  } catch (error) {
    dbStatus = 'error';
    dbError = error?.message || 'Database query failed';
  }

  const healthy = dbStatus === 'ok';
  const payload = {
    status: healthy ? 'ok' : 'degraded',
    uptimeSec: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus,
        error: dbError,
      },
    },
    responseTimeMs: Date.now() - startedAt,
    version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || undefined,
  };

  if (!healthy) {
    return res.status(503).json(payload);
  }

  return res.status(200).json(payload);
}
