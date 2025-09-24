import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

export const corsMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const origin = c.env.CORS_ORIGIN || '*';
  c.header('Access-Control-Allow-Origin', origin);
  c.header('Vary', 'Origin');
  c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (origin !== '*') {
    c.header('Access-Control-Allow-Credentials', 'true');
  }
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }
  await next();
};
