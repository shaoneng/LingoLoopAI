# LingoLoop AI 项目上下文总览（截至 2025-09）

本文件汇总近期对话与操作中形成的关键信息，帮助团队成员快速了解当前架构、部署方式、排错记录以及已完成的调整。

---

## 1. 平台与整体架构

- **前端**：Next.js 14（静态导出），部署在 Cloudflare Pages。
- **后端 API**：Cloudflare Workers（Hono 框架），使用 Prisma Accelerate 访问 Supabase PostgreSQL；暂未启用 Cloudflare Queues。
- **数据库**：Supabase PostgreSQL；本地/Cloudflare 均通过 `DATABASE_URL` 或 `PRISMA_ACCELERATE_URL` 连接。
- **云服务**：
  - Google Cloud Storage（音频存储，需 `GCS_BUCKET`、服务账号凭证）。
  - Google Speech-to-Text 与 Gemini AI（用于转写和分析）。
- **后台任务**：队列消费者尚未启用；代码中保留占位逻辑，未来可通过 Cloudflare Queues 实现长任务消费。

---

## 2. 仓库结构与关键模块

- `frontend/`：Next.js 前端代码，使用 `.env.local` 设置 `NEXT_PUBLIC_*` 变量。
- `workers/`：Cloudflare Worker 源码；`src/index.ts` 挂载 Hono 路由，`src/lib/prisma.ts` 负责 Prisma Edge 客户端初始化。
- `lib/`：Next.js API 路由共享的服务端逻辑（仍保留旧的 `@prisma/client` 用法）。
- `docs/`：
  - `cloudflare-deployment-steps.md`：标准部署流程（进阶版）。
  - `cloudflare-deployment-beginner.md`：面向新手的手把手指引。
  - `local-debug-guide.md`：本地调试流程与常见问题。

---

## 3. 环境变量清单

### 3.1 前端（Cloudflare Pages / `.env.local`）
- `NEXT_PUBLIC_APP_BASE_URL`
- `NEXT_PUBLIC_API_BASE`
- `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID`（可选）

### 3.2 Worker（Cloudflare Secrets 或 `.dev.vars`）
- 核心：`PRISMA_ACCELERATE_URL`（推荐）、`DATABASE_URL`（本地连接 Supabase 时使用）
- 安全：`AUTH_JWT_SECRET`
- Google Cloud：`GCS_BUCKET`、`GCP_CLIENT_EMAIL`、`GCP_PRIVATE_KEY`（单行格式）、`GCLOUD_PROJECT`
- AI：`GEMINI_API_KEY`
- 邮件（可选）：`MAIL_FROM`、`SENDGRID_API_KEY`
- CORS：`CORS_ORIGIN`
- 其他旧逻辑：`TASKS_INLINE_PROCESSING`、`TASKS_MAX_ATTEMPTS` 等在 Worker 中尚未启用

> 若暂不启用队列，`[[queues.producers]]` 配置保持空白。

---

## 4. 近期调整与问题排查

### 4.1 Prisma Edge 相关改动
- `prisma/schema.prisma` 取消自定义 `output`，使用默认生成路径，避免提交生成产物。
- Worker 端通过 `getPrisma(env)` 动态导入 `@prisma/client/edge` 与 `withAccelerate`，并在导入前注入 `module/exports` shim（见 `workers/src/lib/prismaClientShim.ts`）。
- 所有使用 Prisma 的 Worker 路由改为 `await getPrisma(env)`。
- Next.js API（`lib/prisma.js`、`frontend/lib/prisma.js`）改用默认的 `@prisma/client`。

### 4.2 wrangler 配置
- `compatibility_date` 恢复为 `2024-07-01`，避免 Cloudflare 拒绝未来日期。
- 保留 `compatibility_flags = ["nodejs_compat"]` 以支持 Prisma Edge。
- 队列绑定暂时移除（按照“路径 B”执行）。

### 4.3 测试与部署
- 本地：`workers/.dev.vars` 填写 `DATABASE_URL` + 其他变量后，`npx wrangler dev` 可正常访问 `/api/health`。
- 生产：`npx wrangler deploy --env=production` 成功，域名 `https://lingoloop-api.shaoneng-wu.workers.dev` 可访问；若未配置变量会提示 `Missing PRISMA_ACCELERATE_URL or DATABASE_URL`。

---

## 5. 常见问题速查

| 症状 | 原因 | 解决方案 |
| --- | --- | --- |
| `/api/health` 返回 "Missing PRISMA_ACCELERATE_URL..." | Cloudflare 未配置任一数据库变量 | 设置 `PRISMA_ACCELERATE_URL` 或 `DATABASE_URL` 并重新部署 |
| `import_edge.PrismaClient is not a constructor` | 直接命名导入导致拿到 default export | 使用动态导入 `const { PrismaClient } = await import('@prisma/client/edge')` |
| `module is not defined` | Prisma Edge 在 Worker 中找不到 CommonJS 全局 | 确保 `prismaClientShim` 在导入前执行 |
| 未来日期导致部署失败 | `compatibility_date` 设置在未来 | 调整到当前日期或更早 |
| 前端调用报 CORS 错误 | `CORS_ORIGIN` 设置不正确 | 设置为 Pages 域名或 `*`（调试用） |

---

## 6. 推荐的部署流程回顾（路径 A：无队列）
1. 准备 `.env.cloudflare` → `npx prisma migrate dev` → `npx prisma generate`。
2. 本地：`npx wrangler dev` + `npm run dev` 验证注册/登录。
3. Cloudflare Worker：设置 Secrets → `npx wrangler deploy --env=production`。
4. Cloudflare Pages：构建命令 `npm run build && npm run export`，确保 `NEXT_PUBLIC_API_BASE` 指向 Worker 域名。
5. 后续如需队列，再根据 `docs/cloudflare-deployment-steps.md` 第 5 阶段补齐配置。

---

## 7. 后续工作建议
- **完善 Worker 路由**：目前仅迁移了认证路由，其余音频/上传等接口仍返回 501，需按计划迁移至 Cloudflare Worker。
- **建立 `.dev.vars` 模板**：可增加 `workers/.dev.vars.example`，统一本地变量填写格式。
- **加回测试/CI**：后续可引入 Vitest 或 Playwright，覆盖主要 API 与前端流程。
- **监控与报警**：部署后可配置 Cloudflare Analytics、Supabase Logflare 或外部告警机制，及时发现错误。

---

> 若更新架构或迁移计划，请同步修改本文件与 `docs/**` 中相关指引，保持一致。
