# Workflow Schedule 停止執行問題分析報告

## 📅 問題時間線

- **10/17 08:00 之前**：Scheduled workflows 正常執行（48 次執行記錄）
- **10/17 08:00**：最後一次成功執行
- **10/17 08:00 - 10/20**：完全停止執行（0 次新執行）
- **10/20 10:36**：Worker 重啟後恢復正常

## 🔍 根本原因

### 問題觸發點

用戶在某個時間點**刪除了一個 workflow**（ID: `dfef9a6c-b130-490b-bf80-bfd9733e4631`），這個操作觸發了一系列連鎖反應。

### 技術細節

#### 1. 外鍵約束配置

```sql
-- timelineActivity.workflowId → workflow.id
DELETE RULE: CASCADE
```

這個配置本身是正確的，當 workflow 被刪除時，相關的 `timelineActivity` 記錄會被自動級聯刪除。

#### 2. Twenty CRM 的事件系統缺陷

當刪除 workflow 時，發生了以下事件序列：

```
1. 用戶刪除 workflow (ID: dfef9a6c-...)
   ↓
2. CASCADE 觸發，自動刪除相關的 timelineActivity 記錄
   ↓
3. Twenty 的事件系統發出 "workflow.deleted" 事件
   ↓
4. UpsertTimelineActivityFromInternalEvent Job 被觸發
   ↓
5. 嘗試創建新的 timelineActivity 來記錄刪除事件
   ↓
6. ❌ 外鍵檢查失敗：workflow 已經被刪除
   ↓
7. PostgreSQL 錯誤：foreign key constraint violation
   ↓
8. Worker 崩潰並退出
```

### 錯誤日誌

```
error: insert or update on table "timelineActivity" violates foreign key constraint "FK_3c5cb8a4a83a16db773d1272b38"

PostgresException [Error]: insert or update on table "timelineActivity" violates foreign key constraint "FK_3c5cb8a4a83a16db773d1272b38"
    at TimelineActivityRepository.upsertTimelineActivities
```

## 🐛 為什麼會影響 Scheduled Workflows？

### Worker 的角色

Twenty CRM 使用單一的 Worker 進程處理所有後台任務，包括：
- ✅ Cron Jobs（包括 WorkflowCronTriggerCronJob）
- ✅ Workflow 執行
- ✅ 郵件發送
- ✅ Timeline 活動記錄
- ✅ 其他所有異步任務

### 故障傳播

```
timelineActivity 錯誤
  ↓
Worker 進程崩潰
  ↓
所有後台任務停止
  ↓
❌ Cron Jobs 無法觸發新的 scheduled workflows
❌ 已存在的 workflow runs 卡在 RUNNING 狀態
❌ 新的異步任務無法處理
```

## 📊 影響範圍

### 直接影響
- **Scheduled Workflows**：從 10/17 08:00 開始完全停止
- **手動觸發的 Workflows**：可以創建但無法執行
- **Timeline 活動**：無法記錄新的活動
- **其他異步任務**：全部堆積在 Redis 隊列中

### 數據狀態
- **Workflow Runs 卡在 RUNNING**：17 個 runs 卡在運行狀態超過 3 天
- **Redis 隊列堆積**：
  - entity-events-to-db-queue: 18 個待處理任務
  - workflow-queue: 7 個待處理任務

## 🔧 解決方案

### 臨時修復（已完成）

1. **清理孤立的 timelineActivity 記錄**
   ```bash
   node fix-timeline-orphans.js
   # 清理了 4 條引用已刪除 workflow 的記錄
   ```

2. **重啟 Worker 服務**
   ```bash
   npx nx run twenty-server:worker
   ```

3. **驗證恢復**
   - ✅ Worker 正常運行（PID: 34663）
   - ✅ 隊列開始處理
   - ✅ Cron Jobs 正常觸發（WorkflowCronTriggerCronJob）

### 永久解決方案

**方案 1：修改外鍵約束（推薦）**

將 `timelineActivity.workflowId` 的外鍵約束改為 `ON DELETE SET NULL`：

```sql
ALTER TABLE "workspace_xxx"."timelineActivity" 
DROP CONSTRAINT "FK_3c5cb8a4a83a16db773d1272b38";

ALTER TABLE "workspace_xxx"."timelineActivity" 
ADD CONSTRAINT "FK_3c5cb8a4a83a16db773d1272b38" 
FOREIGN KEY ("workflowId") 
REFERENCES "workspace_xxx"."workflow"("id") 
ON DELETE SET NULL 
ON UPDATE NO ACTION;
```

**優點**：
- 允許保留 timelineActivity 記錄，即使 workflow 被刪除
- 符合歷史記錄的需求（可以看到曾經存在的 workflow 的活動）
- 不會導致 Worker 崩潰

**方案 2：修改業務邏輯**

在 Twenty CRM 代碼中，當創建 `workflow.deleted` 事件的 timelineActivity 時：
- 將 `workflowId` 設置為 `NULL`
- 或者在 workflow 刪除前創建 timelineActivity

**方案 3：增強 Worker 錯誤處理**

- Worker 應該捕獲外鍵錯誤並記錄，而不是崩潰
- 使用 Dead Letter Queue 處理失敗的任務
- 實現 Worker 自動重啟機制

## 🚨 預防措施

### 1. 監控 Worker 健康狀態

創建監控腳本：
```bash
#!/bin/bash
# check-worker-health.sh

WORKER_PID=$(ps aux | grep "queue-worker" | grep -v grep | awk '{print $2}')

if [ -z "$WORKER_PID" ]; then
    echo "❌ Worker 未運行！正在重啟..."
    cd /path/to/twenty-ym
    nohup npx nx run twenty-server:worker >> twenty_worker.log 2>&1 &
    echo "✅ Worker 已重啟"
else
    echo "✅ Worker 正常運行 (PID: $WORKER_PID)"
fi
```

### 2. 定期清理孤立記錄

```bash
# 添加到 crontab
0 */6 * * * /path/to/fix-timeline-orphans.js >> /path/to/cleanup.log 2>&1
```

### 3. 修改啟動腳本

在 `start_all_service_start.sh` 中，Worker 啟動失敗時不要繼續：

```bash
# 啟動 Worker
nohup bash -c "npx nx run twenty-server:worker" >> twenty.log 2>&1 &
WORKER_PID=$!
sleep 5

# 嚴格檢查 Worker 狀態
if ! ps -p $WORKER_PID > /dev/null 2>&1; then
    echo "   ❌ Worker 啟動失敗！"
    echo "   查看錯誤日誌："
    tail -50 twenty.log
    exit 1
fi
```

## 📝 學習要點

### 1. 外鍵約束的重要性

外鍵約束的 `ON DELETE` 行為選擇：
- **CASCADE**：級聯刪除（可能導致數據丟失）
- **SET NULL**：設置為 NULL（保留歷史記錄）
- **RESTRICT**：禁止刪除（最安全，但可能不方便）
- **NO ACTION**：默認行為（與 RESTRICT 類似）

### 2. 事件系統的時序問題

當使用事件驅動架構時，需要注意：
- 事件的執行順序
- 數據的一致性
- 外鍵約束的影響

### 3. Worker 的單點故障

單一 Worker 進程處理所有任務的風險：
- 一個任務失敗可能導致整個系統停止
- 需要更好的錯誤隔離
- 考慮使用多 Worker 架構

## ✅ 當前狀態

- ✅ Worker 正常運行
- ✅ 孤立記錄已清理
- ✅ Cron Jobs 正常觸發
- ✅ Scheduled workflows 已恢復
- ⚠️  需要監控並實施永久解決方案

## 📞 後續建議

1. **立即**：實施 Worker 健康監控
2. **短期**（1 週內）：評估並實施永久解決方案（方案 1 或 2）
3. **中期**（1 個月內）：改進 Worker 的錯誤處理和自動恢復機制
4. **長期**：考慮遷移到更robust的任務隊列系統（如獨立的 Worker 集群）

