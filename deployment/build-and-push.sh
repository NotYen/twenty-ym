#!/bin/bash
# ==========================================
# Twenty CRM 映像構建和推送腳本（在 Mac 上執行）
# ==========================================
# 用於構建包含中文翻譯的自定義映像並推送到倉庫
# ==========================================

set -e

# 配置（請修改為你的信息）
DOCKER_USERNAME="${DOCKER_USERNAME:-your-dockerhub-username}"
IMAGE_NAME="twenty-zh-tw"
VERSION="${1:-latest}"  # 可以通過參數指定版本，默認 latest

FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

echo "🐳 Twenty CRM 映像構建和推送"
echo "=========================================="
echo ""
echo "📦 構建信息："
echo "   映像名稱: ${FULL_IMAGE_NAME}"
echo "   構建時間: $(date)"
echo "   包含內容: 所有代碼 + 中文翻譯"
echo ""

# ==========================================
# 步驟 1: 檢查環境
# ==========================================
echo "1️⃣  檢查環境..."

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker 未安裝"
    exit 1
fi

# 檢查是否已登入
if ! docker info &> /dev/null; then
    echo "   ❌ Docker daemon 未運行"
    exit 1
fi

echo "   ✅ Docker 環境正常"
echo ""

# ==========================================
# 步驟 2: 構建映像
# ==========================================
echo "2️⃣  構建映像..."
echo "   ⏱️  預計時間: 10-20 分鐘（首次構建）"
echo ""

cd "$(dirname "$0")/.."

if docker build -f packages/twenty-docker/twenty/Dockerfile \
   -t ${IMAGE_NAME}:${VERSION} \
   -t ${IMAGE_NAME}:latest \
   .; then
    echo ""
    echo "   ✅ 映像構建完成"
else
    echo ""
    echo "   ❌ 構建失敗"
    exit 1
fi

echo ""

# ==========================================
# 步驟 3: 標記映像
# ==========================================
echo "3️⃣  標記映像..."

docker tag ${IMAGE_NAME}:${VERSION} ${FULL_IMAGE_NAME}
docker tag ${IMAGE_NAME}:latest ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

echo "   ✅ 映像已標記"
echo ""

# ==========================================
# 步驟 4: 推送到 Docker Hub
# ==========================================
echo "4️⃣  推送映像到 Docker Hub..."
echo ""

# 檢查是否已登入
if ! docker info | grep -q "Username"; then
    echo "   需要登入 Docker Hub"
    echo "   請輸入你的 Docker Hub 憑證："
    docker login
    echo ""
fi

echo "   推送 ${FULL_IMAGE_NAME}..."
if docker push ${FULL_IMAGE_NAME}; then
    echo "   ✅ 版本 ${VERSION} 推送成功"
else
    echo "   ❌ 推送失敗"
    exit 1
fi

if [ "$VERSION" != "latest" ]; then
    echo ""
    echo "   推送 ${DOCKER_USERNAME}/${IMAGE_NAME}:latest..."
    if docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest; then
        echo "   ✅ latest 標籤推送成功"
    else
        echo "   ⚠️  latest 標籤推送失敗"
    fi
fi

echo ""

# ==========================================
# 步驟 5: 顯示映像信息
# ==========================================
echo "=========================================="
echo "✅ 構建和推送完成！"
echo "=========================================="
echo ""
echo "📦 映像信息："
docker images | grep ${IMAGE_NAME}
echo ""
echo "🔗 Docker Hub："
echo "   https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
echo ""
echo "📋 在 AWS 上使用："
echo "   修改 deployment/.env："
echo "   DOCKER_USERNAME=${DOCKER_USERNAME}"
echo "   IMAGE_NAME=${IMAGE_NAME}"
echo "   IMAGE_VERSION=${VERSION}"
echo ""
echo "   然後在 docker-compose.yml 中使用："
echo "   image: ${FULL_IMAGE_NAME}"
echo ""
echo "💡 下次更新："
echo "   bash deployment/build-and-push.sh v1.1"
echo ""
