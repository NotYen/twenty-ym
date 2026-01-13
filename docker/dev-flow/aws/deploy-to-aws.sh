#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_FLOW_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCKER_DIR="$(cd "${DEV_FLOW_DIR}/.." && pwd)"
ENV_LOCAL="${DEV_FLOW_DIR}/local_build_for_docker/env.local"
ENV_AWS="${SCRIPT_DIR}/env.aws"
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
  -h, --help              Show this help message

Example:
  ./deploy-to-aws.sh --backend-tag backend-20251113-v1-amd64 --frontend-tag frontend-20251113-v1-amd64
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

AWS_COMPOSE_PATH="${SCRIPT_DIR}/docker-compose.aws.yml"

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

This will update docker/dev-flow/aws/docker-compose.aws.yml and upload it to the server.
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

# Replace backend image tag (matches any tag starting with ycrm/y-crm: for backend/worker services)
perl -0pi -e "s|(backend:\s+image:\s*ycrm/y-crm:)[^\s]+|\${1}${BACKEND_TAG}|g" "${tmp_file}"
perl -0pi -e "s|(worker:\s+image:\s*ycrm/y-crm:)[^\s]+|\${1}${BACKEND_TAG}|g" "${tmp_file}"
perl -0pi -e "s|(frontend:\s+image:\s*ycrm/y-crm:)[^\s]+|\${1}${FRONTEND_TAG}|g" "${tmp_file}"

mv "${tmp_file}" "${AWS_COMPOSE_PATH}"
echo "✅ Updated ${AWS_COMPOSE_PATH}"

echo "📤 Uploading docker-compose.aws.yml to ${AWS_IP}..."
scp -i "${SSH_KEY}" "${AWS_COMPOSE_PATH}" "${AWS_USER}@${AWS_IP}:~/docker-compose.aws.yml"
echo "✅ Uploaded compose file."

echo "📤 Uploading .env to ${AWS_IP}..."
scp -i "${SSH_KEY}" "${ENV_TARGET}" "${AWS_USER}@${AWS_IP}:~/.env"
echo "✅ Uploaded .env file."

echo "🚀 Restarting services on AWS..."
ssh -i "${SSH_KEY}" "${AWS_USER}@${AWS_IP}" <<EOF
set -e
cd ~
docker compose -f docker-compose.aws.yml pull
docker compose -f docker-compose.aws.yml up -d
echo "⏳ Waiting for backend to initialize..."
sleep 10
echo "🔄 Running database migrations..."
docker compose -f docker-compose.aws.yml exec backend yarn database:migrate:prod
echo "🔄 Syncing workspace metadata..."
docker compose -f docker-compose.aws.yml exec backend yarn command:prod workspace:sync-metadata || true
echo "🔄 Seeding sales quote views for existing workspaces..."
docker compose -f docker-compose.aws.yml exec backend yarn command:prod workspace:seed-sales-quote-views || true
echo "🛑 Stopping backend and worker before cache clear..."
docker compose -f docker-compose.aws.yml stop backend worker
echo "🧹 Clearing Redis cache (feature flags, metadata, CRON jobs)..."
docker compose -f docker-compose.aws.yml exec redis redis-cli FLUSHALL || true
echo "✅ Redis cache cleared"
echo "🔄 Starting backend and worker with clean cache..."
docker compose -f docker-compose.aws.yml start backend worker
echo "⏳ Waiting for services to fully initialize (15 seconds)..."
sleep 15
echo "🔍 Checking backend health..."
docker compose -f docker-compose.aws.yml exec backend curl -f http://localhost:3000/healthz || echo "⚠️ Backend health check failed, but continuing..."
echo "🔄 Registering CRON jobs (workflow triggers, background sync)..."
docker compose -f docker-compose.aws.yml exec backend yarn command:prod cron:register:all || true
CRON_COUNT=\$(docker compose -f docker-compose.aws.yml exec redis redis-cli KEYS 'bull:cron-queue:repeat:*' 2>/dev/null | wc -l | tr -d ' ')
if [[ "\${CRON_COUNT}" -gt 0 ]]; then
  echo "✅ CRON jobs registered successfully (\${CRON_COUNT} jobs)"
else
  echo "⚠️ Warning: No CRON jobs found in Redis. Please check backend logs."
fi
echo "🧹 Cleaning up unused Docker images..."
docker image prune -af || true
echo "✅ Docker cleanup complete"
EOF
echo "✅ AWS services updated, migrations applied, cache cleared, and views seeded."

cat <<EOF

🎉 Deployment complete!
Remember to update any related documentation or release notes.
EOF
