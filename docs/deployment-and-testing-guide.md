# LingoLoop AI 部署与测试指南（2025-10）

本指南汇总当前代码状态、依赖清单、环境变量以及本地/线上部署步骤，帮助团队在最短时间内完成环境搭建与质量验证。文中所有命令均以项目根目录 `LingoLoopAI/` 为基准。

---

## 1. 仓库结构与现状

```
LingoLoopAI/
├── components/           # Next.js UI 组件
├── contexts/             # React Context（Auth 等）
├── pages/                # Next.js 页面与 API 路由（本地首选）
├── prisma/               # Prisma schema & migrations
├── workers/              # Cloudflare Worker (Hono + Prisma Edge)
├── docs/                 # 运维与部署文档
├── scripts/              # 本地工具脚本（转写 worker 等）
└── ...
```

- **前端**：根目录 Next.js 14 应用，`npm run dev` 即可本地调试；部署时可静态导出至 Cloudflare Pages。
- **API（Next.js）**：`pages/api/**` 覆盖登录、上传、转写等全部接口，推荐作为本地与当前生产的主要后端。
- **API（Cloudflare Worker）**：`workers/src/**` 已完成 `/api/auth/*` 迁移，其余（音频、上传、管理）仍返回 501。部署到 Cloudflare 前请确认业务需求是否仅限认证。
- **后台任务**：Node 版本的转写 worker (`lib/worker.js` + `scripts/start-worker.js`) 仍可消费数据库里的 `job` 表；Cloudflare Queue 方案尚未实现。

---

## 2. 环境要求

### 2.1 软件版本
- Node.js 20.x（Next.js 与 wrangler 均已验证）
- npm 10.x
- `pnpm`/`yarn` 可选（官方脚本使用 npm）
- Prisma CLI `>= 6.16.2`
- Wrangler CLI `>= 4.39.0`
- PostgreSQL 13+（本地或 Supabase）
- ffprobe（`ffmpeg` 套件，用于音频元数据）

### 2.2 云服务账号
- Supabase 项目（或等价的 Postgres 实例）
- Google Cloud：开启 Speech-to-Text、Cloud Storage、Gemini；创建服务账号 JSON
- Cloudflare：Pages + Workers（若上线到 Cloudflare）

---

## 3. 环境变量清单

### 3.1 `.env`（或 `.env.local`）
> 供 Next.js API、本地脚本使用；推荐复制 `.env.example` 后补齐。

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres 连接串，可使用 Supabase Session Pooler：`postgresql://user:pass@...pooler.supabase.com:5432/postgres?sslmode=require` |
| `DIRECT_URL` | ✅ | 直连地址（Supabase 直连或 Session Pooler），供 `prisma db push/migrate` 使用 |
| `AUTH_JWT_SECRET` | ✅ | JWT 签名密钥 |
| `GCS_BUCKET` | ✅ | Google Cloud Storage 桶名 |
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ | 本地服务账号 JSON 路径（供 @google-cloud SDK 自动读取） |
| `GCP_CLIENT_EMAIL` / `GCP_PRIVATE_KEY` / `GCLOUD_PROJECT` | ✅ | 服务账号字段，Worker 与脚本均会引用 |
| `GEMINI_API_KEY` | ✅ | Google Gemini API Key |
| `NEXT_PUBLIC_API_BASE` | ⭕️ | 前端调用的 API 根路径。本地默认为空（走 Next.js API），部署至 Worker 时填 `https://<worker-domain>` |
| `NEXT_PUBLIC_APP_BASE_URL` | ⭕️ | 前端站点地址，邮件/分享链接使用 |
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | ⭕️ | 前端 Google 登录（若启用） |
| `TASKS_INLINE_PROCESSING` | ⭕️ | 设为 `1` 则长音频也在请求线程处理，便于本地测试 |
| 其他可选 |  | `MAIL_FROM`、`SENDGRID_API_KEY`、`QUOTA_*`、`TRANSCRIBE_*` 等根据需求启用 |

> Supabase 场景下建议：`DATABASE_URL` 指向 Session Pooler（端口 5432），`DIRECT_URL` 指向直连地址或 Session Pooler，用于迁移命令消除 P1017 错误。

### 3.2 `workers/.dev.vars`
> Cloudflare Worker 本地调试使用。

```
DATABASE_URL=<同上>
DIRECT_URL=<可选>
AUTH_JWT_SECRET=<同上>
GCS_BUCKET=<同上>
GCP_CLIENT_EMAIL=<同上>
GCP_PRIVATE_KEY=<保持单行，
 表示换行>
GCLOUD_PROJECT=<同上>
GEMINI_API_KEY=<同上>
CORS_ORIGIN=http://localhost:3000
PRISMA_ACCELERATE_URL=<如启用 Accelerate>
```

在线上部署前，可将内容写入 `.env.secrets`，通过 `npx wrangler secret put --env-file .env.secrets` 一次性导入。

---

## 4. 数据库准备

1. **确认连接可用**
   ```bash
   psql "$DIRECT_URL" -c 'SELECT 1'   # 直连（Supabase 需支持 IPv4/IPv6）
   ```
2. **生成 Prisma Client & 同步 schema**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   若命令提示 `P1017 Server has closed the connection`，说明仍走的是 PgBouncer；请确认 `DIRECT_URL` 已配置并在 `prisma/schema.prisma` 的 `datasource db` 中声明 `directUrl = env("DIRECT_URL")`。
3. **导入历史数据（可选）**
   ```bash
   pg_dump --data-only --inserts --schema=public "$DIRECT_URL" > seed.sql
   psql "$DIRECT_URL" -f seed.sql
   ```
   *提示：Cloudflare SQL Editor 不识别 `COPY ... FROM stdin`，导出时务必添加 `--inserts`。*

---

## 5. 本地开发流程

1. **安装依赖**
   ```bash
   npm install            # 根目录（Next.js + API）
   npm install --prefix workers   # Cloudflare Worker（如需调试）
   ```
2. **启动 Next.js 应用**
   ```bash
   npm run dev
   ```
   访问 http://localhost:3000，默认使用 `pages/api/*` 作为后端。
3. **（可选）运行 Cloudflare Worker**
   ```bash
   cd workers
   npx wrangler dev
   ```
   仅 `/api/auth` 可用，其余接口返回 501。若前端需调用 Worker，请在 `.env.local` 设置 `NEXT_PUBLIC_API_BASE=http://localhost:8787`。
4. **后台转写（本地）**
   - 若 `TASKS_INLINE_PROCESSING=1`，同步请求即可完成转写。
   - 若需模拟队列，可运行 `node scripts/start-worker.js`；该脚本会轮询 `job` 表并调用 Google Speech。

### 5.1 手工测试清单

| 场景 | 操作 | 预期 |
| --- | --- | --- |
| 健康检查 | `curl http://localhost:3000/api/health` | 返回 `{ status: "ok", services.database.status: "ok" }` |
| 注册 | POST `/api/auth/register`（邮箱+密码） | 201，返回 `user`、`accessToken` |
| 登录 | POST `/api/auth/login` | 200，返回 Token；数据库 `authSession` 写入一条记录 |
| 上传 | POST `/api/uploads/create`（带 Bearer Token） | 201，返回 `uploadUrl`，并在 `audioFile` 表出现一条 `uploading` 记录 |
| 转写 | POST `/api/audios/{id}/transcribe` | 小文件直接返回 200，`transcriptRun` 状态为 `succeeded` |

---

## 6. Cloudflare 部署流程

### 6.1 Worker API
1. **准备 `.env.secrets`**（示例）
   ```env
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   AUTH_JWT_SECRET=...
   GCS_BUCKET=...
   GCP_CLIENT_EMAIL=...
   GCP_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
   GCLOUD_PROJECT=...
   GEMINI_API_KEY=...
   CORS_ORIGIN=https://<你的-pages域名>
   PRISMA_ACCELERATE_URL=prisma://...  # 如启用加速
   ```
2. **导入 Secrets 并部署**
   ```bash
   cd workers
   npx wrangler secret put --env-file ../.env.secrets
   npx wrangler deploy
   ```
3. **健康检查**
   ```bash
   curl https://<worker-subdomain>.workers.dev/api/health
   ```
   若返回 `Missing PRISMA_ACCELERATE_URL or DATABASE_URL`，说明 Secrets 未正确绑定，请重新执行步骤 2。
4. **路由绑定（可选）**
   在 Cloudflare 控制台将自定义域 `api.example.com/*` 指向该 Worker。

> **限制：** 当前 Worker 仅实现认证相关接口，其余返回 501。若要完全替换 Next.js API，需要迁移 `pages/api/**` 中的逻辑到 `workers/src/routes`。

### 6.2 Cloudflare Pages（前端）
1. **构建**
   ```bash
   npm run build && npm run export
   ```
   输出目录默认 `out/`。
2. **配置 Pages 项目**
   - Build command：`npm run build && npm run export`
   - Build output directory：`out`
   - 环境变量：
     - `NEXT_PUBLIC_API_BASE=https://<worker-subdomain>.workers.dev`
     - `NEXT_PUBLIC_APP_BASE_URL=https://<pages-domain>`
     - 其他 `NEXT_PUBLIC_*` 变量按需补齐
3. **部署 & 验证**
   发布后访问 Pages 域名，确保登录/上传等流程无异常。如遇 CORS 错误，请将 Worker 的 `CORS_ORIGIN` 设置为 Pages 域名。

### 6.3 备用方案（Next.js 全栈部署）
若暂不使用 Cloudflare Worker，可直接将根目录项目部署到 Vercel、Render 或自建 Node 服务器：
1. 设置同样的环境变量（尤其是 Google/Supabase）
2. `npm run build` → `npm start`
3. 若走 Docker，可参考：
   ```bash
   docker build -t lingoloop-app .
   docker run --env-file .env -p 3000:3000 lingoloop-app
   ```

---

## 7. 发布前测试清单

| 类别 | 检查点 |
| --- | --- |
| API | `/api/health`、`/api/auth/login`、`/api/uploads/create`、`/api/audios`（需登录）均返回 2xx |
| 数据库 | Supabase `User`、`AudioFile`、`TranscriptRun` 等表有正确记录；`deletedAt` 为空表示未软删 |
| GCP 集成 | 上传后 GCS 桶出现对象；转写完成后 `transcriptRun.text` 非空 |
| 前端 | 登录态持久化（localStorage `lingoloop.auth.v1`）、仪表盘列表分页、上传弹窗、有错误提示 |
| 安全 | JWT Secret 已设置、CORS 仅允许所需来源、`.env` 不包含在仓库提交中 |
| Worker (若使用) | `npx wrangler tail` 无持续错误日志；`/api/auth/*` 能正常登录 |

---

## 8. 常见问题与排查

| 错误 | 原因 | 解决方案 |
| --- | --- | --- |
| `P1017 Server has closed the connection` | Prisma 通过 PgBouncer 执行 DDL | 配置 `DIRECT_URL` 指向直连或 Session Pooler，更新 `schema.prisma` 后重跑 `npx prisma db push` |
| `P1001 Can't reach database` | URL/端口/防火墙错误 | 确认 Supabase 项目未暂停，或本地 Postgres 监听 5432；对 IPv4-only 网络使用 Session Pooler |
| `Missing PRISMA_ACCELERATE_URL or DATABASE_URL` | Worker 未绑定 Secrets | `npx wrangler secret list` 核对变量，必要时重新 `secret put` 并部署 |
| `module is not defined`（Worker） | Prisma Edge 运行时缺少 shim | 保留 `workers/src/lib/prismaClientShim.ts`，并确保在 `lib/prisma.ts` 顶部 `import './prismaClientShim'` |
| Google API 权限错误 | 服务账号权限不足或私钥格式错误 | 在 GCP 控制台授予 Storage/Speech 权限，确保 `GCP_PRIVATE_KEY` 保持 `
` 换行 |
| 上传/转写 403 | GCS 桶权限或 CORS 未配置 | 检查桶的 IAM、CORS 设置；确保 Worker 返回的签名 URL 未过期 |

---

## 9. 未完成功能与建议
- Cloudflare Worker 端的 `/api/audios`、`/api/uploads`、`/api/runs` 等路由尚未迁移，当前生产仍依赖 Next.js API。若要完全迁移，请按照 `pages/api/**` 的实现逐步移植。
- Cloudflare Queue + Worker 消费者未实现。若需要长音频异步处理，可继续使用 Node 版本脚本或新建 Worker 项目。
- 自动化测试缺失：后续可引入 Vitest / Playwright，在 `__tests__/` 下补充登录、上传、转写用例。
- 监控/告警未接入，可考虑使用 Cloudflare Analytics、Supabase Logs 或第三方服务。

---

如步骤有改动，请同步更新本文档，并与 `docs/cloudflare-deployment-steps.md`、`docs/cloudflare-deployment-beginner.md` 保持一致。
