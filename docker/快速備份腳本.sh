#!/bin/bash

# Y-CRM 快速備份腳本
# 適用於：晚上新增資料後，需要更新備份

set -e

echo "🔄 Y-CRM 快速備份腳本"
echo "================================"
echo "開始時間：$(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 設定路徑
BACKUP_DIR="docker/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 1. 備份 PostgreSQL
echo "📦 備份 PostgreSQL..."
mkdir -p "$BACKUP_DIR/postgres/history"
docker exec Y-CRM-postgres pg_dump -U postgres -d default --no-owner --no-acl > "$BACKUP_DIR/postgres/db-all-$TIMESTAMP.sql"
cp "$BACKUP_DIR/postgres/db-all-$TIMESTAMP.sql" "$BACKUP_DIR/postgres/db-all.sql"
mv "$BACKUP_DIR/postgres/db-all-$TIMESTAMP.sql" "$BACKUP_DIR/postgres/history/"
echo "✅ PostgreSQL 備份完成"

# 2. 備份 Redis
echo "📦 備份 Redis..."
mkdir -p "$BACKUP_DIR/redis/history"
docker exec Y-CRM-redis redis-cli SAVE >/dev/null
docker cp Y-CRM-redis:/data/dump.rdb "$BACKUP_DIR/redis/dump-$TIMESTAMP.rdb"
cp "$BACKUP_DIR/redis/dump-$TIMESTAMP.rdb" "$BACKUP_DIR/redis/dump.rdb"
mv "$BACKUP_DIR/redis/dump-$TIMESTAMP.rdb" "$BACKUP_DIR/redis/history/"
echo "✅ Redis 備份完成"

# 3. 顯示備份資訊
echo ""
echo "📊 備份資訊："
echo "   PostgreSQL: $(ls -lh $BACKUP_DIR/postgres/db-all.sql | awk '{print $5}')"
echo "   Redis:      $(ls -lh $BACKUP_DIR/redis/dump.rdb | awk '{print $5}')"
echo ""
echo "✅ 備份完成！"
echo "結束時間：$(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "📝 接下來你可以："
echo "1. 重新建立部署包："
echo "   tar -czf docker-deploy-$(date +%Y%m%d).tar.gz docker/docker-compose.aws.yml docker/deploy-to-aws.sh docker/fix-frontend-url.sh docker/README_AWS_DEPLOYMENT.md docker/backups/"
echo ""
echo "2. 上傳到 AWS："
echo "   scp -i your-key.pem docker-deploy-$(date +%Y%m%d).tar.gz ubuntu@YOUR_AWS_IP:~/"
echo ""
echo "3. 在 AWS 上部署："
echo "   ssh -i your-key.pem ubuntu@YOUR_AWS_IP"
echo "   tar -xzf docker-deploy-*.tar.gz"
echo "   cd docker"
echo "   docker compose -f docker-compose.aws.yml down -v"
echo "   docker compose -f docker-compose.aws.yml up -d"
echo "   ./fix-frontend-url.sh http://YOUR_AWS_IP:8867"

