# 域名和 HTTPS 配置

## 1. 域名注册商配置

### 推荐的域名注册商
- Cloudflare Registrar
- Namecheap
- GoDaddy
- 阿里云
- 腾讯云

### DNS 服务器设置
```
nameserver1.cloudflare.com
nameserver2.cloudflare.com
```

## 2. Cloudflare DNS 配置

### A 记录
```
类型: A
名称: @
内容: 192.0.2.1 (Cloudflare Pages IP)
代理状态: 已代理
```

### CNAME 记录
```
类型: CNAME
名称: www
内容: your-domain.com
代理状态: 已代理
```

### API 子域名
```
类型: CNAME
名称: api
内容: your-api.workers.dev
代理状态: 已代理
```

## 3. SSL/TLS 配置

### SSL/TLS 模式
```
模式: 完全 (严格)
HSTS: 启用
HTTP 严格传输安全: 启用
```

### 证书管理
- 自动续期证书
- 支持 ECC 和 RSA 证书
- 通配符证书 (可选)

## 4. 安全设置

### DDoS 防护
```
安全级别: 高
DDoS 防护: 启用
Web 应用防火墙: 启用
```

### 速率限制
```
API 请求限制: 1000 次/小时
登录尝试限制: 5 次/分钟
文件上传限制: 100MB
```

## 5. 性能优化

### 缓存配置
```
静态文件缓存: 1 年
API 缓存: 5 分钟
浏览器缓存: 启用
```

### 压缩设置
```
Brotli 压缩: 启用
Gzip 压缩: 启用
图片优化: 启用
```

## 6. Workers 域名配置

### 自定义 Workers 域名
```toml
# 在 wrangler.toml 中配置
[env.production.custom_domains]
"api.your-domain.com" = { zone_name = "your-domain.com" }
```

### 路由配置
```
api.your-domain.com/* -> lingoloop-api
your-domain.com/* -> lingoloop-frontend
www.your-domain.com/* -> lingoloop-frontend
```

## 7. 监控和日志

### 流量监控
- 实时流量统计
- 带宽使用情况
- 请求响应时间
- 错误率监控

### 日志配置
- 访问日志: 启用
- 错误日志: 启用
- 安全日志: 启用
- 保留期: 30 天

## 8. 备份和恢复

### 配置备份
- DNS 配置备份
- Workers 配置备份
- Pages 配置备份
- 环境变量备份

### 灾难恢复
- 多区域部署
- 自动故障转移
- 数据库备份策略

## 9. 维护和更新

### 定期维护
- SSL 证书检查
- DNS 配置验证
- 性能监控
- 安全更新

### 更新流程
- 测试环境验证
- 逐步部署
- 监控反馈
- 回滚机制