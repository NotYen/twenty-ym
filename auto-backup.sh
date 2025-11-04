#!/bin/bash

# ==========================================
# Twenty CRM 自動備份腳本
# ==========================================
# 每天自動備份數據庫，保留最近 7 天的備份

BACKUP_DIR="/Users/ym/twenty-backups"
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TODAY_DIR="${BACKUP_DIR}/${DATE}"

# 創建今天的備份目錄
mkdir -p "${TODAY_DIR}"

# 備份數據庫
echo "💾 開始備份 Twenty CRM 數據庫..."
/opt/homebrew/Cellar/postgresql@16/16.10/bin/pg_dump \
  postgres://postgres:postgres@localhost:5432/default \
  -F c \
  -f "${TODAY_DIR}/twenty_db_backup_${TIMESTAMP}.dump"

if [ $? -eq 0 ]; then
    echo "✅ 備份成功: ${TODAY_DIR}/twenty_db_backup_${TIMESTAMP}.dump"
    ls -lh "${TODAY_DIR}/twenty_db_backup_${TIMESTAMP}.dump"
else
    echo "❌ 備份失敗！"
    exit 1
fi

# 清理 7 天前的舊備份
echo "🧹 清理 7 天前的舊備份..."
find "${BACKUP_DIR}" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

echo "✅ 備份完成！"

