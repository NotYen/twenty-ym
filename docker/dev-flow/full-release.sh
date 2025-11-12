#!/bin/bash

set -euo pipefail

DEV_FLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKUP_SCRIPT="${DEV_FLOW_DIR}/backup-local-data.sh"
RUN_LOCAL_SCRIPT="${DEV_FLOW_DIR}/run-local.sh"
BUILD_SCRIPT="${DEV_FLOW_DIR}/build-amd64-images.sh"
DEPLOY_SCRIPT="${DEV_FLOW_DIR}/deploy-to-aws.sh"

AWS_IP_DEFAULT="52.195.151.185"

read_yes_no() {
  local prompt="$1"
  local default_answer="$2" # y or n
  local answer

  local suffix="[y/N]"
  if [[ "${default_answer}" == "y" ]]; then
    suffix="[Y/n]"
  fi

  while true; do
    read -r -p "${prompt} ${suffix} " answer
    answer="${answer:-${default_answer}}"
    case "${answer}" in
      [yY]|[yY][eE][sS]) return 0 ;;
      [nN]|[nN][oO]) return 1 ;;
    esac
    echo "Please answer yes or no."
  done
}

prompt_for_tag() {
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

cat <<'EOF'
🚀 Full release helper

Steps:
  1. Backup local PostgreSQL & Redis
  2. Rebuild local stack (docker compose up -d --build)
  3. Build linux/amd64 images (backend & frontend)
  4. Optionally push to Docker Hub
  5. Deploy to AWS (optionally sync data)
EOF
echo

if ! read_yes_no "Step 1: Run local backup now?" "y"; then
  echo "Skipping backup."
else
  "${BACKUP_SCRIPT}"
fi

if read_yes_no "Step 2: Rebuild local docker stack?" "y"; then
  "${RUN_LOCAL_SCRIPT}"
fi

DEFAULT_DATE="$(date +%Y%m%d)"
DEFAULT_BACKEND_TAG="backend-${DEFAULT_DATE}-v1-amd64"
DEFAULT_FRONTEND_TAG="frontend-${DEFAULT_DATE}-v1-amd64"

BACKEND_TAG="$(prompt_for_tag 'Backend image tag' "${DEFAULT_BACKEND_TAG}")"
FRONTEND_TAG="$(prompt_for_tag 'Frontend image tag' "${DEFAULT_FRONTEND_TAG}")"

PUSH_FLAG=""
if read_yes_no "Push images to Docker Hub after build?" "y"; then
  PUSH_FLAG="--push"
fi

"${BUILD_SCRIPT}" \
  --backend-version "${BACKEND_TAG}" \
  --frontend-version "${FRONTEND_TAG}" \
  ${PUSH_FLAG}

if ! read_yes_no "Deploy these images to AWS now?" "y"; then
  cat <<EOF

🎉 Build complete. You can deploy later with:
  ${DEPLOY_SCRIPT} --backend-tag ${BACKEND_TAG} --frontend-tag ${FRONTEND_TAG}

EOF
  exit 0
fi

read -r -p "AWS IP address [${AWS_IP_DEFAULT}]: " aws_ip_input
aws_ip_input="${aws_ip_input:-${AWS_IP_DEFAULT}}"

SYNC_FLAG=""
if read_yes_no "Synchronize local DB to AWS after deployment? (overwrites AWS data!)" "n"; then
  SYNC_FLAG="--sync-data"
fi

"${DEPLOY_SCRIPT}" \
  --backend-tag "${BACKEND_TAG}" \
  --frontend-tag "${FRONTEND_TAG}" \
  --aws-ip "${aws_ip_input}" \
  ${SYNC_FLAG}

cat <<EOF

✅ Full release flow completed.
EOF

