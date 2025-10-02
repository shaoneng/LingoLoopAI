import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth';
import audioRoutes from './routes/audios';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import type { AppEnv } from './types';
import { getPrisma } from './lib/prisma';

const app = new Hono<AppEnv>();

app.use('*', errorHandler);
app.use('*', corsMiddleware);

app.get('/api/health', async (c) => {
  const startedAt = Date.now();
  let dbStatus: 'ok' | 'error' = 'ok';
  let dbError: string | null = null;
  try {
    const prisma = await getPrisma(c.env);
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'error';
    dbError = error instanceof Error ? error.message : 'Unknown error';
  }
  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  return c.json({
    status,
    services: {
      database: {
        status: dbStatus,
        error: dbError,
      },
    },
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - startedAt,
  }, dbStatus === 'ok' ? 200 : 503);
});

app.route('/api/auth', authRoutes);
app.route('/api/audios', audioRoutes);
app.route('/api/users', userRoutes);
app.route('/api/admin', adminRoutes);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

export default app;
