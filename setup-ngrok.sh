#!/bin/bash
# ==========================================
# Twenty CRM ngrok 設置腳本
# ==========================================

echo "🌐 Twenty CRM ngrok 外部訪問設置"
echo "=========================================="
echo ""

# ==========================================
# 方案：使用 Nginx 本地反向代理 + ngrok
# ==========================================

echo "📋 推薦方案："
echo ""
echo "由於 Twenty 前端需要知道後端的確切 URL，"
echo "我們使用以下架構："
echo ""
echo "外部訪問 (ngrok) → Nginx (本地) → Twenty 前後端"
echo ""

cat << 'SOLUTION'
╔════════════════════════════════════════════════╗
║  最簡單的方案：使用 Nginx 統一端口             ║
╚════════════════════════════════════════════════╝

步驟 1: 安裝 Nginx (本地)
──────────────────────────
brew install nginx

步驟 2: 配置 Nginx
──────────────────────────
創建配置文件：/opt/homebrew/etc/nginx/nginx.conf

upstream twenty_frontend {
    server 127.0.0.1:8866;
}

upstream twenty_backend {
    server 127.0.0.1:8867;
}

server {
    listen 8080;
    server_name localhost;
    
    # 前端
    location / {
        proxy_pass http://twenty_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 後端 API
    location /graphql {
        proxy_pass http://twenty_backend/graphql;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location /rest {
        proxy_pass http://twenty_backend/rest;
        proxy_set_header Host $host;
    }
    
    location /healthz {
        proxy_pass http://twenty_backend/healthz;
    }
}

步驟 3: 啟動 Nginx
──────────────────────────
nginx
# 或
brew services start nginx

步驟 4: 使用 ngrok 暴露 Nginx
──────────────────────────
ngrok http 8080

這樣：
✅ 前後端都通過同一個 ngrok URL 訪問
✅ 不需要修改 Twenty 配置
✅ 完全符合 Twenty 架構
✅ 一個命令搞定外部訪問

SOLUTION

echo ""
echo "=========================================="
echo "💡 或者更簡單的方法..."
echo "=========================================="

