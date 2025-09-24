# 审计日志说明

已经在关键 API 中写入 `audit_log` 表，便于追踪用户安全事件。

## 1. 写入节点

| 事件 | 触发接口 | 说明 |
| ---- | -------- | ---- |
| `LOGIN_SUCCESS` | `POST /api/auth/login` | 登录成功后记录用户 ID、邮箱 |
| `LOGOUT` | `POST /api/auth/logout` | 无论是否找到 session，成功返回即记一条 |
| `REGISTER` | `POST /api/auth/register` | 注册成功后记录新用户 |
| `UPLOAD_INIT` | `POST /api/uploads/create` | 直传创建会话成功（含 gcsKey、文件信息） |
| `UPLOAD_COMMIT` | `POST /api/uploads/commit` | 上传确认成功或配额失败都会记录（带尺寸/时长/错误信息） |
| `TRANSCRIBE_START` | `POST /api/audios/:id/transcribe` | 发起同步转写前写入（记录语言、force 等参数） |
| `TRANSCRIBE_END` | `POST /api/audios/:id/transcribe` | 转写成功后记录（包含 runId、是否复用） |
| `TRANSCRIBE_FAILED` | `POST /api/audios/:id/transcribe` | 转写报错时记录错误信息 |

日志记录失败不会阻塞主流程（错误会在服务器控制台以 `Failed to record audit log` 输出）。

## 2. 查询方式

```bash
npx prisma studio            # 打开图形界面
npx prisma db pull --print   # 或通过 SQL 工具连接数据库
```

`audit_log.meta` 存储 JSON，记录额外上下文信息；如需搜索，可结合 `->>` 运算符或在应用层筛选。

## 3. 扩展建议

- 若需要 IP、User-Agent，可在 `recordAuditLog` 调用旁加入 `req.headers['user-agent']` 等信息。
- 后续接入 SSE/后台任务时，可复用 `recordAuditLog` 记录异步事件（如 `TRANSCRIBE_QUEUED`、`RUN_RETRY` 等）。

更新日志：同步转写与上传链路上线时添加。
