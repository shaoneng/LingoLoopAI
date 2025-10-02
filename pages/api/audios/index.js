import { setCors } from '../../../lib/cors'
import { requireAuth } from '../../../lib/middleware/auth'
import { query } from '../../../lib/db/client'

function parsePositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function mapAudio(audio) {
  const latestRun = audio.latestRun || null;
  return {
    id: audio.id,
    filename: audio.filename,
    status: audio.status,
    language: audio.language,
    durationMs: audio.durationMs,
    sizeBytes: audio.sizeBytes ? audio.sizeBytes.toString() : null,
    createdAt: audio.createdAt,
    updatedAt: audio.updatedAt,
    latestRun: latestRun
      ? {
          id: latestRun.id,
          status: latestRun.status,
          engine: latestRun.engine,
          version: latestRun.version,
          completedAt: latestRun.completedAt,
        }
      : null,
  };
}

function buildFilterClause({ userId, search }) {
  const conditions = ['a."userId" = $1', 'a."deletedAt" IS NULL']
  const params = [userId]
  if (search) {
    params.push(`%${search.toLowerCase()}%`)
    conditions.push('LOWER(a."filename") LIKE $2')
  }
  return { where: conditions.join(' AND '), params }
}

function mapRow(row) {
  const latestRun = row.latest_run_id
    ? {
        id: row.latest_run_id,
        status: row.latest_run_status,
        engine: row.latest_run_engine,
        version: row.latest_run_version,
        completedAt: row.latest_run_completed_at,
      }
    : null
  return {
    id: row.id,
    filename: row.filename,
    status: row.status,
    language: row.language,
    durationMs: row.duration_ms,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latestRun,
  }
}

async function fetchAudioPage({ userId, search, skip, take }) {
  const { where, params } = buildFilterClause({ userId, search })
  const limit = Math.max(1, take)
  const offset = Math.max(0, skip)

  const listSql = `
    SELECT
      a."id",
      a."filename",
      a."status",
      a."language",
      a."durationMs" as duration_ms,
      a."sizeBytes" as size_bytes,
      a."createdAt" as created_at,
      a."updatedAt" as updated_at,
      latest."id" as latest_run_id,
      latest."status" as latest_run_status,
      latest."engine" as latest_run_engine,
      latest."version" as latest_run_version,
      latest."completedAt" as latest_run_completed_at
    FROM "AudioFile" a
    LEFT JOIN LATERAL (
      SELECT t."id", t."status", t."engine", t."version", t."completedAt", t."updatedAt"
      FROM "TranscriptRun" t
      WHERE t."audioId" = a."id"
      ORDER BY t."createdAt" DESC
      LIMIT 1
    ) latest ON TRUE
    WHERE ${where}
    ORDER BY a."createdAt" DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `

  const countSql = `SELECT COUNT(*)::int AS total FROM "AudioFile" a WHERE ${where}`

  const listParams = [...params, limit, offset]
  const [{ rows: items }, { rows: countRows }] = await Promise.all([
    query(listSql, listParams),
    query(countSql, params),
  ])

  const total = countRows[0]?.total || 0
  const mapped = items.map(mapRow)
  return { items: mapped, total }
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user } = await requireAuth(req);
    const page = Math.max(1, parsePositiveInt(req.query.page, 1));
    const pageSize = Math.min(50, parsePositiveInt(req.query.pageSize, 10));
    const rawSearch = req.query.q?.toString().trim() || ''
    const search = rawSearch ? rawSearch : ''

    const { items, total } = await fetchAudioPage({
      userId: user.id,
      search,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const mapped = items.map((item) => mapAudio({
      ...item,
      sizeBytes: item.sizeBytes,
    }))

    res.status(200).json({
      items: mapped,
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('List audios error:', error);
    return res.status(500).json({ error: '获取音频列表失败，请稍后再试。' });
  }
}
