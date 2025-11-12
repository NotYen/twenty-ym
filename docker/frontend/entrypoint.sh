#!/bin/sh
set -eu

TARGET_DIR="/usr/share/nginx/html"
PLACEHOLDER="@@SERVER_BASE_URL@@"

# Prefer BACKEND_PUBLIC_URL if provided, otherwise fall back to BACKEND_URL, then to default.
BACKEND_URL="${BACKEND_PUBLIC_URL:-${BACKEND_URL:-http://localhost:8867}}"

if [ -z "${BACKEND_URL}" ]; then
  echo "[entrypoint] BACKEND_URL is empty. Falling back to http://localhost:8867"
  BACKEND_URL="http://localhost:8867"
fi

echo "[entrypoint] Using backend URL: ${BACKEND_URL}"

if [ -d "${TARGET_DIR}" ]; then
  MATCHED_FILES=$(grep -rl "${PLACEHOLDER}" "${TARGET_DIR}" || true)
  if [ -n "${MATCHED_FILES}" ]; then
    echo "[entrypoint] Replacing placeholder in:"
    for file in ${MATCHED_FILES}; do
      echo "  - ${file}"
      sed -i "s|${PLACEHOLDER}|${BACKEND_URL}|g" "${file}"
    done
  else
    echo "[entrypoint] No placeholder (${PLACEHOLDER}) found. Skipping replacement."
  fi
else
  echo "[entrypoint] Target directory ${TARGET_DIR} not found."
fi

echo "[entrypoint] Starting nginx..."
exec nginx -g 'daemon off;'

