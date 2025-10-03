# PostgreSQL 数据库配置

## 方案1: Supabase (推荐)

### 1. 注册 Supabase
- 访问 https://supabase.com
- 创建新项目
- 获取数据库连接字符串
- 在 Settings → API 中复制 service_role 密钥 (保存为 `SUPABASE_SERVICE_ROLE_KEY`)

### 2. 配置数据库连接
```
# Prisma 运行时 (PgBouncer 连接池)
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=60&sslmode=require

# Prisma CLI (直连，用于 db push / migrate)
DIRECT_URL=postgresql://postgres:[password]@aws-0-[region].supabase.co:5432/postgres?sslmode=require
```

### 3. 运行数据库迁移
```bash
cd /path/to/LingoLoopAI
cp .env.example .env.local # 或者手动更新环境变量

# 生成 Prisma Edge 客户端
npx prisma generate

# 推送 schema
npx prisma db push

# 生成 Prisma 客户端
npx prisma generate
```

## 方案2: Planetscale

### 1. 注册 Planetscale
- 访问 https://planetscale.com
- 创建数据库
- 获取连接字符串

### 2. 配置 Prisma
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## 方案3: Render PostgreSQL

### 1. 创建 PostgreSQL 服务
- 访问 https://render.com
- 创建 PostgreSQL 数据库
- 获取连接字符串

### 2. 配置环境变量
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

## 数据库迁移脚本

```bash
#!/bin/bash
# migrate.sh

echo "开始数据库迁移..."

# 生成 Prisma 客户端
npx prisma generate

# 推送 schema
npx prisma db push

# 运行种子数据 (可选)
npx prisma db seed

echo "数据库迁移完成"
```

## 环境变量配置

### 前端环境变量 (Cloudflare Pages)
```
NEXT_PUBLIC_API_URL=https://your-api.workers.dev
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
```

### 后端环境变量 (Cloudflare Workers)
```
DATABASE_URL=postgresql://...
AUTH_JWT_SECRET=your-secret-key
GCS_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=service-account-key
GCLOUD_PROJECT=your-project-id
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
```

## 数据库备份策略

### Supabase 自动备份
- 每日自动备份
- 7天保留期
- 可手动导出

### 手动备份脚本
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# 使用 pg_dump 备份
pg_dump $DATABASE_URL > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

echo "备份完成: ${BACKUP_FILE}.gz"
```
