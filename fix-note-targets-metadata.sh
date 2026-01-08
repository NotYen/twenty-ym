#!/bin/bash
# 修復 noteTargets metadata 問題

echo "=== 開始修復 noteTargets metadata 問題 ==="

# 1. Sync metadata
echo "步驟 1: 執行 sync-metadata..."
docker compose -f docker-compose.aws.yml exec backend npx nx run twenty-server:command workspace:sync-metadata

# 2. 清除 Redis cache
echo "步驟 2: 清除 Redis cache..."
docker exec Y-CRM-redis redis-cli FLUSHALL

# 3. 重啟服務
echo "步驟 3: 重啟 backend 和 worker..."
docker compose -f docker-compose.aws.yml restart backend worker

# 4. 等待服務啟動
echo "步驟 4: 等待服務啟動..."
sleep 15

# 5. 重新註冊 CRON jobs
echo "步驟 5: 重新註冊 CRON jobs..."
docker compose -f docker-compose.aws.yml exec backend yarn command:prod cron:register:all

# 6. 驗證 CRON jobs
echo "步驟 6: 驗證 CRON jobs..."
CRON_COUNT=$(docker exec Y-CRM-redis redis-cli KEYS 'bull:cron-queue:repeat:*' | wc -l)
echo "CRON jobs 數量: $CRON_COUNT"

if [ "$CRON_COUNT" -gt 0 ]; then
  echo "✅ CRON jobs 註冊成功"
else
  echo "⚠️  警告: CRON jobs 可能未正確註冊"
fi

echo "=== 修復完成 ==="
echo "請重新測試登入"
