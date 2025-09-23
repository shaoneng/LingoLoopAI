import crypto from 'crypto';
import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import {
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_DAYS,
  createAccessToken,
  createAuthSession,
  hashPassword,
  sanitizeUser,
} from '../../../lib/auth';
import { verifyGoogleIdToken } from '../../../lib/googleOAuth';

function randomPasswordFallback() {
  return crypto.randomBytes(48).toString('base64url');
}

async function upsertUserFromGoogleProfile(tokenInfo, prismaClient) {
  const { email, emailVerified, name, picture, sub } = tokenInfo;
  const now = new Date();
  const existing = await prismaClient.user.findUnique({ where: { email } });
  if (existing) {
    const data = {};
    if (!existing.displayName && name) data.displayName = name;
    if (!existing.avatarUrl && picture) data.avatarUrl = picture;
    if (!existing.emailVerified && emailVerified) data.emailVerified = true;
    if (Object.keys(data).length > 0) {
      data.updatedAt = now;
      return prismaClient.user.update({ where: { id: existing.id }, data });
    }
    return existing;
  }

  const passwordHash = hashPassword(randomPasswordFallback());
  return prismaClient.user.create({
    data: {
      email,
      passwordHash,
      displayName: name || null,
      avatarUrl: picture || null,
      emailVerified: emailVerified || false,
      settings: {
        providedBy: 'google',
        googleSub: sub,
      },
    },
  });
}

async function handlePost(req, res) {
  const credential = req.body?.credential || req.body?.idToken;
  if (!credential) {
    return res.status(400).json({ error: '缺少 Google 登录凭证。' });
  }

  let tokenInfo;
  try {
    tokenInfo = await verifyGoogleIdToken(credential);
  } catch (error) {
    console.error('Google ID token verification failed:', error);
    return res.status(401).json({ error: 'Google 登录验证失败。' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await upsertUserFromGoogleProfile(tokenInfo, tx);
      const { token: refreshToken, session } = await createAuthSession({ userId: user.id, prismaClient: tx });
      const accessToken = createAccessToken({ sub: user.id, email: user.email, provider: 'google' });
      return { user, refreshToken, session, accessToken };
    });

    res.status(200).json({
      user: sanitizeUser(result.user),
      accessToken: result.accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SEC,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.session.expiresAt.toISOString(),
      refreshTokenTtlDays: REFRESH_TOKEN_TTL_DAYS,
    });
  } catch (error) {
    console.error('Google login handler error:', error);
    res.status(500).json({ error: '登录失败，请稍后再试。' });
  }
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await handlePost(req, res);
  } catch (error) {
    console.error('Google auth endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '服务器错误，请稍后再试。' });
    }
  }
}
