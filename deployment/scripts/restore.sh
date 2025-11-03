#!/bin/bash
# ==========================================
# Twenty CRM 恢復腳本
# ==========================================
# 從備份恢復數據庫
# ==========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔄 Twenty CRM 恢復腳本"
echo "=========================================="
echo ""

# 檢查參數
if [ $# -eq 0 ]; then
    echo "❌ 錯誤：請提供備份文件路徑"
    echo ""
    echo "用法："
    echo "   bash scripts/restore.sh /path/to/backup.sql"
    echo "   bash scripts/restore.sh /path/to/backup.sql.gz"
    echo "   bash scripts/restore.sh /path/to/backup.dump"
    echo ""
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 錯誤：備份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "📁 備份文件: $BACKUP_FILE"
echo ""

# 進入專案目錄
cd "$PROJECT_DIR"

# ==========================================
# 確認操作
# ==========================================
echo "⚠️  警告：此操作將覆蓋現有數據！"
echo ""
read -p "確定要繼續嗎？(yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo ""

# ==========================================
# 檢測文件類型
# ==========================================
echo "1️⃣  檢測備份文件類型..."

FILE_TYPE=""
if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
    FILE_TYPE="sql.gz"
    echo "   類型: 壓縮 SQL"
elif [[ "$BACKUP_FILE" == *.sql ]]; then
    FILE_TYPE="sql"
    echo "   類型: SQL"
elif [[ "$BACKUP_FILE" == *.dump ]]; then
    FILE_TYPE="dump"
    echo "   類型: pg_dump 二進制"
else
    echo "   ❌ 不支持的文件類型"
    exit 1
fi
echo ""

# ==========================================
# 停止依賴服務
# ==========================================
echo "2️⃣  停止應用服務..."

docker compose stop server worker

echo "   ✅ 服務已停止"
echo ""

# ==========================================
# 恢復數據庫
# ==========================================
echo "3️⃣  恢復數據庫..."

if [ "$FILE_TYPE" = "sql.gz" ]; then
    # 解壓並恢復
    gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U postgres default
elif [ "$FILE_TYPE" = "sql" ]; then
    # 直接恢復
    docker compose exec -T db psql -U postgres default < "$BACKUP_FILE"
elif [ "$FILE_TYPE" = "dump" ]; then
    # 使用 pg_restore
    docker cp "$BACKUP_FILE" twenty-db:/tmp/backup.dump
    docker compose exec db pg_restore -U postgres -d default -c /tmp/backup.dump
fi

echo "   ✅ 數據庫已恢復"
echo ""

# ==========================================
# 重啟服務
# ==========================================
echo "4️⃣  重啟服務..."

docker compose start server worker

echo "   ⏳ 等待服務就緒..."
sleep 10

echo "   ✅ 服務已重啟"
echo ""

# ==========================================
# 驗證
# ==========================================
echo "5️⃣  驗證恢復..."

if docker compose exec -T server curl -f http://localhost:3000/healthz > /dev/null 2>&1; then
    echo "   ✅ 健康檢查通過"
else
    echo "   ⚠️  健康檢查失敗，請查看日誌"
fi
echo ""

# ==========================================
# 完成
# ==========================================
echo "=========================================="
echo "✅ 恢復完成！"
echo "=========================================="
echo ""
echo "📋 後續操作："
echo ""
echo "1. 檢查服務狀態："
echo "   docker compose ps"
echo ""
echo "2. 查看日誌："
echo "   docker compose logs -f server"
echo ""
echo "3. 同步 Metadata（如需要）："
echo "   docker compose exec server npx nx run twenty-server:command workspace:sync-metadata"
echo ""
