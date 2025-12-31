# 資料庫還原指南 (Windows)

本文件說明如何在 Windows 環境中還原 PostgreSQL 資料庫備份。

---

## 運行環境說明

| 環境 | 資料庫 | 後端/前端 | 適用情境 |
|------|--------|-----------|----------|
| **Docker 全環境** | Docker | Docker | 測試、部署 |
| **本地開發環境** | Docker | 本地運行 | 日常開發 |

> 兩種環境的資料庫都在 Docker 中，差別在於後端/前端的運行方式。

---

## 備份檔案格式

| 格式 | 副檔名 | 還原工具 |
|------|--------|----------|
| PostgreSQL 自訂格式 | `.dump` | `pg_restore` |
| SQL 純文字格式 | `.sql` / `.sql.bak` | `psql` |

---

# Docker 全環境還原

適用於：後端和前端都在 Docker 中運行的情況。

## 步驟一：清空並重啟資料庫

```powershell
cd D:\Project\YCRM_PROJECT\Y-CRM\docker

# 停止所有服務並刪除 volumes
docker-compose down -v

# 重新啟動所有服務
docker-compose up -d
```

## 步驟二：還原備份

### 還原 .dump 格式

```powershell
# 1. 複製備份檔案到容器
docker cp "你的備份檔案.dump" Y-CRM-postgres:/tmp/backup.dump

# 2. 執行還原
docker exec Y-CRM-postgres pg_restore -U postgres -d default --clean --if-exists /tmp/backup.dump

# 3. 清理暫存檔
docker exec Y-CRM-postgres rm /tmp/backup.dump
```

### 還原 .sql 格式

```powershell
# 1. 複製備份檔案到容器
docker cp "你的備份檔案.sql" Y-CRM-postgres:/tmp/backup.sql

# 2. 執行還原
docker exec Y-CRM-postgres psql -U postgres -d default -f /tmp/backup.sql

# 3. 清理暫存檔
docker exec Y-CRM-postgres rm /tmp/backup.sql
```

> **注意**：`pg_restore` 可能顯示 `warning: errors ignored on restore: 1`，通常可忽略。

## 步驟三：執行 Migration 和同步

```powershell
# 1. 執行資料庫 Migration（更新 core schema）
docker exec Y-CRM-backend npx nx run twenty-server:database:migrate:prod

# 2. 同步 Workspace Metadata（更新所有 workspace schema）
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata

# 3. 重啟服務
docker restart Y-CRM-backend Y-CRM-worker
```

## 步驟四：驗證

訪問以下網址確認能正常顯示：
- http://localhost:8866（前端）
- http://localhost:8867（後端 API）

---

# 本地開發環境還原

適用於：資料庫在 Docker，後端/前端在本地運行的情況。

## 步驟一：清空並重啟資料庫

```powershell
cd D:\Project\YCRM_PROJECT\Y-CRM\docker

# 停止所有服務並刪除 volumes
docker-compose down -v

# 只啟動 postgres 和 redis（不啟動 backend/frontend）
docker-compose up -d postgres redis
```

## 步驟二：還原備份

可以使用以下任一方式：

### 方式 A：使用 pgAdmin

1. 打開 pgAdmin 連接到 `localhost:5432`
2. 右鍵點擊 `default` 資料庫 → Restore
3. 選擇備份檔案執行還原

### 方式 B：使用命令列

```powershell
# 還原 .dump 格式
docker cp "你的備份檔案.dump" Y-CRM-postgres:/tmp/backup.dump
docker exec Y-CRM-postgres pg_restore -U postgres -d default --clean --if-exists /tmp/backup.dump
docker exec Y-CRM-postgres rm /tmp/backup.dump
```

> **注意**：`pg_restore` 可能顯示 `warning: errors ignored on restore: 1`，通常可忽略。

## 步驟三：執行 Migration 和同步（本地執行）

```powershell
cd D:\Project\YCRM_PROJECT\Y-CRM

# 1. 執行資料庫 Migration（更新 core schema）
npx nx run twenty-server:database:migrate:prod

# 2. 同步 Workspace Metadata（更新所有 workspace schema）
npx nx run twenty-server:command workspace:sync-metadata
```

> **重要**：兩個指令都必須執行！
> - `database:migrate:prod` → 更新 `core.*` schema（用戶、workspace 設定等）
> - `workspace:sync-metadata` → 更新 `workspace_*` schema（業務數據表）

## 步驟四：啟動本地後端和前端

**PowerShell 視窗 1（後端）：**
```powershell
cd D:\Project\YCRM_PROJECT\Y-CRM
$env:NODE_OPTIONS="--max-old-space-size=8192"
npx nx run twenty-server:start:prod
```

**PowerShell 視窗 2（前端）：**
```powershell
cd D:\Project\YCRM_PROJECT\Y-CRM
npx nx start twenty-front
```

## 步驟五：驗證

訪問以下網址確認能正常顯示：
- http://localhost:3001（前端）
- http://localhost:3000/graphql（後端 GraphQL Playground）

---

## 驗證還原資料

### 檢查 Workspace 列表

```powershell
docker exec Y-CRM-postgres psql -U postgres -d default -c 'SELECT subdomain, "displayName" FROM core.workspace;'
```

### 檢查用戶列表

```powershell
docker exec Y-CRM-postgres psql -U postgres -d default -c 'SELECT email FROM core.user;'
```

### 進入 psql 互動模式

```powershell
docker exec -it Y-CRM-postgres psql -U postgres -d default
```

在 psql 內執行：
```sql
SELECT subdomain, "displayName" FROM core.workspace;
SELECT email FROM core.user;
\q  -- 退出
```

---

## 重設用戶密碼

如果需要重設用戶密碼為預設值 `tim@apple.dev`：

```powershell
docker exec -it Y-CRM-postgres psql -U postgres -d default
```

在 psql 內執行：
```sql
UPDATE core."user" SET "passwordHash" = '$2b$10$3LwXjJRtLsfx4hLuuXhxt.3mWgismTiZFCZSG3z9kDrSfsrBl0fT6' WHERE email = '用戶email@example.com';
```

---

## 常見問題

### Q1: 還原後出現 "column xxx does not exist" 錯誤？

這表示資料庫結構與程式碼不一致，需要執行 Migration 和 sync-metadata：

**Docker 全環境：**
```powershell
docker exec Y-CRM-backend npx nx run twenty-server:database:migrate:prod
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata
docker restart Y-CRM-backend Y-CRM-worker
```

**本地開發環境：**
```powershell
cd D:\Project\YCRM_PROJECT\Y-CRM
npx nx run twenty-server:database:migrate:prod
npx nx run twenty-server:command workspace:sync-metadata
# 然後重啟後端
```

### Q2: pg_restore 顯示 "errors ignored on restore" 警告？

這通常是 constraint 重複等小問題，可以忽略。只要後續的 migration 和 sync-metadata 執行成功即可。

### Q3: 還原後網頁無法連線？

確保服務已正確啟動：

**Docker 全環境：**
```powershell
docker-compose ps
docker restart Y-CRM-backend Y-CRM-worker
```

**本地開發環境：**
確認後端終端機顯示 `Nest application successfully started`。

### Q4: 如何查看後端日誌？

**Docker 全環境：**
```powershell
docker logs Y-CRM-backend --tail 50
```

**本地開發環境：**
日誌直接顯示在終端機中。

---

## pg_restore 參數說明

| 參數 | 說明 |
|------|------|
| `--clean` | 還原前先刪除現有物件 |
| `--if-exists` | 刪除時忽略不存在的物件 |
| `-U postgres` | 使用 postgres 用戶 |
| `-d default` | 目標資料庫名稱 |

---

## 更新日誌

| 日期 | 更新內容 |
|------|----------|
| 2025-12-31 | 重構文件：拆分為「Docker 全環境」和「本地開發環境」兩個獨立章節 |
| 2025-12-31 | 新增「還原前清空資料庫」、`workspace:sync-metadata` 步驟 |
| 2025-12-29 | 初版建立 |
