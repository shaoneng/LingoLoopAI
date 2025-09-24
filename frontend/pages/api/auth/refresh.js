import { setCors } from '../../../lib/cors';
import {
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_DAYS,
  consumeRefreshToken,
  createAccessToken,
  sanitizeUser,
} from '../../../lib/auth';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.AUTH_JWT_SECRET) {
    return res.status(500).json({ error: 'AUTH_JWT_SECRET is not configured.' });
  }

  const { refreshToken } = req.body || {};
  const token = refreshToken || req.cookies?.refreshToken;

  if (!token) {
    return res.status(400).json({ error: '缺少 refresh token。' });
  }

  try {
    const result = await consumeRefreshToken({ token });
    if (!result) {
      return res.status(401).json({ error: 'refresh token 无效或已过期。' });
    }

    const accessToken = createAccessToken({ sub: result.user.id, email: result.user.email });
    res.status(200).json({
      user: sanitizeUser(result.user),
      accessToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SEC,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.session.expiresAt.toISOString(),
      refreshTokenTtlDays: REFRESH_TOKEN_TTL_DAYS,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: '刷新令牌失败，请稍后再试。' });
  }
}
