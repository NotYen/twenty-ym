#!/bin/bash

# ==========================================
# Twenty CRM 一鍵遷移打包腳本
# ==========================================
# 用途：將當前配置打包，方便遷移到新機器
# ==========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/migration_backup_$(date +%Y%m%d_%H%M%S)"
ARCHIVE_NAME="twenty-migration-$(date +%Y%m%d_%H%M%S).tar.gz"

echo "📦 Twenty CRM 遷移打包工具"
echo "=========================================="
echo ""

# ==========================================
# 步驟 1: 創建備份目錄
# ==========================================
echo "1️⃣  創建備份目錄..."
mkdir -p "${BACKUP_DIR}"
echo "   ✅ 目錄創建: ${BACKUP_DIR}"
echo ""

# ==========================================
# 步驟 2: 複製配置文件
# ==========================================
echo "2️⃣  複製配置和腳本..."

FILES_TO_COPY=(
    "twenty-config.sh"
    "一鍵啟動.sh"
    "stop-twenty-local.sh"
    "start-twenty-local.sh"
    "診斷並修復.sh"
    "使用指南.md"
    "多租戶問題診斷和解決方案.md"
    "README.md"
)

for file in "${FILES_TO_COPY[@]}"; do
    if [ -f "${SCRIPT_DIR}/${file}" ]; then
        cp "${SCRIPT_DIR}/${file}" "${BACKUP_DIR}/"
        echo "   ✅ 已複製: ${file}"
    else
        echo "   ⏭️  跳過: ${file} (不存在)"
    fi
done
echo ""

# ==========================================
# 步驟 3: 備份數據庫（可選）
# ==========================================
echo "3️⃣  數據庫備份..."
echo ""

read -p "是否備份數據庫？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    source "${SCRIPT_DIR}/twenty-config.sh"
    
    echo "   正在備份數據庫..."
    
    if command -v pg_dump &> /dev/null; then
        PGPASSWORD=postgres pg_dump -h localhost -p ${POSTGRES_PORT} -U postgres -d default > "${BACKUP_DIR}/twenty_backup.sql" 2>/dev/null || {
            echo "   ⚠️  無法備份數據庫（可能未運行或無權限）"
        }
        
        if [ -f "${BACKUP_DIR}/twenty_backup.sql" ]; then
            DB_SIZE=$(du -h "${BACKUP_DIR}/twenty_backup.sql" | cut -f1)
            echo "   ✅ 數據庫已備份 (大小: ${DB_SIZE})"
        fi
    else
        echo "   ⚠️  未找到 pg_dump 命令"
    fi
else
    echo "   ⏭️  跳過數據庫備份"
fi
echo ""

# ==========================================
# 步驟 4: 創建遷移說明文件
# ==========================================
echo "4️⃣  創建遷移說明..."

cat > "${BACKUP_DIR}/遷移說明.md" << 'EOF'
# Twenty CRM 遷移指南

## 📦 包含文件

- `twenty-config.sh` - 配置文件
- `一鍵啟動.sh` - 啟動腳本
- `stop-twenty-local.sh` - 停止腳本
- `診斷並修復.sh` - 診斷腳本
- `使用指南.md` - 完整使用指南
- `twenty_backup.sql` - 數據庫備份（如果有）

## 🚀 在新機器上部署

### 前置要求

```bash
# macOS
brew install node yarn postgresql@16 redis

# 確認版本
node -v    # v18+
yarn -v    # 1.22+
```

### 部署步驟

#### 1. 克隆項目

```bash
git clone https://github.com/twentyhq/twenty.git twenty-ym
cd twenty-ym
```

#### 2. 解壓配置文件

```bash
# 將打包文件複製到項目根目錄
cp /path/to/twenty-migration-*.tar.gz .

# 解壓
tar -xzf twenty-migration-*.tar.gz

# 賦予執行權限
chmod +x *.sh
```

#### 3. 修改配置（如果需要）

```bash
# 編輯配置文件
vim twenty-config.sh

# 如果 IP 或域名改變，修改這行：
# export EXTERNAL_HOST="新的IP或域名"
```

#### 4. 安裝依賴

```bash
yarn install
```

#### 5. 恢復數據庫（如果有備份）

```bash
# 啟動 PostgreSQL
brew services start postgresql@16

# 創建數據庫
createdb -U postgres default

# 恢復數據
psql -U postgres -d default < twenty_backup.sql
```

#### 6. 啟動服務

```bash
./一鍵啟動.sh
```

#### 7. 驗證

訪問配置文件中的地址，例如：
- 前端：http://apple.your-ip.nip.io:8866
- 後端：http://your-ip.nip.io:8867

## 🔧 配置調整

### 更改 IP 地址

如果新機器的 IP 不同：

```bash
# 編輯 twenty-config.sh
export EXTERNAL_HOST="新IP.nip.io"

# 或使用域名
export EXTERNAL_HOST="your-domain.com"
```

### 更改端口

```bash
# 編輯 twenty-config.sh
export FRONTEND_PORT=3000  # 新前端端口
export BACKEND_PORT=3001   # 新後端端口
```

## ❓ 常見問題

### 問題 1：依賴安裝失敗

```bash
# 清理緩存重試
yarn cache clean
yarn install
```

### 問題 2：數據庫恢復失敗

```bash
# 檢查 PostgreSQL 運行狀態
brew services list | grep postgresql

# 重啟 PostgreSQL
brew services restart postgresql@16
```

### 問題 3：端口被佔用

```bash
# 檢查端口
lsof -i :8866
lsof -i :8867

# 修改配置文件中的端口
vim twenty-config.sh
```

## 📝 檢查清單

遷移前：
- [ ] 備份數據庫
- [ ] 複製所有配置文件
- [ ] 記錄當前版本號

遷移後：
- [ ] PostgreSQL 運行正常
- [ ] Redis 運行正常
- [ ] 依賴安裝成功
- [ ] 數據庫恢復成功
- [ ] 服務啟動成功
- [ ] 可以正常訪問

## 🆘 需要幫助？

1. 運行診斷：`./診斷並修復.sh`
2. 查看日誌：`tail -f twenty.log`
3. 檢查配置：`./twenty-config.sh --show`
EOF

echo "   ✅ 遷移說明已創建"
echo ""

# ==========================================
# 步驟 5: 打包
# ==========================================
echo "5️⃣  打包文件..."

cd "${SCRIPT_DIR}"
tar -czf "${ARCHIVE_NAME}" -C "${BACKUP_DIR}" .

if [ -f "${ARCHIVE_NAME}" ]; then
    ARCHIVE_SIZE=$(du -h "${ARCHIVE_NAME}" | cut -f1)
    echo "   ✅ 打包完成: ${ARCHIVE_NAME}"
    echo "   📦 文件大小: ${ARCHIVE_SIZE}"
else
    echo "   ❌ 打包失敗"
    exit 1
fi
echo ""

# ==========================================
# 步驟 6: 清理臨時目錄
# ==========================================
echo "6️⃣  清理臨時文件..."
rm -rf "${BACKUP_DIR}"
echo "   ✅ 臨時目錄已清理"
echo ""

# ==========================================
# 完成
# ==========================================
echo "=========================================="
echo "✅ 遷移包已創建！"
echo "=========================================="
echo ""
echo "📦 打包文件: ${ARCHIVE_NAME}"
echo "📍 位置: ${SCRIPT_DIR}/${ARCHIVE_NAME}"
echo ""
echo "📤 遷移步驟："
echo ""
echo "1. 將打包文件傳輸到新機器："
echo "   scp ${ARCHIVE_NAME} user@new-machine:/path/to/twenty-ym/"
echo ""
echo "2. 在新機器上解壓："
echo "   tar -xzf ${ARCHIVE_NAME}"
echo ""
echo "3. 按照「遷移說明.md」完成部署"
echo ""
echo "💡 詳細說明請參考解壓後的「遷移說明.md」文件"
echo ""

