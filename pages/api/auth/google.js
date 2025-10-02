import crypto from 'crypto'
import { setCors } from '../../../lib/cors'
import { withTransaction } from '../../../lib/db'
import {
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_DAYS,
  createAccessToken,
  createAuthSession,
  hashPassword,
  sanitizeUser,
} from '../../../lib/auth'
import { AuditKinds, recordAuditLog } from '../../../lib/audit'
import { verifyGoogleIdToken } from '../../../lib/googleOAuth'

function randomPasswordFallback() {
  return crypto.randomBytes(48).toString('base64url')
}

function buildSettings(existingSettings, sub) {
  const base = existingSettings && typeof existingSettings === 'object' ? { ...existingSettings } : {}
  if (!base.providedBy) base.providedBy = 'google'
  if (!base.googleSub) base.googleSub = sub
  return base
}

async function upsertUserFromGoogleProfile(tokenInfo, client) {
  const { email, emailVerified, name, picture, sub } = tokenInfo
  const now = new Date()
  const existingResult = await client.query('SELECT * FROM "User" WHERE "email" = $1 FOR UPDATE', [email])
  if (existingResult.rowCount > 0) {
    const existing = existingResult.rows[0]
    const updates = []
    const values = []
    let index = 1

    if (!existing.displayName && name) {
      updates.push(`"displayName" = $${index++}`)
      values.push(name)
    }
    if (!existing.avatarUrl && picture) {
      updates.push(`"avatarUrl" = $${index++}`)
      values.push(picture)
    }
    if (!existing.emailVerified && emailVerified) {
      updates.push(`"emailVerified" = $${index++}`)
      values.push(true)
    }
    const settings = buildSettings(existing.settings, sub)
    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(existing.settings || {})
    if (settingsChanged) {
      updates.push(`"settings" = $${index++}`)
      values.push(settings)
    }

    if (updates.length === 0) {
      return existing
    }

    updates.push(`"updatedAt" = $${index++}`)
    values.push(now)
    values.push(existing.id)

    const query = `UPDATE "User" SET ${updates.join(', ')} WHERE "id" = $${index} RETURNING *`
    const updated = await client.query(query, values)
    return updated.rows[0]
  }

  const passwordHash = hashPassword(randomPasswordFallback())
  const settings = buildSettings(null, sub)
  const insert = await client.query(
    'INSERT INTO "User" ("email", "passwordHash", "displayName", "avatarUrl", "emailVerified", "settings") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [
      email,
      passwordHash,
      name || null,
      picture || null,
      Boolean(emailVerified),
      settings,
    ]
  )
  return insert.rows[0]
}

async function handlePost(req, res) {
  const credential = req.body?.credential || req.body?.idToken
  if (!credential) {
    return res.status(400).json({ error: '缺少 Google 登录凭证。' })
  }

  let tokenInfo
  try {
    tokenInfo = await verifyGoogleIdToken(credential)
  } catch (error) {
    console.error('Google ID token verification failed:', error)
    return res.status(401).json({ error: 'Google 登录验证失败。' })
  }

  try {
    const result = await withTransaction(async (client) => {
      const user = await upsertUserFromGoogleProfile(tokenInfo, client)
      const { token: refreshToken, session } = await createAuthSession({ userId: user.id, client })
      const accessToken = createAccessToken({ sub: user.id, email: user.email, provider: 'google' })
      return { user, refreshToken, session, accessToken }
    })

    recordAuditLog({
      userId: result.user.id,
      targetId: result.user.id,
      kind: AuditKinds.LOGIN_SUCCESS,
      meta: { email: result.user.email, provider: 'google' },
    }).catch(() => undefined)

    res.status(200).json({
      user: sanitizeUser(result.user),
      accessToken: result.accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SEC,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.session.expiresAt.toISOString(),
      refreshTokenTtlDays: REFRESH_TOKEN_TTL_DAYS,
    })
  } catch (error) {
    console.error('Google login handler error:', error)
    res.status(500).json({ error: '登录失败，请稍后再试。' })
  }
}

export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await handlePost(req, res)
  } catch (error) {
    console.error('Google auth endpoint error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: '服务器错误，请稍后再试。' })
    }
  }
}

