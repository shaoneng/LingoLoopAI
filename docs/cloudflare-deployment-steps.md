# Cloudflare 部署与迁移步骤详解

本文件针对《完整部署指南》中的流程进行逐步拆解，说明每一步的目标、涉及的代码模块、常见问题以及检验方法。

---

## 阶段 0：准备工作

### 0.1 账户与服务开通
- **Cloudflare**：启用 Pages、Workers、Queues 功能；在组织下创建两个项目（静态前端 + API Worker）。
- **Prisma Accelerate**：在 Prisma 控制台开通 Accelerate，生成 `prisma://` 连接串，并为部署环境准备 API 密钥。
- **PostgreSQL**：确保已有可访问的实例（Supabase、RDS、Cloud SQL 等），开放 Cloudflare IP 的访问权限。
- **Google Cloud**：启用 Storage、Speech-to-Text、Gemini API，创建服务账号并授予相应权限（Storage Admin、Speech-to-Text Admin、Generative AI Studio User）。

### 0.2 仓库结构确认
- `frontend/`：负责 Cloudflare Pages 构建。关键代码：`next.config.js`、`pages/`、`components/`。
- `workers/`：Hono API，部署到 Cloudflare Workers。关键代码：`src/index.ts`、`src/routes/**`、`lib/prisma.ts`（Edge 版本）。
- `worker/`：队列消费者 Worker。`src/index.ts` 负责从 Cloudflare Queue 获取任务、调用 Google API。

---

## 阶段 1：环境变量与秘密管理

### 1.1 本地开发
- 复制 `.env.example` 为 `.env.cloudflare`。
- 分别创建 `frontend/.env.local`、`workers/.dev.vars`、`worker/.dev.vars`，填入模板中对应变量。
- 注意：在 Worker 环境下，`GCP_PRIVATE_KEY` 需保持单行格式，换行替换为 `\n`。

### 1.2 Cloudflare 控制台配置
- **Pages** → `Settings > Environment variables`：设置 `NEXT_PUBLIC_*` 变量。
- **Workers** → `Settings > Variables`：添加 `AUTH_JWT_SECRET`、`PRISMA_ACCELERATE_URL`、`GCP_*`、`GEMINI_API_KEY`、`MAIL_*` 等。
- **Queues**：创建队列后，在 Worker 配置中绑定 `QUEUE` 变量。

验证：本地运行 `wrangler dev`（在 `workers/` 目录）与 `wrangler dev --queue-consumer`（在 `worker/` 目录），确保环境变量被正确读取。

---

## 阶段 2：数据库迁移与 Prisma Edge 客户端

### 2.1 迁移执行
- 在仓库根目录执行：
  ```bash
  export $(cat .env.cloudflare | xargs)
  npx prisma db push
  npx prisma generate --schema prisma/schema.prisma
  ```
- 上述命令仅依赖本地 Node 环境，用于更新数据库 schema 和生成 Edge 客户端。

### 2.2 Edge 客户端集成
- `workers/src/lib/prisma.ts` 导入 `@prisma/client/edge`，扩展 `withAccelerate`。
- 确保所有查询使用新的客户端实例，避免引用旧的 Node.js Prisma 代码。

验证：本地 `wrangler dev` 后访问 `/api/health` 检查数据库连接是否通过 Accelerate 正常工作。

---

## 阶段 3：前端静态化（Cloudflare Pages）

### 3.1 编译与导出
- 在 `frontend/` 目录执行：`npm run build && npm run export`。
- 生成的 `out/` 目录包含静态资源，用于 Pages 部署。

### 3.2 API 对接
- 页面的数据请求必须指向 Worker API，例如：
  ```js
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
  fetch(`${API_BASE}/api/auth/login`, {...})
  ```
- 确保所有原来的 `getServerSideProps` 已移除或改写成客户端请求。

### 3.3 Cloudflare Pages 配置
- 在 Pages 项目中选择“框架预设：Next.js (Static)”或自定义构建命令：
  - Build command: `npm run build && npm run export`
  - Build output directory: `out`

验证：构建日志无报错，发布后访问 Pages 域名确认页面加载正常。

---

## 阶段 4：Workers API 部署

### 4.1 Hono 应用结构
- `workers/src/index.ts` 定义路由：
  - `/api/auth/*`、`/api/uploads/*` 等核心接口。
  - 所有响应需返回 `Response.json(...)` 并设置好 CORS。
- 上传接口使用 `request.formData()` 或直传 URL，避免 Node.js 专用库。
- 调用 Google APIs 时，通过服务账号签名 JWT，再使用 `fetch` 访问 REST 端点。

### 4.2 部署命令
- 在 `workers/` 目录执行：
  ```bash
  wrangler deploy
  ```
- `wrangler.toml` 示例：
  ```toml
  name = "lingoloop-api"
  main = "src/index.ts"
  compatibility_date = "2025-01-01"

  [vars]
  CORS_ORIGIN = "*"
  ```

验证：部署后访问 Worker 域名 `/api/health`，确认返回 `status: "ok"`。

---

## 阶段 5（可选）：队列消费者部署

> 如果暂时不启用 Cloudflare Queues，可跳过本阶段并保持 `wrangler.toml` 无队列绑定；后续需要异步转写时再补齐。

### 5.1 队列创建
- `wrangler queues create lingoloop-transcribe`
- 确认控制台可见该队列，并记录名称。

### 5.2 消费者 Worker
- `worker/src/index.ts` 应实现：
  1. 从队列消息解析 `runId`、`audioId` 等字段。
  2. 下载音频（通过 GCS 签名 URL）。
  3. 调用 Google Speech-to-Text `batchRecognize`。
  4. 更新数据库状态、写入 `transcriptRun`、`auditLog`。
  5. 失败时记录错误并决定是否重试或发送到死信队列。
- 部署命令：`wrangler deploy --name lingoloop-transcribe-consumer`
- `wrangler.toml` 中需额外加入：
  ```toml
  [[queues.consumers]]
  queue = "lingoloop-transcribe"
  max_batch_size = 1
  dead_letter_queue = "lingoloop-transcribe-dlq"
  ```

验证：向队列手动发送测试消息（`wrangler queues send`），观察消费者日志是否正确处理并更新数据库。

---

## 阶段 6：联调与发布

### 6.1 前后端联调
- 将 Pages 项目的 `NEXT_PUBLIC_API_BASE` 改为 Worker 自定义域名，例如 `https://api.example.com`。
- 使用真实账号流程：注册、登录、上传音频。若启用队列，确认消费者日志无误。

### 6.2 自定义域名绑定
- Pages：在 Cloudflare 仪表盘设置自定义域，更新 DNS CNAME 记录。
- Workers：配置路由规则（如 `api.example.com/*`），确保 TLS/SSL 启用。

### 6.3 回归测试
- 核对主要用户路径：
  - 密码重置邮件是否发送；
  - 转写完成后数据是否准确写入数据库；
  - 队列失败时是否进入死信队列。

---

## 常见问题与建议

1. **Prisma 超时 / 429**：Accelerate 的连接数有限，确保关闭长事务，必要时增加速率计划。
2. **GCP 凭证格式错误**：若 `private_key` 中包含真实换行，Worker 解析会失败；请使用 `sed 's/\\n/\n/g'` 重置换行。
3. **大文件上传**：Cloudflare Pages 无法直接处理，应通过 Worker 返回 GCS signed URL，前端使用 `fetch`/`XMLHttpRequest` 直接 PUT 到 GCS。
4. **Queue 消费失败重试**：调整 `max_retries`，并在应用层根据 `retryCount` 决定是否放弃任务，避免无限循环。
5. **跨域问题**：Worker 中的 CORS 逻辑要允许 Pages 域名与本地开发域，OPTIONS 请求需要返回 204。

---

## 参考命令速查

```bash
# 本地开发
cd workers && wrangler dev
cd worker && wrangler dev --queue-consumer
cd frontend && npm run dev

# 构建与部署
cd frontend && npm run build && npm run export
cd workers && wrangler deploy
cd worker && wrangler deploy --name lingoloop-transcribe-consumer

# Queue 管理
wrangler queues create lingoloop-transcribe
wrangler queues list
wrangler queues send lingoloop-transcribe '{"runId":"..."}'

# 日志查看
wrangler tail lingoloop-api
wrangler tail lingoloop-transcribe-consumer
```

---

以上步骤完成后，即可实现基于 Cloudflare Pages + Workers + Queues 的全链路部署。若后续需要扩展（如国际化、付费策略），建议继续在 Worker 中引入 Durable Objects 或 KV/R2 存储，以满足更复杂的状态管理需求。
