#!/bin/bash

# 一鍵部署到 AWS
# 自動執行所有部署步驟

set -e

AWS_IP="52.195.151.185"
SSH_KEY="${HOME}/.ssh/y-crm-aws-key.pem"
AWS_USER="ubuntu"

echo "════════════════════════════════════════════════════════════════"
echo "  🚀 一鍵部署到 AWS"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📋 目標 AWS：${AWS_IP}"
echo ""

# 步驟 1：解壓縮
echo "📦 步驟 1/5：解壓縮部署包..."
ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_IP}" << 'REMOTE_CMD'
cd ~
tar -xzf aws-deployment-20251112.tar.gz
echo "✅ 解壓縮完成"
REMOTE_CMD

# 步驟 2：修改 .env
echo ""
echo "🔧 步驟 2/5：修改 .env 檔案..."
ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_IP}" << 'REMOTE_CMD'
cd ~
sed -i "s/YOUR_AWS_IP/52.195.151.185/g" .env
echo "✅ .env 已更新"
REMOTE_CMD

# 步驟 3：登入 Docker Hub
echo ""
echo "🔐 步驟 3/5：登入 Docker Hub..."
echo "   請輸入 Docker Hub 密碼（Personal Access Token）"
ssh -i "$SSH_KEY" -t "${AWS_USER}@${AWS_IP}" "docker login -u ycrm"

# 步驟 4：執行部署
echo ""
echo "🚀 步驟 4/5：執行部署..."
ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_IP}" << 'REMOTE_CMD'
cd ~
chmod +x deploy-to-aws.sh fix-frontend-url.sh
./deploy-to-aws.sh
REMOTE_CMD

# 步驟 5：修正前端 URL
echo ""
echo "🔧 步驟 5/5：修正前端 URL..."
ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_IP}" << 'REMOTE_CMD'
cd ~
./fix-frontend-url.sh http://52.195.151.185:8867
REMOTE_CMD

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ 部署完成！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 訪問 AWS Y-CRM："
echo "   前端：http://52.195.151.185:8866"
echo "   登入：notyenyu@gmail.com"
echo ""
echo "📊 驗證服務狀態："
ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_IP}" "docker compose -f docker-compose.aws.yml ps 2>/dev/null || docker compose ps 2>/dev/null"
echo ""
echo "════════════════════════════════════════════════════════════════"
