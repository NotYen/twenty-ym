#!/bin/bash

set -euo pipefail

DEV_FLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(cd "${DEV_FLOW_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${DOCKER_DIR}/.." && pwd)"

BACKUPS_DIR="${DOCKER_DIR}/backups"
HISTORY_DIR="${BACKUPS_DIR}/history"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
PG_BACKUP_PATH="${HISTORY_DIR}/db-all-${TIMESTAMP}.sql"
REDIS_BACKUP_PATH="${HISTORY_DIR}/dump-${TIMESTAMP}.rdb"

POSTGRES_CONTAINER="Y-CRM-postgres"
REDIS_CONTAINER="Y-CRM-redis"

info() {
  printf '🔹 %s\n' "$1"
}

success() {
  printf '✅ %s\n' "$1"
}

error() {
  printf '❌ %s\n' "$1" >&2
}

ensure_container_running() {
  local container_name="$1"

  if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}\$"; then
    error "Container \"${container_name}\" is not running. Please start your local stack first."
    exit 1
  fi
}

main() {
  info "Starting local database backup (PostgreSQL + Redis)."

  ensure_container_running "${POSTGRES_CONTAINER}"
  ensure_container_running "${REDIS_CONTAINER}"

  mkdir -p "${HISTORY_DIR}"

  info "Backing up PostgreSQL from container \"${POSTGRES_CONTAINER}\"..."
  if ! docker exec "${POSTGRES_CONTAINER}" pg_dump \
    -U postgres \
    -d default \
    --no-owner \
    --no-acl > "${PG_BACKUP_PATH}"; then
    error "PostgreSQL backup failed."
    rm -f "${PG_BACKUP_PATH}"
    exit 1
  fi
  success "PostgreSQL backup saved to ${PG_BACKUP_PATH}"

  info "Backing up Redis from container \"${REDIS_CONTAINER}\"..."
  docker exec "${REDIS_CONTAINER}" redis-cli SAVE >/dev/null
  sleep 2
  if ! docker cp "${REDIS_CONTAINER}:/data/dump.rdb" "${REDIS_BACKUP_PATH}"; then
    error "Redis backup failed."
    rm -f "${PG_BACKUP_PATH}" "${REDIS_BACKUP_PATH}"
    exit 1
  fi
  success "Redis backup saved to ${REDIS_BACKUP_PATH}"

  if [[ -s "${PG_BACKUP_PATH}" && -s "${REDIS_BACKUP_PATH}" ]]; then
    success "Local backup completed successfully."
  else
    error "One of the backup files is empty. Please verify manually."
    exit 1
  fi

  cat <<EOF

📁 Backup summary
   - PostgreSQL: ${PG_BACKUP_PATH}
   - Redis     : ${REDIS_BACKUP_PATH}

You can now proceed with local testing or build amd64 images.
EOF
}

main "$@"

