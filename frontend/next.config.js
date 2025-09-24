/** @type {import('next').NextConfig} */
const nextConfig = {
  // 关键修改：启用静态导出 (适配 Cloudflare Pages)
  output: 'export',

  // 关键修改：添加 trailing slash (静态导出要求)
  trailingSlash: true,

  // 关键修改：禁用图片优化 (静态导出要求)
  images: {
    unoptimized: true
  },

  // 优化：压缩配置
  compress: true,

  // 注意：静态导出不支持自定义 headers，移除 headers 配置

  // 关键：设置基础路径 (如果需要子目录)
  // basePath: '/lingoloop'
}

module.exports = nextConfig