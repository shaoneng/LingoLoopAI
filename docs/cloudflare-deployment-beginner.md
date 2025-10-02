# LingoLoop AI Cloudflare 部署手把手指南（面向新手）

> 目标：把当前项目部署到 **Supabase + Cloudflare Workers + Cloudflare Pages**，并在本地完成验证。
> 本文假设你已经在电脑上安装了 **Node.js 20 或 22**、**npm**，并且能打开终端/命令行。

---

## 一、准备账号与工具

1. **注册或登录所需平台：**
   - Cloudflare（用于 Pages 与 Workers）。
   - Supabase（PostgreSQL 数据库）。
   - Prisma Accelerate（在 Prisma Dashboard 中开启即可）。
   - Google Cloud（启用 Storage、Speech-to-Text、Gemini，创建服务账号 JSON）。
2. **安装 CLI 工具：**
   ```bash
   npm install -g wrangler  # Cloudflare CLI
   npm install -g supabase  # 可选：仅用于 Supabase 调试
   ```
3. **拉取代码并进入目录：**
   ```bash
   git clone <你的仓库地址>
   cd LingoLoopAI
   ```

---

## 二、配置环境变量（本地）

1. 在项目根目录复制模板：
   ```bash
   cp .env.example .env.cloudflare
   ```
2. 按照下表填写 `.env.cloudflare`（示例值仅供参考）：

   | 变量名 | 示例 | 说明 |
   | --- | --- | --- |
   | `DATABASE_URL` | `postgresql://postgres:密码@db.xxx.supabase.co:5432/postgres?sslmode=require` | Supabase 提供的连接串，必须带 `sslmode=require` |
   | `PRISMA_ACCELERATE_URL` | `prisma://...` | 在 Prisma Accelerate 控制台生成 |
   | `AUTH_JWT_SECRET` | `随机长字符串` | 用于签发 JWT |
   | `GCS_BUCKET` | `lingoloop-audio` | GCS 桶名称 |
   | `GCP_CLIENT_EMAIL` | `service-account@project.iam.gserviceaccount.com` | 服务账号邮箱 |
   | `GCP_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"` | 将 JSON 文件里的私钥复制过来，把换行替换成 `\n` |
   | `GCLOUD_PROJECT` | `lingoloop-project` | GCP 项目 ID |
   | `GEMINI_API_KEY` | `xxxx` | Gemini API Key |
   | `NEXT_PUBLIC_APP_BASE_URL` | `https://app.example.com` | 将来前端访问地址 |
   | `NEXT_PUBLIC_API_BASE` | `https://api.example.workers.dev`（本地可先填 `http://localhost:8787`） | 前端请求 API 的根地址 |

3. 设置终端环境（仅当前窗口有效）：
   ```bash
   export $(cat .env.cloudflare | xargs)
   ```
   每次开新终端都需重新执行。

---

## 三、初始化数据库（Supabase）

1. **执行迁移与生成客户端：**
   ```bash
   npx prisma migrate dev --name init-supabase   # 初始化数据库结构
   npx prisma generate                           # 生成 Prisma 客户端（包含 Edge 版本）
   ```
2. **（可选）打开 Prisma Studio 查看表：**
   ```bash
   npx prisma studio
   ```
   浏览器会显示 Supabase 数据库中的表结构。

---

## 四、在本地测试 API + 前端

### 4.1 本地运行 Cloudflare Worker API
```bash
cd workers
npm install
npx wrangler dev
```
成功后终端会提示 `Ready on http://localhost:8787`。
- 测试健康检查：访问 `http://localhost:8787/api/health`，应返回 JSON。
- 测试注册接口：使用 Postman 或 curl 向 `http://localhost:8787/api/auth/register` 发送 POST 请求。

### 4.2 本地运行前端
```bash
cd ../frontend
cp .env.example .env.local          # 如果不存在
# 编辑 frontend/.env.local，确保：
# NEXT_PUBLIC_API_BASE=http://localhost:8787
npm install
npm run dev
```
浏览器访问 `http://localhost:3000`，尝试注册/登录，检查是否成功调用到本地 Worker。

> 如果接口报错，请返回 `workers/` 终端查看日志，确认 Supabase/GCP 环境变量是否缺失。

---

## 五、部署 Cloudflare Workers（API）

1. **登录 Cloudflare 账号：**
   ```bash
   cd ../workers
   npx wrangler login
   ```
2. **在 Cloudflare 控制台设置 Secrets：**进入 Workers → 选择你的 Worker → Settings → Variables，逐个添加：
   - `AUTH_JWT_SECRET`
   - `PRISMA_ACCELERATE_URL`
   - `DATABASE_URL`
   - `GCS_BUCKET`
   - `GCP_CLIENT_EMAIL`
   - `GCP_PRIVATE_KEY`（注意换行）
   - `GCLOUD_PROJECT`
   - `GEMINI_API_KEY`
   - 其他可选：`MAIL_FROM`、`SENDGRID_API_KEY`、`CORS_ORIGIN` 等
3. **部署：**
   ```bash
   npx wrangler deploy
   ```
4. **记录域名：**部署后会显示形如 `https://lingoloop-api.xxx.workers.dev` 的地址，后续前端会用到。
5. **线上检查：**浏览器访问 `https://lingoloop-api.xxx.workers.dev/api/health`，确认返回 JSON。

---

## 六、部署 Cloudflare Pages（静态前端）

1. 登录 Cloudflare → Pages → Create Project → 选择 Git 仓库。
2. 构建设置：
   - **Root Directory**：`frontend`
   - **Build command**：`npm run build && npm run export`
   - **Build output directory**：`out`
3. 环境变量（Pages → Settings → Environment variables）：
   - `NEXT_PUBLIC_API_BASE` → 填入第 5 步得到的 Worker 域名
   - `NEXT_PUBLIC_APP_BASE_URL` → 你的前端域名（如 Pages 默认域名或自定义域）
4. 触发构建 → 发布 → 访问 Pages 域名，确认网页显示正常。

> 如需自定义域名，可在 Pages 的 **Custom Domains** 页面中绑定，并更新 `NEXT_PUBLIC_APP_BASE_URL`。

---

## 七、（可选）部署队列消费者

如果暂时不需要异步转写，可跳过。需要时按以下步骤启用：
1. 创建队列：`wrangler queues create lingoloop-transcribe`
2. 在 `workers/wrangler.toml` 中添加：
   ```toml
   [[queues.producers]]
   queue = "lingoloop-transcribe"
   binding = "TRANSCRIBE_QUEUE"
   ```
3. 在 Cloudflare 控制台补充相同的绑定。
4. 部署消费者 Worker（`worker/` 目录）：
   ```bash
   cd ../worker
   npm install
   npx wrangler deploy --name lingoloop-transcribe-consumer
   ```
5. 验证：`wrangler tail lingoloop-transcribe-consumer` 查看队列处理日志。

---

## 八、上线后的检查清单

- [ ] Cloudflare Worker `/api/health` 返回 `status: "ok"`
- [ ] 前端可完成注册、登录、上传（测试小文件）
- [ ] Supabase 中新增用户/音频记录正确写入
- [ ] （启用队列时）消费者日志正常，失败会记录并重试
- [ ] 各项 Secrets 在 Cloudflare 控制台记录备份
- [ ] 定期更新 `AUTH_JWT_SECRET`、GCP Key、SendGrid Key，并重新部署

---

## 常见问题 FAQ

| 问题 | 解决办法 |
| --- | --- |
| `AUTH_JWT_SECRET is not configured` | 检查 Cloudflare Worker 的 Secrets 是否设置，并重新 `wrangler deploy` |
| `Unable to reach Accelerate` | 重新生成 Prisma Accelerate URL；Cloudflare Worker 变量是否配置错误 |
| `module is not defined` | 确保使用最新 wrangler（>=4.39），并保留 `workers/src/lib/prismaClient.ts` 中的 shim |
| 无法连接 Supabase | `DATABASE_URL` 是否正确、是否有 `sslmode=require`、Supabase 是否允许外部访问 |
| CORS 报错 | 在 Worker 的 Secrets 或 `.env.cloudflare` 中设置正确的 `CORS_ORIGIN`，保证与前端域名一致 |

---

完成以上步骤，你就可以将 LingoLoop AI 正式运行在 Supabase + Cloudflare 的组合上。如果后续要添加队列、Durable Objects、R2 等功能，可参考 `docs/cloudflare-deployment-steps.md` 的进阶部分。
