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

# 4. 提供修復選項
echo "4️⃣  診斷完成"
echo ""
echo "如果發現問題，請選擇修復方式："
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

# 5. 提供自動修復選項
read -p "是否要自動修復 workspace subdomain？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "5️⃣  開始修復 workspace subdomain..."
    
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

