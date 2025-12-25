#!/bin/bash
# =============================================================================
# restore-from-aws.sh - 從 AWS 還原資料庫到本地環境
# =============================================================================
#
# 這個腳本會自動處理所有快取同步問題：
# 1. 從 AWS dump 最新資料庫
# 2. 清空本地資料庫
# 3. 還原資料
# 4. 清除 Redis 快取
# 5. 重啟服務
#
# 使用方式：
#   ./restore-from-aws.sh
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${DOCKER_DIR}/backups"

# AWS 連線資訊
AWS_HOST="52.195.151.185"
AWS_KEY="~/.ssh/y-crm-aws-key.pem"
AWS_USER="ubuntu"

# 本地容器名稱
LOCAL_POSTGRES="Y-CRM-postgres"
LOCAL_REDIS="Y-CRM-redis"
LOCAL_BACKEND="Y-CRM-backend"
LOCAL_WORKER="Y-CRM-worker"
LOCAL_FRONTEND="Y-CRM-frontend"

info() { printf '🔹 %s\n' "$1"; }
success() { printf '✅ %s\n' "$1"; }
error() { printf '❌ %s\n' "$1" >&2; }
warn() { printf '⚠️  %s\n' "$1"; }

check_local_containers() {
  info "檢查本地容器狀態..."

  if ! docker ps --format '{{.Names}}' | grep -q "^${LOCAL_POSTGRES}$"; then
    error "本地 PostgreSQL 容器未運行，請先執行 run-local.sh"
    exit 1
  fi

  if ! docker ps --format '{{.Names}}' | grep -q "^${LOCAL_REDIS}$"; then
    error "本地 Redis 容器未運行，請先執行 run-local.sh"
    exit 1
  fi

  success "本地容器正常運行"
}

dump_from_aws() {
  local backup_file="${BACKUP_DIR}/backup_aws_$(date +%Y%m%d_%H%M%S).dump"

  info "從 AWS dump 資料庫..."
  warn "這是唯讀操作，不會影響 AWS 任何資料"

  mkdir -p "${BACKUP_DIR}"

  if ssh -i "${AWS_KEY}" "${AWS_USER}@${AWS_HOST}" \
    "docker exec Y-CRM-postgres pg_dump -U postgres -Fc default" > "${backup_file}"; then
    success "Dump 完成: ${backup_file}"
    echo "${backup_file}"
  else
    error "Dump 失敗"
    exit 1
  fi
}

stop_app_services() {
  info "停止應用服務..."
  docker stop "${LOCAL_BACKEND}" "${LOCAL_WORKER}" "${LOCAL_FRONTEND}" 2>/dev/null || true
  success "應用服務已停止"
}

restore_database() {
  local backup_file="$1"

  info "清空本地資料庫..."
  docker exec "${LOCAL_POSTGRES}" psql -U postgres -c "DROP DATABASE IF EXISTS \"default\";"
  docker exec "${LOCAL_POSTGRES}" psql -U postgres -c "CREATE DATABASE \"default\";"

  info "還原資料庫..."
  docker exec -i "${LOCAL_POSTGRES}" pg_restore -U postgres -d default --clean --if-exists < "${backup_file}" 2>&1 || true

  success "資料庫還原完成"
}

clear_redis_cache() {
  info "清除 Redis 快取..."
  docker exec "${LOCAL_REDIS}" redis-cli FLUSHALL
  success "Redis 快取已清除"
}

start_app_services() {
  info "啟動應用服務..."
  cd "${DOCKER_DIR}"
  docker compose up -d backend worker frontend
  success "應用服務已啟動"
}

wait_for_backend() {
  info "等待 Backend 啟動..."
  local max_attempts=30
  local attempt=0

  while [ $attempt -lt $max_attempts ]; do
    if docker logs "${LOCAL_BACKEND}" 2>&1 | grep -q "Nest application successfully started"; then
      success "Backend 已就緒"
      return 0
    fi
    sleep 2
    attempt=$((attempt + 1))
    printf "."
  done

  warn "Backend 啟動超時，請手動檢查 logs"
}

main() {
  cat <<'EOF'
╔═══════════════════════════════════════════════════════════════╗
║           從 AWS 還原資料庫到本地環境                          ║
╠═══════════════════════════════════════════════════════════════╣
║  這個腳本會：                                                  ║
║  1. 從 AWS dump 最新資料（唯讀，不影響 AWS）                   ║
║  2. 清空並還原本地資料庫                                       ║
║  3. 清除 Redis 快取                                            ║
║  4. 重啟所有服務                                               ║
╚═══════════════════════════════════════════════════════════════╝

EOF

  read -r -p "確定要繼續嗎？ [y/N] " answer
  case "${answer}" in
    [yY]*) ;;
    *) echo "操作取消"; exit 0 ;;
  esac

  echo ""

  # Step 1: 檢查本地容器
  check_local_containers

  # Step 2: 從 AWS dump
  backup_file=$(dump_from_aws)

  # Step 3: 停止應用服務
  stop_app_services

  # Step 4: 還原資料庫
  restore_database "${backup_file}"

  # Step 5: 清除 Redis 快取
  clear_redis_cache

  # Step 6: 啟動服務
  start_app_services

  # Step 7: 等待 Backend
  wait_for_backend

  echo ""
  success "還原完成！"

  cat <<EOF

📋 後續步驟：
   1. 清除瀏覽器快取 (DevTools → Application → Clear site data)
   2. 重新登入 http://localhost:8866

📝 備份檔案位置：
   ${backup_file}

EOF
}

main "$@"
