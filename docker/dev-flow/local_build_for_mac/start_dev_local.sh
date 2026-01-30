#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_FLOW_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${DEV_FLOW_DIR}/../.." && pwd)"

ENV_LOCAL="${DEV_FLOW_DIR}/local_build_for_docker/env.local"

if [[ ! -f "${ENV_LOCAL}" ]]; then
  echo "❌ Missing ${ENV_LOCAL}. Please create it before running this script."
  exit 1
fi

# Load environment variables
set -a
source "${ENV_LOCAL}"
set +a

echo "🚀 Starting Y-CRM local development environment (non-Docker)"
echo ""
echo "📝 Configuration:"
echo "   Frontend URL: ${FRONTEND_URL}"
echo "   Backend URL: ${BACKEND_URL}"
echo "   Postgres: ${POSTGRES_URL}"
echo "   Redis: ${REDIS_URL}"
echo ""

# Check if PostgreSQL is running
if ! docker ps | grep -q Y-CRM-db; then
  echo "⚠️  PostgreSQL container not running. Starting it..."
  cd "${PROJECT_ROOT}/docker"
  docker compose up -d postgres
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 5
fi

# Check if Redis is running
if ! docker ps | grep -q Y-CRM-redis; then
  echo "⚠️  Redis container not running. Starting it..."
  cd "${PROJECT_ROOT}/docker"
  docker compose up -d redis
  echo "⏳ Waiting for Redis to be ready..."
  sleep 3
fi

echo ""
echo "✅ Infrastructure services ready"
echo ""

# Start backend in background
echo "🔧 Starting backend server..."
cd "${PROJECT_ROOT}/packages/twenty-server"

# Export all environment variables for backend
export NODE_ENV="${NODE_ENV}"
export IS_DEBUG_MODE="${IS_DEBUG_MODE}"
export SIGN_IN_PREFILLED="${SIGN_IN_PREFILLED}"
export APP_SECRET="${APP_SECRET}"
export FRONTEND_URL="${FRONTEND_URL}"
export BACKEND_URL="${BACKEND_URL}"
export SERVER_URL="${SERVER_URL}"
export BACKEND_PUBLIC_URL="${BACKEND_PUBLIC_URL}"
export POSTGRES_URL="${POSTGRES_URL}"
export PG_DATABASE_URL="${PG_DATABASE_URL}"
export REDIS_URL="${REDIS_URL}"
export IS_MULTIWORKSPACE_ENABLED="${IS_MULTIWORKSPACE_ENABLED}"
export IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS="${IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS}"
export DEFAULT_SUBDOMAIN="${DEFAULT_SUBDOMAIN}"
export PORT="${BACKEND_PORT}"

# Start backend
yarn start:dev > "${PROJECT_ROOT}/logs/backend-local.log" 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: ${BACKEND_PID}"
echo "   Logs: ${PROJECT_ROOT}/logs/backend-local.log"

# Wait for backend to start
echo "⏳ Waiting for backend to initialize (30 seconds)..."
sleep 30

# Start frontend in background
echo ""
echo "🎨 Starting frontend server..."
cd "${PROJECT_ROOT}/packages/twenty-front"

# Export frontend environment variables
export VITE_IS_DEBUG_MODE="${VITE_IS_DEBUG_MODE}"
export REACT_APP_SERVER_BASE_URL="${BACKEND_URL}"

yarn start > "${PROJECT_ROOT}/logs/frontend-local.log" 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: ${FRONTEND_PID}"
echo "   Logs: ${PROJECT_ROOT}/logs/frontend-local.log"

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Process IDs:"
echo "   Backend: ${BACKEND_PID}"
echo "   Frontend: ${FRONTEND_PID}"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: ${FRONTEND_URL}"
echo "   Backend: ${BACKEND_URL}"
echo ""
echo "📝 View logs:"
echo "   tail -f ${PROJECT_ROOT}/logs/backend-local.log"
echo "   tail -f ${PROJECT_ROOT}/logs/frontend-local.log"
echo ""
echo "🛑 To stop services, run:"
echo "   ${SCRIPT_DIR}/stop_dev_local.sh"
echo ""

# Save PIDs for stop script
echo "${BACKEND_PID}" > "${PROJECT_ROOT}/.backend-local.pid"
echo "${FRONTEND_PID}" > "${PROJECT_ROOT}/.frontend-local.pid"

echo "⏳ Services are starting up. Please wait 1-2 minutes before accessing the application."
