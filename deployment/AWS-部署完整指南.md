# Twenty CRM AWS 部署完整指南（自定義映像版）

## 📦 你現在有的文件

1. **部署配置包**: `~/twenty-aws-package_20251103_101627.tar.gz` (20MB)
   - 包含所有備份數據
   - 包含 Docker Compose 配置（已更新為使用自定義映像）
   - 包含所有管理腳本

2. **源代碼包**: `~/twenty-source-code.tar.gz` (210MB)
   - 包含你的所有代碼
   - 包含中文翻譯 (zh-TW.po)
   - 包含所有自定義修改

---

## 🚀 完整部署流程

### 階段 1：上傳文件到 AWS (5-10 分鐘)

```bash
# 在你的 Mac 上執行

# 1. 上傳部署配置包
scp -i your-key.pem \
  ~/twenty-aws-package_20251103_101627.tar.gz \
  ubuntu@your-ec2-ip:~/

# 2. 上傳源代碼包
scp -i your-key.pem \
  ~/twenty-source-code.tar.gz \
  ubuntu@your-ec2-ip:~/

# 預計上傳時間：
# - 部署包 (20MB): 約 1-2 分鐘
# - 源代碼 (210MB): 約 3-5 分鐘
```

---

### 階段 2：AWS 環境設置 (30 分鐘)

```bash
# SSH 到 AWS
ssh -i your-key.pem ubuntu@your-ec2-ip

# 1. 更新系統
sudo apt update && sudo apt upgrade -y

# 2. 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 3. 驗證 Docker
docker --version
docker compose version
```

---

### 階段 3：解壓和準備 (5 分鐘)

```bash
# 在 AWS 上執行

# 1. 解壓部署配置
tar -xzf twenty-aws-package_20251103_101627.tar.gz

# 2. 解壓源代碼到專門目錄
mkdir -p ~/twenty-source
tar -xzf twenty-source-code.tar.gz -C ~/twenty-source/

# 3. 檢查文件
ls -la ~/twenty-crm/
ls -la ~/twenty-source/

# 4. 查看目錄結構
cd ~/twenty-crm
tree -L 2 || ls -la
```

---

### 階段 4：構建 Docker 映像 (15-25 分鐘) ⭐ 關鍵步驟

```bash
# 在 AWS 上執行

cd ~/twenty-source

# 構建包含中文翻譯的自定義映像
docker build -f packages/twenty-docker/twenty/Dockerfile \
  -t twenty-zh-tw:latest \
  .

# 等待構建完成（約 15-25 分鐘）
# 你會看到類似的進度：
# Step 1/11 : FROM node:24-alpine AS common-deps
# Step 2/11 : WORKDIR /app
# ...
# Successfully tagged twenty-zh-tw:latest

# 驗證映像已創建
docker images | grep twenty-zh-tw
```

**重要提示：**
- 這一步會需要較長時間，請耐心等待
- 如果出現記憶體不足錯誤，確保使用 t3.large 或更高規格

---

### 階段 5：配置環境變數 (5 分鐘)

```bash
# 在 AWS 上執行

cd ~/twenty-crm/deployment/

# 1. 複製環境變數範例
cp .env.example .env

# 2. 編輯環境變數
nano .env

# 必須修改的項目：
# - EXTERNAL_HOST=your-aws-ip.nip.io  （改為你的 AWS IP）
# - APP_SECRET=（保持已生成的值）
# - PG_DATABASE_PASSWORD=（保持已生成的值）
# - 郵件配置（如需要）

# 3. 保存並退出（Ctrl+X, Y, Enter）
```

---

### 階段 6：部署服務 (5 分鐘)

```bash
# 在 AWS 上執行

cd ~/twenty-crm/deployment/

# 執行部署腳本
bash scripts/deploy.sh

# 腳本會自動：
# 1. 檢查環境
# 2. 創建數據目錄
# 3. 啟動所有服務（db, redis, server, worker）
# 4. 等待服務就緒
```

---

### 階段 7：恢復數據 (5-10 分鐘)

```bash
# 在 AWS 上執行

cd ~/twenty-crm/deployment/

# 恢復數據庫
bash scripts/restore.sh ../backups/db_backup_*.sql.gz

# 等待恢復完成...
# 輸入 yes 確認操作
```

---

### 階段 8：同步 Metadata (2 分鐘)

```bash
# 在 AWS 上執行

cd ~/twenty-crm/deployment/

# 同步 Workspace Metadata
docker compose exec server \
  npx nx run twenty-server:command workspace:sync-metadata
```

---

### 階段 9：驗證部署 (5 分鐘)

```bash
# 在 AWS 上執行

# 1. 檢查服務狀態
docker compose ps

# 應該看到：
# NAME            STATUS
# twenty-db       Up (healthy)
# twenty-redis    Up (healthy)
# twenty-server   Up (healthy)
# twenty-worker   Up

# 2. 檢查健康狀態
curl http://localhost:3000/healthz

# 3. 查看日誌
docker compose logs -f server

# 4. 測試訪問
# 在瀏覽器打開: http://your-aws-ip:3000
```

---

### 階段 10：配置 Nginx（可選，10 分鐘）

```bash
# 安裝 Nginx
sudo apt install nginx -y

# 複製配置
sudo cp nginx/nginx.conf /etc/nginx/sites-available/twenty
sudo ln -s /etc/nginx/sites-available/twenty /etc/nginx/sites-enabled/

# 測試並重載
sudo nginx -t
sudo systemctl reload nginx

# 現在可以通過 http://your-aws-ip 訪問（端口 80）
```

---

## ✅ 完成檢查清單

- [ ] 文件已上傳到 AWS
- [ ] Docker 已安裝
- [ ] 源代碼已解壓
- [ ] Docker 映像已構建（twenty-zh-tw:latest）
- [ ] 環境變數已配置
- [ ] 服務已啟動
- [ ] 數據已恢復
- [ ] Metadata 已同步
- [ ] 健康檢查通過
- [ ] 前端可訪問
- [ ] 可以登入並看到中文界面 ⭐

---

## 🔄 未來更新流程

當你 pull 了新的 bugfix：

```bash
# 在 Mac 上
cd /Users/ym/twenty-ym
git pull

# 重新打包源代碼
tar --exclude='node_modules' --exclude='dist' --exclude='build' \
    -czf ~/twenty-source-code-new.tar.gz .

# 上傳到 AWS
scp -i your-key.pem ~/twenty-source-code-new.tar.gz ubuntu@your-ec2-ip:~/

# 在 AWS 上
ssh -i your-key.pem ubuntu@your-ec2-ip

# 備份
cd ~/twenty-crm/deployment
bash scripts/backup.sh

# 更新源代碼
rm -rf ~/twenty-source
mkdir ~/twenty-source
tar -xzf ~/twenty-source-code-new.tar.gz -C ~/twenty-source/

# 重新構建映像
cd ~/twenty-source
docker build -f packages/twenty-docker/twenty/Dockerfile \
  -t twenty-zh-tw:latest .

# 更新服務
cd ~/twenty-crm/deployment
docker compose up -d --force-recreate
```

---

## 📞 需要幫助？

參考文檔：
- `deployment/README.md` - 完整說明
- `deployment/DOCKER-COMPOSE-NOTES.md` - 配置詳解
- `deployment/scripts/README.md` - 腳本使用
- `nginx/NGINX-SETUP.md` - Nginx 配置

常用命令：
```bash
# 查看日誌
bash scripts/logs.sh

# 查看狀態
docker compose ps

# 重啟服務
docker compose restart server

# 備份數據
bash scripts/backup.sh
```

---

## 🎯 預期結果

部署成功後，你會有：
- ✅ 完整運行的 Twenty CRM
- ✅ 所有數據已遷移
- ✅ Workflow 正常運行
- ✅ **中文界面（你的翻譯）** ⭐
- ✅ 所有自定義功能
- ✅ 自動備份設置
- ✅ 易於更新的流程

預計總時間：**1.5 - 2 小時**
