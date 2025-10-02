import { setCors } from '../../../lib/cors'
import { runQuery, withTransaction } from '../../../lib/db'
import {
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_DAYS,
  createAccessToken,
  createAuthSession,
  hashPassword,
  sanitizeUser,
} from '../../../lib/auth'
import { AuditKinds, recordAuditLog } from '../../../lib/audit'

function normalizeEmail(email) {
  return email?.toString().trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.AUTH_JWT_SECRET) {
    return res.status(500).json({ error: 'AUTH_JWT_SECRET is not configured.' })
  }

  const { email, password, displayName } = req.body || {}
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: '请输入有效的邮箱地址。' })
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: '密码至少需要 8 个字符。' })
  }

  try {
    const existing = await runQuery('SELECT 1 FROM "User" WHERE "email" = $1 LIMIT 1', [normalizedEmail])
    if (existing.length > 0) {
      return res.status(409).json({ error: '邮箱已注册，请直接登录。' })
    }

    const passwordHash = hashPassword(password)
    const result = await withTransaction(async (client) => {
      const userInsert = await client.query(
        'INSERT INTO "User" ("email", "passwordHash", "displayName") VALUES ($1, $2, $3) RETURNING *',
        [normalizedEmail, passwordHash, displayName?.toString().trim() || null]
      )
      const user = userInsert.rows[0]
      const { token, session } = await createAuthSession({ userId: user.id, client })
      return { user, refreshToken: token, session }
    })

    const accessToken = createAccessToken({ sub: result.user.id, email: result.user.email })

    recordAuditLog({
      userId: result.user.id,
      targetId: result.user.id,
      kind: AuditKinds.REGISTER,
      meta: { email: result.user.email },
    }).catch(() => undefined)

    res.status(201).json({
      user: sanitizeUser(result.user),
      accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SEC,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.session.expiresAt.toISOString(),
      refreshTokenTtlDays: REFRESH_TOKEN_TTL_DAYS,
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: '注册失败，请稍后再试。' })
  }
}

