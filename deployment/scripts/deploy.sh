#!/bin/bash
# ==========================================
# Twenty CRM 部署腳本
# ==========================================
# 用於在 AWS Linux 上首次部署或更新
# ==========================================

set -e  # 遇到錯誤立即退出

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Twenty CRM 部署腳本"
echo "=========================================="
echo ""

# 進入專案目錄
cd "$PROJECT_DIR"

# ==========================================
# 步驟 1: 環境檢查
# ==========================================
echo "1️⃣  檢查環境..."

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    echo "   ❌ 錯誤：Docker 未安裝"
    echo "   請先安裝 Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 檢查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo "   ❌ 錯誤：Docker Compose 未安裝"
    exit 1
fi

echo "   ✅ Docker: $(docker --version)"
echo "   ✅ Docker Compose: $(docker compose version)"
echo ""

# ==========================================
# 步驟 2: 檢查配置文件
# ==========================================
echo "2️⃣  檢查配置文件..."

if [ ! -f ".env" ]; then
    echo "   ❌ 錯誤：.env 文件不存在"
    echo "   請複製 .env.example 並配置："
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

echo "   ✅ .env 文件存在"
echo ""

# ==========================================
# 步驟 3: 創建必要目錄
# ==========================================
echo "3️⃣  創建數據目錄..."

mkdir -p data/postgres data/redis data/server-storage logs/server logs/worker

# 設置權限（Docker 使用 UID 1000）
if [ "$(id -u)" = "0" ]; then
    chown -R 1000:1000 data/ logs/
fi

echo "   ✅ 目錄已創建"
echo ""

# ==========================================
# 步驟 4: 拉取 Docker 映像
# ==========================================
echo "4️⃣  拉取 Docker 映像..."

docker compose pull

echo "   ✅ 映像已拉取"
echo ""

# ==========================================
# 步驟 5: 啟動服務
# ==========================================
echo "5️⃣  啟動服務..."

docker compose up -d

echo "   ✅ 服務已啟動"
echo ""

# ==========================================
# 步驟 6: 等待服務就緒
# ==========================================
echo "6️⃣  等待服務就緒..."

echo "   ⏳ 等待數據庫..."
for i in {1..30}; do
    if docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        echo "   ✅ 數據庫已就緒"
        break
    fi
    sleep 2
    if [ $i -eq 30 ]; then
        echo "   ⚠️  數據庫啟動超時，但繼續..."
    fi
done

echo "   ⏳ 等待後端 API..."
for i in {1..60}; do
    if docker compose exec -T server curl -f http://localhost:3000/healthz > /dev/null 2>&1; then
        echo "   ✅ 後端 API 已就緒"
        break
    fi
    sleep 3
    if [ $i -eq 60 ]; then
        echo "   ⚠️  後端啟動超時，請檢查日誌"
    fi
done

echo ""

# ==========================================
# 步驟 7: 顯示服務狀態
# ==========================================
echo "7️⃣  服務狀態："
echo ""

docker compose ps

echo ""

# ==========================================
# 步驟 8: 提示後續操作
# ==========================================
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "📍 後續操作："
echo ""
echo "1. 恢復數據庫（如果是遷移）："
echo "   bash scripts/restore.sh /path/to/backup.sql"
echo ""
echo "2. 同步 Metadata（首次部署後執行一次）："
echo "   docker compose exec server npx nx run twenty-server:command workspace:sync-metadata"
echo ""
echo "3. 查看日誌："
echo "   docker compose logs -f"
echo ""
echo "4. 訪問應用："
echo "   前端：http://your-ip:3000"
echo ""
echo "5. 配置 Nginx（可選）："
echo "   參考 nginx/NGINX-SETUP.md"
echo ""
