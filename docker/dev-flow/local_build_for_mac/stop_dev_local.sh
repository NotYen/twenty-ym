#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

echo "🛑 Stopping Y-CRM local development environment"
echo ""

# Read PIDs
BACKEND_PID_FILE="${PROJECT_ROOT}/.backend-local.pid"
FRONTEND_PID_FILE="${PROJECT_ROOT}/.frontend-local.pid"

if [[ -f "${BACKEND_PID_FILE}" ]]; then
  BACKEND_PID=$(cat "${BACKEND_PID_FILE}")
  if ps -p "${BACKEND_PID}" > /dev/null 2>&1; then
    echo "🔧 Stopping backend (PID: ${BACKEND_PID})..."
    kill "${BACKEND_PID}" || true
    echo "   ✅ Backend stopped"
  else
    echo "   ⚠️  Backend process not found"
  fi
  rm -f "${BACKEND_PID_FILE}"
else
  echo "   ⚠️  Backend PID file not found"
fi

if [[ -f "${FRONTEND_PID_FILE}" ]]; then
  FRONTEND_PID=$(cat "${FRONTEND_PID_FILE}")
  if ps -p "${FRONTEND_PID}" > /dev/null 2>&1; then
    echo "🎨 Stopping frontend (PID: ${FRONTEND_PID})..."
    kill "${FRONTEND_PID}" || true
    echo "   ✅ Frontend stopped"
  else
    echo "   ⚠️  Frontend process not found"
  fi
  rm -f "${FRONTEND_PID_FILE}"
else
  echo "   ⚠️  Frontend PID file not found"
fi

# Kill any remaining node processes for twenty
echo ""
echo "🧹 Cleaning up any remaining processes..."
pkill -f "twenty-server" || true
pkill -f "twenty-front" || true

echo ""
echo "✅ All services stopped"
