# AWS 資料庫完整備份與恢復指南

## ⚠️ 重要原則

1. **絕對不能改動 AWS 環境** - 只做只讀備份
2. **使用 SQL 格式備份** - 比自定義格式 (-F c) 更可靠
3. **備份前先驗證** - 確認所有 workspace 都存在

---

## 一、備份前檢查

### 1. 檢查 AWS 容器名稱

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker ps --format '{{.Names}}' | grep -i postgres"
```

**預期輸出**：`Y-CRM-postgres`

### 2. 檢查所有 workspace

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker exec Y-CRM-postgres psql -U postgres -d default -c \"SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace_%' ORDER BY schema_name;\""
```

**預期輸出**：應該看到 9 個 workspace schema

---

## 二、完整備份（正確方式）

### ✅ 方法一：SQL 格式備份（推薦）

**最可靠的方式**，輸出純 SQL 文件：

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker exec Y-CRM-postgres pg_dump -U postgres -d default --no-owner --no-acl" > docker/backups/aws_full_sql_backup_$(date +%Y%m%d_%H%M%S).sql 2>&1
```

**參數說明**：
- `--no-owner`: 不輸出 owner 設定（避免權限問題）
- `--no-acl`: 不輸出權限設定（避免權限問題）
- 輸出格式：純 SQL 文件

**預期檔案大小**：約 30-40MB（包含所有資料）

### ❌ 錯誤方式（不要使用）

```bash
# ❌ 錯誤 1：使用 -F c 格式但透過 SSH 傳輸會損壞
ssh ... "docker exec ... pg_dump -F c ..." > backup.dump

# ❌ 錯誤 2：先寫到容器內再 cat（檔案可能不存在）
ssh ... "docker exec ... pg_dump -f /tmp/backup.dump && cat /tmp/backup.dump" > backup.dump
```

---

## 三、驗證備份完整性

### 1. 檢查檔案大小

```bash
ls -lh docker/backups/aws_full_sql_backup_*.sql | tail -1
```

**預期**：檔案大小應該 > 30MB

### 2. 檢查 workspace 數量

```bash
grep -c "CREATE SCHEMA workspace_" docker/backups/aws_full_sql_backup_YYYYMMDD_HHMMSS.sql
```

**預期輸出**：`9`

### 3. 列出所有 workspace

```bash
grep "CREATE SCHEMA workspace_" docker/backups/aws_full_sql_backup_YYYYMMDD_HHMMSS.sql
```

**預期輸出**：
```
CREATE SCHEMA workspace_1f50bssxzvj2lwap2po8xu7cn;  # youngming (Y-CRM)
CREATE SCHEMA workspace_1g99wpzrdddsuiagn4k5gsecx;  # calleen-company
CREATE SCHEMA workspace_2c96vz4nsg10zwua9xejof4m;   # hopet
CREATE SCHEMA workspace_39f8dylknizhkvjmva16w79r5;  # glorious-white-owl (OOCHAIN)
CREATE SCHEMA workspace_3joxkr9ofo5hlxjan164egffx;  # hong-ming
CREATE SCHEMA workspace_407lopjyyvm7bxeutk1tvqkpo;  # swift-burgundy-eagle (HUYNH)
CREATE SCHEMA workspace_4k895h39wihc4g84axid1ggzi;  # mooser-design (鹿氏)
CREATE SCHEMA workspace_5sgeef4h8tfcbqihsmg9numuh;  # detonger
CREATE SCHEMA workspace_ah8oi06oyuo29ry1ikb89iu96;  # bright-lavender-lynx (Vivian測試)
```

---

## 四、恢復到本地

### 1. 停止本地服務

```bash
cd docker
docker compose down
```

### 2. 啟動 PostgreSQL

```bash
docker compose up -d postgres
sleep 5
```

### 3. 清空本地資料庫（小心！）

```bash
docker compose exec postgres psql -U postgres -d default -c "DROP SCHEMA IF EXISTS core CASCADE;"
docker compose exec postgres psql -U postgres -d default -c "DROP SCHEMA IF EXISTS public CASCADE;"
docker compose exec postgres psql -U postgres -d default -c "CREATE SCHEMA public;"

# 刪除所有 workspace schema
for schema in $(docker compose exec postgres psql -U postgres -d default -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace_%';"); do
  docker compose exec postgres psql -U postgres -d default -c "DROP SCHEMA IF EXISTS $schema CASCADE;"
done
```

### 4. 恢復備份

```bash
cat docker/backups/aws_full_sql_backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T postgres psql -U postgres -d default
```

**注意**：恢復過程可能需要 1-2 分鐘，會看到很多 SQL 執行訊息。

### 5. 驗證恢復結果

```bash
# 檢查 workspace 數量
docker compose exec postgres psql -U postgres -d default -c "SELECT COUNT(*) FROM core.workspace;"
```

**預期輸出**：`9`

```bash
# 列出所有 workspace
docker compose exec postgres psql -U postgres -d default -c "SELECT id, subdomain, \"displayName\" FROM core.workspace ORDER BY \"createdAt\";"
```

### 6. 啟動所有服務

```bash
docker compose up -d
sleep 10
```

### 7. 清除 Redis cache

```bash
docker compose exec redis redis-cli FLUSHALL
```

### 8. 重啟服務並註冊 CRON jobs

```bash
docker compose restart backend worker
sleep 10
docker compose exec backend yarn command:prod cron:register:all
```

### 9. 同步 metadata

```bash
docker compose exec backend npx nx run twenty-server:command workspace:sync-metadata
```

### 10. 驗證 CRON jobs

```bash
docker compose exec redis redis-cli KEYS 'bull:cron-queue:repeat:*' | wc -l
```

**預期**：數字 > 0

---

## 五、完整備份腳本

建立快速備份腳本：`docker/backups/backup-from-aws.sh`

```bash
#!/bin/bash

set -euo pipefail

BACKUP_DIR="/Users/ym/twenty-ym/docker/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/aws_full_sql_backup_${TIMESTAMP}.sql"

echo "🔹 開始從 AWS 備份資料庫..."
echo "📁 備份檔案：${BACKUP_FILE}"

# 執行備份
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker exec Y-CRM-postgres pg_dump -U postgres -d default --no-owner --no-acl" \
  > "${BACKUP_FILE}" 2>&1

# 檢查檔案大小
FILE_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "✅ 備份完成！檔案大小：${FILE_SIZE}"

# 驗證 workspace 數量
WORKSPACE_COUNT=$(grep -c "CREATE SCHEMA workspace_" "${BACKUP_FILE}")
echo "✅ 包含 ${WORKSPACE_COUNT} 個 workspace"

if [ "${WORKSPACE_COUNT}" -eq 9 ]; then
  echo "✅ 備份驗證成功！所有 9 個 workspace 都已備份"
else
  echo "⚠️  警告：預期 9 個 workspace，但只找到 ${WORKSPACE_COUNT} 個"
fi

echo ""
echo "📝 備份檔案位置："
echo "   ${BACKUP_FILE}"
```

使用方式：

```bash
chmod +x docker/backups/backup-from-aws.sh
./docker/backups/backup-from-aws.sh
```

---

## 六、常見問題

### Q1: 備份檔案只有 7MB，是否正常？

**A**: 不正常！完整備份應該 > 30MB。7MB 的檔案可能是自定義格式 (-F c) 透過 SSH 傳輸時損壞了。請使用 SQL 格式備份。

### Q2: 恢復後 workspace 數量不對？

**A**: 檢查備份檔案是否完整：
```bash
grep -c "CREATE SCHEMA workspace_" docker/backups/aws_full_sql_backup_*.sql
```

### Q3: 恢復時出現權限錯誤？

**A**: 確保使用 `--no-owner --no-acl` 參數備份，這樣恢復時不會有權限問題。

### Q4: 如何只備份特定 workspace？

**A**: 使用 `-n` 參數指定 schema：
```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker exec Y-CRM-postgres pg_dump -U postgres -d default -n workspace_XXXXX --no-owner --no-acl" \
  > docker/backups/workspace_XXXXX_backup.sql
```

---

## 七、備份檔案管理

### 保留策略

- 每日備份：保留最近 7 天
- 每週備份：保留最近 4 週
- 每月備份：保留最近 12 個月

### 清理舊備份

```bash
# 刪除 30 天前的備份
find docker/backups -name "aws_full_sql_backup_*.sql" -mtime +30 -delete
```

---

## 八、緊急恢復檢查清單

恢復完成後，必須檢查以下項目：

- [ ] Workspace 數量正確（9 個）
- [ ] 所有 workspace 都能正常訪問
- [ ] Redis cache 已清除
- [ ] CRON jobs 已重新註冊
- [ ] Metadata 已同步
- [ ] 前端可以正常登入
- [ ] 報價單功能正常
- [ ] LINE 整合功能正常

---

## 九、最新備份記錄

| 日期 | 檔案名稱 | 大小 | Workspace 數量 | 狀態 |
|------|---------|------|---------------|------|
| 2026-01-27 19:51 | aws_full_sql_backup_20260127_195122.sql | 33MB | 9 | ✅ 完整 |

---

**最後更新**：2026-01-27
**維護者**：Kiro AI Assistant
