import crypto from 'crypto';
import prisma from './prisma';

export const ACCESS_TOKEN_TTL_SEC = Number(process.env.AUTH_ACCESS_TOKEN_TTL_SEC || 15 * 60);
export const REFRESH_TOKEN_TTL_DAYS = Number(process.env.AUTH_REFRESH_TOKEN_TTL_DAYS || 14);
export const PASSWORD_RESET_TOKEN_TTL_MIN = Number(process.env.AUTH_PASSWORD_RESET_TTL_MIN || 30);
const PASSWORD_PBKDF2_ROUNDS = 100_000;
const PASSWORD_KEYLEN = 64;
const PASSWORD_DIGEST = 'sha512';

function requireJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error('Missing AUTH_JWT_SECRET environment variable.');
  }
  return secret;
}

function base64UrlEncode(buf) {
  return Buffer.from(buf).toString('base64url');
}

export function hashPassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  const salt = crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(password, salt, PASSWORD_PBKDF2_ROUNDS, PASSWORD_KEYLEN, PASSWORD_DIGEST);
  return [PASSWORD_PBKDF2_ROUNDS, PASSWORD_DIGEST, salt.toString('base64'), derived.toString('base64')].join('$');
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const [roundsStr, digest, saltB64, hashB64] = parts;
  const rounds = Number(roundsStr);
  if (!Number.isInteger(rounds) || rounds <= 0) return false;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const computed = crypto.pbkdf2Sync(password, salt, rounds, expected.length, digest);
  return crypto.timingSafeEqual(expected, computed);
}

export function createAccessToken(payload, { expiresInSec = ACCESS_TOKEN_TTL_SEC } = {}) {
  const secret = requireJwtSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowSec = Math.floor(Date.now() / 1000);
  const body = {
    iat: nowSec,
    exp: nowSec + expiresInSec,
    ...payload,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashPasswordResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiresAt({ ttlDays = REFRESH_TOKEN_TTL_DAYS } = {}) {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + ttlDays);
  return expires;
}

export function passwordResetTokenExpiresAt({ ttlMin = PASSWORD_RESET_TOKEN_TTL_MIN } = {}) {
  const expires = new Date();
  expires.setUTCMinutes(expires.getUTCMinutes() + ttlMin);
  return expires;
}

export async function createAuthSession({ userId, prismaClient = prisma, ttlDays } = {}) {
  if (!userId) throw new Error('userId is required to create auth session.');
  const token = generateRefreshToken();
  const hashed = hashRefreshToken(token);
  const expiresAt = refreshTokenExpiresAt({ ttlDays });
  const session = await prismaClient.authSession.create({
    data: {
      userId,
      refreshToken: hashed,
      expiresAt,
    },
  });
  return { token, session };
}

export async function revokeSessionByToken({ token, prismaClient = prisma }) {
  if (!token) return;
  const hashed = hashRefreshToken(token);
  await prismaClient.authSession.deleteMany({
    where: { refreshToken: hashed },
  });
}

export async function consumeRefreshToken({ token, prismaClient = prisma } = {}) {
  if (!token) return null;
  const hashed = hashRefreshToken(token);
  const session = await prismaClient.authSession.findUnique({
    where: { refreshToken: hashed },
    include: { user: true },
  });
  if (!session) return null;
  const now = new Date();
  if (session.expiresAt <= now) {
    await prismaClient.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  try {
    await prismaClient.authSession.delete({ where: { id: session.id } });
  } catch (error) {
    if (error?.code === 'P2025') {
      return null;
    }
    throw error;
  }
  const { token: nextToken, session: nextSession } = await createAuthSession({ userId: session.userId, prismaClient });
  return {
    user: session.user,
    previousSession: session,
    refreshToken: nextToken,
    session: nextSession,
  };
}

export async function createPasswordResetToken({ userId, prismaClient = prisma, ttlMin } = {}) {
  if (!userId) throw new Error('userId is required to create password reset token.');
  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = passwordResetTokenExpiresAt({ ttlMin });
  const record = await prismaClient.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
  return { token, record };
}

export async function consumePasswordResetToken({ token, prismaClient = prisma } = {}) {
  if (!token) return null;
  const tokenHash = hashPasswordResetToken(token);
  const now = new Date();
  const existing = await prismaClient.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!existing || existing.usedAt || existing.expiresAt <= now) {
    return null;
  }
  await prismaClient.passwordResetToken.update({
    where: { id: existing.id },
    data: { usedAt: now },
  });
  return existing;
}

export async function invalidatePasswordResetTokensForUser({ userId, prismaClient = prisma }) {
  if (!userId) return;
  await prismaClient.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

function decodeJwtSegment(segment) {
  try {
    return Buffer.from(segment, 'base64url').toString('utf8');
  } catch (error) {
    return null;
  }
}

export function verifyAccessToken(token) {
  if (!token || typeof token !== 'string') return null;
  const secret = requireJwtSecret();
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  let provided;
  try {
    provided = Buffer.from(encodedSignature, 'base64url');
  } catch (error) {
    return null;
  }
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }
  const decodedPayload = decodeJwtSegment(encodedPayload);
  if (!decodedPayload) return null;
  let payload;
  try {
    payload = JSON.parse(decodedPayload);
  } catch (error) {
    return null;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && nowSec > Number(payload.exp)) {
    return null;
  }
  return payload;
}

export function extractBearerToken(authHeader) {
  if (!authHeader) return null;
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (typeof header !== 'string') return null;
  const match = header.match(/^\s*Bearer\s+(.+)$/i);
  if (!match) return null;
  return match[1].trim();
}

export async function authenticateRequest(req, { prismaClient = prisma, requireEmailVerified = false } = {}) {
  const token = extractBearerToken(req?.headers?.authorization);
  if (!token) {
    return { token: null, user: null, payload: null };
  }
  const payload = verifyAccessToken(token);
  if (!payload?.sub) {
    return { token: null, user: null, payload: null };
  }
  const user = await prismaClient.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return { token, user: null, payload: null };
  }
  if (requireEmailVerified && !user.emailVerified) {
    return { token, user: null, payload };
  }
  return { token, user, payload };
}

export async function requireUser(req, { prismaClient = prisma, emailVerified = false } = {}) {
  const { token, user, payload } = await authenticateRequest(req, {
    prismaClient,
    requireEmailVerified: emailVerified,
  });
  if (!token) {
    const error = new Error('未认证请求');
    error.statusCode = 401;
    throw error;
  }
  if (!user) {
    const error = new Error(emailVerified ? '邮箱未验证' : '用户不存在');
    error.statusCode = emailVerified ? 403 : 401;
    throw error;
  }
  return { user, token, payload };
}
