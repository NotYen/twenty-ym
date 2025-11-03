#!/bin/bash
# 修正容器內前端的 SERVER_BASE_URL
# 用於 Docker 重啟後自動修正環境變數

COMPOSE_FILE=${1:-docker-compose.local-test.yml}
TARGET_URL=${2:-http://localhost:9999}

echo "🔧 修正前端 SERVER_BASE_URL 為: $TARGET_URL"

docker compose -f $COMPOSE_FILE exec server-test sed -i \
  's|"REACT_APP_SERVER_BASE_URL": "[^"]*"|"REACT_APP_SERVER_BASE_URL": "'"$TARGET_URL"'"|g' \
  /app/packages/twenty-server/dist/front/index.html

echo "✅ 已修正！"
echo ""
echo "驗證："
docker compose -f $COMPOSE_FILE exec server-test cat /app/packages/twenty-server/dist/front/index.html | grep -A 3 "window._env_"

