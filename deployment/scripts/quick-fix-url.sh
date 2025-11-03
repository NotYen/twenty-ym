#!/bin/bash

###############################################################################
# Twenty CRM - 快速修正前端 URL
# 用途：重啟容器後快速修正前端 URL
# 使用：./quick-fix-url.sh [compose-file] [target-url]
###############################################################################

COMPOSE_FILE="${1:-/Users/ym/twenty-ym/deployment/docker-compose.local-test.yml}"
TARGET_URL="${2:-http://localhost:9999}"

echo "🔧 快速修正前端 URL"
echo "===================="
echo "Docker Compose: $COMPOSE_FILE"
echo "目標 URL: $TARGET_URL"
echo ""

# 獲取容器 ID
CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" ps -q server-test 2>/dev/null)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ 錯誤: 找不到 server-test 容器"
    echo "💡 請先啟動 Docker Compose"
    exit 1
fi

# 修正 URL
echo "🔧 修正中..."
docker exec "$CONTAINER_ID" sh -c "sed -i 's|http://localhost:3000|$TARGET_URL|g' /app/packages/twenty-server/dist/front/index.html"

# 驗證
echo ""
echo "✅ 驗證結果："
docker exec "$CONTAINER_ID" grep "REACT_APP_SERVER_BASE_URL" /app/packages/twenty-server/dist/front/index.html

echo ""
echo "🎉 完成！請刷新瀏覽器（Cmd+Shift+R）"

