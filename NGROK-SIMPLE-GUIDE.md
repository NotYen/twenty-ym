# Twenty CRM ngrok 外部訪問 - 超簡單方案

## 🎯 最簡單的做法（5分鐘搞定）

### 架構：
```
外部用戶 → ngrok → Nginx (9000) → Twenty 前端(8866) + 後端(8867)
```

### 完整步驟：

#### 1. 安裝 Nginx
```bash
brew install nginx
```

#### 2. 創建 Nginx 配置
```bash
cat > /opt/homebrew/etc/nginx/servers/twenty.conf << 'NGINX'
upstream twenty_app {
    server 127.0.0.1:8866;
}

upstream twenty_api {
    server 127.0.0.1:8867;
}

server {
    listen 9000;
    
    location / {
        proxy_pass http://twenty_app;
        proxy_set_header Host $host;
    }
    
    location /graphql {
        proxy_pass http://twenty_api/graphql;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location ~ ^/(rest|metadata|healthz|client-config|auth) {
        proxy_pass http://twenty_api;
        proxy_set_header Host $host;
    }
}
NGINX
```

#### 3. 啟動 Nginx
```bash
nginx
# 測試：curl http://localhost:9000/healthz
```

#### 4. 啟動 ngrok
```bash
ngrok http 9000
```

#### 5. 訪問
```
用 ngrok 給的網址訪問，例如：
https://abc123.ngrok.io
```

## ✅ 優勢
- 完全免費
- 不改 Twenty 配置
- 符合原始架構
- 所有功能正常
