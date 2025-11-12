#!/bin/bash

set -euo pipefail

DEV_FLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(cd "${DEV_FLOW_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${DOCKER_DIR}/.." && pwd)"
ENV_LOCAL="${DOCKER_DIR}/env.local"
ENV_TARGET="${DOCKER_DIR}/.env"

DEFAULT_DATE="$(date +%Y%m%d)"
DEFAULT_BACKEND_VERSION="backend-${DEFAULT_DATE}-v1-amd64"
DEFAULT_FRONTEND_VERSION="frontend-${DEFAULT_DATE}-v1-amd64"

BACKEND_VERSION=""
FRONTEND_VERSION=""
PUSH_IMAGES=false

print_usage() {
  cat <<'EOF'
Usage: build-amd64-images.sh [options]

Options:
  --backend-version <tag>   Set backend image tag (default: backend-YYYYMMDD-v1-amd64)
  --frontend-version <tag>  Set frontend image tag (default: frontend-YYYYMMDD-v1-amd64)
  --push                    Push images to Docker Hub after build
  -h, --help                Show this help message

Examples:
  ./build-amd64-images.sh
  ./build-amd64-images.sh --backend-version backend-20251113-v2-amd64 --frontend-version frontend-20251113-v2-amd64 --push
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-version)
      BACKEND_VERSION="$2"
      shift 2
      ;;
    --frontend-version)
      FRONTEND_VERSION="$2"
      shift 2
      ;;
    --push)
      PUSH_IMAGES=true
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      print_usage
      exit 1
      ;;
  esac
done

if [[ ! -f "${ENV_LOCAL}" ]]; then
  echo "❌ Missing ${ENV_LOCAL}. Please create it before running this script." >&2
  exit 1
fi

cat <<EOF
📝 Applying env.local -> .env for build
EOF
cp "${ENV_LOCAL}" "${ENV_TARGET}"

prompt_for_version() {
  local prompt_message="$1"
  local default_value="$2"
  local input=""
  read -r -p "${prompt_message} [${default_value}]: " input
  if [[ -z "${input}" ]]; then
    echo "${default_value}"
  else
    echo "${input}"
  fi
}

BACKEND_VERSION="${BACKEND_VERSION:-$(prompt_for_version "Backend image tag" "${DEFAULT_BACKEND_VERSION}")}"
FRONTEND_VERSION="${FRONTEND_VERSION:-$(prompt_for_version "Frontend image tag" "${DEFAULT_FRONTEND_VERSION}")}"

cat <<EOF

Planned build:
  - Backend image : ycrm/y-crm:${BACKEND_VERSION}
  - Frontend image: ycrm/y-crm:${FRONTEND_VERSION}
  - Push after build: ${PUSH_IMAGES}

EOF

read -r -p "Proceed with build? [y/N] " confirm
case "${confirm}" in
  [yY]*) ;;
  *) echo "Operation cancelled."; exit 0 ;;
esac

build_backend() {
  echo "🛠️  Building backend image (linux/amd64)..."
  (
    cd "${PROJECT_ROOT}"
    docker buildx build \
      --platform linux/amd64 \
      --build-arg BACKEND_IMAGE_VERSION="${BACKEND_VERSION}" \
      -t "ycrm/y-crm:${BACKEND_VERSION}" \
      -f docker/backend/Dockerfile \
      --load \
      .
  )
  echo "✅ Backend image ready: ycrm/y-crm:${BACKEND_VERSION}"
}

build_frontend() {
  echo "🛠️  Building frontend image (linux/amd64)..."
  (
    cd "${PROJECT_ROOT}"
    docker buildx build \
      --platform linux/amd64 \
      --build-arg BACKEND_URL_PLACEHOLDER="@@SERVER_BASE_URL@@" \
      --build-arg FRONTEND_IMAGE_VERSION="${FRONTEND_VERSION}" \
      --build-arg VITE_IS_DEBUG_MODE=false \
      -t "ycrm/y-crm:${FRONTEND_VERSION}" \
      -f docker/frontend/Dockerfile \
      --load \
      .
  )
  echo "✅ Frontend image ready: ycrm/y-crm:${FRONTEND_VERSION}"
}

push_image() {
  local tag="$1"
  echo "📤 Pushing ycrm/y-crm:${tag}..."
  docker push "ycrm/y-crm:${tag}"
  echo "✅ Pushed ycrm/y-crm:${tag}"
}

build_backend
build_frontend

if [[ "${PUSH_IMAGES}" == true ]]; then
  push_image "${BACKEND_VERSION}"
  push_image "${FRONTEND_VERSION}"
fi

cat <<EOF

Build summary:
  Backend image : ycrm/y-crm:${BACKEND_VERSION}
  Frontend image: ycrm/y-crm:${FRONTEND_VERSION}

Next steps:
  1. Update your docker/.env file with:
       BACKEND_IMAGE_VERSION=${BACKEND_VERSION}
       FRONTEND_IMAGE_VERSION=${FRONTEND_VERSION}
  2. If you skipped --push, run "docker push" when ready.
  3. Use deploy-to-aws.sh to roll out the new images.
EOF

