# 分析（句子分析/语法分析）使用说明

本功能为音频转写的分段（segment）提供“句子分析”和“语法分析”，结果会持久化，便于后续复用与导出。默认引擎为 Google Gemini（可通过环境变量配置）。

## 1. 环境准备
- 设置 Gemini API Key（AI Studio）：
  - `GEMINI_API_KEY=你的APIKey`
  - 也兼容：`GOOGLE_GENAI_API_KEY` 或 `GOOGLE_API_KEY`
- 配置模型：目前后端已固定使用 `gemini-2.5-pro` 进行分析；如需改回可配置模式，请告知，我们再开放环境变量切换。
- 部署数据库 schema：
  - `npx prisma db push`

## 2. 数据模型（Analysis）
- 表：`analysis`
- 键：`runId + segmentIndex + kind + engine + paramsHash` 唯一，保障相同参数分析幂等。
- 重要字段：
  - `kind`：`sentence` 或 `grammar`
  - `status`：`processing|succeeded|failed`
  - `result`：分析结果 JSON
  - `summary`、`score`：概览与评分（可选）

## 3. API
### 3.1 句级分析（GET/POST）
- 路径：`/api/runs/:runId/segments/:segmentIndex/analysis`
- 权限：需资源属主登录。

GET（拉取已保存结果）
```
GET /api/runs/{runId}/segments/{index}/analysis?kinds=sentence,grammar
Authorization: Bearer <accessToken>
```
响应：`{ items: Analysis[] }`

POST（触发分析；命中缓存会直接返回）
```
POST /api/runs/{runId}/segments/{index}/analysis
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kinds": ["sentence", "grammar"],
  "force": false
}
```
响应：
```
{
  "items": [
    { "kind": "sentence", "status": "succeeded", "analysisId": "...", "summary": "...", "score": 0.62, "result": { ... } },
    { "kind": "grammar",  "status": "succeeded", ... }
  ]
}
```

## 4. 审计
- `ANALYZE_START` / `ANALYZE_END` / `ANALYZE_FAILED`
- `meta`: `{ segmentIndex, kind, engine }`

## 5. 结果结构（示例）
- sentence（句子分析）
```
{
  "tokens": [{"text": "When", "pos": "SCONJ"}, ...],
  "phrases": [{"type": "NP", "text": "the little boy"}, ...],
  "syntax": [{"label": "主句", "detail": "..."}],
  "metrics": {"length": 18, "complexity": 0.48},
  "summary": "本句包含时间状语从句..."
}
```
- grammar（语法分析）
```
{
  "patterns": [{"name": "Present Perfect", "matchedText": "has gone", "rationale": "..."}],
  "issues": [{"type": "agreement", "message": "主谓一致问题", "span": "..."}],
  "suggestions": [{"hint": "改为 were", "example": "..."}],
  "score": 0.62,
  "summary": "涉及现在完成时，与..."
}
```

## 6. 前端接入建议
- 右侧“分析区”订阅 TranscriptPlayer 的当前段（segmentIndex），优先 GET 拉取结果；无结果时展示“分析此句”。
- 点击“分析此句”调用 POST；返回后直接渲染成功项。
- 支持“再次分析（覆盖）”：POST 时 `force: true`。

## 7. 故障与降级
- 未配置 API Key → 返回 500，提示管理员配置 `GOOGLE_GENAI_API_KEY`。
- 分析超时或非 JSON 响应 → 标记为失败，可重试。
- 可在后续版本加入队列与 SSE 实时通知。
