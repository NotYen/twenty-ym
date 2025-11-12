# Y-CRM AWS 部署完整流程

> 此資料夾包含所有 AWS 部署相關的腳本和文件
> 未來可複製此資料夾到新的 AWS VM 快速部署

## 📁 資料夾結構

```
Sync-to-AWS/
├── README.md                          # 本文件（完整流程說明）
├── 01-備份資料庫.sh                    # 步驟 1：備份 PostgreSQL 和 Redis
├── 02-build-跨平台映像.sh              # 步驟 2：Build amd64 映像並推送
├── 03-準備部署包.sh                    # 步驟 3：打包所有必要檔案
├── 04-上傳到AWS.sh                     # 步驟 4：上傳到 AWS（需提供 IP）
├── docker-compose.aws.yml             # AWS 專用 Compose 檔
├── deploy-to-aws.sh                   # AWS 上執行的部署腳本
├── fix-frontend-url.sh                # 修正前端 URL 腳本
├── .env.template                      # 環境變數範本
└── backups/                           # 備份資料夾（執行後自動生成）
    ├── postgres/
    │   └── db-all.sql
    └── redis/
        └── dump.rdb
```

---

## 🚀 完整部署流程

### 前置準備（本地執行一次）

#### 步驟 1：備份最新資料庫
```bash
./01-備份資料庫.sh
```
**作用**：
- 備份 PostgreSQL 資料庫到 `backups/postgres/db-all.sql`
- 備份 Redis 資料到 `backups/redis/dump.rdb`
- 保留歷史備份在 `history/` 資料夾

#### 步驟 2：Build 跨平台映像 ✅
```bash
./02-build-跨平台映像.sh
```
**作用**：
- Build linux/amd64 架構的映像（相容 AWS x86_64）
- 推送到 Docker Hub 私有 repository
- 映像標籤：`ycrm/y-crm:backend-20251112-amd64` 等

**✅ 已完成！映像資訊：**
- Backend: `ycrm/y-crm:backend-20251112-amd64` (9.13 GB)
- Frontend: `ycrm/y-crm:frontend-20251112-amd64` (153 MB)
- **您的 Mac (ARM64) 仍可運行這些 amd64 映像**（Docker Desktop 自動模擬）

**注意**：此步驟需要 15-25 分鐘

#### 步驟 3：準備部署包
```bash
./03-準備部署包.sh
```
**作用**：
- 打包所有必要檔案（Compose、腳本、備份）
- 生成 `aws-deployment-YYYYMMDD.tar.gz`

---

### AWS 部署（每台新 VM 執行）

#### 步驟 4：上傳到 AWS
```bash
./04-上傳到AWS.sh AWS_IP
# 範例：./04-上傳到AWS.sh 52.195.151.185
```
**作用**：
- 上傳部署包到指定的 AWS VM
- 自動使用 SSH 金鑰連線

#### 步驟 5：在 AWS 上部署

**SSH 連線到 AWS**：
```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@AWS_IP
```

**執行以下命令**：
```bash
# 1. 解壓縮部署包
tar -xzf aws-deployment-*.tar.gz
cd Sync-to-AWS

# 2. 修改 .env（設定 AWS IP）
nano .env
# 將所有 YOUR_AWS_IP 替換為實際 IP

# 3. 登入 Docker Hub
docker login -u ycrm

# 4. 執行部署
chmod +x deploy-to-aws.sh fix-frontend-url.sh
./deploy-to-aws.sh

# 5. 修正前端 URL
./fix-frontend-url.sh http://YOUR_AWS_IP:8867

# 6. 訪問系統
# 前端：http://YOUR_AWS_IP:8866
# 使用 notyenyu@gmail.com 登入
```

---

## 🔄 日常維運

### 如果本地新增資料，要同步到 AWS

```bash
# 1. 重新備份資料庫
./01-備份資料庫.sh

# 2. 準備新的部署包
./03-準備部署包.sh

# 3. 上傳到 AWS（會覆蓋舊資料）
./04-上傳到AWS.sh AWS_IP

# 4. 在 AWS 上重新部署
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@AWS_IP
cd Sync-to-AWS
docker compose -f docker-compose.aws.yml down -v
docker compose -f docker-compose.aws.yml up -d
./fix-frontend-url.sh http://YOUR_AWS_IP:8867
```

### 如果程式碼有更新

```bash
# 1. 備份資料庫（如果資料也有變動）
./01-備份資料庫.sh

# 2. 重新 build 映像
./02-build-跨平台映像.sh

# 3. 準備部署包
./03-準備部署包.sh

# 4. 上傳並部署到 AWS
./04-上傳到AWS.sh AWS_IP
# 然後在 AWS 上執行 deploy-to-aws.sh
```

---

## 📝 重要提醒

### Docker Hub 私有 Repository
- 帳號：`ycrm`
- Repository：`ycrm/y-crm`
- 映像是私有的，部署前需要 `docker login`

### 環境變數設定
- `.env.template` 是範本
- 每次部署到新 AWS 需要修改：
  - `EXTERNAL_HOST`
  - `FRONTEND_URL`
  - `BACKEND_URL`
  - `SERVER_URL`
  - `BACKEND_PUBLIC_URL`
  - `AUTH_GOOGLE_CALLBACK_URL`
  - `AUTH_GOOGLE_APIS_CALLBACK_URL`

### 映像標籤規則
- Backend: `ycrm/y-crm:backend-YYYYMMDD-amd64`
- Worker: `ycrm/y-crm:worker-YYYYMMDD-amd64`
- Frontend: `ycrm/y-crm:frontend-YYYYMMDD-amd64`

### AWS 建議規格
- **測試環境**：t3.medium（2 vCPU、4 GB RAM）
- **生產環境**：t3.large（2 vCPU、8 GB RAM）
- **穩定營運**：m6i.large（2 vCPU、8 GB RAM，非突發型）
- **作業系統**：Ubuntu 24.04 LTS
- **儲存空間**：gp3 SSD 60 GB 以上

### 安全群組設定
必須開放以下端口：
- 22（SSH）
- 80（HTTP）
- 8866（前端）
- 8867（後端 API）

---

## 🐛 常見問題

### 問題：前端無法連接後端
**解決方式**：重新執行 `fix-frontend-url.sh`

### 問題：架構不匹配錯誤
**原因**：本地 Mac ARM64 build 的映像無法在 AWS x86_64 運行
**解決方式**：使用 `02-build-跨平台映像.sh` 重新 build amd64 版本

### 問題：Docker Hub 登入失敗
**解決方式**：使用 Personal Access Token (PAT) 而不是密碼
1. 前往 https://app.docker.com/settings/personal-access-tokens
2. 建立新 token
3. 使用 token 作為密碼登入

---

## 📞 技術支援

如有問題，請檢查：
1. Docker 容器狀態：`docker compose -f docker-compose.aws.yml ps`
2. 容器日誌：`docker compose -f docker-compose.aws.yml logs -f`
3. 環境變數設定：`cat .env`
4. 網路連線和安全群組規則

---

最後更新：2025-11-12

