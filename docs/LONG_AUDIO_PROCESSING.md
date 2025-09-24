# 长音频异步处理指南

本文档说明如何使用LingoLoopAI的长音频异步处理功能，包括实时状态更新和SSE通知。

## 功能概述

- **自动异步处理**：大文件（>10MB或>60秒）自动进入异步处理队列
- **实时状态更新**：通过SSE（Server-Sent Events）提供实时状态更新
- **工作器进程**：后台工作器自动处理队列中的任务
- **进度跟踪**：提供处理进度、预估剩余时间等信息
- **错误处理**：自动重试机制和错误恢复

## 工作流程

```
1. 用户上传音频文件
2. 系统检测文件大小/时长
3. 大文件自动进入异步队列
4. 工作器处理任务
5. 实时状态更新推送
6. 处理完成通知用户
```

## 状态流转

```
queued → processing → succeeded/failed
```

- **queued**: 任务已进入队列，等待处理
- **processing**: 正在转录处理中
- **succeeded**: 转录成功完成
- **failed**: 转录失败

## 启动工作器

### 开发环境

```bash
# 方法1: 直接启动（前台运行）
npm run worker

# 方法2: 在后台运行
nohup npm run worker > worker.log 2>&1 &
```

### 生产环境

```bash
# 使用PM2管理进程
npm install -g pm2
pm2 start npm --name "lingoloop-worker" -- run worker

# 查看状态
pm2 status

# 查看日志
pm2 logs lingoloop-worker

# 停止服务
pm2 stop lingoloop-worker
```

## SSE端点

### 单个任务状态监控

```
GET /api/runs/{runId}/events?runId={runId}&access_token={accessToken}
```

**事件类型：**
- `init`: 初始状态信息
- `update`: 状态更新
- `done`: 处理完成
- `error`: 错误信息

### 全局任务监控

```
GET /api/runs/events?access_token={accessToken}
```

**事件类型：**
- `snapshot`: 当前活跃任务快照
- `update`: 任务状态更新
- `done`: 任务完成

### 前端使用示例

```javascript
// 监听单个任务
const eventSource = new EventSource(
  `/api/runs/${runId}/events?runId=${runId}&access_token=${accessToken}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到状态更新:', data);

  if (data.event === 'done') {
    console.log('转录完成!');
    eventSource.close();
  }
};
```

## API端点

### 获取任务进度

```
GET /api/runs/{runId}/progress
```

返回格式：
```json
{
  "runId": "string",
  "audioId": "string",
  "status": "queued|processing|succeeded|failed",
  "progress": 50,
  "timeElapsed": 30000,
  "estimatedTimeRemaining": 120,
  "audio": {
    "id": "string",
    "filename": "string",
    "durationMs": 180000,
    "sizeBytes": 15728640
  },
  "jobs": [...]
}
```

### 管理工作器

```
POST /api/admin/worker      # 启动工作器
DELETE /api/admin/worker     # 停止工作器
GET /api/admin/worker        # 查看工作器状态
```

## 前端集成

### 使用TranscriptionStatus组件

```jsx
import { TranscriptionStatus } from '../components/TranscriptionStatus';

<TranscriptionStatus
  runId={transcriptionRunId}
  onCompleted={(success, data) => {
    if (success) {
      console.log('转录完成:', data);
    } else {
      console.error('转录失败:', data);
    }
  }}
/>
```

### 使用EventContext Hook

```jsx
import { useEvents } from '../contexts/EventContext';

const { subscribeToRun, pollRunProgress } = useEvents();

// 监听任务状态
const unsubscribe = subscribeToRun(
  runId,
  (data) => {
    console.log('状态更新:', data);
  },
  (error) => {
    console.error('连接错误:', error);
  }
);

// 轮询进度（备用方案）
const progress = await pollRunProgress(runId);
```

## 配置参数

### 环境变量

```bash
# 同步处理阈值
TRANSCRIBE_SYNC_MAX_BYTES=10485760          # 10MB
TRANSCRIBE_SYNC_MAX_DURATION_MS=60000      # 60秒

# 任务处理
TASKS_INLINE_PROCESSING=1                  # 开发模式：同步处理

# 重试配置
WORKER_MAX_RETRIES=3
WORKER_RETRY_DELAYS=5000,30000,120000      # 5s, 30s, 2min
```

## 监控和调试

### 查看工作器状态

```bash
# API方式
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3002/api/admin/worker

# 查看日志
tail -f worker.log
```

### 查看数据库状态

```sql
-- 查看待处理任务
SELECT * FROM job
WHERE job_type = 'transcribe_long'
AND status = 'queued'
ORDER BY created_at ASC;

-- 查看正在处理的任务
SELECT * FROM transcript_run
WHERE status = 'processing';

-- 查看失败的任务
SELECT * FROM transcript_run
WHERE status = 'failed';
```

### 常见问题

**1. 工作器无法启动**
- 检查环境变量配置
- 确认数据库连接正常
- 查看错误日志

**2. SSE连接失败**
- 确认访问令牌有效
- 检查CORS配置
- 确认网络连接正常

**3. 任务处理卡住**
- 检查Google Cloud API配额
- 查看工作器日志
- 手动重启工作器

**4. 长音频处理失败**
- 确认音频文件格式支持
- 检查文件完整性
- 查看Google Cloud错误信息

## 性能优化

### 工作器配置

```javascript
// 并发处理数量
const MAX_CONCURRENT_JOBS = 3;

// 轮询间隔
const POLL_INTERVAL = 2000; // 2秒

// 任务超时时间
const JOB_TIMEOUT = 30 * 60 * 1000; // 30分钟
```

### 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_job_status_created ON job(status, created_at);
CREATE INDEX idx_run_status ON transcript_run(status);
```

## 部署建议

### 生产环境配置

1. **工作器部署**
   - 使用PM2或systemd管理进程
   - 配置自动重启
   - 设置日志轮转

2. **监控告警**
   - 监控队列深度
   - 设置失败率告警
   - 监控API响应时间

3. **扩展性**
   - 支持多个工作器实例
   - 负载均衡
   - 数据库连接池

### 备份和恢复

```bash
# 备份脚本
pg_dump $DATABASE_URL > backup.sql

# 恢复脚本
psql $DATABASE_URL < backup.sql
```

## 版本历史

- **v1.0** (2025-01-22)
  - 初始版本
  - 支持长音频异步处理
  - SSE实时通知
  - 工作器进程管理