# 域名配置和HTTPS设置

## Vercel 域名配置

### 1. 添加自定义域名
1. 登录 Vercel 控制台
2. 选择你的项目
3. 进入 Settings -> Domains
4. 添加你的域名 (例如: lingoloop.com)

### 2. DNS 配置
在你的域名注册商处添加以下 DNS 记录：

```
A 记录:
@   IN  A   76.76.21.21
www IN  A   76.76.21.21

CNAME 记录:
www IN  CNAME cname.vercel-dns.com
```

### 3. HTTPS 配置
Vercel 会自动为你的域名配置 SSL 证书，通常需要几分钟时间。

## Railway Worker 域名配置

Worker 服务需要一个独立的域名来接收请求：

1. 在 Railway 中为 Worker 服务分配域名
2. 配置环境变量 `WORKER_URL`
3. 确保主应用可以访问 Worker 服务

## Nginx 反向代理配置 (可选)

如果你使用自己的服务器，可以使用 Nginx 进行反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /_next/static/ {
        alias /var/www/app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Cloudflare 配置 (推荐)

1. 将域名服务器指向 Cloudflare
2. 在 Cloudflare 中添加 A 记录指向 Vercel IP
3. 开启以下功能：
   - SSL/TLS: Full (strict)
   - Always Use HTTPS
   - Auto Minify
   - Brotli compression

## 部署检查清单

- [ ] 域名 DNS 解析正确
- [ ] HTTPS 证书有效
- [ ] 所有环境变量已配置
- [ ] 数据库连接正常
- [ ] Google Cloud 服务访问正常
- [ ] Worker 服务正常运行
- [ ] 文件上传功能正常
- [ ] 音频播放功能正常