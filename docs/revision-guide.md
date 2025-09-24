# 转写修订指南

## 1. 接口概览
- `GET /api/runs/:runId/revisions` – 列出指定 run 的修订，按创建时间倒序。
- `POST /api/runs/:runId/revisions` – 新建修订 `{ title?, text, segments? }`。
- `PATCH /api/revisions/:revisionId` – 更新修订标题、正文或段落 JSON。
- `DELETE /api/revisions/:revisionId` – 删除修订。
所有请求需 `Authorization: Bearer <accessToken>`，且仅限 run 所属用户访问。

## 2. 数据格式
```json
{
  "id": "rev-uuid",
  "runId": "run-uuid",
  "title": "可选标题",
  "text": "修订后的全文",
  "segments": [ { ... } ],
  "createdBy": "user-uuid",
  "createdAt": "2025-09-18T10:51:31.123Z"
}
```

## 3. 前端流程
- 音频详情页右侧展示「历史版本 & 注释」和「修订面板」。
- 创建修订时默认填入当前 run 的文本；用户可编辑标题与正文后保存。
- 选中修订后，可直接在页面内更新或删除；操作完成会刷新列表。

## 4. 注意事项
- 空文本不允许创建或更新；接口返回 400。
- 删除修订为硬删，需确认提示；后续可改为软删。
- 若未来支持多 run 修订共享，需在接口层拓展授权逻辑。

请在新增功能时同步更新本文件。
