# Y-CRM AWS 部署指南

## 📋 前置準備

### 1. 本地準備（執行一次）

#### 推送映像到 Docker Hub

```bash
# 1. 登入 Docker Hub
docker login

# 2. 設定你的 Docker Hub 帳號和版本號
export DOCKER_USER=yourname
export VERSION=20251112

# 3. 標記映像
docker tag twenty-backend:latest $DOCKER_USER/y-crm:backend-$VERSION
docker tag twenty-backend:latest $DOCKER_USER/y-crm:worker-$VERSION
docker tag y-crm-company-docker-frontend:latest $DOCKER_USER/y-crm:frontend-$VERSION

# 4. 推送到 Docker Hub
docker push $DOCKER_USER/y-crm:backend-$VERSION
docker push $DOCKER_USER/y-crm:worker-$VERSION
docker push $DOCKER_USER/y-crm:frontend-$VERSION
```

#### 修改 docker-compose.aws.yml

將 `docker-compose.aws.yml` 中的 `yourname` 替換為你的 Docker Hub 帳號。

#### 準備部署包

打包以下檔案/資料夾準備上傳到 AWS：

```
docker/
├── docker-compose.aws.yml
├── deploy-to-aws.sh
├── fix-frontend-url.sh
├── .env (從 .env.example 複製並修改)
└── backups/
    ├── postgres/
    │   └── db-all.sql
    └── redis/
        └── dump.rdb
```

---

## 🚀 AWS 部署步驟

### 2. 建立 AWS EC2 實例

#### 推薦規格
- **實例類型**：t3.large 或 m6i.large
- **作業系統**：Ubuntu 22.04 LTS 或 Amazon Linux 2023
- **儲存空間**：gp3 SSD 60 GB 以上
- **安全群組規則**：
  - SSH (22) - 你的 IP
  - HTTP (80) - 0.0.0.0/0
  - Custom TCP (8866) - 0.0.0.0/0（前端）
  - Custom TCP (8867) - 0.0.0.0/0（後端 API，可選）
  - PostgreSQL (5432) - 僅內部（可選）
  - Redis (6379) - 僅內部（可選）

### 3. 連線到 EC2 並安裝 Docker

```bash
# SSH 連線到 EC2
ssh -i your-key.pem ubuntu@YOUR_AWS_IP

# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 將當前用戶加入 docker 群組
sudo usermod -aG docker $USER

# 登出並重新登入使群組生效
exit
ssh -i your-key.pem ubuntu@YOUR_AWS_IP

# 驗證 Docker 安裝
docker --version
docker compose version
```

### 4. 上傳部署包到 EC2

在**本地終端**執行：

```bash
# 從你的 twenty-ym 專案根目錄
cd /Users/ym/twenty-ym

# 打包 docker 資料夾（不包含 .gitignore 的檔案）
tar -czf docker-deploy.tar.gz \
  docker/docker-compose.aws.yml \
  docker/deploy-to-aws.sh \
  docker/fix-frontend-url.sh \
  docker/backups/

# 上傳到 EC2
scp -i your-key.pem docker-deploy.tar.gz ubuntu@YOUR_AWS_IP:~/
```

### 5. 在 EC2 上部署

```bash
# SSH 到 EC2
ssh -i your-key.pem ubuntu@YOUR_AWS_IP

# 解壓縮
tar -xzf docker-deploy.tar.gz

# 進入 docker 目錄
cd docker

# 建立 .env 檔案
nano .env
```

**填入 .env 內容**（重要！）：

```bash
# PostgreSQL 配置
POSTGRES_USER=ym
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=default
POSTGRES_PORT=5432

# Redis 配置
REDIS_PORT=6379

# Backend 配置
BACKEND_PORT=8867
BACKEND_PUBLIC_URL=http://YOUR_AWS_IP:8867

# Frontend 配置
FRONTEND_PORT=8866

# Vite 配置
VITE_IS_DEBUG_MODE=false

# JWT Secret（請務必更改為至少 32 字元的隨機字串）
JWT_SECRET=請替換為你的實際 JWT secret

# 補充其他你本地 .env 的必要環境變數
```

**給腳本執行權限並部署**：

```bash
# 給腳本執行權限
chmod +x deploy-to-aws.sh fix-frontend-url.sh

# 執行部署
./deploy-to-aws.sh
```

### 6. 修正前端 URL（重要！）

部署完成後，前端可能還指向 localhost，需要修正：

```bash
# 執行 URL 修正腳本
./fix-frontend-url.sh http://YOUR_AWS_IP:8867
```

**記得替換 `YOUR_AWS_IP` 為你的實際 AWS 公開 IP**。

### 7. 驗證部署

```bash
# 檢查所有容器狀態
docker compose -f docker-compose.aws.yml ps

# 查看日誌
docker compose -f docker-compose.aws.yml logs -f backend
docker compose -f docker-compose.aws.yml logs -f frontend

# 測試連線
curl http://localhost:8867/healthz
curl http://localhost:8866
```

### 8. 訪問系統

在瀏覽器開啟：
- **前端**：`http://YOUR_AWS_IP:8866`
- **後端 API**：`http://YOUR_AWS_IP:8867`

使用你的管理員帳號 `notyenyu@gmail.com` 登入。

---

## 🔄 日常維運

### 重啟服務

```bash
cd ~/docker
docker compose -f docker-compose.aws.yml restart
```

### 停止服務

```bash
docker compose -f docker-compose.aws.yml down
```

### 更新映像

```bash
# 拉取最新映像
docker compose -f docker-compose.aws.yml pull

# 重新啟動
docker compose -f docker-compose.aws.yml up -d

# 重新修正前端 URL
./fix-frontend-url.sh http://YOUR_AWS_IP:8867
```

### 備份資料

```bash
# 備份 PostgreSQL
docker exec Y-CRM-postgres pg_dump -U ym -d default > backup-$(date +%Y%m%d).sql

# 備份 Redis
docker exec Y-CRM-redis redis-cli SAVE
docker cp Y-CRM-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

### 查看日誌

```bash
# 所有服務
docker compose -f docker-compose.aws.yml logs -f

# 特定服務
docker compose -f docker-compose.aws.yml logs -f backend
docker compose -f docker-compose.aws.yml logs -f frontend
```

---

## ⚠️ 注意事項

1. **每次重啟容器後**，需要重新執行 `fix-frontend-url.sh`
2. **JWT_SECRET** 務必使用強密碼（至少 32 字元）
3. **PostgreSQL 密碼** 務必修改為強密碼
4. 建議定期備份資料庫
5. 若要使用域名，需要：
   - 設定 DNS 指向 EC2
   - 修改 `.env` 的 `BACKEND_PUBLIC_URL`
   - 重新執行 `fix-frontend-url.sh`

---

## 🐛 常見問題

### 問題：前端顯示連線錯誤

**解決方式**：重新執行 `fix-frontend-url.sh`

```bash
./fix-frontend-url.sh http://YOUR_AWS_IP:8867
```

### 問題：無法登入

**可能原因**：
1. 資料庫未正確初始化
2. Redis 連線問題
3. JWT_SECRET 不正確

**檢查方式**：

```bash
# 檢查 backend 日誌
docker compose -f docker-compose.aws.yml logs backend

# 進入 PostgreSQL 確認資料
docker exec -it Y-CRM-postgres psql -U ym -d default
\dt core.*
```

### 問題：容器無法啟動

**檢查**：

```bash
# 查看容器狀態
docker compose -f docker-compose.aws.yml ps -a

# 查看特定容器日誌
docker compose -f docker-compose.aws.yml logs postgres
docker compose -f docker-compose.aws.yml logs backend
```

---

## 📞 支援

如有問題，請檢查：
1. 日誌檔案
2. 環境變數設定
3. 網路連線
4. 安全群組規則

