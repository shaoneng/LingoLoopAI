import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import {
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_DAYS,
  createAccessToken,
  createAuthSession,
  sanitizeUser,
  verifyPassword,
} from '../../../lib/auth';
import { AuditKinds, recordAuditLog } from '../../../lib/audit';

function normalizeEmail(email) {
  return email?.toString().trim().toLowerCase();
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.AUTH_JWT_SECRET) {
    return res.status(500).json({ error: 'AUTH_JWT_SECRET is not configured.' });
  }

  const { email, password } = req.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: '请输入邮箱和密码。' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: '邮箱或密码不正确。' });
    }

    const { token: refreshToken, session } = await createAuthSession({ userId: user.id });
    const accessToken = createAccessToken({ sub: user.id, email: user.email });

    recordAuditLog({
      userId: user.id,
      kind: AuditKinds.LOGIN_SUCCESS,
      targetId: user.id,
      meta: { email: user.email },
    }).catch(() => undefined);

    res.status(200).json({
      user: sanitizeUser(user),
      accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SEC,
      refreshToken,
      refreshTokenExpiresAt: session.expiresAt.toISOString(),
      refreshTokenTtlDays: REFRESH_TOKEN_TTL_DAYS,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败，请稍后再试。' });
  }
}
