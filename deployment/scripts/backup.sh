#!/bin/bash
# ==========================================
# Twenty CRM 備份腳本
# ==========================================
# 備份數據庫、Redis 和文件存儲
# ==========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Twenty CRM 備份腳本"
echo "=========================================="
echo ""

# 進入專案目錄
cd "$PROJECT_DIR"

# 創建備份目錄
mkdir -p "$BACKUP_DIR"

echo "📦 備份位置: $BACKUP_DIR"
echo "📅 備份時間: $(date)"
echo ""

# ==========================================
# 備份 PostgreSQL
# ==========================================
echo "1️⃣  備份 PostgreSQL 數據庫..."

docker compose exec -T db pg_dump -U postgres default > "$BACKUP_DIR/db_backup_$DATE.sql"

# 壓縮備份
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

DBSIZE=$(du -h "$BACKUP_DIR/db_backup_$DATE.sql.gz" | cut -f1)
echo "   ✅ 數據庫已備份 ($DBSIZE)"
echo ""

# ==========================================
# 備份 Redis
# ==========================================
echo "2️⃣  備份 Redis..."

# 觸發 Redis 保存
docker compose exec -T redis redis-cli SAVE > /dev/null 2>&1

# 複製 RDB 文件
if [ -f "$PROJECT_DIR/data/redis/dump.rdb" ]; then
    cp "$PROJECT_DIR/data/redis/dump.rdb" "$BACKUP_DIR/redis_backup_$DATE.rdb"
    REDISSIZE=$(du -h "$BACKUP_DIR/redis_backup_$DATE.rdb" | cut -f1)
    echo "   ✅ Redis 已備份 ($REDISSIZE)"
else
    echo "   ⚠️  Redis 數據文件不存在，跳過"
fi
echo ""

# ==========================================
# 備份文件存儲
# ==========================================
echo "3️⃣  備份文件存儲..."

if [ -d "$PROJECT_DIR/data/server-storage" ]; then
    tar -czf "$BACKUP_DIR/storage_backup_$DATE.tar.gz" \
        -C "$PROJECT_DIR/data" server-storage
    STORAGESIZE=$(du -h "$BACKUP_DIR/storage_backup_$DATE.tar.gz" | cut -f1)
    echo "   ✅ 文件存儲已備份 ($STORAGESIZE)"
else
    echo "   ⚠️  存儲目錄不存在，跳過"
fi
echo ""

# ==========================================
# 備份配置
# ==========================================
echo "4️⃣  備份配置文件..."

cp .env "$BACKUP_DIR/env_backup_$DATE"
echo "   ✅ 環境變數已備份"
echo ""

# ==========================================
# 清理舊備份
# ==========================================
echo "5️⃣  清理舊備份..."

# 保留最近 7 天的備份
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.rdb" -mtime +7 -delete
find "$BACKUP_DIR" -name "env_backup_*" -mtime +7 -delete

echo "   ✅ 舊備份已清理（保留 7 天內）"
echo ""

# ==========================================
# 完成
# ==========================================
echo "=========================================="
echo "✅ 備份完成！"
echo "=========================================="
echo ""
echo "📁 備份文件："
ls -lh "$BACKUP_DIR" | grep "$DATE"
echo ""
echo "💡 恢復方法："
echo "   bash scripts/restore.sh $BACKUP_DIR/db_backup_$DATE.sql.gz"
echo ""
