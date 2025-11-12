#!/bin/bash

set -euo pipefail

DEV_FLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(cd "${DEV_FLOW_DIR}/.." && pwd)"
SYNC_DIR="${DOCKER_DIR}/Sync-to-AWS"
ENV_LOCAL="${DOCKER_DIR}/env.local"
ENV_AWS="${DOCKER_DIR}/env.aws"
ENV_TARGET="${DOCKER_DIR}/.env"
RESTORE_ENV=false

AWS_IP_DEFAULT="52.195.151.185"
AWS_USER_DEFAULT="ubuntu"
SSH_KEY_DEFAULT="${HOME}/.ssh/y-crm-aws-key.pem"

BACKEND_TAG=""
FRONTEND_TAG=""
AWS_IP="${AWS_IP_DEFAULT}"
AWS_USER="${AWS_USER_DEFAULT}"
SSH_KEY="${SSH_KEY_DEFAULT}"
SYNC_DATA=false

cleanup() {
  if [[ "${RESTORE_ENV}" == true && -f "${ENV_LOCAL}" ]]; then
    cp "${ENV_LOCAL}" "${ENV_TARGET}"
    echo "🔁 Restored .env from env.local"
  fi
  rm -f "${ENV_TARGET}.backup" 2>/dev/null || true
}

trap cleanup EXIT

print_usage() {
  cat <<'EOF'
Usage: deploy-to-aws.sh --backend-tag <tag> --frontend-tag <tag> [options]

Options:
  --backend-tag <tag>     Backend image tag (required)
  --frontend-tag <tag>    Frontend image tag (required)
  --aws-ip <ip>           AWS host (default: 52.195.151.185)
  --aws-user <user>       SSH user (default: ubuntu)
  --ssh-key <path>        SSH private key (default: ~/.ssh/y-crm-aws-key.pem)
  --sync-data             Run synchronization script after deployment
  -h, --help              Show this help message

Example:
  ./deploy-to-aws.sh --backend-tag backend-20251113-v1-amd64 --frontend-tag frontend-20251113-v1-amd64 --sync-data
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-tag)
      BACKEND_TAG="$2"
      shift 2
      ;;
    --frontend-tag)
      FRONTEND_TAG="$2"
      shift 2
      ;;
    --aws-ip)
      AWS_IP="$2"
      shift 2
      ;;
    --aws-user)
      AWS_USER="$2"
      shift 2
      ;;
    --ssh-key)
      SSH_KEY="$2"
      shift 2
      ;;
    --sync-data)
      SYNC_DATA=true
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

if [[ -z "${BACKEND_TAG}" || -z "${FRONTEND_TAG}" ]]; then
  echo "Error: --backend-tag and --frontend-tag are required." >&2
  print_usage
  exit 1
fi

if [[ ! -f "${SSH_KEY}" ]]; then
  echo "Error: SSH key not found at ${SSH_KEY}" >&2
  exit 1
fi

if [[ ! -f "${ENV_AWS}" ]]; then
  echo "Error: ${ENV_AWS} not found." >&2
  exit 1
fi

if [[ ! -f "${ENV_LOCAL}" ]]; then
  echo "Warning: ${ENV_LOCAL} not found. .env will not be restored automatically." >&2
fi

AWS_COMPOSE_PATH="${SYNC_DIR}/docker-compose.aws.yml"

if [[ ! -f "${AWS_COMPOSE_PATH}" ]]; then
  echo "Error: ${AWS_COMPOSE_PATH} not found." >&2
  exit 1
fi

cat <<EOF
🚀 AWS deployment plan
  Backend image : ycrm/y-crm:${BACKEND_TAG}
  Frontend image: ycrm/y-crm:${FRONTEND_TAG}
  AWS host      : ${AWS_USER}@${AWS_IP}
  SSH key       : ${SSH_KEY}
  Sync data     : ${SYNC_DATA}

This will update docker/Sync-to-AWS/docker-compose.aws.yml and upload it to the server.
EOF

read -r -p "Proceed? [y/N] " confirm
case "${confirm}" in
  [yY]*) ;;
  *) echo "Operation cancelled."; exit 0 ;;
esac

if [[ -f "${ENV_TARGET}" ]]; then
  echo "📝 Backing up current .env"
  cp "${ENV_TARGET}" "${ENV_TARGET}.backup" 2>/dev/null || true
fi

echo "🌐 Applying env.aws -> .env"
cp "${ENV_AWS}" "${ENV_TARGET}"
RESTORE_ENV=true

echo "🔄 Updating docker-compose.aws.yml with new tags..."
tmp_file="$(mktemp)"
cp "${AWS_COMPOSE_PATH}" "${tmp_file}"

perl -0pi -e "s|(image:\s*ycrm/y-crm:backend-)[^\s]+|\1${BACKEND_TAG}|g" "${tmp_file}"
perl -0pi -e "s|(image:\s*ycrm/y-crm:frontend-)[^\s]+|\1${FRONTEND_TAG}|g" "${tmp_file}"

mv "${tmp_file}" "${AWS_COMPOSE_PATH}"
echo "✅ Updated ${AWS_COMPOSE_PATH}"

echo "📤 Uploading docker-compose.aws.yml to ${AWS_IP}..."
scp -i "${SSH_KEY}" "${AWS_COMPOSE_PATH}" "${AWS_USER}@${AWS_IP}:~/docker-compose.aws.yml"
echo "✅ Uploaded compose file."

echo "🚀 Restarting services on AWS..."
ssh -i "${SSH_KEY}" "${AWS_USER}@${AWS_IP}" <<EOF
set -e
cd ~
docker compose -f docker-compose.aws.yml pull
docker compose -f docker-compose.aws.yml up -d
EOF
echo "✅ AWS services updated."

if [[ "${SYNC_DATA}" == true ]]; then
  echo "🔁 Synchronizing local data to AWS..."
  SYNC_SCRIPT="${SYNC_DIR}/同步本地資料到AWS.sh"
  if [[ ! -x "${SYNC_SCRIPT}" ]]; then
    echo "Error: ${SYNC_SCRIPT} not found or not executable." >&2
    exit 1
  fi
  "${SYNC_SCRIPT}" "${AWS_IP}"
fi

cat <<EOF

🎉 Deployment complete!
Remember to update any related documentation or release notes.
EOF

