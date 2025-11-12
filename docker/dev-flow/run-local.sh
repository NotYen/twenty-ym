#!/bin/bash

set -euo pipefail

DEV_FLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(cd "${DEV_FLOW_DIR}/.." && pwd)"

COMMAND="docker compose up -d --build"
ENV_LOCAL="${DOCKER_DIR}/env.local"
ENV_TARGET="${DOCKER_DIR}/.env"
LOCAL_FRONTEND_PORT=8866

info() {
  printf '🔹 %s\n' "$1"
}

main() {
  cat <<'EOF'
🧪 Local stack rebuild
This will rebuild and start the local Docker services defined in docker/docker-compose.yml.

EOF

  if [[ ! -f "${ENV_LOCAL}" ]]; then
    echo "❌ Missing ${ENV_LOCAL}. Please create it before running this script." >&2
    exit 1
  fi

  read -r -p "Proceed with \"${COMMAND}\"? [y/N] " answer
  case "${answer}" in
    [yY]*) ;;
    *) echo "Operation cancelled."; exit 0 ;;
  esac

  info "Applying env.local -> .env"
  cp "${ENV_LOCAL}" "${ENV_TARGET}"

  info "Running docker compose build & up..."
  (
    cd "${DOCKER_DIR}"
    ${COMMAND}
  )

  info "Services are rebuilding in the background. Use \"docker compose ps\" to check status."
  cat <<EOF

Next steps:
  - Wait for containers to become healthy.
  - Access the frontend at http://localhost:${LOCAL_FRONTEND_PORT}
  - When satisfied, proceed to build the linux/amd64 images.
EOF
}

main "$@"

