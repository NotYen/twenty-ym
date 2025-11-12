#!/bin/bash

# 修正前端 URL 腳本
# 使用方式：./fix-frontend-url.sh http://your-aws-ip:8867

set -e

TARGET_URL=$1

if [ -z "$TARGET_URL" ]; then
  echo "❌ 請提供目標 URL"
  echo "使用方式：$0 <target-url>"
  echo "範例：$0 http://54.123.45.67:8867"
  exit 1
fi

echo "🔧 修正前端 SERVER_BASE_URL 為: $TARGET_URL"

# 獲取 frontend 容器的 ID
FRONTEND_CONTAINER=$(docker compose -f docker-compose.aws.yml ps -q frontend)

if [ -z "$FRONTEND_CONTAINER" ]; then
  echo "❌ 找不到 frontend 容器。請確認 Docker 服務已啟動。"
  exit 1
fi

# 在容器內執行 sed 命令修改 index.html
docker exec "$FRONTEND_CONTAINER" sh -c "sed -i 's|REACT_APP_SERVER_BASE_URL\": \".*\"|REACT_APP_SERVER_BASE_URL\": \"${TARGET_URL}\"|g' /usr/share/nginx/html/index.html"

echo "✅ 已修正！"

echo ""
echo "驗證："
docker exec "$FRONTEND_CONTAINER" sh -c "grep -A 2 'window._env_' /usr/share/nginx/html/index.html"

echo ""
echo "🌐 請訪問前端確認：http://YOUR_AWS_IP:8866"

