#!/usr/bin/env bash

# ==========================================
# Twenty CRM 一鍵啟動腳本（Windows 版）
# ==========================================
# 功能：
# - 自動檢查必要工具（node、yarn、npx、powershell）
# - 啟動並驗證 PostgreSQL 與 Redis Windows 服務
# - 檢查端口佔用並強制釋放
# - 設置環境變數並執行 build / 啟動流程
# - 與 macOS 版腳本對齊的完整診斷與啟動步驟
# ==========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/twenty-config.sh"

if [[ ! "$(uname -s)" =~ (MINGW|MSYS|CYGWIN|Windows_NT) ]]; then
  echo "❌ 此腳本僅適用於 Windows (Git Bash / WSL)。"
  echo "   請改用 macOS 版腳本：build_all_services_prod_env.sh"
  exit 1
fi

# 允許透過環境變數覆寫 Windows 服務名稱
POSTGRES_WINDOWS_SERVICE_NAME="${POSTGRES_WINDOWS_SERVICE_NAME:-postgresql-x64-16}"
REDIS_WINDOWS_SERVICE_NAME="${REDIS_WINDOWS_SERVICE_NAME:-redis}" # Redis 官方 MSI 預設 service 名稱為 Redis

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "   ❌ 錯誤：找不到命令 $cmd"
    exit 1
  fi
}

is_port_listening() {
  local port="$1"
  powershell.exe -NoProfile -Command "& {
    param([int]\$Port)
    \$result = Get-NetTCPConnection -LocalPort \$Port -State Listen -ErrorAction SilentlyContinue
    if (\$result) { exit 0 } else { exit 1 }
  }" "$port" >/dev/null 2>&1
}

stop_processes_on_port() {
  local port="$1"
  local pids
  pids=$(powershell.exe -NoProfile -Command "& {
    param([int]\$Port)
    \$conns = Get-NetTCPConnection -LocalPort \$Port -State Listen -ErrorAction SilentlyContinue
    if (\$conns) {
      (\$conns | Select-Object -ExpandProperty OwningProcess -Unique) -join ' '
    }
  }" "$port" | tr -d '\r')

  if [ -n "$pids" ]; then
    echo "   ⚠️  端口 $port 被佔用，嘗試釋放..."
    for pid in $pids; do
      powershell.exe -NoProfile -Command "& {
        param([int]\$Pid)
        try {
          Stop-Process -Id \$Pid -Force -ErrorAction Stop
        } catch {
          Write-Host \"      ⏭️  無法終止進程 \$Pid (\$_.Exception.Message)\"
        }
      }" "$pid" >/dev/null 2>&1 || true
    done
    sleep 2
  fi
}

start_windows_service() {
  local service_name="$1"
  echo "   🔄 正在啟動 Windows 服務：$service_name"
  powershell.exe -NoProfile -Command "& {
    param([string]\$ServiceName)
    try {
      \$svc = Get-Service -Name \$ServiceName -ErrorAction Stop
      if (\$svc.Status -ne 'Running') {
        Start-Service -Name \$ServiceName
        \$svc.WaitForStatus('Running', '00:00:10')
      }
      exit 0
    } catch {
      Write-Error \"啟動服務失敗：\$($_.Exception.Message)\"
      exit 1
    }
  }" "$service_name"
}

echo "🚀 Twenty CRM 一鍵啟動系統（Windows 版）"
echo "=========================================="
echo ""

echo "1️⃣  檢查系統環境..."
REQUIRED_COMMANDS=("node" "yarn" "npx" "powershell.exe")
for cmd in "${REQUIRED_COMMANDS[@]}"; do
  require_command "$cmd"
done
echo "   ✅ 系統環境檢查通過"
echo ""

echo "2️⃣  啟動 PostgreSQL 服務 (${POSTGRES_WINDOWS_SERVICE_NAME})..."
if ! is_port_listening "$POSTGRES_PORT"; then
  start_windows_service "$POSTGRES_WINDOWS_SERVICE_NAME"
  sleep 3
  if is_port_listening "$POSTGRES_PORT"; then
    echo "   ✅ PostgreSQL 已啟動"
  else
    echo "   ❌ PostgreSQL 服務啟動失敗"
    exit 1
  fi
else
  echo "   ✅ PostgreSQL 已運行"
fi
echo ""

echo "3️⃣  啟動 Redis 服務 (${REDIS_WINDOWS_SERVICE_NAME})..."
if ! is_port_listening "$REDIS_PORT"; then
  start_windows_service "$REDIS_WINDOWS_SERVICE_NAME"
  sleep 3
  if is_port_listening "$REDIS_PORT"; then
    echo "   ✅ Redis 已啟動"
  else
    echo "   ❌ Redis 服務啟動失敗"
    exit 1
  fi
else
  echo "   ✅ Redis 已運行"
fi

echo "   🧹 清除 Redis 快取..."
if command -v redis-cli >/dev/null 2>&1; then
  redis-cli FLUSHALL >/dev/null 2>&1 || redis-cli.exe FLUSHALL >/dev/null 2>&1 || true
  echo "   ✅ Redis 快取已清除"
else
  echo "   ⚠️  找不到 redis-cli，跳過快取清除"
fi
echo ""

echo "4️⃣  檢查端口衝突..."
stop_processes_on_port "$FRONTEND_PORT"
stop_processes_on_port "$BACKEND_PORT"
echo "   ✅ 端口檢查完成"
echo ""

echo "5️⃣  配置環境變數..."
export REACT_APP_PORT=${FRONTEND_PORT}
export REACT_APP_SERVER_BASE_URL=${BACKEND_URL}
export VITE_HOST=0.0.0.0
export NODE_PORT=${BACKEND_PORT}
export PG_DATABASE_URL=${POSTGRES_URL}
export REDIS_URL=${REDIS_URL}
export APP_SECRET=${APP_SECRET}
export NODE_ENV=${NODE_ENV}
export SERVER_URL=${BACKEND_URL}
export FRONTEND_URL=${FRONTEND_URL}
export IS_MULTIWORKSPACE_ENABLED=${IS_MULTIWORKSPACE_ENABLED}
export IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=${IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS}
export DEFAULT_SUBDOMAIN=${DEFAULT_SUBDOMAIN}
export SIGN_IN_PREFILLED=${SIGN_IN_PREFILLED}
export EMAIL_DRIVER=${EMAIL_DRIVER}
export EMAIL_SMTP_HOST=${EMAIL_SMTP_HOST}
export EMAIL_SMTP_PORT=${EMAIL_SMTP_PORT}
export EMAIL_SMTP_USER=${EMAIL_SMTP_USER}
export EMAIL_SMTP_PASSWORD=${EMAIL_SMTP_PASSWORD}
export EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS}
export EMAIL_FROM_NAME=${EMAIL_FROM_NAME}
export IS_BILLING_ENABLED=${IS_BILLING_ENABLED}
export BILLING_STRIPE_API_KEY=${BILLING_STRIPE_API_KEY}
export BILLING_STRIPE_BASE_PLAN_PRODUCT_ID=${BILLING_STRIPE_BASE_PLAN_PRODUCT_ID}
echo "   ✅ 環境變數已設置"
echo "   📋 關鍵配置："
echo "      FRONTEND_URL: ${FRONTEND_URL}"
echo "      SERVER_URL: ${SERVER_URL}"
echo "      DEFAULT_SUBDOMAIN: ${DEFAULT_SUBDOMAIN}"
echo "      IS_MULTIWORKSPACE_ENABLED: ${IS_MULTIWORKSPACE_ENABLED}"
echo ""

echo "5️⃣.5 清理孤立數據..."
CURRENT_WORKSPACE_ID=$(psql "${POSTGRES_URL}" -t -c "SELECT id FROM core.workspace LIMIT 1;" 2>/dev/null | xargs)
if [ -n "${CURRENT_WORKSPACE_ID}" ]; then
  echo "   🧹 清理孤立的 dataSource、metadata、workspaceMigration..."
  psql "${POSTGRES_URL}" >/dev/null 2>&1 <<EOF
DELETE FROM core."dataSource" WHERE "workspaceId" NOT IN (SELECT id FROM core.workspace);
DELETE FROM core."objectMetadata" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."fieldMetadata" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."indexMetadata" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core.view WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."viewField" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."viewFilter" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."viewGroup" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."viewSort" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."viewFilterGroup" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."workspaceMigration" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."featureFlag" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core.webhook WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."serverlessFunction" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."pageLayout" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."pageLayoutTab" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
DELETE FROM core."pageLayoutWidget" WHERE "workspaceId" != '${CURRENT_WORKSPACE_ID}';
EOF
  echo "   ✅ 孤立數據已清理"
fi
echo ""

echo "5️⃣.6 運行數據庫遷移..."
if npx nx run twenty-server:database:migrate:prod > twenty_migration.log 2>&1; then
  echo "   ✅ 數據庫遷移完成"
  if grep -q "migration" twenty_migration.log 2>/dev/null; then
    echo "   📋 已執行的遷移："
    grep -i "migration" twenty_migration.log | tail -5 || echo "      （數據庫已是最新版本）"
  else
    echo "   ℹ️  數據庫已是最新版本"
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
  exit 1
fi
echo ""

echo "6️⃣  清除 Nx 快取..."
npx nx reset >/dev/null 2>&1
echo "   ✅ Nx 快取已清除"
echo ""

echo "7️⃣  啟動 Twenty CRM 服務..."
cd "${SCRIPT_DIR}"
if [ -f "twenty.log" ]; then
  mv twenty.log "twenty.log.$(date +%Y%m%d_%H%M%S).bak" 2>/dev/null || true
fi

if [ "${NODE_ENV}" = "production" ]; then
  echo "   🚀 Production 模式：先 build 再啟動"
  echo "   🌐 Compiling i18n translations..."
  npx nx run-many -t lingui:compile -p twenty-front twenty-server
  echo "   📦 Building frontend and backend..."
  npx nx run-many -t build -p twenty-server twenty-front
  echo "   🔧 啟動後端服務..."
  nohup bash -c "cd packages/twenty-server && node dist/src/main.js" > twenty_backend.log 2>&1 &
  echo "   🌐 啟動前端服務..."
  nohup npx serve packages/twenty-front/build -l ${FRONTEND_PORT} -s > twenty_frontend.log 2>&1 &
  echo "   📝 日誌文件：twenty_backend.log, twenty_frontend.log"
else
  echo "   🔧 Development 模式：使用熱重載"
  nohup bash -c "npx nx run-many -t start -p twenty-server twenty-front" > twenty.log 2>&1 &
  echo "   📝 日誌文件：twenty.log"
fi

echo "   ⏳ 等待後端啟動..."
sleep 5

echo "8️⃣  等待後端 API 完全就緒..."
MAX_WAIT=60
WAITED=0
BACKEND_READY=false
while [ $WAITED -lt $MAX_WAIT ]; do
  if is_port_listening "$BACKEND_PORT"; then
    echo "   ✅ 後端 API 端口已監聽 (${BACKEND_PORT})"
    BACKEND_READY=true
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
  echo "   ⏳ 等待後端啟動... ($WAITED/$MAX_WAIT 秒)"
done

if [ "${BACKEND_READY}" = false ]; then
  echo "   ❌ 後端啟動超時！"
  echo ""
  echo "📋 錯誤日誌："
  if [ -f twenty.log ]; then
    tail -30 twenty.log
  elif [ -f twenty_backend.log ]; then
    tail -30 twenty_backend.log
  fi
  echo ""
  echo "💡 可能原因："
  echo "   1. 資料庫連接失敗"
  echo "   2. 環境變數配置錯誤"
  echo "   3. 端口被佔用"
  exit 1
fi

echo "   ⏳ 等待後端初始化完成..."
sleep 5

if curl -s "http://localhost:${BACKEND_PORT}/healthz" >/dev/null 2>&1; then
  echo "   ✅ 後端健康檢查通過"
elif curl -s "http://localhost:${BACKEND_PORT}/client-config" >/dev/null 2>&1; then
  echo "   ✅ 後端 API 可訪問"
else
  echo "   ⚠️  後端可能未完全就緒，但繼續啟動..."
fi
echo ""

echo "   🔄 同步 Workspace Metadata..."
if npx nx run twenty-server:command workspace:sync-metadata >> twenty.log 2>&1; then
  echo "   ✅ Metadata 同步完成"
else
  echo "   ⚠️  Metadata 同步失敗，可稍後手動重試"
  echo "   💡 手動命令: npx nx run twenty-server:command workspace:sync-metadata"
fi
echo ""

if [ "${AUTO_CLEAN_ORPHAN_VIEWS}" = "true" ]; then
  echo "   🧽 自動清理孤兒 Views 與對應 Favorites..."
  PORT=${POSTGRES_PORT:-5432}
  DB=${POSTGRES_DB:-default}
  USER=${POSTGRES_USER:-postgres}
  PASS=${POSTGRES_PASSWORD:-postgres}
  export PGPASSWORD="$PASS"
  WORKSPACE_SCHEMAS=$(psql -h localhost -p "$PORT" -U "$USER" -d "$DB" -At -c "SELECT nspname FROM pg_namespace WHERE nspname LIKE 'workspace_%' ORDER BY nspname;" 2>/dev/null || echo "")
  if [ -z "$WORKSPACE_SCHEMAS" ]; then
    echo "   ℹ️  未找到任何 workspace_* schema"
  else
    for WS in $WORKSPACE_SCHEMAS; do
      echo "   → 檢查 $WS"
      COUNT_VIEWS=$(psql -h localhost -p "$PORT" -U "$USER" -d "$DB" -At -c "SELECT COUNT(*) FROM \"$WS\".\"view\" v LEFT JOIN \"$WS\".\"objectMetadata\" o ON o.id = v.\"objectMetadataId\" WHERE o.id IS NULL;" 2>/dev/null || echo "0")
      COUNT_FAVS=$(psql -h localhost -p "$PORT" -U "$USER" -d "$DB" -At -c "SELECT COUNT(*) FROM \"$WS\".\"favorite\" f JOIN \"$WS\".\"view\" v ON v.id = f.\"viewId\" LEFT JOIN \"$WS\".\"objectMetadata\" o ON o.id = v.\"objectMetadataId\" WHERE o.id IS NULL;" 2>/dev/null || echo "0")
      echo "      預計刪除 Views: $COUNT_VIEWS, Favorites: $COUNT_FAVS"
      if [ "$COUNT_VIEWS" != "0" ] || [ "$COUNT_FAVS" != "0" ]; then
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

echo "9️⃣  等待前端 Web 就緒..."
MAX_WAIT=60
WAITED=0
FRONTEND_READY=false
while [ $WAITED -lt $MAX_WAIT ]; do
  if is_port_listening "$FRONTEND_PORT"; then
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

if [ "${FRONTEND_READY}" = false ]; then
  echo "   ⚠️  前端啟動超時，但可能仍在編譯中..."
fi
echo ""

echo "🔟 註冊 Cron Jobs..."
sleep 5
if npx nx run twenty-server:command cron:register:all >> twenty.log 2>&1; then
  echo "   ✅ Cron Jobs 已成功註冊"
else
  echo "   ⚠️  Cron Jobs 註冊失敗，可稍後手動執行"
  echo "   💡 命令: npx nx run twenty-server:command cron:register:all"
fi
echo ""

echo "1️⃣1️⃣  啟動 Worker 服務..."
if [ "${NODE_ENV}" = "production" ]; then
  echo "   🚀 Production 模式：運行編譯後的 Worker"
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
if ps -p $WORKER_PID >/dev/null 2>&1; then
  echo "   ✅ Worker 已啟動 (PID: $WORKER_PID)"
else
  echo "   ⚠️  Worker 可能啟動失敗，請檢查日誌"
fi
echo ""

echo "1️⃣2️⃣  驗證多租戶配置..."
sleep 5
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
    echo "   建議重新啟動服務或檢查環境變數"
  else
    echo "   ✅ 配置正確"
  fi
else
  echo "   ⏳ 無法驗證配置（服務可能仍在啟動）"
fi
echo ""

echo "1️⃣3️⃣ 啟動後健康檢查..."
echo "   ⏳ 等待服務穩定（10 秒）..."
sleep 10

echo "   🔍 檢查 Worker 進程..."
WORKER_PID=$(powershell.exe -NoProfile -Command "(Get-Process -Name 'node' -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*queue-worker*' } | Select-Object -ExpandProperty Id -First 1)" | tr -d '\r ')
if [ -n "$WORKER_PID" ]; then
  echo "   ✅ Worker 正在運行（PID: $WORKER_PID）"
else
  echo "   ❌ Worker 未運行！"
fi

echo ""
echo "   🔍 檢查 Cron Jobs 註冊狀態..."
CRON_JOBS=$(redis-cli keys "bull:cron-queue:repeat:*CronJob" 2>/dev/null | wc -l | tr -d ' ')
if [ "$CRON_JOBS" -gt 0 ]; then
  echo "   ✅ 已註冊 $CRON_JOBS 個 Cron Jobs"
  redis-cli keys "bull:cron-queue:repeat:*CronJob" 2>/dev/null | while read -r key; do
    JOB_NAME=$(echo "$key" | sed 's/bull:cron-queue:repeat://;s/:[0-9]*$//')
    echo "      - $JOB_NAME"
  done | head -5
else
  echo "   ⚠️  未找到 Cron Jobs"
fi

echo ""
echo "   🔍 檢查 Workflow Schedule Cron Job..."
WORKFLOW_CRON=$(redis-cli exists "bull:cron-queue:repeat:WorkflowCronTriggerCronJob" 2>/dev/null)
if [ "$WORKFLOW_CRON" = "1" ]; then
  PATTERN=$(redis-cli hget "bull:cron-queue:repeat:WorkflowCronTriggerCronJob" "pattern" 2>/dev/null)
  echo "   ✅ WorkflowCronTriggerCronJob 已註冊（執行頻率: $PATTERN）"
else
  echo "   ❌ WorkflowCronTriggerCronJob 未註冊！"
fi

echo ""
echo "   🔍 檢查卡住的 Workflow Runs..."
if command -v psql >/dev/null 2>&1; then
  STUCK_WORKFLOWS=$(PGPASSWORD=${POSTGRES_PASSWORD:-postgres} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "SELECT COUNT(*) FROM workspace_1wgvd1injqtife6y4rvfbu3h5.\"workflowRun\" WHERE status = 'RUNNING' AND \"deletedAt\" IS NULL AND \"startedAt\" < NOW() - INTERVAL '1 hour';" 2>/dev/null | tr -d ' ')
  if [ -n "$STUCK_WORKFLOWS" ] && [ "$STUCK_WORKFLOWS" -gt 0 ]; then
    echo "   ⚠️  發現 $STUCK_WORKFLOWS 個可能卡住的 Workflow Runs"
  else
    echo "   ✅ 沒有卡住的 Workflow Runs"
  fi
else
  echo "   ⏭️  跳過（psql 未安裝）"
fi

echo ""
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
