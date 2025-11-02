#!/bin/bash

# ==========================================
# Twenty CRM 一鍵啟動腳本（完整版）
# ==========================================
# 功能：
# - 自動檢查和啟動所有依賴服務（PostgreSQL, Redis）
# - 自動診斷和修復配置問題
# - 確保環境變數正確傳遞
# - 支持遷移到新機器後一鍵啟動
# ==========================================

set -e

# 加載配置文件
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/twenty-config.sh"

echo "🚀 Twenty CRM 一鍵啟動系統"
echo "=========================================="
echo ""

# ==========================================
# 步驟 1: 環境檢查
# ==========================================
echo "1️⃣  檢查系統環境..."

# 檢查必要命令
REQUIRED_COMMANDS=("node" "yarn" "npx" "lsof" "brew")
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command -v $cmd &> /dev/null; then
        echo "   ❌ 錯誤：找不到命令 $cmd"
        echo "   請先安裝必要的工具"
        exit 1
    fi
done
echo "   ✅ 系統環境檢查通過"
echo ""

# ==========================================
# 步驟 2: 啟動 PostgreSQL
# ==========================================
echo "2️⃣  啟動 PostgreSQL (端口 ${POSTGRES_PORT})..."
if ! lsof -Pi :${POSTGRES_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   🔄 正在啟動 PostgreSQL..."
    brew services start postgresql@16
    sleep 3

    # 驗證啟動成功
    if lsof -Pi :${POSTGRES_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   ✅ PostgreSQL 已啟動"
    else
        echo "   ❌ PostgreSQL 啟動失敗"
        exit 1
    fi
else
    echo "   ✅ PostgreSQL 已運行"
fi
echo ""

# ==========================================
# 步驟 3: 啟動 Redis 並清除快取
# ==========================================
echo "3️⃣  啟動 Redis (端口 ${REDIS_PORT})..."
if ! lsof -Pi :${REDIS_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   🔄 正在啟動 Redis..."
    brew services start redis
    sleep 3

    # 驗證啟動成功
    if lsof -Pi :${REDIS_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   ✅ Redis 已啟動"
    else
        echo "   ❌ Redis 啟動失敗"
        exit 1
    fi
else
    echo "   ✅ Redis 已運行"
fi

# 清除 Redis 快取（避免舊的權限數據導致問題）
echo "   🧹 清除 Redis 快取..."
if command -v redis-cli &> /dev/null; then
    redis-cli FLUSHALL > /dev/null 2>&1
    echo "   ✅ Redis 快取已清除"
else
    echo "   ⚠️  redis-cli 不可用，跳過快取清除"
fi
echo ""

# ==========================================
# 步驟 4: 檢查端口衝突
# ==========================================
echo "4️⃣  檢查端口衝突..."

if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  前端端口 ${FRONTEND_PORT} 已被佔用，嘗試關閉..."
    lsof -ti:${FRONTEND_PORT} | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if lsof -Pi :${BACKEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  後端端口 ${BACKEND_PORT} 已被佔用，嘗試關閉..."
    lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo "   ✅ 端口檢查通過"
echo ""

# ==========================================
# 步驟 5: 設置環境變數（關鍵！）
# ==========================================
echo "5️⃣  配置環境變數..."

# 基礎配置
export REACT_APP_PORT=${FRONTEND_PORT}
export REACT_APP_SERVER_BASE_URL=${BACKEND_URL}
export VITE_HOST=0.0.0.0
export NODE_PORT=${BACKEND_PORT}
export PG_DATABASE_URL=${POSTGRES_URL}
export REDIS_URL=${REDIS_URL}
export APP_SECRET=${APP_SECRET}
export NODE_ENV=${NODE_ENV}

# 多租戶配置（最關鍵！）
export SERVER_URL=${BACKEND_URL}
export FRONTEND_URL=${FRONTEND_URL}
export IS_MULTIWORKSPACE_ENABLED=${IS_MULTIWORKSPACE_ENABLED}
export IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=${IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS}
export DEFAULT_SUBDOMAIN=${DEFAULT_SUBDOMAIN}

# 登入配置
export SIGN_IN_PREFILLED=${SIGN_IN_PREFILLED}

# 郵件配置
export EMAIL_DRIVER=${EMAIL_DRIVER}
export EMAIL_SMTP_HOST=${EMAIL_SMTP_HOST}
export EMAIL_SMTP_PORT=${EMAIL_SMTP_PORT}
export EMAIL_SMTP_USER=${EMAIL_SMTP_USER}
export EMAIL_SMTP_PASSWORD=${EMAIL_SMTP_PASSWORD}
export EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS}
export EMAIL_FROM_NAME=${EMAIL_FROM_NAME}

# 計費配置
export IS_BILLING_ENABLED=${IS_BILLING_ENABLED}
export BILLING_STRIPE_API_KEY=${BILLING_STRIPE_API_KEY}
export BILLING_STRIPE_BASE_PLAN_PRODUCT_ID=${BILLING_STRIPE_BASE_PLAN_PRODUCT_ID}

echo "   ✅ 環境變數已設置"
echo ""
echo "   📋 關鍵配置："
echo "      FRONTEND_URL: ${FRONTEND_URL}"
echo "      SERVER_URL: ${SERVER_URL}"
echo "      DEFAULT_SUBDOMAIN: ${DEFAULT_SUBDOMAIN}"
echo "      IS_MULTIWORKSPACE_ENABLED: ${IS_MULTIWORKSPACE_ENABLED}"
echo ""

# ==========================================
# 步驟 5.5: 運行數據庫遷移（確保數據庫結構最新）
# ==========================================
echo "5️⃣.5 運行數據庫遷移..."
echo "   📊 檢查數據庫結構更新..."

# 運行數據庫遷移
if npx nx run twenty-server:database:migrate:prod > twenty_migration.log 2>&1; then
    echo "   ✅ 數據庫遷移完成"

    # 顯示執行了哪些遷移
    if grep -q "migration" twenty_migration.log 2>/dev/null; then
        echo "   📋 已執行的遷移："
        grep -i "migration" twenty_migration.log | tail -5 || echo "      （數據庫已是最新版本）"
    else
        echo "   ℹ️  數據庫已是最新版本，無需遷移"
    fi
else
    echo "   ❌ 數據庫遷移失敗！"
    echo ""
    echo "📋 錯誤日誌："
    cat twenty_migration.log
    echo ""
    echo "💡 可能原因："
    echo "   1. 數據庫連接失敗（檢查 PostgreSQL 是否運行）"
    echo "   2. 遷移文件語法錯誤"
    echo "   3. 數據庫權限不足"
    echo "   4. 數據不一致（可能需要手動修復）"
    echo ""
    echo "🔧 建議操作："
    echo "   - 檢查數據庫連接: psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB}"
    echo "   - 查看詳細日誌: cat twenty_migration.log"
    echo ""
    exit 1
fi
echo ""

# ==========================================
# 步驟 6: 清除 Nx 快取（避免使用舊的 build）
# ==========================================
echo "6️⃣  清除 Nx 快取..."
echo "   🧹 清除 Nx 快取以確保重新 build..."
npx nx reset > /dev/null 2>&1
echo "   ✅ Nx 快取已清除"
echo ""

# ==========================================
# 步驟 7: 啟動 Twenty 服務
# ==========================================
echo "7️⃣  啟動 Twenty CRM 服務..."

cd "${SCRIPT_DIR}"

# 清理舊的日誌
if [ -f "twenty.log" ]; then
    mv twenty.log "twenty.log.$(date +%Y%m%d_%H%M%S).bak" 2>/dev/null || true
fi

# 根據 NODE_ENV 選擇啟動方式
if [ "$NODE_ENV" = "production" ]; then
    echo "   🚀 Production 模式：先 build 再啟動"

    # 1. 先編譯語系，再 Build 前後端
    echo "   🌐 Compiling i18n translations..."
    npx nx run-many -t lingui:compile -p twenty-front twenty-server
    echo "   📦 Building frontend and backend..."
    npx nx run-many -t build -p twenty-server twenty-front

    if [ $? -ne 0 ]; then
        echo "   ❌ Build 失敗！"
        exit 1
    fi

    # 2. 啟動後端（production）
    echo "   🔧 啟動後端服務..."
    nohup bash -c "cd packages/twenty-server && node dist/src/main.js" > twenty_backend.log 2>&1 &

    # 3. 啟動前端（使用 serve）
    echo "   🌐 啟動前端服務..."
    nohup npx serve packages/twenty-front/build -l ${FRONTEND_PORT} -s > twenty_frontend.log 2>&1 &

    echo "   📝 日誌文件：twenty_backend.log, twenty_frontend.log"
else
    echo "   🔧 Development 模式：使用熱重載"

    # Development 模式：使用熱重載
    nohup bash -c "npx nx run-many -t start -p twenty-server twenty-front" > twenty.log 2>&1 &

    echo "   📝 日誌文件：twenty.log"
fi

echo "   ⏳ 等待後端啟動..."
sleep 5

# ==========================================
# 步驟 8: 等待後端完全就緒
# ==========================================
echo "8️⃣  等待後端 API 完全就緒..."

# 等待後端 API 端口監聽
MAX_WAIT=60
WAITED=0
BACKEND_READY=false

while [ $WAITED -lt $MAX_WAIT ]; do
    if lsof -Pi :${BACKEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   ✅ 後端 API 端口已監聽 (${BACKEND_PORT})"
        BACKEND_READY=true
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo "   ⏳ 等待後端啟動... ($WAITED/$MAX_WAIT 秒)"
done

if [ "$BACKEND_READY" = false ]; then
    echo "   ❌ 後端啟動超時！"
    echo ""
    echo "📋 錯誤日誌："
    tail -30 twenty.log
    echo ""
    echo "💡 可能原因："
    echo "   1. 資料庫連接失敗"
    echo "   2. 環境變數配置錯誤"
    echo "   3. 端口被佔用"
    echo ""
    exit 1
fi

# 額外等待後端初始化完成
echo "   ⏳ 等待後端初始化完成..."
sleep 5

# 驗證後端健康狀態
if curl -s "http://localhost:${BACKEND_PORT}/healthz" > /dev/null 2>&1; then
    echo "   ✅ 後端健康檢查通過"
elif curl -s "http://localhost:${BACKEND_PORT}/client-config" > /dev/null 2>&1; then
    echo "   ✅ 後端 API 可訪問"
else
    echo "   ⚠️  後端可能未完全就緒，但繼續啟動..."
fi
echo ""

# 在後端就緒後，同步 Workspace Metadata，避免前端取不到物件定義
echo "   🔄 同步 Workspace Metadata..."
if npx nx run twenty-server:command workspace:sync-metadata >> twenty.log 2>&1; then
    echo "   ✅ Metadata 同步完成（包括 Workflow 等標準對象）"
else
    echo "   ⚠️  Metadata 同步失敗，但繼續啟動（可稍後手動重試）"
    echo "   💡 手動重試命令: npx nx run twenty-server:command workspace:sync-metadata"
fi
echo ""

# 可選：自動清理指向不存在 Object 的 Views 與對應 Favorites（預設關閉）
# 開啟方式：在執行前導出 AUTO_CLEAN_ORPHAN_VIEWS=true
if [ "${AUTO_CLEAN_ORPHAN_VIEWS}" = "true" ]; then
  echo "   🧽 自動清理孤兒 Views 與對應 Favorites（僅刪除 objectMetadataId 不存在的項目）..."

  PORT=${POSTGRES_PORT:-5432}
  DB=${POSTGRES_DB:-default}
  USER=${POSTGRES_USER:-postgres}
  PASS=${POSTGRES_PASSWORD:-postgres}
  export PGPASSWORD="$PASS"

  # 取得所有 workspace_* schemas
  WORKSPACE_SCHEMAS=$(psql -h localhost -p "$PORT" -U "$USER" -d "$DB" -At -c "SELECT nspname FROM pg_namespace WHERE nspname LIKE 'workspace_%' ORDER BY nspname;" 2>/dev/null || echo "")

  if [ -z "$WORKSPACE_SCHEMAS" ]; then
    echo "   ℹ️  未找到任何 workspace_* schema，略過清理"
  else
    for WS in $WORKSPACE_SCHEMAS; do
      echo "   → 檢查 $WS"
      # Dry-run：統計將被刪除的數量
      COUNT_VIEWS=$(psql -h localhost -p "$PORT" -U "$USER" -d "$DB" -At -c "SELECT COUNT(*) FROM \"$WS\".\"view\" v LEFT JOIN \"$WS\".\"objectMetadata\" o ON o.id = v.\"objectMetadataId\" WHERE o.id IS NULL;" 2>/dev/null || echo "0")
      COUNT_FAVS=$(psql -h localhost -p "$PORT" -U "$USER" -d "$DB" -At -c "SELECT COUNT(*) FROM \"$WS\".\"favorite\" f JOIN \"$WS\".\"view\" v ON v.id = f.\"viewId\" LEFT JOIN \"$WS\".\"objectMetadata\" o ON o.id = v.\"objectMetadataId\" WHERE o.id IS NULL;" 2>/dev/null || echo "0")
      echo "      預計刪除 Views: $COUNT_VIEWS, Favorites: $COUNT_FAVS"

      if [ "${COUNT_VIEWS}" != "0" ] || [ "${COUNT_FAVS}" != "0" ]; then
        echo "      執行刪除..."
        psql -h localhost -p "$PORT" -U "$USER" -d "$DB" <<SQL_CLEAN >/dev/null 2>&1 || true
BEGIN;
  DELETE FROM "$WS"."favorite"
  WHERE "viewId" IN (
    SELECT v.id FROM "$WS"."view" v
    LEFT JOIN "$WS"."objectMetadata" o ON o.id = v."objectMetadataId"
    WHERE o.id IS NULL
  );

  DELETE FROM "$WS"."view"
  WHERE "objectMetadataId" IN (
    SELECT v."objectMetadataId" FROM "$WS"."view" v
    LEFT JOIN "$WS"."objectMetadata" o ON o.id = v."objectMetadataId"
    WHERE o.id IS NULL
  );
COMMIT;
SQL_CLEAN
        echo "      ✅ 清理完成"
      else
        echo "      無需清理"
      fi
    done
  fi
  echo ""
fi

# ==========================================
# 步驟 9: 等待前端就緒
# ==========================================
echo "9️⃣  等待前端 Web 就緒..."

MAX_WAIT=60
WAITED=0
FRONTEND_READY=false

while [ $WAITED -lt $MAX_WAIT ]; do
    if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   ✅ 前端 Web 已就緒 (${FRONTEND_PORT})"
        FRONTEND_READY=true
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $((WAITED % 10)) -eq 0 ]; then
        echo "   ⏳ 等待前端啟動... ($WAITED/$MAX_WAIT 秒)"
    fi
done

if [ "$FRONTEND_READY" = false ]; then
    echo "   ⚠️  前端啟動超時，但可能仍在編譯中..."
    echo "   💡 前端通常需要較長時間編譯，可以稍後訪問"
fi
echo ""

# ==========================================
# 步驟 10: 註冊 Cron Jobs（必須在啟動 Worker 之前）
# ==========================================
echo "🔟 註冊 Cron Jobs..."

# 註冊所有背景同步任務（包括 Workflow Cron Triggers）
# 注意：這個命令會重新編譯後端，所以在後端啟動後延遲執行
sleep 5
if npx nx run twenty-server:command cron:register:all >> twenty.log 2>&1; then
    echo "   ✅ Cron Jobs 已成功註冊"
else
    echo "   ⚠️  Cron Jobs 註冊失敗，但繼續啟動..."
    echo "   💡 可以稍後手動執行：npx nx run twenty-server:command cron:register:all"
fi
echo ""

# ==========================================
# 步驟 11: 啟動 Worker（必須在後端就緒後）
# ==========================================
echo "1️⃣1️⃣  啟動 Worker 服務..."

# Worker 依賴後端，所以必須在後端就緒後啟動
if [ "$NODE_ENV" = "production" ]; then
    echo "   🚀 Production 模式：直接運行編譯後的 Worker"
    nohup bash -c "cd packages/twenty-server && node dist/src/queue-worker/queue-worker.js" > twenty_worker.log 2>&1 &
    WORKER_PID=$!
    echo "   📝 Worker 日誌文件：twenty_worker.log"
else
    echo "   🔧 Development 模式：使用 nx 運行 Worker"
    nohup bash -c "npx nx run twenty-server:worker" >> twenty.log 2>&1 &
    WORKER_PID=$!
    echo "   📝 Worker 日誌文件：twenty.log"
fi

sleep 3

# 檢查 Worker 是否成功啟動
if ps -p $WORKER_PID > /dev/null 2>&1; then
    echo "   ✅ Worker 已啟動 (PID: $WORKER_PID)"
else
    echo "   ⚠️  Worker 可能啟動失敗，請檢查日誌"
fi
echo ""

# ==========================================
# 步驟 12: 驗證配置
# ==========================================
echo "1️⃣2️⃣  驗證多租戶配置..."

sleep 5

# 獲取後端配置
CLIENT_CONFIG=$(curl -s "http://localhost:${BACKEND_PORT}/client-config" 2>/dev/null || echo "{}")

if [ "$CLIENT_CONFIG" != "{}" ]; then
    FRONT_DOMAIN=$(echo "$CLIENT_CONFIG" | grep -o '"frontDomain":"[^"]*"' | cut -d'"' -f4 || echo "")
    DEFAULT_SUB=$(echo "$CLIENT_CONFIG" | grep -o '"defaultSubdomain":"[^"]*"' | cut -d'"' -f4 || echo "")

    echo "   後端配置檢查："
    echo "   - frontDomain: ${FRONT_DOMAIN:-[未設置]}"
    echo "   - defaultSubdomain: ${DEFAULT_SUB:-[未設置]}"

    if [ -z "$DEFAULT_SUB" ]; then
        echo ""
        echo "   ⚠️  警告：defaultSubdomain 為空！"
        echo "   這會導致多租戶 URL 錯誤"
        echo ""
        echo "   可能原因："
        echo "   1. 環境變數未正確傳遞給後端"
        echo "   2. 需要重啟服務以應用新配置"
        echo ""
        echo "   建議：執行以下命令重啟"
        echo "   ./stop-twenty-local.sh && ./一鍵啟動.sh"
    else
        echo "   ✅ 配置正確"
    fi
else
    echo "   ⏳ 無法驗證配置（服務可能仍在啟動）"
fi
echo ""

# ==========================================
# 步驟 13: 啟動後健康檢查
# ==========================================
echo "1️⃣3️⃣ 啟動後健康檢查..."
echo ""

# 等待服務穩定
echo "   ⏳ 等待服務穩定（10 秒）..."
sleep 10

# 檢查 Worker 進程
echo "   🔍 檢查 Worker 進程..."
WORKER_PID=$(ps aux | grep -E "queue-worker.js" | grep -v grep | awk '{print $2}' | head -1)
if [ -n "$WORKER_PID" ]; then
    echo "   ✅ Worker 正在運行（PID: $WORKER_PID）"
else
    echo "   ❌ Worker 未運行！"
fi

# 檢查 Redis 中的 Cron Jobs
echo ""
echo "   🔍 檢查 Cron Jobs 註冊狀態..."
CRON_JOBS=$(redis-cli keys "bull:cron-queue:repeat:*CronJob" 2>/dev/null | wc -l | tr -d ' ')
if [ "$CRON_JOBS" -gt 0 ]; then
    echo "   ✅ 已註冊 $CRON_JOBS 個 Cron Jobs"
    echo ""
    echo "   📋 主要 Cron Jobs："
    redis-cli keys "bull:cron-queue:repeat:*CronJob" 2>/dev/null | while read key; do
        JOB_NAME=$(echo "$key" | sed 's/bull:cron-queue:repeat://;s/:[0-9]*$//')
        echo "      - $JOB_NAME"
    done | head -5
else
    echo "   ⚠️  警告：未找到 Cron Jobs"
fi

# 檢查 WorkflowCronTriggerCronJob
echo ""
echo "   🔍 檢查 Workflow Schedule Cron Job..."
WORKFLOW_CRON=$(redis-cli exists "bull:cron-queue:repeat:WorkflowCronTriggerCronJob" 2>/dev/null)
if [ "$WORKFLOW_CRON" = "1" ]; then
    PATTERN=$(redis-cli hget "bull:cron-queue:repeat:WorkflowCronTriggerCronJob" "pattern" 2>/dev/null)
    echo "   ✅ WorkflowCronTriggerCronJob 已註冊（執行頻率: $PATTERN）"
else
    echo "   ❌ WorkflowCronTriggerCronJob 未註冊！"
fi

# 檢查是否有卡住的 Workflow Runs（可選）
echo ""
echo "   🔍 檢查卡住的 Workflow Runs..."
if command -v psql &> /dev/null; then
    STUCK_WORKFLOWS=$(PGPASSWORD=postgres psql -h localhost -p ${POSTGRES_PORT} -U postgres -d default -t -c "SELECT COUNT(*) FROM workspace_1wgvd1injqtife6y4rvfbu3h5.\"workflowRun\" WHERE status = 'RUNNING' AND \"deletedAt\" IS NULL AND \"startedAt\" < NOW() - INTERVAL '1 hour';" 2>/dev/null | tr -d ' ')

    if [ -n "$STUCK_WORKFLOWS" ] && [ "$STUCK_WORKFLOWS" -gt 0 ]; then
        echo "   ⚠️  發現 $STUCK_WORKFLOWS 個可能卡住的 Workflow Runs（超過1小時）"
        echo "   💡 建議：檢查這些 Workflow 是否需要清理"
    else
        echo "   ✅ 沒有卡住的 Workflow Runs"
    fi
else
    echo "   ⏭️  跳過（psql 未安裝）"
fi

echo ""
echo "   ✅ 健康檢查完成！"
echo ""

# ==========================================
# 完成
# ==========================================
echo "=========================================="
echo "✅ Twenty CRM 啟動完成！"
echo "=========================================="
echo ""
echo "📍 訪問地址："
echo "   前端 Web:  ${FRONTEND_URL}"
echo "   後端 API:  ${BACKEND_URL}"
echo "   默認工作區: ${DEFAULT_SUBDOMAIN}.${EXTERNAL_HOST}:${FRONTEND_PORT}"
echo ""
echo "📝 查看日誌: tail -f twenty.log"
echo "🛑 停止服務: ./stop-twenty-local.sh"
echo "🔍 診斷問題: ./診斷並修復.sh"
echo ""
echo "💡 提示："
echo "   - 首次訪問請使用: http://${DEFAULT_SUBDOMAIN}.${EXTERNAL_HOST}:${FRONTEND_PORT}"
echo "   - 如果遇到跳轉錯誤，請運行診斷腳本"
echo ""

