#!/bin/bash

source "$(dirname "$0")/twenty-config.sh"

echo "🛑 停止 Twenty CRM 本地服务..."
echo "=========================================="
echo ""

# ==========================================
# 停止顺序（从上到下）：
# 1. Worker（依赖后端）
# 2. 前端 Web（依赖后端 API）
# 3. 后端 API（依赖数据库和 Redis）
# 4. Redis（缓存服务）
# 5. PostgreSQL（数据库服务）
# ==========================================

# 步骤 1: 停止 Worker
echo "1️⃣  停止 Worker 服务..."
pkill -f "twenty-server:worker"
sleep 1
echo "   ✅ Worker 已停止"
echo ""

# 步骤 2: 停止前端 Web
echo "2️⃣  停止前端 Web 服务..."
if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    lsof -ti:${FRONTEND_PORT} | xargs kill -9 2>/dev/null
    echo "   ✅ 前端 Web 已停止（端口 ${FRONTEND_PORT}）"
else
    echo "   ℹ️  前端 Web 未运行"
fi
echo ""

# 步骤 3: 停止后端 API
echo "3️⃣  停止后端 API 服务..."
if lsof -Pi :${BACKEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null
    echo "   ✅ 后端 API 已停止（端口 ${BACKEND_PORT}）"
else
    echo "   ℹ️  后端 API 未运行"
fi
echo ""

# 停止所有其他 Twenty 相关进程
pkill -f "yarn start"
pkill -f "nx run"
pkill -f "vite"
pkill -f "nest start"
sleep 2
echo ""

# 步骤 4: 停止 Redis
echo "4️⃣  停止 Redis..."
if lsof -Pi :${REDIS_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    brew services stop redis
    sleep 2
    echo "   ✅ Redis 已停止（端口 ${REDIS_PORT}）"
else
    echo "   ℹ️  Redis 未运行"
fi
echo ""

# 步骤 5: 停止 PostgreSQL
echo "5️⃣  停止 PostgreSQL..."
if lsof -Pi :${POSTGRES_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    brew services stop postgresql@16
    sleep 2
    echo "   ✅ PostgreSQL 已停止（端口 ${POSTGRES_PORT}）"
else
    echo "   ℹ️  PostgreSQL 未运行"
fi
echo ""

echo "=========================================="
echo "✅ 所有 Twenty CRM 服务已完全停止！"
echo "=========================================="
echo ""
echo "💡 下次启动："
echo "   ./start_all_service_start.sh"
echo ""

