# 同步转写接口指南

本指南记录了 `POST /api/audios/:audioId/transcribe` 的使用方式，以及与数据库的交互流程。

## 1. 调用条件

- 用户已登录，并在请求头携带 `Authorization: Bearer <accessToken>`。
- 音频通过 `/api/uploads/create` → `/api/uploads/commit` 上传成功，`audio_files.status` 至少为 `uploaded`。
- 服务器需配置：
  - `GCS_BUCKET`（音频对象所在的存储桶）
  - Google Cloud 语音识别权限（`GOOGLE_APPLICATION_CREDENTIALS` 等）
  - 可选：`TRANSCRIBE_GAP_SEC`、`TRANSCRIBE_MAX_SEGMENT_SEC` 用于默认分段阈值。

## 2. 请求示例

```http
POST /api/audios/8f8a0e38-4dd2-4a27-9b5f-1a91fdcf77d0/transcribe
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "engine": "google-speech-v2",
  "language": "en-US",
  "diarize": true,
  "minSpeakerCount": 1,
  "maxSpeakerCount": 3,
  "gapSec": 0.8,
  "maxSegmentSec": 12,
  "force": false
}
```

> `engine` 目前仅支持 `google-speech-v2`；`force=true` 时会强制重新识别，即使已有相同参数的成功结果。

## 3. 响应

```json
{
  "audioId": "8f8a0e38-4dd2-4a27-9b5f-1a91fdcf77d0",
  "runId": "2f9f...",
  "status": "succeeded",
  "engine": "google-speech-v2",
  "version": 1,
  "language": "en-US",
  "text": "...",
  "segments": [
    { "id": 0, "start": 0, "end": 3.2, "text": "Hello everyone", "speaker": 1, "words": [...] }
  ],
  "speakerCount": 1,
  "confidence": 0.94,
  "completedAt": "2025-02-16T09:24:31.123Z",
  "reused": false
}
```

- 若 `reused=true`，表示已存在相同参数的成功记录，本次直接返回缓存结果。
- 当音频体积超过 Google 同步接口约 10MB 限制时，系统会自动切换到批量模式（`batchRecognize`），无需额外参数。
- 当音频时长超过 Google 同步接口 60 秒限制时（v2 Recognize），系统也会自动切换到批量模式。
- 发生错误时返回 4xx/5xx，并附带 `{ error }` 描述。
- 若音频较大（>10MB）或显式指定 `model="long"`，API 会返回 `202 Accepted`，body 形如：

```json
{
  "audioId": "8f8a0e38-4dd2-4a27-9b5f-1a91fdcf77d0",
  "runId": "9f1a...",
  "jobId": "db2f...",
  "status": "queued",
  "queued": true,
  "engine": "google-speech-v2",
  "version": 2
}
```

  - 前端需提示“任务排队中”，并通过 Dashboard 轮询/刷新查看结果。
  - `jobId` 对应 `job` 表记录，Worker 成功处理后会将其状态改为 `succeeded`。

### 3.1 分段分页
- `GET /api/runs/:runId/segments?limit=40&cursor=0`
  - 默认 `limit=50`，最大 200；`cursor` 为下一段起始索引。
  - 返回 `{ items, nextCursor, total }`，其中 `nextCursor` 为下一次请求的索引（无更多时为 `null`）。
  - `items` 为与原 `segments` 字段相同的结构，可直接传给播放器组件。

### 3.2 修订（Revision）
- `GET /api/runs/:runId/revisions`：按时间倒序列出修订。
- `POST /api/runs/:runId/revisions`：新建修订，`{ title?, text, segments? }`。
- `PATCH /api/revisions/:revisionId`：更新修订标题或文本（`segments` 亦可传入覆盖）。
- `DELETE /api/revisions/:revisionId`：删除修订。
> 创建修订时前端默认把当前 run 的文本和段落作为起点，方便用户编辑。

## 4. 数据库写入

- `transcript_runs`
  - 创建时 `status=processing`，识别完成后写入 `text`、`segments`、`speakerCount`、`confidence`。
  - `version` 从 1 开始按音频自增。
  - `params` 保存用户传入的参数，`params_hash` 作为幂等键。
- `audio_files`
  - 成功后 `status` 更新为 `transcribed`，`language`、`gap_sec`、`mode` 同步更新。
  - `meta.transcription` 记录最近一次 run 的 ID、时间、引擎。

## 5. 常见问题

- **返回 400：音频尚未完成上传** → 先调用 `/commit` 并确认成功。
- **返回 429/403 等** → 检查账号权限、配额或音频归属。
- **Google API 报错** → 确认服务账号权限、`SPEECH_LOCATION` 配置。可以在服务器日志中查看 `Transcribe API error` 栈信息。
- **段落分页缺少数据** → 检查 `cursor` 是否越界，可根据响应里的 `total` 与 `nextCursor` 判断是否需要继续请求。
- **修订缺失** → 确保 `runId` 对应的音频属于当前用户且未被删除；删除修订后前端需刷新列表。

### 3.3 队列与 Worker（M2）
- `/api/audios/:audioId/transcribe` 在排队时会创建 `transcript_runs.status=queued` 与 `job.status=queued`。
- Cloud Tasks/Worker 应调用 `POST /api/internal/tasks/transcribe`（Header `x-internal-secret`）触发处理：
  - Worker 将任务标记为 `processing`，执行 `runQueuedTranscription`，成功后落库并把 `job.status` 更新为 `succeeded`；失败时根据重试策略写回 `nextRetryAt`。
  - 默认重试 3 次，延迟序列 5s/30s/120s，可通过 `TASKS_MAX_ATTEMPTS`、`TASKS_RETRY_SCHEDULE_MS` 调整。
- 本地调试可设置 `TASKS_INLINE_PROCESSING=1`，强制在 API 内同步执行，便于复现。

后续计划：继续完善 revision、批注等交互。若有流程调整，请同步更新本文件。

### 3.4 实时状态（SSE）

- 端点：`GET /api/runs/:runId/events?access_token=<ACCESS_TOKEN>`，返回 `text/event-stream`。
- 事件类型：
  - `init`：初始状态 `{ runId, audioId, status, completedAt? }`
  - `update`：状态变化 `{ runId, status, completedAt? }`
  - `done`：终态（`succeeded`/`failed`）后即关闭连接
- 心跳：服务端每 25s 发送 `: ping` 注释帧以维持连接。
- 认证：EventSource 无法自定义 Header，故通过查询参数 `access_token` 传入短期访问令牌（HTTPS 环境下使用，避免记录完整 URL 日志）。
- 客户端示例（浏览器）：

```js
const es = new EventSource(`/api/runs/${runId}/events?access_token=${encodeURIComponent(accessToken)}`);
es.addEventListener('update', (ev) => {
  const data = JSON.parse(ev.data);
  console.log('status update', data.status);
});
es.addEventListener('done', () => es.close());
```

前端 `/audios/:audioId` 已接入上述 SSE：当最近一次 run 处于 `queued/processing` 时，页面会自动监听并在完成后刷新段落。

### 3.5 Run 重试接口

- `POST /api/runs/:runId/retry`
  - 权限：需资源属主登录态（Bearer Token）。
  - 行为：复用上次 `run.params`（语言/分段/说话人设置等），强制创建新一次转写；大文件会自动进入队列。
  - 响应：
    - `202 Accepted`（queued）：`{ audioId, runId, jobId?, status: 'queued', queued: true }`
    - `200 OK`（succeeded）：包含新 run 的关键信息与文本/分段字段
  - 失败：返回 4xx/5xx，body 带 `{ error }`。

### 3.6 环境变量（限制）
- `TRANSCRIBE_SYNC_MAX_BYTES`：同步识别的最大字节数阈值（默认 10MB），超过走批量。
- `TRANSCRIBE_SYNC_MAX_DURATION_MS`：同步识别的最大时长阈值（默认 60000ms=60s），超过走批量。
