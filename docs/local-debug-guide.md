# 本地调试与服务启动顺序指南

本指南说明在本地调试项目时需要启动的服务、推荐顺序以及常见检查点，帮助你快速复现和排查问题。

## 1. 前置准备

1. **安装依赖**
   ```bash
   npm install
   ```
2. **配置环境变量**
   - 在项目根目录创建（或更新）`.env`/`.env.local`，至少包含：
     ```dotenv
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lingoloop?schema=public
     AUTH_JWT_SECRET=your_jwt_secret
     GCS_BUCKET=your-gcs-bucket
     GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
     INTERNAL_TASK_SECRET=dev-secret
     TASKS_INLINE_PROCESSING=1
     ```
   - 若前后端同源，可省略 `NEXT_PUBLIC_API_BASE`；分离部署时需指向后端 API 域名。
3. **安装辅助工具（可选）**
   - Postgres（Homebrew：`brew install postgresql@15`）
   - Docker（如使用容器化数据库）
   - ffprobe（`brew install ffmpeg`，commit 接口需要）
   - 队列重试（可选环境变量）：`TASKS_MAX_ATTEMPTS`（默认 3）、`TASKS_RETRY_SCHEDULE_MS`（默认 `5000,30000,120000`）
   - 长音频自动批处理：`TRANSCRIBE_SYNC_MAX_DURATION_MS=60000`（默认 60s，超过则走批处理）

## 2. 推荐启动顺序

| 步骤 | 命令 | 说明 | 检查点 |
| ---- | ---- | ---- | ---- |
| 1 | `brew services start postgresql@15` 或 `docker run ... postgres:15` | 启动数据库服务 | `lsof -nP -iTCP:5432 \| grep LISTEN` 确认端口监听；`pg_isready -h localhost -p 5432 -d lingoloop` 验证连接 |
| 2 | `export DATABASE_URL=...`（如未写入 `.env`） | 确保 Prisma 能读取连接串 | `echo $DATABASE_URL` 或检查 `.env` |
| 3 | `npx prisma generate` | 生成 Prisma Client（默认输出到 `node_modules/.prisma/client`） | 成功日志 `Generated Prisma Client ...` |
| 4 | `npx prisma db push` | 同步 schema，创建/更新表结构 | 若报 P1001，说明数据库未启动；成功后提示 `The Prisma schema was successfully pushed` |
| 5 | `npm run dev` | 启动 Next.js 开发服务器 | 控制台出现 `ready - started server on ...`，访问 http://localhost:3000 |
| 6（可选） | `node scripts/transcribe-worker.js` | 启动本地转写 Worker（消费长音频队列） | 控制台出现 `[worker] job succeeded` 等日志 |

> **提示**：如果修改了 `prisma/schema.prisma`，需要重复执行步骤 3 和 4，随后重启 Next.js（步骤 5）。

## 3. 日常调试建议

- **API 报错 500**：查看终端输出。若见 `@prisma/client did not initialize yet`，通常是忘了执行 `npx prisma generate` 或环境变量缺失。
- **数据库连接失败 (P1001)**：确认 Postgres 正在监听 5432，且连接串中的账号/密码/数据库名无误。
- **上传/转写相关错误**：检查 `GCS_BUCKET`、Google 认证文件路径以及本机是否安装 `ffprobe`。
- **环境变量变更**：修改 `.env` 后需要重启 `npm run dev`，以便 Next.js 读取新的配置。
- **清理 Docker 容器**：需要重置数据库时，可执行 `docker stop lingoloop-db && docker rm lingoloop-db`，或使用 Prisma 的 `npx prisma db push --force-reset`（注意会清空数据）。
- **长音频长时间无结果**：确认已启动 `scripts/transcribe-worker.js` 或在 `.env.local` 设置 `TASKS_INLINE_PROCESSING=1` 进行本地内联处理（生产环境不建议）。

## 4. 常用排查命令速查

```bash
# 查看监听端口
lsof -nP -iTCP:5432 | grep LISTEN

# 检查 Postgres Ready
pg_isready -h localhost -p 5432 -d lingoloop

# 打开 Prisma Studio（图形界面检查数据）
npx prisma studio

# 查看当前环境变量是否生效
printenv | grep -E 'DATABASE_URL|AUTH_JWT_SECRET|GCS_BUCKET'
```

如有新的服务依赖或启动顺序调整，请同步更新此文档以保持团队一致性。
