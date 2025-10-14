#!/bin/bash

source "$(dirname "$0")/twenty-config.sh"

echo "⚠️  警告：即将完全清空数据库并重置！"
echo "=========================================="
echo ""
echo "📋 这将删除："
echo "  - ❌ 所有用户数据"
echo "  - ❌ 所有工作区"
echo "  - ❌ 所有 CRM 记录（人员、公司、任务等）"
echo "  - ❌ 所有工作流"
echo "  - ❌ 所有邀请链接"
echo ""
echo "✅ 这不会影响："
echo "  - ✅ 本地源代码（packages/ 目录）"
echo "  - ✅ 配置文件（twenty-config.sh）"
echo "  - ✅ 启动脚本"
echo "  - ✅ PostgreSQL 和 Redis 服务"
echo ""
echo "🔧 重置方式："
echo "  - 使用本地源代码重新构建"
echo "  - 清空数据库表"
echo "  - 运行数据库迁移"
echo "  - 初始化新的空白数据库"
echo ""
read -p "确定要继续吗？(输入 YES 继续): " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ 已取消重置"
    exit 0
fi

echo ""
echo "🔄 开始重置数据库..."
echo ""

# 1. 停止所有服务
echo "1️⃣  停止 Twenty CRM 服务..."
pkill -f "yarn start"
pkill -f "nx run"
sleep 3
echo "   ✅ 服务已停止"
echo ""

# 2. 清空 Redis 缓存
echo "2️⃣  清空 Redis 缓存..."
redis-cli -p ${REDIS_PORT} FLUSHALL > /dev/null 2>&1
echo "   ✅ Redis 缓存已清空"
echo ""

# 3. 重置数据库（使用本地源代码）
echo "3️⃣  重置数据库（使用本地源代码构建）..."
echo "   这可能需要 2-3 分钟..."
echo ""
npx nx database:reset twenty-server

echo ""
echo "✅ 数据库重置完成！"
echo ""
echo "=========================================="
echo "📋 下一步操作："
echo "=========================================="
echo ""
echo "1. 启动服务:"
echo "   ./start-twenty-local.sh"
echo ""
echo "2. 访问网页:"
echo "   http://118.168.188.27:8866"
echo ""
echo "3. 创建新账号:"
echo "   - 填写邮箱和密码"
echo "   - 创建工作区名称"
echo "   - 系统会自动初始化所有功能"
echo ""
echo "4. 确认功能:"
echo "   - 所有标准对象（People, Companies等）会自动创建"
echo "   - Workflows 功能可用"
echo "   - 邮件系统已配置（SMTP）"
echo ""
echo "🎯 这次是全新开始，所有配置都会正确初始化！"
echo ""
