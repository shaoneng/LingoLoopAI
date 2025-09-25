import { Hono } from 'hono';
import type { Prisma } from '@prisma/client/edge';
import type { AppEnv } from '../types';
import { getPrisma } from '../lib/prisma';
import {
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_DAYS,
  createAccessToken,
  createAuthSession,
  hashPassword,
  sanitizeUser,
  verifyPassword,
  consumeRefreshToken,
} from '../lib/auth';
import { AuditKinds, recordAuditLog } from '../lib/audit';

const auth = new Hono<AppEnv>();

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase();
}

function isValidEmail(email?: string | null) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

auth.post('/register', async (c) => {
  const body = await c.req
    .json<{ email?: string; password?: string; displayName?: string }>()
    .catch(() => ({} as { email?: string; password?: string; displayName?: string }));
  const email = normalizeEmail(body.email);
  const password = body.password?.toString() || '';
  const displayName = body.displayName?.toString().trim() || null;

  if (!isValidEmail(email)) {
    return c.json({ error: '请输入有效的邮箱地址。' }, 400);
  }
  if (!password || password.length < 8) {
    return c.json({ error: '密码至少需要 8 个字符。' }, 400);
  }

  const prisma = getPrisma(c.env);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: '邮箱已注册，请直接登录。' }, 409);
  }

  try {
    const passwordHash = await hashPassword(password);
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          displayName,
        },
      });
      const { token, session } = await createAuthSession({ prisma: tx, userId: user.id });
      return { user, refreshToken: token, session };
    });

    const accessToken = await createAccessToken(c.env, { sub: result.user.id, email: result.user.email });

    recordAuditLog({
      prisma,
      userId: result.user.id,
      targetId: result.user.id,
      kind: AuditKinds.REGISTER,
      meta: { email: result.user.email },
    }).catch(() => undefined);

    return c.json({
      user: sanitizeUser(result.user),
      accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SEC,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.session.expiresAt.toISOString(),
      refreshTokenTtlDays: REFRESH_TOKEN_TTL_DAYS,
    }, 201);
  } catch (error) {
    console.error('Register error', error);
    return c.json({ error: '注册失败，请稍后再试。' }, 500);
  }
});

auth.post('/login', async (c) => {
  const body = await c.req
    .json<{ email?: string; password?: string }>()
    .catch(() => ({} as { email?: string; password?: string }));
  const email = normalizeEmail(body.email);
  const password = body.password?.toString() || '';

  if (!isValidEmail(email) || !password) {
    return c.json({ error: '请输入邮箱和密码。' }, 400);
  }

  const prisma = getPrisma(c.env);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return c.json({ error: '邮箱或密码不正确。' }, 401);
    }

    const { token: refreshToken, session } = await createAuthSession({ prisma, userId: user.id });
    const accessToken = await createAccessToken(c.env, { sub: user.id, email: user.email });

    recordAuditLog({
      prisma,
      userId: user.id,
      targetId: user.id,
      kind: AuditKinds.LOGIN_SUCCESS,
      meta: { email: user.email },
    }).catch(() => undefined);

    return c.json({
      user: sanitizeUser(user),
      accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SEC,
      refreshToken,
      refreshTokenExpiresAt: session.expiresAt.toISOString(),
      refreshTokenTtlDays: REFRESH_TOKEN_TTL_DAYS,
    });
  } catch (error) {
    console.error('Login error', error);
    return c.json({ error: '登录失败，请稍后再试。' }, 500);
  }
});

auth.post('/refresh', async (c) => {
  const body = await c.req
    .json<{ refreshToken?: string }>()
    .catch(() => ({} as { refreshToken?: string }));
  const refreshToken = body.refreshToken;
  if (!refreshToken) {
    return c.json({ error: '缺少 refresh token。' }, 400);
  }
  const prisma = getPrisma(c.env);
  try {
    const result = await consumeRefreshToken({ prisma, token: refreshToken });
    if (!result) {
      return c.json({ error: 'refresh token 无效或已过期。' }, 401);
    }
    const accessToken = await createAccessToken(c.env, { sub: result.user.id, email: result.user.email });
    return c.json({
      user: sanitizeUser(result.user),
      accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SEC,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.session.expiresAt.toISOString(),
      refreshTokenTtlDays: REFRESH_TOKEN_TTL_DAYS,
    });
  } catch (error) {
    console.error('Refresh error', error);
    return c.json({ error: '刷新令牌失败，请稍后再试。' }, 500);
  }
});

export default auth;
