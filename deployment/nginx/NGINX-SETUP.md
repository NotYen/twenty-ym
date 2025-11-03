# Nginx 安裝和配置指南

## 📋 在 AWS Linux 上安裝 Nginx

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Amazon Linux 2
```bash
sudo amazon-linux-extras install nginx1 -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## ⚙️ 配置 Nginx

### 1. 複製配置文件
```bash
# 假設部署目錄在 /home/ubuntu/twenty-crm/deployment
sudo cp /home/ubuntu/twenty-crm/deployment/nginx/nginx.conf \
  /etc/nginx/sites-available/twenty

# 創建符號連結
sudo ln -s /etc/nginx/sites-available/twenty \
  /etc/nginx/sites-enabled/twenty
```

### 2. 測試配置
```bash
# 檢查配置語法
sudo nginx -t

# 應該看到：
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3. 重載 Nginx
```bash
sudo systemctl reload nginx

# 或重啟
sudo systemctl restart nginx
```

### 4. 檢查狀態
```bash
sudo systemctl status nginx

# 查看日誌
sudo tail -f /var/log/nginx/twenty-access.log
sudo tail -f /var/log/nginx/twenty-error.log
```

## 🔐 配置 HTTPS（Let's Encrypt）

### 安裝 Certbot
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# Amazon Linux 2
sudo yum install certbot python3-certbot-nginx -y
```

### 申請 SSL 證書
```bash
# 替換為你的域名
sudo certbot --nginx -d your-domain.com

# 如果有多個子域名
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 自動續期
```bash
# 測試自動續期
sudo certbot renew --dry-run

# Certbot 會自動設置 cron job
# 可以手動檢查：
sudo systemctl list-timers | grep certbot
```

## 🎯 使用 nip.io（無需真實域名）

如果你使用 nip.io 魔法 DNS：

```bash
# 假設你的 AWS IP 是 54.123.45.67
# 你可以使用：54.123.45.67.nip.io

# Nginx 配置中設置：
server_name 54.123.45.67.nip.io;
```

**注意：** nip.io 不支持 HTTPS（Let's Encrypt 需要真實域名）

## 🔧 常用 Nginx 命令

```bash
# 啟動
sudo systemctl start nginx

# 停止
sudo systemctl stop nginx

# 重啟
sudo systemctl restart nginx

# 重載配置（不中斷服務）
sudo systemctl reload nginx

# 查看狀態
sudo systemctl status nginx

# 測試配置
sudo nginx -t

# 查看日誌
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔍 故障排查

### 問題 1：端口已被佔用
```bash
# 檢查端口 80 是否被佔用
sudo netstat -tulpn | grep :80

# 如果有其他程序佔用，停止它
sudo systemctl stop apache2  # 如果是 Apache
```

### 問題 2：權限錯誤
```bash
# 確保 Nginx 用戶有權訪問日誌目錄
sudo chown -R nginx:nginx /var/log/nginx/

# Ubuntu 上用戶可能是 www-data
sudo chown -R www-data:www-data /var/log/nginx/
```

### 問題 3：無法連接到後端
```bash
# 檢查 Twenty Server 是否運行
docker compose ps

# 檢查端口
sudo netstat -tulpn | grep :3000

# 測試本地連接
curl http://localhost:3000/healthz
```

### 問題 4：SELinux 阻止連接（CentOS/RHEL）
```bash
# 允許 Nginx 連接到網絡
sudo setsebool -P httpd_can_network_connect 1
```

## 📊 性能優化

### 1. 調整 Worker 進程數
```nginx
# 在 /etc/nginx/nginx.conf 中
worker_processes auto;  # 自動匹配 CPU 核心數
```

### 2. 增加連接數限制
```nginx
events {
    worker_connections 2048;
    use epoll;
}
```

### 3. 啟用快取（可選）
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 10m;
    # ...
}
```

## 🛡️ 安全加固

### 1. 隱藏 Nginx 版本
```nginx
http {
    server_tokens off;
}
```

### 2. 添加安全頭
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 3. 限制請求速率
```nginx
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;

location / {
    limit_req zone=one burst=20 nodelay;
    # ...
}
```

## 📝 檢查清單

配置完成後，確認以下項目：

- [ ] Nginx 安裝成功
- [ ] 配置文件語法正確 (`nginx -t`)
- [ ] Nginx 服務運行中
- [ ] 可以訪問 http://your-domain-or-ip
- [ ] 健康檢查正常 http://your-domain-or-ip/healthz
- [ ] 日誌正常寫入
- [ ] （可選）HTTPS 證書配置成功
- [ ] 防火牆開放 80 和 443 端口
