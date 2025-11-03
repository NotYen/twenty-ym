# 在 AWS 上構建自定義映像指南

## 🎯 為什麼在 AWS 上構建？

1. ✅ AWS VM 記憶體更充足（8GB+）
2. ✅ 不需要上傳大映像文件（2GB+）
3. ✅ 構建速度可能更快
4. ✅ 直接在生產環境使用

## 📋 步驟

### 步驟 1：上傳源代碼到 AWS

```bash
# 在本地 Mac 上執行
cd /Users/ym/twenty-ym

# 打包源代碼（排除 node_modules 等）
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.nx' \
    --exclude='.git' \
    -czf twenty-source-code.tar.gz .

# 查看大小
ls -lh twenty-source-code.tar.gz

# 上傳到 AWS
scp -i your-key.pem twenty-source-code.tar.gz ubuntu@your-ec2-ip:~/
```

### 步驟 2：在 AWS 上解壓並構建

```bash
# SSH 到 AWS
ssh -i your-key.pem ubuntu@your-ec2-ip

# 解壓源代碼
mkdir -p ~/twenty-source
tar -xzf twenty-source-code.tar.gz -C ~/twenty-source/

# 進入目錄
cd ~/twenty-source

# 構建 Docker 映像
docker build -f packages/twenty-docker/twenty/Dockerfile \
  -t twenty-zh-tw:v1.0 \
  -t twenty-zh-tw:latest \
  .

# 預計時間：10-20 分鐘
```

### 步驟 3：更新 docker-compose.yml

```bash
# 編輯配置
cd ~/twenty-crm/deployment
nano docker-compose.yml

# 修改 server 和 worker 的映像：
# 從: image: twentycrm/twenty:${TWENTY_VERSION:-latest}
# 改為: image: twenty-zh-tw:latest
```

### 步驟 4：部署

```bash
cd ~/twenty-crm/deployment

# 使用新映像部署
bash scripts/deploy.sh
```

## 🔄 未來更新流程

### 在本地更新代碼後：

```bash
# 1. 打包新代碼
cd /Users/ym/twenty-ym
git pull  # 獲取最新代碼
tar --exclude='node_modules' --exclude='dist' --exclude='build' \
    -czf twenty-source-code-$(date +%Y%m%d).tar.gz .

# 2. 上傳到 AWS
scp -i your-key.pem twenty-source-code-*.tar.gz ubuntu@your-ec2-ip:~/
```

### 在 AWS 上重新構建：

```bash
# 1. SSH 到 AWS
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. 備份當前數據
cd ~/twenty-crm/deployment
bash scripts/backup.sh

# 3. 解壓新代碼
cd ~
rm -rf ~/twenty-source
mkdir ~/twenty-source
tar -xzf twenty-source-code-*.tar.gz -C ~/twenty-source/

# 4. 重新構建映像
cd ~/twenty-source
docker build -f packages/twenty-docker/twenty/Dockerfile \
  -t twenty-zh-tw:v$(date +%Y%m%d) \
  -t twenty-zh-tw:latest \
  .

# 5. 更新服務
cd ~/twenty-crm/deployment
docker compose up -d --force-recreate
```

## 💡 優勢

相比在本地構建：
- ✅ 不受本地 Mac Docker 記憶體限制
- ✅ 不需要上傳 2GB+ 的映像文件
- ✅ 更接近生產環境
- ✅ 構建更穩定

## ⚠️ 注意事項

1. **首次上傳源代碼**
   - 大小約 50-100MB（已排除 node_modules）
   - 比上傳映像快很多

2. **AWS VM 記憶體要求**
   - 建議至少 t3.large（8GB RAM）
   - t3.medium（4GB）可能也可以，但較慢

3. **構建時間**
   - 在 AWS t3.large 上約 15-25 分鐘
   - 比本地可能稍慢，但更穩定
