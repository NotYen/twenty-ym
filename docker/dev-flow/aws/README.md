# AWS Deployment Scripts

AWS 部署相關腳本：建置 x86/amd64 映像 → 推送到 Docker Hub → 部署到 AWS。

## 可用腳本

| Script | 說明 |
| --- | --- |
| `build-amd64-images.sh` | 建置 `linux/amd64` 的 backend / frontend 映像，可選擇自動推送到 Docker Hub |
| `deploy-to-aws.sh` | 更新 `docker-compose.aws.yml` 的映像版本，上傳到 AWS 並重啟服務 |
| `docker-compose.aws.yml` | AWS 用的 Docker Compose 配置檔 |
| `env.aws` | AWS 環境變數配置 |

## 完整部署流程

### 步驟 1：建置 AMD64 映像

```bash
cd docker/dev-flow/aws
./build-amd64-images.sh --push
```

依提示輸入（或使用預設值）後，會產出 `ycrm/y-crm:<tag>` 映像並推送到 Docker Hub。

預設 tag 格式：
- `backend-YYYYMMDD-v1-amd64`
- `frontend-YYYYMMDD-v1-amd64`

### 步驟 2：部署到 AWS

```bash
cd docker/dev-flow/aws
./deploy-to-aws.sh \
  --backend-tag backend-20251216-v1-amd64 \
  --frontend-tag frontend-20251216-v1-amd64
```

這會：
1. 更新 `docker-compose.aws.yml` 中的映像版本
2. 上傳 compose 檔案和 .env 到 AWS
3. 在 AWS 上執行 `docker compose pull && up -d`
4. 執行資料庫遷移
5. 同步 workspace metadata
6. 補充報價單 views

## 前置需求

- 已登入 Docker Hub (`docker login`)
- 本地有 `docker buildx` builder
- SSH key 位於 `~/.ssh/y-crm-aws-key.pem`
- `env.aws` 檔案已配置（位於本目錄）

## 相關檔案

| 檔案 | 說明 |
| --- | --- |
| `env.aws` | AWS 環境變數配置 |
| `docker-compose.aws.yml` | AWS 用的 compose 檔案 |
| `多租戶報價單功能說明.md` | 報價單功能問題說明與解決方案 |

## 常見問題

### Q: 如何查看 AWS 上的服務狀態？
```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
docker compose -f docker-compose.aws.yml ps
docker compose -f docker-compose.aws.yml logs -f backend
```

### Q: 部署後新 workspace 沒有報價單功能？
手動執行：
```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
docker compose -f docker-compose.aws.yml exec backend yarn command:prod workspace:seed-sales-quote-views
```

詳細說明請參考 `多租戶報價單功能說明.md`。
