// Cloudflare Workers API 主入口
import { PrismaClient } from '@prisma/client';
import { Hono } from 'hono';

// 路由导入
import authRoutes from './routes/auth';
import audioRoutes from './routes/audios';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';

// 中间件导入
import { corsMiddleware } from './middleware/cors';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';

const app = new Hono();

// 初始化 Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

// 全局中间件
app.use('*', corsMiddleware);
app.use('*', errorHandler);

// 健康检查
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API 路由
app.route('/api/auth', authRoutes);
app.route('/api/audios', audioRoutes);
app.route('/api/users', userRoutes);
app.route('/api/admin', adminRoutes);

// 404 处理
app.all('*', (c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};

// 环境变量类型
type Env = {
  DATABASE_URL: string;
  AUTH_JWT_SECRET: string;
  GCS_BUCKET: string;
  GOOGLE_APPLICATION_CREDENTIALS: string;
  GCLOUD_PROJECT: string;
  GEMINI_API_KEY: string;
  GOOGLE_OAUTH_CLIENT_ID: string;
  GOOGLE_OAUTH_CLIENT_SECRET: string;
};