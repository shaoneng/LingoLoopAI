import crypto from 'crypto'
import { getPool, withTransaction } from './db.js'

export const ACCESS_TOKEN_TTL_SEC = Number(process.env.AUTH_ACCESS_TOKEN_TTL_SEC || 15 * 60)
export const REFRESH_TOKEN_TTL_DAYS = Number(process.env.AUTH_REFRESH_TOKEN_TTL_DAYS || 14)
export const PASSWORD_RESET_TOKEN_TTL_MIN = Number(process.env.AUTH_PASSWORD_RESET_TTL_MIN || 30)
const PASSWORD_PBKDF2_ROUNDS = 100_000
const PASSWORD_KEYLEN = 64
const PASSWORD_DIGEST = 'sha512'

function requireJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret) {
    throw new Error('Missing AUTH_JWT_SECRET environment variable.')
  }
  return secret
}

function base64UrlEncode(buf) {
  return Buffer.from(buf).toString('base64url')
}

export function hashPassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.')
  }
  const salt = crypto.randomBytes(16)
  const derived = crypto.pbkdf2Sync(password, salt, PASSWORD_PBKDF2_ROUNDS, PASSWORD_KEYLEN, PASSWORD_DIGEST)
  return [PASSWORD_PBKDF2_ROUNDS, PASSWORD_DIGEST, salt.toString('base64'), derived.toString('base64')].join('$')
}

export function verifyPassword(password, stored) {
  if (!stored) return false
  const parts = stored.split('$')
  if (parts.length !== 4) return false
  const [roundsStr, digest, saltB64, hashB64] = parts
  const rounds = Number(roundsStr)
  if (!Number.isInteger(rounds) || rounds <= 0) return false
  const salt = Buffer.from(saltB64, 'base64')
  const expected = Buffer.from(hashB64, 'base64')
  const computed = crypto.pbkdf2Sync(password, salt, rounds, expected.length, digest)
  return crypto.timingSafeEqual(expected, computed)
}

export function createAccessToken(payload, { expiresInSec = ACCESS_TOKEN_TTL_SEC } = {}) {
  const secret = requireJwtSecret()
  const header = { alg: 'HS256', typ: 'JWT' }
  const nowSec = Math.floor(Date.now() / 1000)
  const body = {
    iat: nowSec,
    exp: nowSec + expiresInSec,
    ...payload,
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedBody = base64UrlEncode(JSON.stringify(body))
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url')
  return `${encodedHeader}.${encodedBody}.${signature}`
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url')
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('base64url')
}

export function hashPasswordResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function refreshTokenExpiresAt({ ttlDays = REFRESH_TOKEN_TTL_DAYS } = {}) {
  const expires = new Date()
  expires.setUTCDate(expires.getUTCDate() + ttlDays)
  return expires
}

export function passwordResetTokenExpiresAt({ ttlMin = PASSWORD_RESET_TOKEN_TTL_MIN } = {}) {
  const expires = new Date()
  expires.setUTCMinutes(expires.getUTCMinutes() + ttlMin)
  return expires
}

function getDbClient(options = {}) {
  return options.client || options.prismaClient || null
}

async function runQuery(sql, params = [], options = {}) {
  const client = getDbClient(options)
  if (client) {
    const { rows } = await client.query(sql, params)
    return rows
  }
  const { rows } = await getPool().query(sql, params)
  return rows
}

export async function createAuthSession({ userId, ttlDays, client, prismaClient } = {}) {
  if (!userId) throw new Error('userId is required to create auth session.')
  const dbClient = client || prismaClient
  const token = generateRefreshToken()
  const hashed = hashRefreshToken(token)
  const expiresAt = refreshTokenExpiresAt({ ttlDays })
  const rows = await runQuery(
    'INSERT INTO "AuthSession" ("userId", "refreshToken", "expiresAt") VALUES ($1, $2, $3) RETURNING "id", "userId", "refreshToken", "expiresAt", "createdAt"',
    [userId, hashed, expiresAt],
    { client: dbClient }
  )
  const session = rows[0]
  return { token, session }
}

export async function revokeSessionByToken({ token, client, prismaClient } = {}) {
  if (!token) return
  const dbClient = client || prismaClient
  const hashed = hashRefreshToken(token)
  await runQuery('DELETE FROM "AuthSession" WHERE "refreshToken" = $1', [hashed], { client: dbClient })
}

async function internalCreateAuthSession(client, { userId, ttlDays }) {
  const token = generateRefreshToken()
  const hashed = hashRefreshToken(token)
  const expiresAt = refreshTokenExpiresAt({ ttlDays })
  const { rows } = await client.query(
    'INSERT INTO "AuthSession" ("userId", "refreshToken", "expiresAt") VALUES ($1, $2, $3) RETURNING "id", "userId", "refreshToken", "expiresAt", "createdAt"',
    [userId, hashed, expiresAt]
  )
  return { token, session: rows[0] }
}

async function findUserById(id, options = {}) {
  const rows = await runQuery('SELECT * FROM "User" WHERE "id" = $1', [id], options)
  return rows[0] || null
}

export async function consumeRefreshToken({ token, client, prismaClient } = {}) {
  if (!token) return null
  const dbClient = client || prismaClient
  const action = async (tx) => {
    const hashed = hashRefreshToken(token)
    const { rows } = await tx.query(
      'SELECT * FROM "AuthSession" WHERE "refreshToken" = $1 FOR UPDATE',
      [hashed]
    )
    if (rows.length === 0) {
      return null
    }
    const session = rows[0]
    const now = new Date()
    if (new Date(session.expiresAt) <= now) {
      await tx.query('DELETE FROM "AuthSession" WHERE "id" = $1', [session.id])
      return null
    }
    await tx.query('DELETE FROM "AuthSession" WHERE "id" = $1', [session.id])
    const userRows = await tx.query('SELECT * FROM "User" WHERE "id" = $1', [session.userId])
    if (userRows.rowCount === 0) {
      return null
    }
    const user = userRows.rows[0]
    const { token: nextToken, session: nextSession } = await internalCreateAuthSession(tx, {
      userId: session.userId,
      ttlDays: undefined,
    })
    return {
      user,
      previousSession: session,
      refreshToken: nextToken,
      session: nextSession,
    }
  }

  if (dbClient) {
    return action(dbClient)
  }
  return withTransaction(action)
}

export async function createPasswordResetToken({ userId, ttlMin, client, prismaClient } = {}) {
  if (!userId) throw new Error('userId is required to create password reset token.')
  const dbClient = client || prismaClient
  const token = generatePasswordResetToken()
  const tokenHash = hashPasswordResetToken(token)
  const expiresAt = passwordResetTokenExpiresAt({ ttlMin })
  const rows = await runQuery(
    'INSERT INTO "PasswordResetToken" ("userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3) RETURNING *',
    [userId, tokenHash, expiresAt],
    { client: dbClient }
  )
  const record = rows[0]
  return { token, record }
}

export async function consumePasswordResetToken({ token, client, prismaClient } = {}) {
  if (!token) return null
  const dbClient = client || prismaClient
  const action = async (tx) => {
    const tokenHash = hashPasswordResetToken(token)
    const { rows } = await tx.query(
      'SELECT * FROM "PasswordResetToken" WHERE "tokenHash" = $1 FOR UPDATE',
      [tokenHash]
    )
    if (rows.length === 0) {
      return null
    }
    const existing = rows[0]
    const now = new Date()
    if (existing.usedAt || new Date(existing.expiresAt) <= now) {
      return null
    }
    await tx.query('UPDATE "PasswordResetToken" SET "usedAt" = $1 WHERE "id" = $2', [now, existing.id])
    const userRows = await tx.query('SELECT * FROM "User" WHERE "id" = $1', [existing.userId])
    if (userRows.rowCount === 0) {
      return null
    }
    existing.user = userRows.rows[0]
    return existing
  }

  if (dbClient) {
    return action(dbClient)
  }
  return withTransaction(action)
}

export async function invalidatePasswordResetTokensForUser({ userId, client, prismaClient } = {}) {
  if (!userId) return
  const dbClient = client || prismaClient
  const now = new Date()
  await runQuery(
    'UPDATE "PasswordResetToken" SET "usedAt" = $1 WHERE "userId" = $2 AND "usedAt" IS NULL',
    [now, userId],
    { client: dbClient }
  )
}

export function sanitizeUser(user) {
  if (!user) return null
  const { passwordHash, ...rest } = user
  return rest
}

function decodeJwtSegment(segment) {
  try {
    return Buffer.from(segment, 'base64url').toString('utf8')
  } catch (error) {
    return null
  }
}

export function verifyAccessToken(token) {
  if (!token || typeof token !== 'string') return null
  const secret = requireJwtSecret()
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest()
  let provided
  try {
    provided = Buffer.from(encodedSignature, 'base64url')
  } catch (error) {
    return null
  }
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null
  }
  const decodedPayload = decodeJwtSegment(encodedPayload)
  if (!decodedPayload) return null
  let payload
  try {
    payload = JSON.parse(decodedPayload)
  } catch (error) {
    return null
  }
  const nowSec = Math.floor(Date.now() / 1000)
  if (payload.exp && nowSec > Number(payload.exp)) {
    return null
  }
  return payload
}

export function extractBearerToken(authHeader) {
  if (!authHeader) return null
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader
  if (typeof header !== 'string') return null
  const match = header.match(/^\s*Bearer\s+(.+)$/i)
  if (!match) return null
  return match[1].trim()
}

export async function authenticateRequest(req, { client, prismaClient, requireEmailVerified = false } = {}) {
  const token = extractBearerToken(req?.headers?.authorization)
  if (!token) {
    return { token: null, user: null, payload: null }
  }
  const payload = verifyAccessToken(token)
  if (!payload?.sub) {
    return { token: null, user: null, payload: null }
  }
  const user = await findUserById(payload.sub, { client: client || prismaClient })
  if (!user) {
    return { token, user: null, payload: null }
  }
  if (requireEmailVerified && !user.emailVerified) {
    return { token, user: null, payload }
  }
  return { token, user, payload }
}

export async function requireUser(req, { client, prismaClient, emailVerified = false } = {}) {
  const { token, user, payload } = await authenticateRequest(req, {
    client,
    prismaClient,
    requireEmailVerified: emailVerified,
  })
  if (!token) {
    const error = new Error('未认证请求')
    error.statusCode = 401
    throw error
  }
  if (!user) {
    const error = new Error(emailVerified ? '邮箱未验证' : '用户不存在')
    error.statusCode = emailVerified ? 403 : 401
    throw error
  }
  return { user, token, payload }
}

