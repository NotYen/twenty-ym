# Redis FLUSHALL 導致 CRON Jobs 消失問題

## 問題描述

2024-12-26 發現 Workflow 定期執行功能停止運作，所有 CRON jobs 都沒有被觸發。

### 症狀
- Workflow 設定了定期執行（如每天早上 9 點發送郵件）
- UI 顯示 Workflow 已啟用，但實際上沒有執行
- Redis 中沒有 `bull:cron-queue:repeat:*` keys

### 最後正常執行時間
- 2025-12-24 04:02:14 之後就停止了

## 根本原因

在 `deploy-to-aws.sh` 部署腳本中，為了清除翻譯 cache 而加入了 `redis-cli FLUSHALL`：

```bash
echo "🧹 Clearing Redis cache (feature flags, metadata)..."
docker compose -f docker-compose.aws.yml exec redis redis-cli FLUSHALL || true
```

**問題：`FLUSHALL` 會清除所有 Redis 資料，包括：**
- ✅ 翻譯 cache（預期要清的）
- ✅ Feature flags cache
- ❌ BullMQ CRON repeatable jobs（不該清的！）
- ❌ 其他重要的 queue 資料

## 解決方案

在 `FLUSHALL` 後加上 `cron:register:all` 重新註冊所有 CRON jobs：

```bash
echo "🧹 Clearing Redis cache (feature flags, metadata)..."
docker compose -f docker-compose.aws.yml exec redis redis-cli FLUSHALL || true
echo "🔄 Restarting backend to rebuild cache..."
docker compose -f docker-compose.aws.yml restart backend worker
sleep 10
echo "🔄 Registering CRON jobs (workflow triggers, background sync)..."
docker compose -f docker-compose.aws.yml exec backend yarn command:prod cron:register:all || true
```

### 為什麼選擇這個方案？

1. **符合官方設計**：官方 `entrypoint.sh` 每次啟動都會執行 `cron:register:all`
2. **冪等操作**：`cron:register:all` 可以重複執行，不會產生重複的 jobs
3. **簡單可靠**：不需要複雜的選擇性清除邏輯

## 手動恢復步驟

如果已經發生問題，可以手動執行：

```bash
# SSH 到 AWS
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185

# 重新註冊 CRON jobs
docker compose -f docker-compose.aws.yml exec backend yarn command:prod cron:register:all
```

## BullMQ Job Retention 機制（重要！）

官方已經有完善的清理機制，不用擔心長期運行會產生垃圾：

```typescript
// packages/twenty-server/src/engine/core-modules/message-queue/constants/queue-retention.constants.ts
export const QUEUE_RETENTION = {
  completedMaxAge: 14400,    // 4 小時
  completedMaxCount: 1000,   // 最多 1000 筆
  failedMaxAge: 604800,      // 7 天
  failedMaxCount: 1000,      // 最多 1000 筆
};
```

### 自動清理邏輯

BullMQ 會自動清除舊的 job 記錄，**兩個條件先到先清**：

| Job 類型 | 時間限制 | 數量限制 | 清理方式 |
|----------|----------|----------|----------|
| Completed | 4 小時 | 1000 筆 | 超過任一條件，刪除最舊的 |
| Failed | 7 天 | 1000 筆 | 超過任一條件，刪除最舊的 |

**範例：**
- 如果 4 小時內執行了 1500 個 job → 只保留最新的 1000 筆
- 如果 1 小時內執行了 100 個 job → 4 小時後自動過期刪除

### Redis 資源佔用

這些 job 記錄只是輕量級的 metadata，不會佔用大量資源：

| 環境 | Keys 數量 | Redis 記憶體 |
|------|-----------|--------------|
| 本機 | ~400 | ~15MB |
| AWS | ~800 | ~19MB |

每個 key 平均只有幾 KB，Redis 記憶體會穩定在 20-30MB 左右。

### 長期運行（1-2 年）不會有問題

- Completed jobs：最多保留 4 小時或 1000 筆（先到先清）
- Failed jobs：最多保留 7 天或 1000 筆（先到先清）
- Repeatable jobs 只是「定義」，不會無限增長
- 每次部署時 `FLUSHALL` + `cron:register:all` 也會重置一切
- **即使每小時執行 5 個 CRON jobs，一年 43,800 個，但因為自動清理，Redis 永遠只保留最近的記錄**

## 相關檔案

- `docker/dev-flow/aws/deploy-to-aws.sh` - AWS 部署腳本
- `packages/twenty-docker/twenty/entrypoint.sh` - 官方 entrypoint（參考）
- `packages/twenty-server/src/database/commands/cron-register-all.command.ts` - 註冊 CRON 的 command
- `packages/twenty-server/src/engine/core-modules/message-queue/constants/queue-retention.constants.ts` - Job retention 設定

## 檢查 Redis 狀態的指令

```bash
# 查看 Redis 總 key 數量
docker compose -f docker-compose.aws.yml exec redis redis-cli DBSIZE

# 查看 CRON repeatable jobs
docker compose -f docker-compose.aws.yml exec redis redis-cli KEYS 'bull:cron-queue:repeat:*'

# 查看 Redis 記憶體使用
docker compose -f docker-compose.aws.yml exec redis redis-cli INFO memory | grep used_memory_human

# 查看各 queue 的 completed jobs 數量
docker compose -f docker-compose.aws.yml exec redis redis-cli ZCARD 'bull:cron-queue:completed'
```

## 教訓

1. **`FLUSHALL` 是危險操作**：會清除所有資料，不只是 cache
2. **了解 Redis 中存了什麼**：不只有 cache，還有 queue、jobs 等重要資料
3. **參考官方設計**：官方 entrypoint 的設計是有原因的
