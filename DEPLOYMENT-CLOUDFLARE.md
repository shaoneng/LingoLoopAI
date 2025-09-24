# LingoLoop AI 部署指南

## 架构概述

本架构使用 GitHub + Cloudflare Pages + Workers + PostgreSQL 的组合：

- **前端**: Next.js 静态导出部署到 Cloudflare Pages
- **后端**: Hono.js API 部署到 Cloudflare Workers
- **数据库**: 外部 PostgreSQL 服务
- **存储**: Cloudflare R2 或外部云存储

## 部署步骤

### 步骤 1: 前端部署 (Cloudflare Pages)

1. **配置 GitHub 仓库**
   ```bash
   git add .
   git commit -m "Initial setup for Cloudflare deployment"
   git push origin main
   ```

2. **创建 Cloudflare Pages 项目**
   - 登录 Cloudflare Dashboard
   - 选择 Pages > Create a project
   - 连接你的 GitHub 仓库
   - 配置构建设置：
     - Build command: `npm run build`
     - Build output directory: `out`
     - Node.js version: `18`

3. **环境变量设置**
   - 在 Pages 设置中添加：
     - `NEXT_PUBLIC_API_BASE_URL`: `https://lingoloop-ai-api.your-subdomain.workers.dev`

### 步骤 2: 后端部署 (Cloudflare Workers)

1. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **配置 Worker**
   ```bash
   cd worker
   npm install
   ```

3. **设置环境变量**
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put DATABASE_URL
   ```

4. **部署 Worker**
   ```bash
   npm run deploy
   ```

### 步骤 3: 数据库配置

**推荐使用外部 PostgreSQL 服务：**

1. **选择服务提供商**：
   - [Supabase](https://supabase.com)
   - [Neon](https://neon.tech)
   - [PlanetScale](https://planetscale.com)
   - [Railway](https://railway.app)

2. **获取数据库连接字符串**
   ```bash
   # 示例：Supabase
   DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres"
   ```

3. **更新 Worker 环境变量**
   ```bash
   wrangler secret put DATABASE_URL
   ```

### 步骤 4: 域名配置

1. **配置自定义域名**
   - 在 Cloudflare Pages 中设置自定义域名
   - 在 Cloudflare Workers 中设置自定义域名
   - 配置 DNS 记录指向 Cloudflare

2. **SSL 证书**
   - Cloudflare 自动提供 SSL 证书
   - 确保所有连接都使用 HTTPS

## 环境变量配置

### 前端环境变量 (Cloudflare Pages)
```env
NEXT_PUBLIC_API_BASE_URL=https://lingoloop-ai-api.your-domain.workers.dev
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
```

### 后端环境变量 (Cloudflare Workers Secrets)
```bash
wrangler secret put JWT_SECRET
wrangler secret put DATABASE_URL
wrangler secret put GCS_BUCKET
wrangler secret put GOOGLE_APPLICATION_CREDENTIALS
wrangler secret put GEMINI_API_KEY
wrangler secret put GOOGLE_OAUTH_CLIENT_ID
wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET
```

## 功能特性

### ✅ 已实现功能
- [x] 用户认证 (JWT)
- [x] 用户注册/登录
- [x] 静态页面导出
- [x] 响应式设计
- [x] 无限滚动加载
- [x] API 路由结构
- [x] 环境变量配置

### 🚧 待实现功能
- [ ] 文件上传 (需要配置云存储)
- [ ] 语音转写 (需要 Google Cloud Speech API)
- [ ] AI 分析 (需要 Gemini API)
- [ ] 实时进度更新 (需要 SSE 支持)
- [ ] 数据库模型实现
- [ ] 缓存系统
- [ ] 错误处理优化

## 开发流程

### 本地开发
```bash
# 前端开发
npm run dev

# 后端开发
cd worker
npm run dev
```

### 部署流程
```bash
# 构建前端
npm run build

# 部署后端
cd worker
npm run deploy

# 提交代码
git add .
git commit -m "Update deployment"
git push origin main
```

## 监控和维护

### 1. 监控指标
- Cloudflare Analytics 访问统计
- Workers 执行时间
- 错误日志监控
- 数据库性能监控

### 2. 备份策略
- 定期备份数据库
- 版本控制代码
- 环境变量管理

### 3. 性能优化
- 使用 Cloudflare CDN
- 优化图片和静态资源
- 实施缓存策略
- 数据库查询优化

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本
   - 确认所有依赖已安装
   - 检查 TypeScript 错误

2. **API 连接失败**
   - 验证环境变量
   - 检查 Workers 部署状态
   - 确认 CORS 配置

3. **数据库连接问题**
   - 验证连接字符串
   - 检查数据库服务状态
   - 确认 IP 白名单配置

### 调试技巧
- 使用 `wrangler dev` 本地调试
- 查看 Cloudflare 日志
- 使用浏览器开发者工具
- 检查网络请求

## 成本估算

### Cloudflare 免费额度
- Pages: 100 构建次数/月
- Workers: 100,000 请求/天
- KV 存储: 1GB
- R2 存储: 10GB

### 预估成本
- 小规模使用: 免费
- 中等规模: ~$20/月
- 大规模: ~$100+/月

## 后续优化建议

1. **性能优化**
   - 实施边缘缓存
   - 优化数据库查询
   - 使用 CDN 加速

2. **功能扩展**
   - 添加更多 AI 功能
   - 实现实时协作
   - 支持更多音频格式

3. **安全增强**
   - 实施速率限制
   - 添加验证码
   - 增强输入验证

## 联系支持

如需技术支持，请查看：
- [Cloudflare 文档](https://developers.cloudflare.com/)
- [Hono.js 文档](https://hono.dev/)
- [Next.js 文档](https://nextjs.org/docs)