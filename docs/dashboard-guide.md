# Dashboard & 音频详情指南

本指南介绍新上线的「我的音频」仪表盘，以及音频详情页的基础交互，方便 QA/自测。

## 1. 入口

- 登录后首页右上角点击「我的音频」，或直接访问 `/dashboard`。
- 页面在客户端通过 `GET /api/audios` 拉取当前用户的音频列表。

## 2. 列表视图

- 支持搜索：输入文件名关键字并点击「刷新」即可查询。
- 列表字段：文件名、时长、状态、最新转写状态、最后更新时间。
- 分页：默认 10 条，可用底部「上一页 / 下一页」切换。
- 「查看详情」跳转到 `/audios/:audioId`。
 - 若“最新转写状态”为 `failed`，行内会出现「重试」按钮，点击将以相同参数重新发起一次转写；长音频会进入队列，状态将通过 SSE 实时更新。

## 3. 详情页

- 路径：`/audios/:audioId`
- 数据来源：`GET /api/audios/:audioId`
  - 返回音频基础信息、最新转写结果（segments）、最近 5 个 run 的简要信息。
- 页面结构：
  1. **基础信息**：文件名、时长、状态等。
  2. **播放器**：进入页面后请求 `GET /api/audios/:audioId/download` 获取 V4 签名 URL，自动填充 `<audio>` 播放器；若获取失败会提示重试。
  3. **TranscriptPlayer**：通过 `GET /api/runs/:runId/segments` 分页加载段落，按钮可继续加载更多。
  4. **历史版本与注释**：右侧面板调用 `RunHistoryList`，使用 `GET /api/audios/:audioId/runs` + `GET/POST /api/runs/:runId/annotations` 管理版本与批注。
  5. **修订面板**：`RevisionsPanel` 使用 `GET/POST /api/runs/:runId/revisions` 与 `PATCH/DELETE /api/revisions/:revisionId`，可新建、编辑、删除修订。

## 4. API 摘要

| Method | Path | 描述 |
| ------ | ---- | ---- |
| `GET` | `/api/audios` | 分页列出当前用户音频，支持 `page`、`pageSize`、`q` 查询参数 |
| `GET` | `/api/audios/:audioId` | 获取单个音频详情，附带最近的 transcript runs |
| `GET` | `/api/audios/:audioId/runs` | 游标分页获取 run 历史，`limit`（默认 10）与 `cursor`（run.id） |
| `GET` | `/api/runs/:runId/segments` | 段落分页：`limit`（默认 50，最大 200），`cursor` 为下一段索引 |
| `GET` | `/api/runs/:runId/annotations` | 获取 run 对应注释列表 |
| `POST` | `/api/runs/:runId/annotations` | 新增注释 `{ content, anchorType, anchorValue }` |
| `PATCH` | `/api/annotations/:annotationId` | 更新注释（可修改内容或锚点） |
| `DELETE` | `/api/annotations/:annotationId` | 软删注释 |
| `GET` | `/api/runs/:runId/revisions` | 获取修订列表 |
| `POST` | `/api/runs/:runId/revisions` | 新建修订 `{ title?, text, segments? }` |
| `PATCH` | `/api/revisions/:revisionId` | 更新修订标题 / 文本 |
| `DELETE` | `/api/revisions/:revisionId` | 删除修订 |
| `GET` | `/api/audios/:audioId/download` | 生成短期有效的音频播放签名 URL |

返回 JSON 中 `sizeBytes` 使用字符串表示（避免 BigInt 序列化问题）。

## 5. 实时更新（SSE）

- 详情页：当最近一次 run 处于 `queued/processing`，页面通过 `GET /api/runs/:runId/events?access_token=<ACCESS_TOKEN>` 订阅状态更新。
  - 事件：`init`/`update`/`done`；完成后自动刷新分段。
- Dashboard 列表：登录后自动连接 `GET /api/runs/events?access_token=<ACCESS_TOKEN>` 订阅当前用户的运行中任务。
  - 首次会收到 `snapshot { items: [{ runId, audioId, status, completedAt? }] }`；
  - 后续通过 `update`/`done` 更新行内“最新转写状态”。
- 若网络/代理不支持长连接，UI 会静默降级为手动刷新。

## 6. 后续规划

- 详情页后续迭代：补充 run 重试按钮、revision/annotation 面板。
- 整合音频签名 URL（下载/播放）。

如有 UI 变更或接口调整，请同步更新此文档。
