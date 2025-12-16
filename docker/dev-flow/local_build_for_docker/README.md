# Local Build for Docker（本地 Docker 環境）

使用 Docker Desktop 在本地建置和運行服務。

## 可用腳本

| Script | 說明 |
| --- | --- |
| `run-local.sh` | 重建並啟動本地 Docker 服務（backend, frontend, worker） |
| `backup-local-data.sh` | 備份本地 PostgreSQL 和 Redis 資料 |
| `env.local` | 本地 Docker 環境變數配置 |

## 使用流程

### 1. 本地開發環境重建

```bash
cd docker/dev-flow/local_build_for_docker
./run-local.sh
```

這會：
1. 套用 `env.local` 到 `docker/.env`
2. 停止現有容器
3. 啟動 postgres 和 redis
4. 重新建置 backend 和 frontend images
5. 啟動所有服務（backend, frontend, worker）

完成後可在 `http://localhost:8866` 訪問前端。

### 2. 備份本地資料

```bash
cd docker/dev-flow/local_build_for_docker
./backup-local-data.sh
```

備份檔案會存放在 `docker/backups/history/` 目錄：
- `db-all-YYYYMMDD_HHMMSS.sql` - PostgreSQL 備份
- `dump-YYYYMMDD_HHMMSS.rdb` - Redis 備份

## 環境變數配置

編輯 `env.local` 設定本地環境變數：

```bash
# 主要配置
SERVER_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8866

# 資料庫
PG_DATABASE_URL=postgres://postgres:postgres@postgres:5432/default

# Redis
REDIS_URL=redis://redis:6379
```

## 前置需求

- Docker Desktop 已安裝並運行
- `env.local` 檔案已配置（位於本目錄）

## 容器說明

腳本使用的容器名稱與 `docker/docker-compose.yml` 一致：

| 容器名稱 | 說明 |
| --- | --- |
| `Y-CRM-postgres` | PostgreSQL 資料庫 |
| `Y-CRM-redis` | Redis 快取 |
| `Y-CRM-backend` | 後端 API 服務 |
| `Y-CRM-frontend` | 前端 Web 服務 |
| `Y-CRM-worker` | 背景任務處理 |

## 常用 Docker 指令

```bash
# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f worker

# 重啟單一服務
docker compose restart backend

# 進入容器
docker compose exec backend sh
```

## 注意事項

- 重建會花費 5-10 分鐘，取決於機器效能
- 建議在部署到 AWS 前先在本地驗證功能
- 建置日誌會輸出到 `logs/docker-build.log`

## 訪問地址

啟動完成後：
- 前端：`http://localhost:8866`
- 後端 API：`http://localhost:3000`
