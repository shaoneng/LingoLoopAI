# 转写导出指南

## 1. 接口概览
- `GET /api/runs/:runId/export?fmt=txt|json|srt|vtt`
  - 需要携带 `Authorization: Bearer <accessToken>`。
  - 根据 `fmt` 返回不同格式的文本，并设置下载头。
  - 仅允许访问当前用户音频下的转写记录；被软删的音频无法导出。

## 2. 支持格式
- `txt`：逐段文本按行拼接。
- `json`：原始 run 数据（去除音频关联）格式化后的 JSON。
- `srt`：标准字幕格式 `HH:MM:SS,mmm`。
- `vtt`：含 `WEBVTT` 头的字幕，时间戳 `HH:MM:SS.mmm`。

## 3. 使用示例
```bash
curl -L \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/runs/abcd-1234/export?fmt=srt" \
  -o transcript.srt
```

## 4. 常见问题
- **返回 404**：确认 runId 属于当前用户且音频未删除。
- **返回 400**：检查 `fmt` 参数是否在 `txt|json|srt|vtt` 范围内。
- **大文件**：字幕和文本生成在内存完成，若后续 run 极大需考虑流式处理。

新增格式或字段时，请同步更新本指南。
