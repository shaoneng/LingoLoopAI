# TODO

## M1 — 最小闭环（2 周）
- [ ] 账户体系
  - [x] 实现邮箱+密码注册、登录、登出 API（含 refresh token）
  - [x] 接入 Google OAuth
  - [x] 配置邮件服务用于验证/重置
  - [x] 前端登录/注册/忘记密码页面与会话管理
- [ ] 上传链路
  - [x] GCS 直传（Resumable）预签名接口 `/api/uploads/create`
  - [x] 完成回调 `/api/uploads/commit`：校验对象、调用 ffprobe 入库
  - [x] 配额校验与 `usage_log` 记录
- [ ] 同步转写
  - [x] Google Speech v2 调用服务化；落库 `transcript_runs`
  - [x] 转写详情展示：播放器 + 段落渲染 + 点击跳播放
  - [x] Dashboard 列表（分页、筛选、搜索）
- [ ] 基础安全/审计
  - [x] JWT/Session 中间件 + 软删支持
  - [x] `audit_log` 记录 LOGIN/UPLOAD/TRANSCRIBE_START/END

## M2 — 稳态异步（2 周）
- [ ] 异步任务
  - [x] Cloud Tasks → Worker 服务化（去重、重试）
  - [ ] 长音频 run 状态流转 + SSE/WebSocket 实时通知
  - [x] Run 列表/详情 API 与前端切换
- [ ] 结果管理
  - [x] 段落分页（cursor）及前端虚拟滚动
  - [x] Revision：新建编辑副本、历史版本列表
  - [x] Annotation：增删改查、播放器时间锚点
- [ ] 下载/导出
  - [x] 音频签名 URL 服务（有效期 5–10 分钟）
  - [x] TXT/JSON/SRT/VTT 导出 API

## M3 — 体验与合规（2 周）
- [ ] 通知体系
  - [ ] 邮件模板（转写完成/失败）；统计送达率
  - [ ] Dashboard 通知铃铛与任务进行中提示
- [ ] GDPR 支持
  - [ ] 数据导出（音频+文本+元数据）
  - [ ] 账号删除流程（软删→延迟物理删）
- [ ] 成本与监控
  - [ ] GCS 生命周期策略（自动归档/删除）
  - [ ] 指标看板：队列深度、失败率、成本估算；告警阈值

## 附录任务
- [ ] 数据库迁移：建立 ER 表结构与索引
- [ ] OpenAPI 文档（账户、上传、转写、批注、导出）
- [ ] 前端组件库整理（播放器、转写段落、批注侧栏）
- [ ] CI/CD：lint、测试、部署流水线
- [ ] 安全检查：rate limit、验证码（匿名）、Signed URL 权限验证
