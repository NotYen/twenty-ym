# AWS 部署流程步驟教學

本文件記錄完整的 AWS 部署流程，包含備份、Build Image、Push 到 Docker Hub、部署到 AWS 等步驟。

---

## 目錄

1. [前置準備](#1-前置準備)
2. [備份 AWS 資料庫](#2-備份-aws-資料庫)
3. [清理 AWS Docker 空間（可選）](#3-清理-aws-docker-空間可選)
4. [Build AMD64 Images](#4-build-amd64-images)
5. [Push Images 到 Docker Hub](#5-push-images-到-docker-hub)
6. [更新環境變數配置](#6-更新環境變數配置)
7. [部署到 AWS](#7-部署到-aws)
8. [驗證部署結果](#8-驗證部署結果)
9. [常見問題排解](#9-常見問題排解)

---

## 1. 前置準備

### 1.1 確認 SSH Key 存在

```bash
ls -la ~/.ssh/y-crm-aws-key.pem
```

### 1.2 確認可以連線到 AWS

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
```

### 1.3 確認 Docker Hub 登入

```bash
docker login
```

如果未登入，輸入 Docker Hub 帳號密碼。

---

## 2. 備份 AWS 資料庫

**⚠️ 重要：每次部署前務必先備份資料庫！**

### 2.1 SSH 連線到 AWS

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
```

### 2.2 執行資料庫備份

```bash
# 建立備份檔案名稱（包含日期時間）
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).dump"

# 執行 pg_dump 備份
docker exec Y-CRM-postgres pg_dump -U postgres -d default -Fc > ~/$BACKUP_FILE

# 確認備份檔案大小
ls -lh ~/$BACKUP_FILE
```

### 2.3 下載備份到本機（可選）

在本機執行：

```bash
# 建立本地備份目錄
mkdir -p docker/backups

# 下載備份檔案
scp -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185:~/backup_*.dump docker/backups/
```

### 2.4 還原備份（如需要）

```bash
# 在 AWS 上還原
docker exec -i Y-CRM-postgres pg_restore -U postgres -d default --clean --if-exists < ~/backup_file.dump
```

---

## 3. 清理 AWS Docker 空間（可選）

### 3.1 檢查 Docker 空間使用

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker system df"
```

### 3.2 查看現有 Images

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker images"
```

### 3.3 刪除舊版本 Images

```bash
# 刪除特定舊版本（保留最近 1-2 個版本作為回滾備用）
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker rmi ycrm/y-crm:舊版本tag"
```

### 3.4 清理未使用的資源

```bash
# 清理 dangling images
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker image prune -f"

# 清理所有未使用資源（謹慎使用）
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker system prune -f"
```

---

## 4. Build AMD64 Images

### 4.1 更新 env.aws 中的 Image 版本

編輯 `docker/dev-flow/aws/env.aws`：

```bash
# 更新版本號（格式：b_YYYYMMDD_v版本_aws_image）
FRONTEND_IMAGE_VERSION=f_20251222_v1_aws_image
BACKEND_IMAGE_VERSION=b_20251222_v1_aws_image
```

### 4.2 執行 Build 腳本

```bash
cd /Users/ym/twenty-ym
./docker/dev-flow/aws/build-amd64-images.sh
```

腳本會提示輸入版本號，直接按 Enter 使用預設值，或輸入自訂版本。

### 4.3 Build 時間預估

- **首次 Build（無 cache）**：1-2 小時（跨平台編譯 ARM → AMD64）
- **有 cache 的 Build**：10-30 分鐘

### 4.4 Build 完成確認

```bash
docker images | grep ycrm
```

應該看到新建立的 images：
- `ycrm/y-crm:b_YYYYMMDD_vX_aws_image`
- `ycrm/y-crm:f_YYYYMMDD_vX_aws_image`

---

## 5. Push Images 到 Docker Hub

### 5.1 使用 --push 參數自動 Push

```bash
./docker/dev-flow/aws/build-amd64-images.sh --push
```

### 5.2 手動 Push（如果 Build 時沒有加 --push）

```bash
docker push ycrm/y-crm:b_20251222_v1_aws_image
docker push ycrm/y-crm:f_20251222_v1_aws_image
```

### 5.3 驗證 Push 成功

到 Docker Hub 網站確認：https://hub.docker.com/r/ycrm/y-crm/tags

---

## 6. 更新環境變數配置

### 6.1 編輯 env.aws

檔案位置：`docker/dev-flow/aws/env.aws`

確認以下設定正確：

```bash
# Image 版本
FRONTEND_IMAGE_VERSION=f_20251222_v1_aws_image
BACKEND_IMAGE_VERSION=b_20251222_v1_aws_image

# 多租戶設定
IS_MULTIWORKSPACE_ENABLED=true
IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=true

# 其他環境變數...
```

### 6.2 env.aws 會自動同步

`deploy-to-aws.sh` 腳本會自動將 `env.aws` 上傳到 AWS 作為 `.env`。

---

## 7. 部署到 AWS

### 7.1 執行部署腳本

```bash
./docker/dev-flow/aws/deploy-to-aws.sh \
  --backend-tag b_20251222_v1_aws_image \
  --frontend-tag f_20251222_v1_aws_image
```

### 7.2 部署腳本會自動執行

1. 更新 `docker-compose.aws.yml` 中的 image tags
2. 上傳 `docker-compose.aws.yml` 到 AWS
3. 上傳 `.env`（來自 env.aws）到 AWS
4. `docker compose pull` - 拉取新 images
5. `docker compose up -d` - 啟動服務
6. `yarn database:migrate:prod` - 執行資料庫 migrations
7. `yarn command:prod workspace:sync-metadata` - 同步 metadata
8. `yarn command:prod workspace:seed-sales-quote-views` - 建立報價單 views

### 7.3 部署時間預估

- Pull images：2-5 分鐘
- 啟動服務：1-2 分鐘
- Migration：1-2 分鐘

---

## 8. 驗證部署結果

### 8.1 檢查容器狀態

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'"
```

應該看到所有容器都是 `Up` 狀態。

### 8.2 檢查 Backend 健康狀態

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "curl -s http://localhost:8867/healthz"
```

應該回傳：`{"status":"ok",...}`

### 8.3 檢查 Backend Logs

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker logs Y-CRM-backend --tail 50"
```

### 8.4 訪問前端

瀏覽器打開：http://52.195.151.185.nip.io:8866

### 8.5 檢查資料庫 Migration 結果

```bash
# 檢查特定資料表是否存在
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker exec Y-CRM-postgres psql -U postgres -d default -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'core';\""
```

---

## 9. 常見問題排解

### 9.1 Image Pull 失敗

**錯誤訊息：**
```
failed to resolve reference "docker.io/ycrm/y-crm:xxx": not found
```

**解決方案：**
1. 確認 image 已 push 到 Docker Hub
2. 確認 tag 名稱正確（注意 deploy 腳本可能會加上前綴）
3. 手動修正 `docker-compose.aws.yml` 中的 image tag

### 9.2 Build 卡住超過 90 分鐘

**可能原因：**
- 跨平台編譯（ARM → AMD64）本來就慢
- Docker build cache 問題

**解決方案：**
1. 取消目前的 build（Ctrl+C）
2. 清理 Docker build cache：
   ```bash
   docker builder prune -f
   ```
3. 重新執行 build

### 9.3 Migration 失敗

**解決方案：**
1. 檢查 backend logs：
   ```bash
   ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker logs Y-CRM-backend"
   ```
2. 手動執行 migration：
   ```bash
   ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
     "docker exec Y-CRM-backend yarn database:migrate:prod"
   ```

### 9.4 需要回滾到舊版本

```bash
# 修改 env.aws 中的版本號為舊版本
# 然後重新部署
./docker/dev-flow/aws/deploy-to-aws.sh \
  --backend-tag b_舊版本tag \
  --frontend-tag f_舊版本tag
```

### 9.5 資料庫需要還原

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185

# 停止服務
docker compose -f docker-compose.aws.yml stop backend worker

# 還原資料庫
docker exec -i Y-CRM-postgres pg_restore -U postgres -d default --clean --if-exists < ~/backup_file.dump

# 重啟服務
docker compose -f docker-compose.aws.yml up -d
```

---

## 附錄：相關檔案位置

| 檔案 | 路徑 | 說明 |
|------|------|------|
| Build 腳本 | `docker/dev-flow/aws/build-amd64-images.sh` | Build AMD64 images |
| Deploy 腳本 | `docker/dev-flow/aws/deploy-to-aws.sh` | 部署到 AWS |
| AWS 環境變數 | `docker/dev-flow/aws/env.aws` | AWS 環境設定 |
| Docker Compose | `docker/dev-flow/aws/docker-compose.aws.yml` | AWS Docker 配置 |
| 本地備份目錄 | `docker/backups/` | 資料庫備份檔案 |

---

## 版本歷史

| 日期 | 版本 | 說明 |
|------|------|------|
| 2025-12-22 | v1 | 單租戶轉多租戶部署，新增 workspace_config 資料表 |

---

*最後更新：2025-12-22*
