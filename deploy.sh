#!/bin/bash

# ==========================================
# Twenty CRM 完整部署脚本
# ==========================================
# 功能：
# - 从 Git 拉取最新代码
# - 安装/更新依赖
# - 运行数据库 migrations
# - 停止旧服务
# - 启动新服务
# ==========================================
# 使用时机：
# 1. ✅ 从 Git 拉取新代码后（git pull）
# 2. ✅ Merge 新分支后（git merge）
# 3. ✅ 切换到新的 Git 提交后（git checkout）
# 4. ✅ 数据库 schema 有变化时
# 5. ✅ 首次部署到新服务器时
# 
# ❌ 不需要使用的情况：
# - 仅重启服务（使用 ./start_all_service_start.sh）
# - 修改配置文件后（使用 ./stop-twenty-local.sh && ./start_all_service_start.sh）
# ==========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 加载配置文件
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/twenty-config.sh"

echo ""
echo "=========================================="
echo "🚀 Twenty CRM 完整部署流程"
echo "=========================================="
echo ""

# ==========================================
# 步骤 0: 部署前确认
# ==========================================
echo "⚠️  部署前确认"
echo "----------------------------------------"
echo "此脚本将执行以下操作："
echo "  1. 从 Git 拉取最新代码"
echo "  2. 安装/更新依赖包"
echo "  3. 运行数据库 migrations"
echo "  4. 重新构建前端和后端"
echo "  5. 重启所有服务"
echo ""
echo -e "${YELLOW}⏳ 预计耗时：5-10 分钟${NC}"
echo ""

# 询问用户是否继续
read -p "确认继续部署？[y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 部署已取消"
    exit 0
fi
echo ""

# ==========================================
# 步骤 1: 检查 Git 状态
# ==========================================
echo "1️⃣  检查 Git 状态..."

# 检查是否在 Git 仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}   ❌ 错误：当前目录不是 Git 仓库${NC}"
    exit 1
fi

# 记录当前 Git 提交
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "   📍 当前分支：${CURRENT_BRANCH}"
echo "   📍 当前提交：${CURRENT_COMMIT}"

# 检查是否有未提交的修改
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}   ⚠️  警告：有未提交的修改${NC}"
    echo ""
    git status --short
    echo ""
    read -p "   继续部署会覆盖这些修改，确认继续？[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   💡 建议：先提交或暂存修改"
        echo "      git stash       # 暂存修改"
        echo "      git commit -am  # 提交修改"
        exit 0
    fi
fi

echo "   ✅ Git 状态检查通过"
echo ""

# ==========================================
# 步骤 2: 拉取最新代码
# ==========================================
echo "2️⃣  拉取最新代码..."

# 备份当前提交信息
echo "   📦 备份当前提交：${CURRENT_COMMIT}"

# 拉取最新代码
if git pull origin ${CURRENT_BRANCH}; then
    NEW_COMMIT=$(git rev-parse --short HEAD)
    
    if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
        echo "   ✅ 代码已是最新（${NEW_COMMIT}）"
    else
        echo "   ✅ 代码已更新：${CURRENT_COMMIT} → ${NEW_COMMIT}"
        
        # 显示更新日志
        echo ""
        echo "   📋 更新内容："
        git log --oneline --no-decorate ${CURRENT_COMMIT}..${NEW_COMMIT} | head -10 | sed 's/^/      /'
        echo ""
    fi
else
    echo -e "${RED}   ❌ Git pull 失败${NC}"
    echo "   💡 可能原因："
    echo "      - 网络连接问题"
    echo "      - 有冲突需要解决"
    exit 1
fi
echo ""

# ==========================================
# 步骤 3: 安装/更新依赖
# ==========================================
echo "3️⃣  检查并更新依赖..."

# 检查 yarn.lock 是否有变化
if git diff ${CURRENT_COMMIT}..${NEW_COMMIT} --name-only | grep -q "yarn.lock"; then
    echo "   🔄 yarn.lock 有变化，正在更新依赖..."
    
    if yarn install; then
        echo "   ✅ 依赖更新成功"
    else
        echo -e "${RED}   ❌ 依赖安装失败${NC}"
        exit 1
    fi
else
    echo "   ✅ 依赖无变化，跳过安装"
fi
echo ""

# ==========================================
# 步骤 4: 检查并运行 Migrations
# ==========================================
echo "4️⃣  检查数据库 migrations..."

# 检查是否有新的 migration 文件
NEW_MIGRATIONS=$(git diff ${CURRENT_COMMIT}..${NEW_COMMIT} --name-only | grep -c "migrations/" || true)

if [ "$NEW_MIGRATIONS" -gt 0 ]; then
    echo "   🔄 发现 ${NEW_MIGRATIONS} 个新的 migration 文件"
    echo "   📦 正在运行 migrations..."
    
    # 运行 migrations
    if npx nx database:migrate twenty-server; then
        echo "   ✅ Migrations 执行成功"
        
        # 显示已执行的 migrations
        echo ""
        echo "   📋 最近执行的 migrations："
        psql -U twenty -d default -t -c "SELECT name, \"executedAt\" FROM core._typeorm_migrations ORDER BY \"executedAt\" DESC LIMIT 5;" 2>/dev/null | sed 's/^/      /' || true
        echo ""
    else
        echo -e "${RED}   ❌ Migrations 执行失败！${NC}"
        echo ""
        echo "   💡 可能原因："
        echo "      - 数据库连接失败"
        echo "      - Migration 脚本有错误"
        echo "      - 数据库权限不足"
        echo ""
        echo "   🔧 修复建议："
        echo "      1. 检查数据库是否运行：lsof -Pi :5432"
        echo "      2. 查看 migration 日志"
        echo "      3. 手动运行：npx nx database:migrate twenty-server"
        exit 1
    fi
else
    echo "   ✅ 无新的 migrations，跳过"
fi
echo ""

# ==========================================
# 步骤 5: 停止旧服务
# ==========================================
echo "5️⃣  停止旧服务..."

if [ -f "./stop-twenty-local.sh" ]; then
    if ./stop-twenty-local.sh; then
        echo "   ✅ 旧服务已停止"
    else
        echo -e "${YELLOW}   ⚠️  停止服务时出现警告，但继续部署...${NC}"
    fi
else
    echo "   ⚠️  停止脚本不存在，手动停止服务..."
    
    # 手动停止服务
    pkill -f "twenty-server" || true
    pkill -f "twenty-front" || true
    pkill -f "serve.*twenty-front" || true
    
    echo "   ✅ 服务已停止"
fi
echo ""

# ==========================================
# 步骤 6: 清理缓存（可选）
# ==========================================
echo "6️⃣  清理缓存..."

# 清理 Nx 缓存
if command -v npx &> /dev/null; then
    echo "   🧹 清理 Nx 缓存..."
    npx nx reset > /dev/null 2>&1
    echo "   ✅ Nx 缓存已清除"
fi

# 清理 Redis 缓存
if command -v redis-cli &> /dev/null && lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   🧹 清理 Redis 缓存..."
    redis-cli FLUSHALL > /dev/null 2>&1
    echo "   ✅ Redis 缓存已清除"
fi

echo ""

# ==========================================
# 步骤 7: 启动新服务
# ==========================================
echo "7️⃣  启动新服务..."

if [ -f "./start_all_service_start.sh" ]; then
    echo "   🚀 正在启动 Twenty CRM..."
    echo ""
    
    # 执行启动脚本
    if ./start_all_service_start.sh; then
        echo ""
        echo "   ✅ 服务启动成功"
    else
        echo -e "${RED}   ❌ 服务启动失败${NC}"
        echo ""
        echo "   💡 查看日志："
        echo "      tail -50 twenty.log"
        echo "      tail -50 twenty_backend.log"
        echo "      tail -50 twenty_frontend.log"
        exit 1
    fi
else
    echo -e "${RED}   ❌ 启动脚本不存在：./start_all_service_start.sh${NC}"
    exit 1
fi
echo ""

# ==========================================
# 步骤 8: 部署后验证
# ==========================================
echo "8️⃣  部署后验证..."

# 等待服务稳定
echo "   ⏳ 等待服务稳定（10 秒）..."
sleep 10

# 验证后端 API
echo "   🔍 验证后端 API..."
if curl -s "http://localhost:${BACKEND_PORT}/client-config" > /dev/null 2>&1; then
    echo "   ✅ 后端 API 正常"
else
    echo -e "${YELLOW}   ⚠️  后端 API 响应异常${NC}"
fi

# 验证前端
echo "   🔍 验证前端服务..."
if curl -s "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
    echo "   ✅ 前端服务正常"
else
    echo -e "${YELLOW}   ⚠️  前端服务响应异常${NC}"
fi

# 检查进程
echo "   🔍 检查进程状态..."
BACKEND_PID=$(ps aux | grep -E "node.*twenty-server" | grep -v grep | wc -l | tr -d ' ')
FRONTEND_PID=$(ps aux | grep -E "serve.*twenty-front" | grep -v grep | wc -l | tr -d ' ')
WORKER_PID=$(ps aux | grep -E "queue-worker" | grep -v grep | wc -l | tr -d ' ')

echo "   📊 进程统计："
echo "      - 后端进程：${BACKEND_PID}"
echo "      - 前端进程：${FRONTEND_PID}"
echo "      - Worker 进程：${WORKER_PID}"

if [ "$BACKEND_PID" -gt 0 ] && [ "$FRONTEND_PID" -gt 0 ] && [ "$WORKER_PID" -gt 0 ]; then
    echo "   ✅ 所有进程正常运行"
else
    echo -e "${YELLOW}   ⚠️  部分进程未运行，请检查日志${NC}"
fi

echo ""

# ==========================================
# 步骤 9: 生成部署报告
# ==========================================
echo "9️⃣  生成部署报告..."

DEPLOY_TIME=$(date "+%Y-%m-%d %H:%M:%S")
NEW_COMMIT=$(git rev-parse --short HEAD)

cat > deploy-report.txt <<EOF
========================================
Twenty CRM 部署报告
========================================

部署时间：${DEPLOY_TIME}
部署分支：${CURRENT_BRANCH}
代码版本：${CURRENT_COMMIT} → ${NEW_COMMIT}

更新内容：
$(git log --oneline --no-decorate ${CURRENT_COMMIT}..${NEW_COMMIT} | head -10)

服务状态：
- 后端 API：http://localhost:${BACKEND_PORT}
- 前端 Web：http://localhost:${FRONTEND_PORT}
- 后端进程：${BACKEND_PID}
- 前端进程：${FRONTEND_PID}
- Worker 进程：${WORKER_PID}

数据库 Migrations：
- 新增 Migrations：${NEW_MIGRATIONS} 个

依赖变化：
$(git diff ${CURRENT_COMMIT}..${NEW_COMMIT} --name-only | grep "package.json\|yarn.lock" || echo "无")

========================================
EOF

echo "   ✅ 部署报告已生成：deploy-report.txt"
echo ""

# ==========================================
# 完成
# ==========================================
echo "=========================================="
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "=========================================="
echo ""
echo "📍 访问地址："
echo "   前端 Web:  ${FRONTEND_URL}"
echo "   后端 API:  ${BACKEND_URL}"
echo ""
echo "📝 部署信息："
echo "   代码版本：${CURRENT_COMMIT} → ${NEW_COMMIT}"
echo "   部署时间：${DEPLOY_TIME}"
echo ""
echo "📋 常用命令："
echo "   查看日志：tail -f twenty.log"
echo "   停止服务：./stop-twenty-local.sh"
echo "   重启服务：./start_all_service_start.sh"
echo "   查看报告：cat deploy-report.txt"
echo ""
echo "💡 提示："
echo "   - 首次访问请使用：${FRONTEND_URL}"
echo "   - 如遇问题请查看：deploy-report.txt"
echo ""

