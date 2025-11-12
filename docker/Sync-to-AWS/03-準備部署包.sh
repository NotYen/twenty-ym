#!/bin/bash

set -e

echo "📦 準備 AWS 部署包..."
echo ""

# 獲取當前日期
DATE=$(date +%Y%m%d)
PACKAGE_NAME="aws-deployment-${DATE}.tar.gz"

# 確認備份存在
if [ ! -f "backups/postgres/db-all.sql" ]; then
    echo "❌ PostgreSQL 備份不存在！請先執行 01-備份資料庫.sh"
    exit 1
fi

if [ ! -f "backups/redis/dump.rdb" ]; then
    echo "❌ Redis 備份不存在！請先執行 01-備份資料庫.sh"
    exit 1
fi

echo "✅ 備份檔案確認完成"
echo ""

# 創建臨時打包目錄
TEMP_DIR=$(mktemp -d)
echo "📁 創建臨時目錄：$TEMP_DIR"

# 複製所有必要檔案
echo "📋 複製部署檔案..."
cp docker-compose.aws.yml "$TEMP_DIR/"
cp deploy-to-aws.sh "$TEMP_DIR/"
cp fix-frontend-url.sh "$TEMP_DIR/"
cp .env.template "$TEMP_DIR/.env"

# 複製備份
mkdir -p "$TEMP_DIR/backups/postgres"
mkdir -p "$TEMP_DIR/backups/redis"
cp backups/postgres/db-all.sql "$TEMP_DIR/backups/postgres/"
cp backups/redis/dump.rdb "$TEMP_DIR/backups/redis/"

# 設置執行權限
chmod +x "$TEMP_DIR/deploy-to-aws.sh"
chmod +x "$TEMP_DIR/fix-frontend-url.sh"

echo "✅ 檔案複製完成"
echo ""

# 打包
echo "🗜️  壓縮部署包..."
ORIGINAL_DIR=$(pwd)
cd "$TEMP_DIR"
tar -czf "$PACKAGE_NAME" ./*

# 移動到原始目錄
mv "$PACKAGE_NAME" "$ORIGINAL_DIR/"
cd "$ORIGINAL_DIR"

# 清理
rm -rf "$TEMP_DIR"

# 顯示資訊
PACKAGE_SIZE=$(ls -lh "$PACKAGE_NAME" | awk '{print $5}')
echo ""
echo "✅ 部署包已準備完成！"
echo ""
echo "📦 檔案資訊："
echo "   名稱：$PACKAGE_NAME"
echo "   大小：$PACKAGE_SIZE"
echo "   位置：$(pwd)/$PACKAGE_NAME"
echo ""
echo "📋 包含內容："
echo "   - docker-compose.aws.yml"
echo "   - deploy-to-aws.sh"
echo "   - fix-frontend-url.sh"
echo "   - .env (環境變數)"
echo "   - backups/postgres/db-all.sql"
echo "   - backups/redis/dump.rdb"
echo ""
echo "🚀 下一步："
echo "   ./04-上傳到AWS.sh YOUR_AWS_IP"
