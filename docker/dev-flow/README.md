# Dev Flow Scripts

這個資料夾集中所有開發、建置、部署相關的腳本和文檔。

## 目錄結構

```
dev-flow/
├── README.md                    # 本文件
├── full-release.sh              # 一鍵完整流程（Docker 本地 → build → push → AWS）
├── local_build_for_docker/      # 本地 Docker 環境（Mac Docker Desktop）
├── local_build_for_mac/         # 本地 Mac 直接執行（不用 Docker）
├── aws/                         # AWS 部署相關
└── docs/                        # 所有文檔
```

## 快速開始

### 方式 1：本地 Docker 環境

```bash
cd docker/dev-flow/local_build_for_docker
./run-local.sh
```

適用於：使用 Docker Desktop 在本地運行服務

### 方式 2：本地 Mac 直接執行

```bash
cd docker/dev-flow/local_build_for_mac
./build_all_services_prod_env.sh
```

適用於：直接在 Mac 上用 nx 建置和執行，不透過 Docker

### 方式 3：部署到 AWS

```bash
cd docker/dev-flow/aws
./build-amd64-images.sh --push
./deploy-to-aws.sh --backend-tag xxx --frontend-tag xxx
```

### 方式 4：一鍵完整流程

```bash
cd docker/dev-flow
./full-release.sh
```

依照提示完成：備份 → 本地 Docker rebuild → build amd64 → push → 部署 AWS

## 目錄說明

| 目錄 | 說明 |
| --- | --- |
| local_build_for_docker/ | 本地 Docker 環境腳本 |
| local_build_for_mac/ | 本地 Mac 直接執行腳本（nx build） |
| aws/ | AWS 部署腳本和 docker-compose |
| docs/ | 所有專案文檔 |
