# Auth Middleware & Soft Delete

## 1. 认证中间件
- 所有需要登录的 API 现通过 `lib/middleware/auth.ts`（JS 文件）提供的 `requireAuth` / `requireAuthWrapper`。
- 行为：
  - 从 `Authorization: Bearer <token>` 解析访问令牌。
  - 校验 JWT 签名、过期时间，并查找未软删的用户。
  - 失败时抛出 `401`，成功后将 `req.user`、`req.authToken`、`req.authPayload` 注入。
- 路由示例：
  ```js
  import { requireAuth } from '../../../lib/middleware/auth';

  export default async function handler(req, res) {
    const { user } = await requireAuth(req);
    // …业务逻辑
  }
  ```

## 2. 软删约束
- 模型（如 `audioFile`）包含 `deletedAt` 字段。使用 `enforceSoftDelete(entity)` 统一检查；若已软删则抛出 404。
- API 查询应避免显式筛选 `deletedAt: null` 后再重复判断，而是：
  ```js
  const audio = await prisma.audioFile.findFirst({ where: { id, userId } });
  enforceSoftDelete(audio);
  ```

## 3. 已适配的路由
- 音频列表、详情、播放、run 列表、run 导出。
- 上传创建/确认、转写触发等敏感接口。

## 4. 注意事项
- 新增登录保护路由时：先引入 `requireAuth`，再在数据读取后调用 `enforceSoftDelete`。
- 若未来需 email 验证，可在 `requireAuth` 基础上封装 `requireVerifiedUser`。
- 中间件只做认证，不负责授权；仍需检查资源归属（查询时限制 `userId`）。

持续引入新接口时，遵守上述流程以确保权限和软删一致性。
