import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';
import { verifyJwt } from '../lib/jwt';

export interface AuthenticatedVariables {
  userId: string;
  email?: string;
}

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: 'Missing Authorization header' }, 401);
  }
  const token = auth.slice('Bearer '.length).trim();
  const payload = await verifyJwt(token, c.env.AUTH_JWT_SECRET);
  if (!payload || typeof payload.sub !== 'string') {
    return c.json({ error: 'Invalid token' }, 401);
  }
  c.set('auth', { userId: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined });
  await next();
};
