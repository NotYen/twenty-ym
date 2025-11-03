# 部署腳本使用說明

## 📋 腳本列表

### 1. deploy.sh - 部署腳本
首次部署或更新服務使用

```bash
bash scripts/deploy.sh
```

**功能：**
- 檢查環境（Docker, Docker Compose）
- 驗證配置文件
- 創建必要目錄
- 拉取 Docker 映像
- 啟動所有服務
- 等待服務就緒
- 顯示狀態和後續步驟

### 2. backup.sh - 備份腳本
備份數據庫、Redis 和文件存儲

```bash
bash scripts/backup.sh
```

**備份內容：**
- PostgreSQL 數據庫（壓縮 SQL 格式）
- Redis 數據
- 文件存儲
- 環境配置

**自動清理：** 保留最近 7 天的備份

### 3. restore.sh - 恢復腳本
從備份恢復數據

```bash
# 從 SQL 備份恢復
bash scripts/restore.sh /path/to/backup.sql

# 從壓縮備份恢復
bash scripts/restore.sh /path/to/backup.sql.gz

# 從 dump 文件恢復
bash scripts/restore.sh /path/to/backup.dump
```

**⚠️ 警告：** 會覆蓋現有數據，執行前會要求確認

### 4. stop.sh - 停止腳本
安全停止所有服務

```bash
bash scripts/stop.sh
```

### 5. logs.sh - 日誌查看
實時查看服務日誌

```bash
# 查看所有服務日誌
bash scripts/logs.sh

# 查看特定服務日誌
bash scripts/logs.sh server
bash scripts/logs.sh worker
bash scripts/logs.sh db
bash scripts/logs.sh redis
```

## 🔄 典型工作流程

### 首次部署
```bash
# 1. 配置環境變數
cp .env.example .env
nano .env  # 修改為實際配置

# 2. 部署
bash scripts/deploy.sh

# 3. 恢復數據（如果是遷移）
bash scripts/restore.sh /path/to/backup.sql.gz

# 4. 同步 Metadata
docker compose exec server npx nx run twenty-server:command workspace:sync-metadata

# 5. 查看日誌確認
bash scripts/logs.sh
```

### 日常維護
```bash
# 每日備份（可設置 cron job）
bash scripts/backup.sh

# 查看服務狀態
docker compose ps

# 查看日誌
bash scripts/logs.sh server

# 重啟特定服務
docker compose restart server
```

### 更新版本
```bash
# 1. 修改版本號
nano .env  # 修改 TWENTY_VERSION

# 2. 備份當前數據
bash scripts/backup.sh

# 3. 重新部署
bash scripts/deploy.sh
```

### 故障排查
```bash
# 1. 查看所有服務狀態
docker compose ps

# 2. 查看特定服務日誌
bash scripts/logs.sh server

# 3. 檢查健康狀態
docker compose exec server curl http://localhost:3000/healthz
docker compose exec db pg_isready
docker compose exec redis redis-cli ping

# 4. 重啟服務
docker compose restart server

# 5. 如果需要完全重啟
bash scripts/stop.sh
bash scripts/deploy.sh
```

## ⏰ 設置自動備份

在 AWS Linux 上設置每日自動備份：

```bash
# 編輯 crontab
crontab -e

# 添加以下行（每天凌晨 2 點執行）
0 2 * * * cd /home/ubuntu/twenty-crm/deployment && bash scripts/backup.sh >> /home/ubuntu/backup.log 2>&1
```

## 🔍 常用 Docker Compose 命令

```bash
# 查看所有容器狀態
docker compose ps

# 查看實時日誌
docker compose logs -f

# 進入容器
docker compose exec server bash
docker compose exec db psql -U postgres -d default

# 重啟特定服務
docker compose restart server

# 停止所有服務
docker compose down

# 停止並刪除數據卷（危險！）
docker compose down -v

# 查看資源使用
docker stats

# 清理未使用的映像
docker system prune -a
```

## 📊 監控和健康檢查

```bash
# 檢查服務健康
docker compose ps

# 檢查 Server 健康
curl http://localhost:3000/healthz

# 檢查數據庫
docker compose exec db pg_isready

# 檢查 Redis
docker compose exec redis redis-cli ping

# 查看資源使用
docker stats --no-stream

# 查看磁碟使用
df -h
du -sh deployment/data/*
```

## 🆘 緊急恢復

如果服務完全無法啟動：

```bash
# 1. 停止所有服務
bash scripts/stop.sh

# 2. 備份當前狀態（如果可能）
tar -czf emergency-backup-$(date +%Y%m%d).tar.gz data/

# 3. 清理並重新部署
docker compose down -v  # 刪除所有數據卷（危險！）
bash scripts/deploy.sh

# 4. 從備份恢復
bash scripts/restore.sh /path/to/backup.sql.gz
```

## 💡 提示

1. **定期備份** - 每天至少一次
2. **監控日誌** - 定期檢查錯誤
3. **測試恢復** - 定期驗證備份可用
4. **文檔記錄** - 記錄所有變更和問題
5. **保持更新** - 定期更新 Docker 映像
