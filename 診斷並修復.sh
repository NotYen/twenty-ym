#!/bin/bash

# ==========================================
# Twenty CRM 多租戶問題診斷和修復腳本
# ==========================================

set -e

echo "🔍 開始診斷 Twenty CRM 多租戶配置..."
echo ""

# 1. 加載配置
echo "1️⃣  加載配置文件..."
if [ ! -f "./twenty-config.sh" ]; then
    echo "❌ 錯誤：找不到 twenty-config.sh"
    exit 1
fi

source ./twenty-config.sh
echo "   ✅ 配置已加載"
echo "   EXTERNAL_HOST: ${EXTERNAL_HOST}"
echo "   DEFAULT_SUBDOMAIN: ${DEFAULT_SUBDOMAIN}"
echo "   FRONTEND_URL: ${FRONTEND_URL}"
echo "   BACKEND_URL: ${BACKEND_URL}"
echo ""

# 2. 檢查後端 API
echo "2️⃣  檢查後端配置 API..."
if ! lsof -Pi :${BACKEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ❌ 後端未運行，請先啟動服務"
    exit 1
fi

echo "   正在獲取 client-config..."
CLIENT_CONFIG=$(curl -s "http://localhost:${BACKEND_PORT}/client-config" 2>/dev/null || echo "{}")

if [ "$CLIENT_CONFIG" = "{}" ]; then
    echo "   ❌ 無法獲取配置，後端可能有問題"
else
    echo "   ✅ 後端配置 API 正常"
    
    # 解析 frontDomain 和 defaultSubdomain
    FRONT_DOMAIN=$(echo "$CLIENT_CONFIG" | grep -o '"frontDomain":"[^"]*"' | cut -d'"' -f4 || echo "")
    DEFAULT_SUB=$(echo "$CLIENT_CONFIG" | grep -o '"defaultSubdomain":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    echo "   frontDomain: ${FRONT_DOMAIN}"
    echo "   defaultSubdomain: ${DEFAULT_SUB}"
    
    if [ -z "$FRONT_DOMAIN" ]; then
        echo "   ⚠️  警告：frontDomain 為空！"
    fi
    
    if [ -z "$DEFAULT_SUB" ]; then
        echo "   ⚠️  警告：defaultSubdomain 為空！"
    fi
fi
echo ""

# 3. 檢查數據庫
echo "3️⃣  檢查數據庫 Workspace 配置..."

# 檢查 PostgreSQL 是否運行
if ! lsof -Pi :${POSTGRES_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ❌ PostgreSQL 未運行"
    exit 1
fi

# 檢查是否有 psql 命令（優先使用 Docker）
if docker ps | grep -q "twenty-db"; then
    echo "   使用 Docker 容器查詢數據庫..."
    WORKSPACES=$(docker exec twenty-db psql -U postgres -d default -t -A -F'|' -c \
        "SELECT id, subdomain, COALESCE(\"displayName\", 'NULL'), COALESCE(\"customDomain\", 'NULL'), \"isCustomDomainEnabled\" FROM core.workspace;" 2>/dev/null || echo "")
else
    # 嘗試使用本地 psql
    WORKSPACES=$(PGPASSWORD=postgres psql -h localhost -p ${POSTGRES_PORT} -U postgres -d default -t -A -F'|' -c \
        "SELECT id, subdomain, COALESCE(\"displayName\", 'NULL'), COALESCE(\"customDomain\", 'NULL'), \"isCustomDomainEnabled\" FROM core.workspace;" 2>/dev/null || echo "")
fi

if [ -z "$WORKSPACES" ]; then
    echo "   ❌ 無法查詢數據庫"
else
    echo "   ✅ Workspace 列表："
    echo "$WORKSPACES" | while IFS='|' read -r id subdomain displayName customDomain isCustomDomainEnabled; do
        echo "   - ID: $id"
        echo "     subdomain: ${subdomain:-[空]}"
        echo "     displayName: $displayName"
        echo "     customDomain: $customDomain"
        echo "     isCustomDomainEnabled: $isCustomDomainEnabled"
        echo ""
        
        # 檢查問題
        if [ -z "$subdomain" ]; then
            echo "   ⚠️  警告：此 workspace 的 subdomain 為空！"
        fi
    done
fi
echo ""

# 4. 检查 Mock 数据文件
echo "4️⃣  检查 Mock 数据文件..."

MOCK_FILE="packages/twenty-front/src/testing/mock-data/generated/mock-metadata-query-result.ts"
MOCK_TEST_FILE="packages/twenty-front/src/modules/favorites/hooks/__mocks__/useFavorites.ts"
MOCK_ISSUES=0

if [ ! -f "$MOCK_FILE" ]; then
    echo "   ⚠️  Mock 数据文件不存在"
else
    # 检查 1: Favorite.view RELATION 问题（应该是 viewId UUID）
    if grep -q '"nameSingular": "favorite"' "$MOCK_FILE" 2>/dev/null; then
        FAVORITE_SECTION=$(sed -n '/"nameSingular": "favorite"/,/^[[:space:]]*},$/p' "$MOCK_FILE" | head -500)
        if echo "$FAVORITE_SECTION" | grep -q '"name": "view".*"type": "RELATION"' 2>/dev/null; then
            echo "   ❌ Favorite 对象使用废弃的 view RELATION 字段"
            echo "      应该是: viewId (UUID 类型)"
            MOCK_ISSUES=$((MOCK_ISSUES + 1))
        else
            echo "   ✅ Favorite.viewId 字段正确"
        fi
    fi
    
    # 检查 2: 空的 relation 对象（会导致 nameSingular 错误）
    EMPTY_RELATIONS=$(grep -c '"relation": {}' "$MOCK_FILE" 2>/dev/null || echo "0")
    if [ "$EMPTY_RELATIONS" -gt 0 ]; then
        echo "   ❌ 发现 $EMPTY_RELATIONS 个空的 relation 对象"
        echo "      这会导致: Cannot read properties of undefined (reading 'nameSingular')"
        MOCK_ISSUES=$((MOCK_ISSUES + 1))
    else
        echo "   ✅ 没有空的 relation 对象"
    fi
    
    # 检查 3: Mock 测试文件中的废弃字段
    if [ -f "$MOCK_TEST_FILE" ]; then
        DEPRECATED_FIELDS=0
        
        if grep -q '"view": {' "$MOCK_TEST_FILE" 2>/dev/null; then
            echo "   ⚠️  测试文件包含废弃的 view 对象查询"
            DEPRECATED_FIELDS=$((DEPRECATED_FIELDS + 1))
        fi
        
        if grep -q '"context":\|"output":' "$MOCK_TEST_FILE" 2>/dev/null; then
            echo "   ⚠️  测试文件包含 WorkflowRun 废弃字段 (context/output)"
            DEPRECATED_FIELDS=$((DEPRECATED_FIELDS + 1))
        fi
        
        if [ $DEPRECATED_FIELDS -eq 0 ]; then
            echo "   ✅ Mock 测试文件正确"
        else
            MOCK_ISSUES=$((MOCK_ISSUES + DEPRECATED_FIELDS))
        fi
    fi
fi

if [ $MOCK_ISSUES -gt 0 ]; then
    echo ""
    echo "   📋 发现 $MOCK_ISSUES 个 Mock 数据问题"
    echo ""
    echo "   💡 修复方法："
    echo "      选项 1: 重新生成 Mock 数据（推荐）"
    echo "         npx nx run twenty-front:graphql:generate:metadata"
    echo ""
    echo "      选项 2: 手动修复上述问题"
    echo "         - 将 Favorite.view RELATION 改为 viewId UUID"
    echo "         - 删除空的 relation 对象"
    echo "         - 删除测试文件中的废弃字段"
    echo ""
else
    echo "   ✅ Mock 数据检查通过"
fi
echo ""

# 5. 提供修復選項
echo "5️⃣  診斷總結"
echo ""
echo "【常見問題和解決方案】"
echo ""
echo "問題 A：subdomain 為空"
echo "  修復：運行以下 SQL"
echo "  UPDATE core.workspace SET subdomain = '${DEFAULT_SUBDOMAIN}' WHERE subdomain IS NULL OR subdomain = '';"
echo ""
echo "問題 B：frontDomain 為空"
echo "  檢查：FRONTEND_URL 環境變數是否正確"
echo "  當前值：${FRONTEND_URL}"
echo "  修復：確保 FRONTEND_URL 包含完整的協議和主機名"
echo ""
echo "問題 C：服務重啟後配置丟失"
echo "  原因：環境變數沒有持久化"
echo "  修復：使用提供的一鍵啟動腳本（已包含環境變數導出）"
echo ""
echo "問題 D：Mock 数据过时"
echo "  症状：Cannot query field 'view' on type 'Favorite'"
echo "  原因：Mock 数据文件未更新到最新 schema"
echo "  修復：npx nx run twenty-front:graphql:generate:metadata"
echo ""

# 6. 提供自動修復選項
read -p "是否要自動修復 workspace subdomain？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "6️⃣  開始修復 workspace subdomain..."
    
    if docker ps | grep -q "twenty-db"; then
        docker exec twenty-db psql -U postgres -d default -c \
            "UPDATE core.workspace SET subdomain = '${DEFAULT_SUBDOMAIN}' WHERE subdomain IS NULL OR subdomain = '';"
        echo "   ✅ 已更新空的 subdomain 為 ${DEFAULT_SUBDOMAIN}"
    else
        PGPASSWORD=postgres psql -h localhost -p ${POSTGRES_PORT} -U postgres -d default -c \
            "UPDATE core.workspace SET subdomain = '${DEFAULT_SUBDOMAIN}' WHERE subdomain IS NULL OR subdomain = '';"
        echo "   ✅ 已更新空的 subdomain 為 ${DEFAULT_SUBDOMAIN}"
    fi
    
    echo ""
    echo "   請重啟服務使更改生效："
    echo "   ./stop-twenty-local.sh && ./start-twenty-local.sh"
fi

echo ""
echo "✅ 診斷完成！"

