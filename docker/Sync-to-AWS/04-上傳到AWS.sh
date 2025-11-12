#!/bin/bash

set -e

# 檢查參數
if [ -z "$1" ]; then
    echo "❌ 請提供 AWS IP 地址"
    echo "用法：$0 AWS_IP"
    echo "範例：$0 52.195.151.185"
    exit 1
fi

AWS_IP=$1
SSH_KEY="${HOME}/.ssh/y-crm-aws-key.pem"
AWS_USER="ubuntu"

echo "🚀 準備上傳到 AWS..."
echo ""
echo "目標：$AWS_USER@$AWS_IP"
echo ""

# 檢查 SSH 金鑰
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH 金鑰不存在：$SSH_KEY"
    echo "請確認金鑰路徑正確"
    exit 1
fi

# 找到最新的部署包
PACKAGE=$(ls -t aws-deployment-*.tar.gz 2>/dev/null | head -1)

if [ -z "$PACKAGE" ]; then
    echo "❌ 找不到部署包！"
    echo "請先執行：./03-準備部署包.sh"
    exit 1
fi

echo "📦 部署包：$PACKAGE"
PACKAGE_SIZE=$(ls -lh "$PACKAGE" | awk '{print $5}')
echo "📏 大小：$PACKAGE_SIZE"
echo ""

# 測試 SSH 連線
echo "🔐 測試 SSH 連線..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$AWS_USER@$AWS_IP" "echo '✅ SSH 連線成功'" 2>/dev/null; then
    echo "❌ 無法連接到 AWS"
    echo "請檢查："
    echo "  1. IP 地址是否正確"
    echo "  2. SSH 金鑰權限 (chmod 400 $SSH_KEY)"
    echo "  3. AWS 安全群組是否開放 SSH (port 22)"
    exit 1
fi
echo ""

# 上傳部署包
echo "📤 上傳部署包到 AWS..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$PACKAGE" "$AWS_USER@$AWS_IP:~/"

if [ $? -eq 0 ]; then
    echo "✅ 上傳完成！"
else
    echo "❌ 上傳失敗"
    exit 1
fi

echo ""
echo "📋 下一步操作："
echo ""
echo "1. SSH 連線到 AWS："
echo "   ssh -i $SSH_KEY $AWS_USER@$AWS_IP"
echo ""
echo "2. 解壓縮部署包："
echo "   tar -xzf $PACKAGE"
echo ""
echo "3. 修改 .env 檔案："
echo "   nano .env"
echo "   # 將所有 YOUR_AWS_IP 替換為 $AWS_IP"
echo ""
echo "4. 登入 Docker Hub："
echo "   docker login -u ycrm"
echo ""
echo "5. 執行部署："
echo "   chmod +x deploy-to-aws.sh fix-frontend-url.sh"
echo "   ./deploy-to-aws.sh"
echo ""
echo "6. 修正前端 URL："
echo "   ./fix-frontend-url.sh http://$AWS_IP:8867"
echo ""
echo "7. 訪問系統："
echo "   前端：http://$AWS_IP:8866"
echo "   登入帳號：notyenyu@gmail.com"
