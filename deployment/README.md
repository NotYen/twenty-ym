# Twenty CRM Docker 部署文件

## 📁 目錄結構

```
deployment/
├── docker-compose.yml          # Docker Compose 主配置文件
├── .env                        # 環境變數（敏感信息，不要提交到 Git）
├── .env.example               # 環境變數範例
├── README.md                  # 本文件
├── nginx/                     # Nginx 反向代理配置
│   └── nginx.conf
├── scripts/                   # 部署和管理腳本
│   ├── deploy.sh             # 部署腳本
│   ├── backup.sh             # 備份腳本
│   ├── restore.sh            # 恢復腳本
│   └── stop.sh               # 停止腳本
├── data/                      # 數據持久化（在 AWS 上創建）
│   ├── postgres/             # PostgreSQL 數據
│   ├── redis/                # Redis 數據
│   └── server-storage/       # 應用文件存儲
└── logs/                      # 應用日誌（在 AWS 上創建）
```

## 🚀 快速開始

### 在 AWS Linux VM 上部署

1. **上傳部署文件到 AWS**
   ```bash
   # 在本地打包
   tar -czf twenty-deployment.tar.gz deployment/

   # 上傳到 AWS
   scp -i your-key.pem twenty-deployment.tar.gz ubuntu@your-ec2-ip:~/
   ```

2. **在 AWS 上解壓並配置**
   ```bash
   # SSH 到 AWS
   ssh -i your-key.pem ubuntu@your-ec2-ip

   # 解壓
   tar -xzf twenty-deployment.tar.gz
   cd deployment/

   # 複製並編輯環境變數
   cp .env.example .env
   nano .env  # 修改為你的 AWS 配置
   ```

3. **啟動服務**
   ```bash
   # 使用部署腳本
   bash scripts/deploy.sh

   # 或手動啟動
   docker compose up -d
   ```

## 🔧 配置說明

### 必須修改的環境變數

在 `.env` 文件中，你需要修改以下變數：

- `EXTERNAL_HOST` - 你的 AWS 公網 IP 或域名
- `APP_SECRET` - 應用密鑰（使用 `openssl rand -hex 32` 生成）
- `PG_DATABASE_PASSWORD` - 數據庫密碼
- 郵件相關配置（如需要）

## 📊 服務說明

### 服務組件
- **db** - PostgreSQL 16 數據庫
- **redis** - Redis 快取和消息隊列
- **server** - Twenty 後端服務（包含前端靜態文件）
- **worker** - Queue Worker 背景任務處理

### 端口說明
- 前端: 8866 (可通過 Nginx 反向代理到 80/443)
- 後端: 8867
- PostgreSQL: 5432 (僅內部訪問)
- Redis: 6379 (僅內部訪問)

## 🔍 常用命令

```bash
# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f

# 重啟服務
docker compose restart

# 停止服務
docker compose down

# 進入容器
docker compose exec server bash
docker compose exec db psql -U postgres -d default

# 備份數據庫
bash scripts/backup.sh

# 恢復數據庫
bash scripts/restore.sh
```

## 🛡️ 安全注意事項

1. ⚠️ **不要將 `.env` 文件提交到 Git**
2. 🔐 使用強密碼和隨機密鑰
3. 🔥 配置防火牆規則
4. 🔒 啟用 HTTPS（使用 Let's Encrypt）
5. 📦 定期備份數據

## 📝 部署檢查清單

- [ ] AWS EC2 實例已創建
- [ ] 安全組已配置（開放必要端口）
- [ ] Docker 和 Docker Compose 已安裝
- [ ] `.env` 文件已配置
- [ ] 備份文件已上傳
- [ ] 數據庫已恢復
- [ ] 服務啟動成功
- [ ] 健康檢查通過
- [ ] 前端可訪問
- [ ] 登入功能正常

## 🆘 故障排查

### 服務無法啟動
```bash
# 查看詳細日誌
docker compose logs --tail=100 service_name

# 檢查配置
docker compose config

# 檢查端口
sudo netstat -tulpn | grep LISTEN
```

### 數據庫連接失敗
```bash
# 檢查數據庫健康
docker compose exec db pg_isready

# 測試連接
docker compose exec server psql "postgresql://postgres:password@db:5432/default"
```

### 權限問題
```bash
# 修改數據目錄權限
sudo chown -R 1000:1000 data/
```

## 📞 技術支援

- 官方文檔: https://twenty.com/developers
- GitHub: https://github.com/twentyhq/twenty

## 🎯 版本信息

- Twenty 版本: [填寫當前版本]
- Docker Compose 版本: 3.8+
- PostgreSQL 版本: 16
- Redis 版本: latest
- Node 版本: 20+

