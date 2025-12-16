# Y-CRM Docker 開發與部署指南

本目錄包含所有 Docker 相關的配置、腳本和文檔，讓開發者可以快速上手開發和部署。

## 目錄結構

```
docker/
├── README.md                 # 本文件
├── docker-compose.yml        # 本地 Docker 服務配置
├── .env                      # 當前使用的環境變數（由腳本自動管理）
├── backend/                  # 後端 Dockerfile
├── frontend/                 # 前端 Dockerfile 和 nginx 配置
├── backups/                  # 資料庫備份存放位置
└── dev-flow/                 # 開發流程腳本和文檔（重點！）
    ├── local_build_for_docker/   # 本地 Docker 環境
    ├── local_build_for_mac/      # 本地 Mac 直接執行（不用 Docker）
    ├── aws/                      # AWS 部署
    ├── docs/                     # 所有技術文檔
    └── full-release.sh           # 一鍵完整發布流程
```

## 快速開始

### 我想在本地用 Docker 跑起來

```bash
cd docker/dev-flow/local_build_for_docker
./run-local.sh
```

訪問 `http://localhost:8866`

### 我想在 Mac 上直接跑（不用 Docker）

```bash
cd docker/dev-flow/local_build_for_mac
./build_all_services_prod_env.sh
```

### 我想部署到 AWS

```bash
cd docker/dev-flow/aws
./build-amd64-images.sh --push
./deploy-to-aws.sh --backend-tag xxx --frontend-tag xxx
```

### 我想一鍵完成所有流程

```bash
cd docker/dev-flow
./full-release.sh
```

## 三種開發/部署方式比較

| 方式 | 適用場景 | 目錄 |
|------|----------|------|
| **Local Docker** | 使用 Docker Desktop 在本地運行 | `dev-flow/local_build_for_docker/` |
| **Local Mac** | 直接在 Mac 上用 nx 建置執行 | `dev-flow/local_build_for_mac/` |
| **AWS** | 部署到 AWS 生產環境 | `dev-flow/aws/` |

## 環境變數說明

| 檔案 | 用途 |
|------|------|
| `dev-flow/local_build_for_docker/env.local` | 本地 Docker 環境變數 |
| `dev-flow/local_build_for_mac/twenty-config.sh` | 本地 Mac 環境配置 |
| `dev-flow/aws/env.aws` | AWS 生產環境變數 |
| `.env` | 當前使用的環境變數（由腳本自動複製） |

⚠️ **注意**：不要直接編輯 `.env`，它會被腳本覆蓋。請編輯對應的 `env.local` 或 `env.aws`。

## 重要文檔位置

所有技術文檔都在 `dev-flow/docs/` 目錄：

| 目錄 | 內容 |
|------|------|
| `docs/features/` | 功能說明（報價單、Workflow、OAuth 等） |
| `docs/deployment/` | 部署相關文檔 |
| `docs/troubleshooting/` | 問題排查指南 |
| `docs/api/` | API 和技術棧文檔 |

## 常見操作

### 備份本地資料

```bash
cd docker/dev-flow/local_build_for_docker
./backup-local-data.sh
```

備份會存到 `docker/backups/history/`

### 查看 Docker 服務狀態

```bash
cd docker
docker compose ps
docker compose logs -f backend
```

### 停止本地 Mac 服務

```bash
cd docker/dev-flow/local_build_for_mac
./stop_all_services.sh
```

## 日誌檔案

所有日誌統一存放在專案根目錄的 `logs/` 資料夾：

| 檔案 | 說明 |
|------|------|
| `ycrm_backend.log` | 後端日誌 |
| `ycrm_frontend.log` | 前端日誌 |
| `ycrm_worker.log` | Worker 日誌 |
| `ycrm_migration.log` | 資料庫遷移日誌 |
| `docker-build.log` | Docker 建置日誌 |

## AWS 生產環境

- **IP**: `52.195.151.185`
- **SSH**: `ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185`

⚠️ **警告**：AWS 是正式環境，有真實用戶資料，操作前請三思！

## 新功能開發流程建議

1. 在 `local_build_for_mac` 環境開發和測試
2. 用 `local_build_for_docker` 驗證 Docker 環境
3. 用 `aws/build-amd64-images.sh` 建置 x86 映像
4. 用 `aws/deploy-to-aws.sh` 部署到 AWS

或直接使用 `full-release.sh` 一鍵完成所有步驟。

## 需要幫助？

- 查看 `dev-flow/docs/` 目錄的文檔
- 查看各子目錄的 `README.md`
- 查看 `dev-flow/docs/troubleshooting/` 排查問題
