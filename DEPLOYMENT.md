# LingoLoopAI 部署配置

## Railway.toml 配置
[build]
command = "npm run build"

[deploy]
startCommand = "npm start"

[env]
NODE_ENV = "production"
PORT = "3000"

## 需要配置的环境变量

### Vercel (前端)
```
DATABASE_URL=postgresql://...
AUTH_JWT_SECRET=your-secret-key-here
GCS_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json
GCLOUD_PROJECT=your-project-id
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_API_BASE=https://your-domain.com

# 可选配置
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
SPEECH_LOCATION=global
UPLOAD_URL_TTL_SEC=3600
AUTH_ACCESS_TOKEN_TTL_SEC=900
AUTH_REFRESH_TOKEN_TTL_DAYS=14
AUTH_PASSWORD_RESET_TTL_MIN=30

# 配额设置
QUOTA_PER_FILE_SIZE_BYTES=104857600
QUOTA_PER_FILE_DURATION_MS=1800000
QUOTA_DAILY_UPLOAD_LIMIT=10
QUOTA_DAILY_DURATION_LIMIT_MS=7200000
```

### Railway (Worker)
```
DATABASE_URL=postgresql://...
AUTH_JWT_SECRET=your-secret-key-here
GCS_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json
GCLOUD_PROJECT=your-project-id
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=production
```

## 部署脚本

### 1. 推送到 GitHub
```bash
git add .
git commit -m "部署准备"
git push origin main
```

### 2. 数据库迁移
```bash
# 本地运行
npx prisma db push
npx prisma generate

# 或在 Railway 中运行
railway run npx prisma db push
railway run npx prisma generate
```

### 3. Worker 部署
在 Railway 中配置 `scripts/start-worker.js`

### 4. 域名配置
在 Vercel 中添加自定义域名，自动配置 HTTPS