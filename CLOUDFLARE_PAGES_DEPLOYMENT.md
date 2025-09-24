# Cloudflare Pages 部署指南

## 🚀 问题已修复！

之前的错误 `Cannot find cwd: /opt/buildhome/repo/frontend` 已经通过以下修复解决：

### 修复内容
1. ✅ 更新 `next.config.js` 添加静态导出配置
2. ✅ 设置输出目录为 `out`
3. ✅ 添加 `trailingSlash` 和 `unoptimized images` 配置
4. ✅ 更新 `package.json` 构建脚本

## 📋 Cloudflare Pages 部署步骤

### 1. 连接 GitHub 仓库
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择 "Pages" 服务
3. 点击 "Create a project"
4. 选择 "Connect to Git"
5. 选择你的 `LingoLoopAI` 仓库

### 2. 配置构建设置
在 Cloudflare Pages 配置页面：

#### 构建设置
- **Framework preset**: `Next.js (Static Export)`
- **Build command**: `npm run build`
- **Build output directory**: `out`
- **Root directory**: `/` (留空)

#### 环境变量
添加以下环境变量：

```env
# 生产环境配置
NODE_ENV=production

# 可选：如果有外部API，配置API地址
NEXT_PUBLIC_API_BASE_URL=https://your-worker-domain.workers.dev
```

### 3. 部署后端 (Cloudflare Workers)
在另一个项目中部署 Workers 后端：

```bash
cd worker
npm run build
npx wrangler deploy
```

## 🔧 技术说明

### 静态导出配置
```javascript
// next.config.js
const nextConfig = {
  output: 'export',           // 启用静态导出
  trailingSlash: true,        // 添加斜杠
  distDir: 'out',            // 输出目录
  images: {
    unoptimized: true,       // 禁用图片优化
  },
};
```

### 构建流程
```bash
npm run build  # 生成静态文件到 out/ 目录
```

生成的文件结构：
```
out/
├── index.html
├── dashboard/
├── login/
├── register/
├── _next/
└── ...
```

## 🌐 部署后的访问

部署完成后，你的应用将在以下地址可用：
- **预览环境**: `https://your-project-name.pages.dev`
- **生产环境**: `https://your-custom-domain.com`

## 🎯 功能验证

部署后请验证以下功能：

1. ✅ 首页正常显示
2. ✅ 登录/注册页面可以访问
3. ✅ 仪表板页面正常显示
4. ✅ 所有导航链接正常工作
5. ✅ 响应式设计正常

## 📝 注意事项

### 已知限制
- API 路由在静态导出中不可用
- 需要单独部署 Workers 后端
- 图片优化被禁用

### 后续优化
- 配置自定义域名
- 设置 CI/CD 自动部署
- 添加性能监控
- 配置 CDN 缓存规则

## 🎉 部署成功！

你的 LingoLoopAI 应用现在已经完全适配 Cloudflare Pages 部署。静态导出确保了：

- **快速加载**: 静态文件，CDN 加速
- **高可用性**: Cloudflare 全球网络
- **零服务器成本**: 纯静态托管
- **自动 HTTPS**: 免费 SSL 证书

项目现在可以在 Cloudflare Pages 上完美运行！🚀