#!/bin/bash
# ==========================================
# Twenty CRM AWS 打包腳本
# ==========================================
# 將部署文件和備份打包，準備傳輸到 AWS
# ==========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$HOME/twenty-backups/$(date +%Y%m%d)"
OUTPUT_FILE="$HOME/twenty-aws-package_$(date +%Y%m%d_%H%M%S).tar.gz"

echo "📦 Twenty CRM AWS 打包腳本"
echo "=========================================="
echo ""

# ==========================================
# 檢查備份
# ==========================================
echo "1️⃣  檢查備份文件..."

if [ ! -d "$BACKUP_DIR" ]; then
    echo "   ❌ 備份目錄不存在: $BACKUP_DIR"
    echo "   請先運行備份腳本"
    exit 1
fi

echo "   ✅ 備份目錄: $BACKUP_DIR"
echo ""

# ==========================================
# 創建臨時打包目錄
# ==========================================
echo "2️⃣  準備打包..."

TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="$TEMP_DIR/twenty-crm"

mkdir -p "$PACKAGE_DIR"

echo "   ✅ 臨時目錄: $TEMP_DIR"
echo ""

# ==========================================
# 複製文件
# ==========================================
echo "3️⃣  複製部署文件..."

# 複製 deployment 目錄（排除敏感文件）
cp -r "$SCRIPT_DIR" "$PACKAGE_DIR/"

# 移除 .env（防止洩露本地配置）
rm -f "$PACKAGE_DIR/deployment/.env"

# 確保 .env.example 存在
if [ ! -f "$PACKAGE_DIR/deployment/.env.example" ]; then
    echo "   ⚠️  .env.example 不存在"
fi

echo "   ✅ 部署文件已複製"
echo ""

# ==========================================
# 複製備份
# ==========================================
echo "4️⃣  複製備份文件..."

mkdir -p "$PACKAGE_DIR/backups"
cp -r "$BACKUP_DIR"/* "$PACKAGE_DIR/backups/" 2>/dev/null || echo "   ⚠️  沒有備份文件"

echo "   ✅ 備份文件已複製"
echo ""

# ==========================================
# 創建 AWS 部署說明
# ==========================================
echo "5️⃣  創建部署說明..."

cat > "$PACKAGE_DIR/AWS-DEPLOYMENT-GUIDE.md" << 'GUIDE'
# Twenty CRM AWS 部署指南

## 📦 包內容

```
twenty-crm/
├── deployment/              # 部署配置
│   ├── docker-compose.yml  # Docker Compose 配置
│   ├── .env.example        # 環境變數範例
│   ├── nginx/              # Nginx 配置
│   ├── scripts/            # 管理腳本
│   └── README.md           # 詳細說明
└── backups/                # 數據備份
    ├── db_backup_*.sql.gz  # 數據庫備份
    ├── storage_backup_*.tar.gz  # 文件存儲
    └── env_backup_*        # 環境配置
```

## 🚀 快速開始

### 步驟 1: 上傳到 AWS

```bash
# 在本地執行（替換 your-key.pem 和 your-ec2-ip）
scp -i your-key.pem twenty-aws-package_*.tar.gz ubuntu@your-ec2-ip:~/
```

### 步驟 2: 在 AWS 上解壓

```bash
# SSH 到 AWS
ssh -i your-key.pem ubuntu@your-ec2-ip

# 解壓
tar -xzf twenty-aws-package_*.tar.gz
cd twenty-crm/deployment/
```

### 步驟 3: 安裝 Docker

```bash
# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 驗證
docker --version
docker compose version
```

### 步驟 4: 配置環境

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯環境變數（重要！）
nano .env

# 必須修改的項目：
# - EXTERNAL_HOST (改為你的 AWS IP 或域名)
# - APP_SECRET (保持已生成的值或重新生成)
# - PG_DATABASE_PASSWORD (改為強密碼)
# - 郵件配置（如需要）
```

### 步驟 5: 部署

```bash
# 執行部署腳本
bash scripts/deploy.sh

# 等待服務啟動...
```

### 步驟 6: 恢復數據

```bash
# 查看備份文件
ls -lh ../backups/

# 恢復數據庫
bash scripts/restore.sh ../backups/db_backup_*.sql.gz

# 同步 Metadata
docker compose exec server npx nx run twenty-server:command workspace:sync-metadata
```

### 步驟 7: 驗證

```bash
# 檢查服務狀態
docker compose ps

# 查看日誌
bash scripts/logs.sh

# 測試健康檢查
curl http://localhost:3000/healthz

# 訪問應用
# http://your-aws-ip:3000
```

### 步驟 8: 配置 Nginx（可選）

```bash
# 安裝 Nginx
sudo apt install nginx -y

# 複製配置
sudo cp nginx/nginx.conf /etc/nginx/sites-available/twenty

# 啟用配置
sudo ln -s /etc/nginx/sites-available/twenty /etc/nginx/sites-enabled/

# 測試並重載
sudo nginx -t
sudo systemctl reload nginx

# 現在可以通過 http://your-aws-ip 訪問（端口 80）
```

## 🔐 安全檢查清單

- [ ] AWS 安全組已配置（開放 22, 80, 443, 3000）
- [ ] 已修改 APP_SECRET
- [ ] 已修改數據庫密碼
- [ ] .env 文件權限設為 600
- [ ] 已配置防火牆（UFW）
- [ ] 已配置 HTTPS（如使用真實域名）
- [ ] 已設置自動備份

## 📞 需要幫助？

查看詳細文檔：
- deployment/README.md
- deployment/DOCKER-COMPOSE-NOTES.md
- deployment/scripts/README.md
- nginx/NGINX-SETUP.md

## 🎯 下一步

1. 設置自動備份（cron job）
2. 配置監控和告警
3. 優化性能設置
4. 設置 SSL 證書（如使用域名）
5. 配置日誌輪轉
GUIDE

echo "   ✅ 部署說明已創建"
echo ""

# ==========================================
# 打包
# ==========================================
echo "6️⃣  打包文件..."

cd "$TEMP_DIR"
tar -czf "$OUTPUT_FILE" twenty-crm/

echo "   ✅ 打包完成"
echo ""

# ==========================================
# 清理
# ==========================================
echo "7️⃣  清理臨時文件..."

rm -rf "$TEMP_DIR"

echo "   ✅ 清理完成"
echo ""

# ==========================================
# 完成
# ==========================================
echo "=========================================="
echo "✅ 打包完成！"
echo "=========================================="
echo ""
echo "📁 輸出文件："
ls -lh "$OUTPUT_FILE"
echo ""
echo "📦 文件位置: $OUTPUT_FILE"
echo ""
echo "📋 下一步："
echo ""
echo "1. 上傳到 AWS："
echo "   scp -i your-key.pem $OUTPUT_FILE ubuntu@your-ec2-ip:~/"
echo ""
echo "2. 在 AWS 上解壓："
echo "   ssh -i your-key.pem ubuntu@your-ec2-ip"
echo "   tar -xzf $(basename $OUTPUT_FILE)"
echo "   cd twenty-crm/deployment/"
echo ""
echo "3. 按照 AWS-DEPLOYMENT-GUIDE.md 執行部署"
echo ""
