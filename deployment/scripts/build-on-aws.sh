#!/bin/bash
# ==========================================
# 在 AWS 上構建自定義映像腳本
# ==========================================
# 此腳本在 AWS Linux 上執行
# ==========================================

set -e

echo "🐳 在 AWS 上構建 Twenty 自定義映像"
echo "=========================================="
echo ""

# ==========================================
# 步驟 1: 檢查源代碼
# ==========================================
echo "1️⃣  檢查源代碼..."

if [ ! -d "~/twenty-source" ]; then
    echo "   ⚠️  源代碼目錄不存在"
    echo ""
    echo "   請先執行："
    echo "   1. 上傳源代碼: scp -i key.pem twenty-source-code.tar.gz ubuntu@ip:~/"
    echo "   2. 解壓: mkdir ~/twenty-source && tar -xzf ~/twenty-source-code.tar.gz -C ~/twenty-source/"
    echo ""
    exit 1
fi

echo "   ✅ 源代碼已準備"
echo ""

# ==========================================
# 步驟 2: 檢查 Docker
# ==========================================
echo "2️⃣  檢查 Docker..."

if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker 未安裝"
    echo "   請先安裝: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo "   ✅ Docker: $(docker --version)"
echo ""

# ==========================================
# 步驟 3: 清理舊映像（可選）
# ==========================================
echo "3️⃣  清理舊映像..."

if docker images | grep -q "twenty-zh-tw"; then
    echo "   發現舊映像，是否刪除? (yes/no)"
    read -p "   > " CLEAN
    if [ "$CLEAN" = "yes" ]; then
        docker rmi twenty-zh-tw:latest twenty-zh-tw:v* 2>/dev/null || true
        echo "   ✅ 已清理"
    else
        echo "   ⏭️  跳過清理"
    fi
else
    echo "   ℹ️  沒有舊映像"
fi

echo ""

# ==========================================
# 步驟 4: 構建映像
# ==========================================
echo "4️⃣  開始構建映像..."
echo "   ⏱️  預計時間: 15-25 分鐘"
echo "   📦 映像名稱: twenty-zh-tw:latest"
echo ""

cd ~/twenty-source

# 獲取版本號（日期）
VERSION=$(date +%Y%m%d)

echo "   構建版本: v${VERSION}"
echo ""

if docker build -f packages/twenty-docker/twenty/Dockerfile \
   -t twenty-zh-tw:v${VERSION} \
   -t twenty-zh-tw:latest \
   . ; then
    echo ""
    echo "   ✅ 構建完成！"
else
    echo ""
    echo "   ❌ 構建失敗"
    echo "   請檢查錯誤信息"
    exit 1
fi

echo ""

# ==========================================
# 步驟 5: 驗證映像
# ==========================================
echo "5️⃣  驗證映像..."

docker images | grep "twenty-zh-tw"

echo ""

# 獲取映像大小
SIZE=$(docker images --format "{{.Size}}" twenty-zh-tw:latest)
echo "   映像大小: $SIZE"

echo ""

# ==========================================
# 完成
# ==========================================
echo "=========================================="
echo "✅ 構建完成！"
echo "=========================================="
echo ""
echo "📦 已創建映像："
echo "   - twenty-zh-tw:v${VERSION}"
echo "   - twenty-zh-tw:latest"
echo ""
echo "📋 下一步："
echo "   1. 確認 docker-compose.yml 已配置為使用 twenty-zh-tw:latest"
echo "   2. 執行部署: cd ~/twenty-crm/deployment && bash scripts/deploy.sh"
echo ""
