# Local Build for Mac（本地 Mac 直接執行）

在 Mac 上直接使用 `nx` 建置和執行服務，不透過 Docker。

## 可用腳本

| Script | 說明 |
| --- | --- |
| `build_all_services_prod_env.sh` | 一鍵啟動所有服務（PostgreSQL, Redis, Backend, Frontend, Worker） |
| `stop_all_services.sh` | 停止所有服務 |
| `twenty-config.sh` | 統一配置檔（端口、環境變數等） |

## 使用流程

### 1. 啟動所有服務

```bash
cd docker/dev-flow/local_build_for_mac
./build_all_services_prod_env.sh
```

這會：
1. 檢查系統環境
2. 啟動 PostgreSQL 和 Redis（使用 brew services）
3. 清除 Redis 快取
4. 設置環境變數
5. 執行資料庫遷移
6. 建置並啟動 Backend 和 Frontend
7. 啟動 Worker
8. 註冊 Cron Jobs

### 2. 停止所有服務

```bash
cd docker/dev-flow/local_build_for_mac
./stop_all_services.sh
```

### 3. 清理孤立的 Views（可選）

如果需要清理指向不存在 Object 的 Views：

```bash
AUTO_CLEAN_ORPHAN_VIEWS=true ./build_all_services_prod_env.sh
```

## 配置說明

所有配置都在 `twenty-config.sh` 中：

| 變數 | 預設值 | 說明 |
| --- | --- | --- |
| `EXTERNAL_HOST` | `118.168.188.27.nip.io` | 外部訪問 IP/域名 |
| `FRONTEND_PORT` | `8866` | 前端端口 |
| `BACKEND_PORT` | `8867` | 後端端口 |
| `NODE_ENV` | `production` | 環境模式 |

## 前置需求

- macOS
- Node.js（見 `.nvmrc`）
- Yarn
- Homebrew
- PostgreSQL 16（`brew install postgresql@16`）
- Redis（`brew install redis`）

## 日誌檔案

日誌會輸出到專案根目錄的 `logs/` 資料夾：
- `ycrm_backend.log` - 後端日誌
- `ycrm_frontend.log` - 前端日誌
- `ycrm_worker.log` - Worker 日誌
- `ycrm_migration.log` - 資料庫遷移日誌

## 訪問地址

啟動完成後：
- 前端：`http://{EXTERNAL_HOST}:8866`
- 後端 API：`http://{EXTERNAL_HOST}:8867`
