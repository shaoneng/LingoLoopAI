# 项目部署结构

## 目录结构
```
lingoloop/
├── frontend/                 # Cloudflare Pages 前端
│   ├── src/
│   ├── pages/
│   ├── components/
│   └── package.json
├── workers/                  # Cloudflare Workers 后端
│   ├── src/
│   │   ├── auth/            # 认证中间件
│   │   ├── routes/          # API 路由
│   │   ├── middleware/      # 通用中间件
│   │   └── utils/           # 工具函数
│   ├── package.json
│   └── wrangler.toml
├── shared/                   # 共享代码
│   ├── lib/
│   ├── types/
│   └── constants/
└── docs/                     # 文档
```

## 前端配置 (frontend/)
- 移除 API 路由
- 配置环境变量
- 设置 Workers API 基础 URL

## 后端配置 (workers/)
- 迁移所有 API 路由
- 适配 Prisma 连接
- 配置环境变量