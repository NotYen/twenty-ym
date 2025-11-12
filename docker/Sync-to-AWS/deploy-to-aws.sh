#!/bin/bash

# Y-CRM AWS 部署腳本
# 使用方式：./deploy-to-aws.sh

set -e

echo "🚀 Y-CRM AWS 部署腳本"
echo "================================"
echo ""

# 1. 檢查 Docker 和 Docker Compose
echo "📋 檢查環境..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝，請先安裝 Docker"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安裝，請先安裝 Docker Compose v2"
    exit 1
fi

# 2. 檢查 .env 檔案
if [ ! -f ".env" ]; then
    echo "❌ 找不到 .env 檔案"
    echo "請從範例建立：cp .env.example .env"
    exit 1
fi

# 3. 檢查備份檔案
if [ ! -f "backups/postgres/db-all.sql" ]; then
    echo "❌ 找不到 backups/postgres/db-all.sql"
    exit 1
fi

if [ ! -f "backups/redis/dump.rdb" ]; then
    echo "❌ 找不到 backups/redis/dump.rdb"
    exit 1
fi

echo "✅ 環境檢查完成"
echo ""

# 4. 登入 Docker Hub
echo "🔐 登入 Docker Hub..."
if ! docker login; then
    echo "❌ Docker Hub 登入失敗"
    exit 1
fi

echo ""

# 5. 拉取映像
echo "📥 拉取 Docker 映像..."
docker compose -f docker-compose.aws.yml pull

echo ""

# 6. 啟動服務
echo "🚀 啟動服務..."
docker compose -f docker-compose.aws.yml up -d

echo ""

# 7. 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 10

# 8. 檢查服務狀態
echo "📊 服務狀態："
docker compose -f docker-compose.aws.yml ps

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 接下來的步驟："
echo "1. 檢查服務是否正常運行"
echo "2. 訪問前端：http://YOUR_AWS_IP:8866"
echo "3. 如果前端 API URL 不正確，執行 fix-frontend-url.sh"
echo ""

