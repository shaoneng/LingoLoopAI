# 代码修改指南

## 📋 修改总览

为了适配 GitHub + Cloudflare Pages + Workers 架构，需要对现有代码进行以下修改：

1. **前端代码修改**: 移除 API 路由，配置静态导出
2. **后端代码迁移**: 将 API 路由迁移到 Workers
3. **数据库配置**: 适配 Workers 环境的数据库连接
4. **环境变量**: 适配各平台的环境变量格式

## 🎯 前端代码修改

### 1. 修改 package.json

**当前问题**: 包含 API 路由依赖
**修改方案**: 移除不必要的依赖

```json
{
  "name": "lingoloop-frontend",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next export",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.17"
    // 移除 formidable 等服务端依赖
  }
}
```

### 2. 修改 next.config.js

**当前问题**: 不支持静态导出
**修改方案**: 添加静态导出配置

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 关键修改：启用静态导出
  output: 'export',
  trailingSlash: true,

  // 关键修改：图片优化禁用（静态导出要求）
  images: {
    unoptimized: true
  },

  // 优化：静态资源缓存
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

### 3. 修改 API 调用配置

**当前问题**: API 调用使用相对路径
**修改方案**: 配置 Workers API 基础 URL

**src/lib/api.js**
```javascript
// 新增 API 配置文件
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.your-domain.com';

// API 请求封装
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}
```

### 4. 修改认证相关代码

**当前问题**: 使用 Next.js API 路由
**修改方案**: 适配 Workers API

**src/contexts/AuthContext.js**
```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 修改：从 localStorage 读取 token
  useEffect(() => {
    const savedAuth = localStorage.getItem('lingoloop.auth.v1');
    if (savedAuth) {
      const { user, accessToken } = JSON.parse(savedAuth);
      setUser(user);
      setAccessToken(accessToken);
    }
    setLoading(false);
  }, []);

  // 修改：适配 Workers API 的登录
  const login = async (email, password) => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const { user, accessToken, refreshToken } = response;

      // 保存到 localStorage
      localStorage.setItem('lingoloop.auth.v1', JSON.stringify({
        user,
        accessToken,
        refreshToken
      }));

      setUser(user);
      setAccessToken(accessToken);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 修改：适配 Workers API 的注册
  const register = async (userData) => {
    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      const { user, accessToken, refreshToken } = response;

      localStorage.setItem('lingoloop.auth.v1', JSON.stringify({
        user,
        accessToken,
        refreshToken
      }));

      setUser(user);
      setAccessToken(accessToken);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 修改：适配 Workers API 的登出
  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('lingoloop.auth.v1');
      setUser(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 5. 修改组件中的 API 调用

**当前问题**: 直接调用 Next.js API 路由
**修改方案**: 使用统一的 API 请求函数

**components/EnhancedDashboard.jsx**
```javascript
// 修改 loadData 函数
const loadData = React.useCallback(async ({ page: pageNum, q: query }) => {
  if (!accessToken) return;

  setLoading(true);
  setError(null);

  try {
    const params = new URLSearchParams();
    params.set('page', pageNum.toString());
    params.set('pageSize', '10');
    if (query) params.set('q', query);

    // 修改：使用 Workers API
    const response = await apiRequest(`/api/audios?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (pageNum === 1) {
      setItems(response.items || []);
    } else {
      setItems(prev => [...prev, ...(response.items || [])]);
    }

    setHasMore(response.hasMore || false);
    setPage(pageNum);
  } catch (error) {
    setError(error.message || '获取音频列表失败');
  } finally {
    setLoading(false);
  }
}, [accessToken]);
```

## 🔧 后端代码迁移

### 1. 创建 Workers 项目结构

```
workers/
├── src/
│   ├── index.ts              # 主入口
│   ├── routes/
│   │   ├── auth.ts           # 认证路由
│   │   ├── audios.ts         # 音频相关路由
│   │   ├── users.ts          # 用户相关路由
│   │   └── admin.ts          # 管理员路由
│   ├── middleware/
│   │   ├── auth.ts           # 认证中间件
│   │   ├── cors.ts           # CORS 中间件
│   │   └── error.ts          # 错误处理中间件
│   └── utils/
│       ├── database.ts       # 数据库连接
│       ├── jwt.ts            # JWT 工具
│       └── validation.ts     # 数据验证
├── package.json
└── wrangler.toml
```

### 2. 创建主入口文件

**workers/src/index.ts**
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { PrismaClient } from '@prisma/client';

// 导入路由
import authRoutes from './routes/auth';
import audioRoutes from './routes/audios';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';

// 导入中间件
import { errorHandler } from './middleware/error';
import { authMiddleware } from './middleware/auth';

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    AUTH_JWT_SECRET: string;
    GCS_BUCKET: string;
    GOOGLE_APPLICATION_CREDENTIALS: string;
    GCLOUD_PROJECT: string;
    GEMINI_API_KEY: string;
    GOOGLE_OAUTH_CLIENT_ID: string;
    GOOGLE_OAUTH_CLIENT_SECRET: string;
  }
}>();

// 全局中间件
app.use('*', cors({
  origin: ['https://your-domain.com', 'https://www.your-domain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

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

export default app;
```

### 3. 创建认证路由

**workers/src/routes/auth.ts**
```typescript
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';

const auth = new Hono();
const prisma = new PrismaClient();

// 登录
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      c.env.AUTH_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      c.env.AUTH_JWT_SECRET,
      { expiresIn: '14d' }
    );

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 注册
auth.post('/register', async (c) => {
  const { email, password, displayName } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName: displayName || email
      }
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      c.env.AUTH_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      c.env.AUTH_JWT_SECRET,
      { expiresIn: '14d' }
    );

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default auth;
```

### 4. 创建音频路由

**workers/src/routes/audios.ts**
```typescript
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const audios = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    AUTH_JWT_SECRET: string;
  }
}>();

const prisma = new PrismaClient();

// 获取音频列表
audios.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '10');
  const search = c.req.query('q')?.toString().trim();

  try {
    const where = {
      userId: user.userId,
      deletedAt: null,
      ...(search ? {
        filename: {
          contains: search,
          mode: 'insensitive'
        }
      } : {})
    };

    const [items, total] = await Promise.all([
      prisma.audioFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          transcriptRuns: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.audioFile.count({ where })
    ]);

    const mapped = items.map(audio => ({
      id: audio.id,
      filename: audio.filename,
      status: audio.status,
      language: audio.language,
      durationMs: audio.durationMs,
      sizeBytes: audio.sizeBytes?.toString(),
      createdAt: audio.createdAt,
      latestRun: audio.transcriptRuns[0] || null
    }));

    return c.json({
      items: mapped,
      hasMore: page * pageSize < total
    });
  } catch (error) {
    console.error('List audios error:', error);
    return c.json({ error: 'Failed to fetch audios' }, 500);
  }
});

export default audios;
```

## 🗄️ 数据库连接配置

### 1. 创建数据库连接工具

**workers/src/utils/database.ts**
```typescript
import { PrismaClient } from '@prisma/client';

// 创建 Prisma 客户端
const prisma = new PrismaClient();

// 数据库连接池配置
export const getPrismaClient = () => {
  return prisma;
};

// 健康检查
export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};
```

### 2. 修改 Prisma schema

**prisma/schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 数据库模型保持不变
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  displayName   String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // 关系
  audioFiles    AudioFile[]
  auditLogs     AuditLog[]
  usageLogs     UsageLog[]
  subscriptions Subscription[]
  authSessions  AuthSession[]
  learningSessions LearningSession[]

  @@map("users")
}

// 其他模型保持不变...
```

## 🌐 环境变量配置

### 1. 前端环境变量

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
```

### 2. Workers 环境变量

**wrangler.toml**
```toml
[env.production.vars]
DATABASE_URL = "postgresql://..."
AUTH_JWT_SECRET = "your-secret-key"
GCS_BUCKET = "your-bucket-name"
GOOGLE_APPLICATION_CREDENTIALS = "service-account-key"
GCLOUD_PROJECT = "your-project-id"
GEMINI_API_KEY = "your-gemini-api-key"
GOOGLE_OAUTH_CLIENT_ID = "your-oauth-client-id"
GOOGLE_OAUTH_CLIENT_SECRET = "your-oauth-client-secret"
```

### 3. GitHub Secrets

在 GitHub 仓库设置中配置：
```
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
DATABASE_URL=your-database-url
AUTH_JWT_SECRET=your-jwt-secret
```

## 📋 部署文件

### 1. 创建 GitHub Actions 工作流

**.github/workflows/deploy.yml**
```yaml
name: Deploy LingoLoop AI

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Build frontend
        working-directory: ./frontend
        run: |
          npm ci
          npm run build
          npm run export

      - name: Deploy to Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: lingoloop-frontend
          directory: frontend/out

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: workers/package-lock.json

      - name: Deploy Workers
        working-directory: ./workers
        run: |
          npm ci
          npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## 🎯 修改总结

### 主要修改点：
1. **前端**: 移除 API 路由，配置静态导出
2. **后端**: 迁移到 Workers + Hono.js
3. **数据库**: 保持 PostgreSQL，优化连接
4. **环境变量**: 适配各平台配置
5. **部署**: 配置 GitHub Actions 自动化部署

### 迁移优势：
- **性能提升**: Cloudflare 全球 CDN
- **成本降低**: 大部分服务免费
- **可维护性**: 自动化部署和监控
- **安全性**: Cloudflare 安全防护

这个方案可以在保持现有功能的同时，获得更好的性能和更低的成本。