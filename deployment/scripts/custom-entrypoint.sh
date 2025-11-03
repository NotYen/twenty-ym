#!/bin/sh
set -e

###############################################################################
# Twenty CRM - 自定義 Entrypoint
# 用途：在容器啟動時自動修正前端 URL
###############################################################################

echo "🔧 Twenty CRM 自定義啟動腳本"

# 執行原始的 entrypoint
/app/entrypoint.sh "$@" &
ENTRYPOINT_PID=$!

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 20

# 修正前端 URL（如果設置了 FRONTEND_BASE_URL 環境變數）
if [ ! -z "$FRONTEND_BASE_URL" ]; then
    echo "🔧 修正前端 SERVER_BASE_URL 為: $FRONTEND_BASE_URL"

    INDEX_FILE="/app/packages/twenty-server/dist/front/index.html"

    if [ -f "$INDEX_FILE" ]; then
        sed -i "s|http://localhost:3000|$FRONTEND_BASE_URL|g" "$INDEX_FILE"
        echo "✅ 前端 URL 已修正"

        # 驗證
        grep "REACT_APP_SERVER_BASE_URL" "$INDEX_FILE" || echo "⚠️ 未找到配置"
    else
        echo "⚠️ 警告: index.html 不存在"
    fi
else
    echo "💡 提示: 未設置 FRONTEND_BASE_URL，使用預設值"
fi

# 等待原始進程
wait $ENTRYPOINT_PID

