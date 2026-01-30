# 本地開發環境指南（非 Docker）

這是一個完全本地化的開發環境，不使用 Docker 容器運行前後端，方便快速 Debug。

## 架構說明

- **PostgreSQL**: 使用 Docker 容器（共用資料庫）
- **Redis**: 使用 Docker 容器（共用 cache）
- **Backend**: 本地 Node.js 進程（`yarn start:dev`）
- **Frontend**: 本地 Vite 開發伺服器（`yarn start`）

## 前置條件

1. 確保 Docker 已安裝並運行
2. 確保 Node.js 已安裝（建議 v20+）
3. 確保已執行 `yarn install`

## 啟動步驟

### 1. 確保資料庫和 Redis 運行

```bash
cd docker
docker compose up -d postgres redis
```

### 2. 啟動本地開發環境

```bash
cd docker/dev-flow/local_build_for_mac
./start_dev_local.sh
```

腳本會自動：
- 檢查並啟動 PostgreSQL 和 Redis（如果未運行）
- 從 `env.local` 載入環境變數
- 啟動 Backend（端口 8867）
- 啟動 Frontend（端口 8866）
- 保存進程 PID 以便後續停止

### 3. 訪問應用

- Frontend: http://118.168.188.27.nip.io:8866
- Backend: http://118.168.188.27.nip.io:8867

## 停止服務

```bash
cd docker/dev-flow/local_build_for_mac
./stop_dev_local.sh
```

## 查看日誌

```bash
# Backend 日誌
tail -f logs/backend-local.log

# Frontend 日誌
tail -f logs/frontend-local.log
```

## 環境變數配置

環境變數從 `docker/dev-flow/local_build_for_docker/env.local` 載入。

關鍵配置：
- `IS_MULTIWORKSPACE_ENABLED=true` - 多租戶模式
- `IS_DEBUG_MODE=true` - Debug 模式
- `POSTGRES_URL` - 資料庫連線
- `REDIS_URL` - Redis 連線

## 常見問題

### Q: 多租戶模式沒有生效？

A: 確認 `env.local` 中的 `IS_MULTIWORKSPACE_ENABLED=true`。注意：NestJS 的 ConfigService 需要字串 `"true"` 才能正確轉換為布林值。

### Q: 前端無法連接後端？

A: 檢查：
1. Backend 是否成功啟動（查看 `logs/backend-local.log`）
2. 環境變數 `BACKEND_URL` 是否正確
3. 防火牆是否阻擋端口 8867

### Q: 資料庫連線失敗？

A: 確認：
1. PostgreSQL 容器是否運行：`docker ps | grep Y-CRM-db`
2. `POSTGRES_URL` 是否正確
3. 資料庫是否已初始化（執行過 migration）

## 與 Docker 環境的差異

| 項目 | Docker 環境 | 本地開發環境 |
|------|------------|-------------|
| Backend | Docker 容器 | 本地 Node.js |
| Frontend | Docker 容器 | 本地 Vite |
| PostgreSQL | Docker 容器 | Docker 容器（共用） |
| Redis | Docker 容器 | Docker 容器（共用） |
| 啟動速度 | 較慢（需 build） | 快速 |
| Hot Reload | 需重啟容器 | 自動重載 |
| Debug | 較困難 | 容易 |

## 注意事項

1. **不影響 Docker build**：這些腳本完全獨立，不會影響 `run-local.sh` 或 AWS 部署
2. **共用資料庫**：本地開發環境與 Docker 環境共用同一個 PostgreSQL 資料庫
3. **環境隔離**：前後端進程獨立運行，方便單獨重啟和 Debug
4. **日誌分離**：每個服務的日誌獨立保存在 `logs/` 目錄

## 適用場景

- 快速 Debug 後端 API
- 前端開發（需要 Hot Reload）
- 測試環境變數配置
- 開發新功能（不需要完整 Docker 環境）
