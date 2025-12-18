#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_FLOW_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCKER_DIR="$(cd "${DEV_FLOW_DIR}/.." && pwd)"

ENV_LOCAL="${DEV_FLOW_DIR}/local_build_for_docker/env.local"
ENV_TARGET="${DOCKER_DIR}/.env"
VERSIONS_FILE="${DOCKER_DIR}/versions.env"

# 載入統一版本設定
if [[ -f "${VERSIONS_FILE}" ]]; then
  source "${VERSIONS_FILE}"
  echo "📝 Loaded base image versions from versions.env"
  echo "   NODE_VERSION=${NODE_VERSION}"
  echo "   NGINX_VERSION=${NGINX_VERSION}"
else
  echo "❌ versions.env not found, using defaults"
  NODE_VERSION="24-alpine"
  NGINX_VERSION="1.27-alpine"
fi
LOCAL_FRONTEND_PORT=8866
LOG_DIR="${DOCKER_DIR}/../logs"
mkdir -p "${LOG_DIR}"
BUILD_LOG="${LOG_DIR}/docker-build.log"

info() {
  printf '🔹 %s\n' "$1"
}

success() {
  printf '✅ %s\n' "$1"
}

error() {
  printf '❌ %s\n' "$1" >&2
}

# 修復版：直接輸出到終端，可以看到即時進度
build_service() {
  local service="$1"
  local start_time=$(date +%s)

  echo "⏳ Building ${service}..."
  echo ""

  # 直接執行並輸出到終端（同時保存到 log）
  if docker compose build "$service" 2>&1 | tee "$BUILD_LOG"; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo ""
    success "${service} built in ${duration}s"
    return 0
  else
    echo ""
    error "${service} build failed. Check ${BUILD_LOG} for details."
    return 1
  fi
}

main() {
  cat <<'EOF'
🧪 Local stack rebuild
This will rebuild and start the local Docker services defined in docker/docker-compose.yml.

⚠️  This will rebuild ALL services (frontend, backend, worker) from scratch.
⏱️  Expected time: 5-10 minutes depending on your machine.

Services to build:
  - backend  (NestJS API server)
  - worker   (Background job processor - uses backend image)
  - frontend (React Vite app)

EOF

  if [[ ! -f "${ENV_LOCAL}" ]]; then
    error "Missing ${ENV_LOCAL}. Please create it before running this script."
    exit 1
  fi

  read -r -p "Proceed with full rebuild? [y/N] " answer
  case "${answer}" in
    [yY]*) ;;
    *) echo "Operation cancelled."; exit 0 ;;
  esac

  info "Applying env.local -> .env"
  cp "${ENV_LOCAL}" "${ENV_TARGET}"

  # 確保版本變數也被加入到 .env 中
  info "Adding base image versions to .env"
  {
    echo ""
    echo "# Base image versions (from versions.env)"
    echo "NODE_VERSION=${NODE_VERSION}"
    echo "NGINX_VERSION=${NGINX_VERSION}"
    echo "POSTGRES_VERSION=${POSTGRES_VERSION}"
    echo "REDIS_VERSION=${REDIS_VERSION}"
  } >> "${ENV_TARGET}"

  cd "${DOCKER_DIR}"

  info "Stopping existing containers..."
  docker compose down 2>/dev/null || true

  echo ""
  info "Starting infrastructure services (postgres, redis)..."
  docker compose up -d postgres redis
  sleep 3
  success "Infrastructure ready"

  echo ""
  info "Building application services (this will take several minutes)..."
  echo "💡 Tip: Open another terminal and run 'tail -f ${BUILD_LOG}' to see detailed build logs"
  echo ""

  # Build backend (worker 使用同一個 image)
  build_service "backend" || exit 1

  echo ""
  # Build frontend
  build_service "frontend" || exit 1

  echo ""
  info "Starting all services..."
  docker compose up -d

  echo ""
  success "All services started!"

  cat <<EOF

📊 Check service status:
   docker compose ps

📝 View logs:
   docker compose logs -f backend
   docker compose logs -f frontend
   docker compose logs -f worker

🌐 Access the application:
   Frontend: http://localhost:${LOCAL_FRONTEND_PORT}
   Backend:  http://localhost:8867

⏳ Note: Services may take 1-2 minutes to become healthy after starting.

EOF
}

main "$@"
