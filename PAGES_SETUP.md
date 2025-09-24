# Cloudflare Pages 配置指南

## 1. 创建 Cloudflare Pages 项目

### 步骤：
1. 登录 Cloudflare Dashboard
2. 进入 Pages 部分
3. 点击 "Create a project"
4. 选择 "Connect to Git"
5. 选择你的 GitHub 仓库
6. 配置构建设置：

### 构建设置
```
框架预设: Next.js
构建命令: npm run build
构建输出目录: out
根目录: /frontend
Node.js 版本: 18
```

## 2. 环境变量配置

在 Pages 项目设置中添加：
```
NEXT_PUBLIC_API_URL=https://your-api.your-domain.com
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
```

## 3. 配置 _redirects 文件

在 `frontend/public` 目录下创建 `_redirects`：
```
/*    /index.html   200
```

## 4. 自定义域名配置

### 主域名配置
```
域名: your-domain.com
状态: Active
SSL: 完全 (严格)
```

### 子域名配置
```
域名: www.your-domain.com
状态: Active
SSL: 完全 (严格)
```

## 5. 构建设置优化

### 缓存配置
在 `frontend/next.config.js` 中添加：
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

## 6. 部署配置

### 自动部署
- 每次推送到 main 分支自动部署
- PR 预览部署
- 失败时自动回滚

### 构建失败处理
- 检查依赖版本
- 验证环境变量
- 查看构建日志
- 测试本地构建

## 7. 性能优化

### 图片优化
- 使用 WebP 格式
- 添加响应式图片
- 启用懒加载

### CSS 优化
- 启用 CSS 压缩
- 使用 critical CSS
- 移除未使用的 CSS

### JavaScript 优化
- 代码分割
- 懒加载组件
- 压缩 bundle

## 8. 监控和分析

### Cloudflare Analytics
- 启用页面浏览量统计
- 监控性能指标
- 分析用户行为

### 错误监控
- 配置错误日志
- 设置告警通知
- 监控 4xx/5xx 错误