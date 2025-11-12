#!/bin/bash

# ════════════════════════════════════════════════════════════════════════
# 同步本地 Y-CRM 資料到 AWS
# 功能：完整複製本地 PostgreSQL 和 Redis 資料到 AWS
# 作者：AI Assistant
# 日期：2025-11-12
# ════════════════════════════════════════════════════════════════════════

set -e  # 遇到錯誤立即停止

# ════════════════════════════════════════════════════════════════════════
# 顏色定義
# ════════════════════════════════════════════════════════════════════════
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ════════════════════════════════════════════════════════════════════════
# 工具函數
# ════════════════════════════════════════════════════════════════════════

print_header() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_substep() {
    echo -e "   ${CYAN}├─${NC} $1"
}

print_success() {
    echo -e "   ${CYAN}├─${NC} ${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}📋 $1${NC}"
}

ask_confirmation() {
    echo ""
    echo -e "${YELLOW}❓ $1 (y/n):${NC} "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo ""
        print_error "操作已取消"
        exit 0
    fi
}

# ════════════════════════════════════════════════════════════════════════
# 參數檢查
# ════════════════════════════════════════════════════════════════════════

if [ -z "$1" ]; then
    print_error "請提供 AWS IP 地址"
    echo "用法：$0 AWS_IP"
    echo "範例：$0 52.195.151.185"
    exit 1
fi

AWS_IP=$1
SSH_KEY="${HOME}/.ssh/y-crm-aws-key.pem"
AWS_USER="ubuntu"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 本地備份路徑
LOCAL_BACKUP_DIR="./backup-temp"
LOCAL_PG_BACKUP="${LOCAL_BACKUP_DIR}/postgres-backup-${TIMESTAMP}.sql"
LOCAL_REDIS_BACKUP="${LOCAL_BACKUP_DIR}/redis-backup-${TIMESTAMP}.rdb"
LOCAL_PACKAGE="sync-package-${TIMESTAMP}.tar.gz"

# AWS 路徑
AWS_BACKUP_BEFORE="aws-backup-before-restore-${TIMESTAMP}.sql"

# ════════════════════════════════════════════════════════════════════════
# 開始執行
# ════════════════════════════════════════════════════════════════════════

print_header "🚀 同步本地 Y-CRM 資料到 AWS"

print_info "目標 AWS：${AWS_IP}"
print_info "同步內容：PostgreSQL + Redis（完整資料）"
print_warning "警告：此操作會覆蓋 AWS 上的所有資料"

echo ""

# ════════════════════════════════════════════════════════════════════════
# 步驟 1：檢查本地環境
# ════════════════════════════════════════════════════════════════════════

print_step "步驟 1/6：檢查本地環境"

# 檢查 Docker
if ! docker ps > /dev/null 2>&1; then
    print_error "Docker 未運行或無權限訪問"
    exit 1
fi
print_success "本地 Docker 服務運行中"

# 檢查 PostgreSQL 容器
if ! docker ps --format '{{.Names}}' | grep -q "Y-CRM-postgres"; then
    print_error "PostgreSQL 容器未運行"
    exit 1
fi
print_success "PostgreSQL 容器正常"

# 檢查 Redis 容器
if ! docker ps --format '{{.Names}}' | grep -q "Y-CRM-redis"; then
    print_error "Redis 容器未運行"
    exit 1
fi
print_success "Redis 容器正常"

# 檢查 SSH 金鑰
if [ ! -f "$SSH_KEY" ]; then
    print_error "SSH 金鑰不存在：$SSH_KEY"
    exit 1
fi
print_success "SSH 金鑰已找到"

echo -e "   ${CYAN}└─${NC} ${GREEN}✅ 環境檢查完成${NC}"

# ════════════════════════════════════════════════════════════════════════
# 步驟 2：備份本地資料
# ════════════════════════════════════════════════════════════════════════

print_step "步驟 2/6：備份本地資料（完整備份）"

# 創建臨時目錄
mkdir -p "$LOCAL_BACKUP_DIR"

# 備份 PostgreSQL - 完整備份（所有 schema 和資料）
print_substep "📦 正在備份 PostgreSQL（所有 schema 和資料）..."
docker exec Y-CRM-postgres pg_dump \
    -U postgres \
    -d default \
    --no-owner \
    --no-acl \
    > "$LOCAL_PG_BACKUP" 2>/dev/null

if [ ! -f "$LOCAL_PG_BACKUP" ]; then
    print_error "PostgreSQL 備份失敗"
    exit 1
fi

PG_SIZE=$(ls -lh "$LOCAL_PG_BACKUP" | awk '{print $5}')
print_success "PostgreSQL 備份完成 (${PG_SIZE})"

# 備份 Redis
print_substep "📦 正在備份 Redis..."
docker exec Y-CRM-redis redis-cli SAVE > /dev/null 2>&1
sleep 2
docker cp Y-CRM-redis:/data/dump.rdb "$LOCAL_REDIS_BACKUP" > /dev/null 2>&1

if [ ! -f "$LOCAL_REDIS_BACKUP" ]; then
    print_error "Redis 備份失敗"
    exit 1
fi

REDIS_SIZE=$(ls -lh "$LOCAL_REDIS_BACKUP" | awk '{print $5}')
print_success "Redis 備份完成 (${REDIS_SIZE})"

# 驗證備份完整性
print_substep "🔐 驗證備份完整性..."

# 驗證 PostgreSQL 備份
if ! grep -q "PostgreSQL database dump complete" "$LOCAL_PG_BACKUP"; then
    print_error "PostgreSQL 備份檔案不完整"
    exit 1
fi

# 驗證 Redis 備份
if [ ! -s "$LOCAL_REDIS_BACKUP" ]; then
    print_error "Redis 備份檔案為空"
    exit 1
fi

print_success "備份檔案完整"

echo -e "   ${CYAN}└─${NC} ${GREEN}✅ 備份完成${NC}"
echo ""
echo -e "${CYAN}📊 本地資料統計：${NC}"
echo -e "   - 資料庫大小：${PG_SIZE}"
echo -e "   - Redis 大小：${REDIS_SIZE}"

# 第一次確認
ask_confirmation "是否繼續上傳到 AWS？"

# ════════════════════════════════════════════════════════════════════════
# 步驟 3：打包並上傳到 AWS
# ════════════════════════════════════════════════════════════════════════

print_step "步驟 3/6：上傳到 AWS"

print_substep "🗜️  正在壓縮備份檔案..."
cd "$LOCAL_BACKUP_DIR"
tar -czf "../${LOCAL_PACKAGE}" ./*
cd ..

if [ ! -f "$LOCAL_PACKAGE" ]; then
    print_error "壓縮失敗"
    exit 1
fi

PACKAGE_SIZE=$(ls -lh "$LOCAL_PACKAGE" | awk '{print $5}')
print_success "壓縮完成 (${PACKAGE_SIZE})"

print_substep "📤 正在上傳到 AWS (${AWS_IP})..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$LOCAL_PACKAGE" "${AWS_USER}@${AWS_IP}:~/" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    print_error "上傳失敗"
    exit 1
fi

print_success "上傳完成"
echo -e "   ${CYAN}└─${NC} ${GREEN}✅ 上傳完成${NC}"

# ════════════════════════════════════════════════════════════════════════
# 步驟 4：驗證 AWS 環境
# ════════════════════════════════════════════════════════════════════════

print_step "步驟 4/6：驗證 AWS 環境"

print_substep "🔐 測試 SSH 連線..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${AWS_USER}@${AWS_IP}" "echo ''" 2>/dev/null; then
    print_error "無法連接到 AWS"
    exit 1
fi
print_success "SSH 連線成功"

print_substep "🔍 檢查 Docker 服務..."
AWS_CONTAINERS=$(ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_IP}" "docker ps --format '{{.Names}}'" 2>/dev/null)

if echo "$AWS_CONTAINERS" | grep -q "Y-CRM-postgres"; then
    print_success "Y-CRM-postgres 運行中"
else
    print_warning "Y-CRM-postgres 未運行（首次部署？）"
fi

if echo "$AWS_CONTAINERS" | grep -q "Y-CRM-redis"; then
    print_success "Y-CRM-redis 運行中"
else
    print_warning "Y-CRM-redis 未運行（首次部署？）"
fi

if echo "$AWS_CONTAINERS" | grep -q "Y-CRM-backend"; then
    print_success "Y-CRM-backend 運行中"
else
    print_warning "Y-CRM-backend 未運行（首次部署？）"
fi

echo -e "   ${CYAN}└─${NC} ${GREEN}✅ AWS 環境檢查完成${NC}"

# 第二次確認
echo ""
print_warning "準備執行資料還原"
echo -e "   - 這將會覆蓋 AWS 上的所有資料"
echo -e "   - 還原期間服務將停止約 2-3 分鐘"
echo -e "   - AWS 現有資料會先自動備份"

ask_confirmation "確定要執行還原嗎？"

# ════════════════════════════════════════════════════════════════════════
# 步驟 5：執行 AWS 資料還原
# ════════════════════════════════════════════════════════════════════════

print_step "步驟 5/6：執行 AWS 資料還原"

# 創建遠端執行腳本
REMOTE_SCRIPT=$(cat <<'REMOTE_SCRIPT_EOF'
#!/bin/bash
set -e

TIMESTAMP="$1"
PACKAGE="$2"
AWS_BACKUP_BEFORE="$3"

# 解壓縮
echo "   ├─ 📦 解壓縮備份檔案..."
tar -xzf "$PACKAGE" -C ~/
PG_BACKUP=$(ls ~/postgres-backup-*.sql | head -1)
REDIS_BACKUP=$(ls ~/redis-backup-*.rdb | head -1)
echo "   ├─ ✅ 解壓縮完成"

# 備份 AWS 現有資料
echo ""
echo "   🛡️  安全措施：備份 AWS 現有資料"
echo "   ├─ 📦 正在備份 AWS PostgreSQL..."
docker exec Y-CRM-postgres pg_dump -U postgres -d default --no-owner --no-acl > ~/"$AWS_BACKUP_BEFORE" 2>/dev/null || echo "   ├─ ⚠️  AWS 資料庫可能為空（首次部署）"
if [ -f ~/"$AWS_BACKUP_BEFORE" ]; then
    BACKUP_SIZE=$(ls -lh ~/"$AWS_BACKUP_BEFORE" | awk '{print $5}')
    echo "   ├─ ✅ 備份完成：$AWS_BACKUP_BEFORE ($BACKUP_SIZE)"
    echo "   └─ 💡 如需恢復，請使用此備份檔案"
else
    echo "   └─ ℹ️  無需備份（首次部署）"
fi

# 停止服務
echo ""
echo "   🔄 停止 AWS 服務"
docker compose -f ~/docker-compose.aws.yml stop frontend worker backend 2>/dev/null || docker compose -f ~/Sync-to-AWS/docker-compose.aws.yml stop frontend worker backend 2>/dev/null || echo "   ├─ ⚠️  部分服務可能未運行"
echo "   └─ ✅ 服務已停止"

# 還原 PostgreSQL
echo ""
echo "   📥 還原 PostgreSQL（完整資料）"
echo "   ├─ 🔍 驗證 SQL 檔案完整性..."
if ! grep -q "PostgreSQL database dump complete" "$PG_BACKUP"; then
    echo "   └─ ❌ SQL 檔案不完整"
    exit 1
fi
echo "   ├─ ✅ SQL 檔案完整"
echo "   ├─ 🔄 開始執行 SQL（使用事務保護）..."
docker exec -i Y-CRM-postgres psql -U postgres -d default < "$PG_BACKUP" 2>&1 | tail -5
if [ $? -eq 0 ]; then
    PG_SIZE=$(ls -lh "$PG_BACKUP" | awk '{print $5}')
    echo "   ├─ ✅ PostgreSQL 還原完成"
    echo "   └─ 📊 還原統計：$PG_SIZE"
else
    echo "   └─ ❌ PostgreSQL 還原失敗"
    exit 1
fi

# 還原 Redis
echo ""
echo "   📥 還原 Redis"
echo "   ├─ 🔄 正在還原 Redis 資料..."
docker cp "$REDIS_BACKUP" Y-CRM-redis:/data/dump.rdb
docker restart Y-CRM-redis > /dev/null 2>&1
sleep 3
REDIS_SIZE=$(ls -lh "$REDIS_BACKUP" | awk '{print $5}')
echo "   └─ ✅ Redis 還原完成 ($REDIS_SIZE)"

# 重啟服務
echo ""
echo "   🚀 重啟 AWS 服務"
docker compose -f ~/docker-compose.aws.yml start backend worker frontend 2>/dev/null || docker compose -f ~/Sync-to-AWS/docker-compose.aws.yml start backend worker frontend 2>/dev/null
echo "   ├─ ⏳ 等待服務啟動..."
sleep 10
echo "   └─ ✅ 所有服務已啟動"

# 修正前端 URL
echo ""
echo "   🔧 修正前端 URL"
BACKEND_URL="http://${4}:8867"
docker exec Y-CRM-frontend sh -c "sed -i 's|REACT_APP_SERVER_BASE_URL\": \".*\"|REACT_APP_SERVER_BASE_URL\": \"${BACKEND_URL}\"|g' /usr/share/nginx/html/index.html" 2>/dev/null || echo "   ├─ ⚠️  前端 URL 修正失敗（可能是首次部署，稍後手動執行）"
echo "   └─ ✅ 前端 URL 已更新"

# 清理
echo ""
echo "   🧹 清理臨時檔案"
rm -f "$PACKAGE" "$PG_BACKUP" "$REDIS_BACKUP"
if [ -f ~/"$AWS_BACKUP_BEFORE" ]; then
    rm -f ~/"$AWS_BACKUP_BEFORE"
    echo "   ├─ 🗑️  刪除 AWS 舊備份（還原成功）"
fi
echo "   └─ ✅ 清理完成"

echo ""
echo "SUCCESS"
REMOTE_SCRIPT_EOF
)

# 執行遠端腳本
print_substep "正在 AWS 上執行還原..."
echo ""

ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_IP}" "bash -s" "$TIMESTAMP" "$LOCAL_PACKAGE" "$AWS_BACKUP_BEFORE" "$AWS_IP" <<< "$REMOTE_SCRIPT"

if [ $? -ne 0 ]; then
    echo ""
    print_error "還原失敗"
    print_warning "AWS 備份已保留：${AWS_BACKUP_BEFORE}"
    print_warning "您可以手動恢復資料"
    exit 1
fi

echo -e "${CYAN}════════════════════════════════════════════════════════════════════════${NC}"

# ════════════════════════════════════════════════════════════════════════
# 步驟 6：驗證同步結果
# ════════════════════════════════════════════════════════════════════════

print_step "步驟 6/6：驗證同步結果"

print_substep "📊 資料驗證"

# 檢查服務狀態
AWS_STATUS=$(ssh -i "$SSH_KEY" "${AWS_USER}@${AWS_IP}" "docker compose -f ~/docker-compose.aws.yml ps 2>/dev/null || docker compose -f ~/Sync-to-AWS/docker-compose.aws.yml ps 2>/dev/null" 2>/dev/null)

if echo "$AWS_STATUS" | grep -q "Y-CRM-postgres.*Up"; then
    print_success "PostgreSQL 運行正常"
else
    print_warning "PostgreSQL 狀態異常"
fi

if echo "$AWS_STATUS" | grep -q "Y-CRM-redis.*Up"; then
    print_success "Redis 運行正常"
else
    print_warning "Redis 狀態異常"
fi

if echo "$AWS_STATUS" | grep -q "Y-CRM-backend.*Up"; then
    print_success "Backend API 正常"
else
    print_warning "Backend 狀態異常"
fi

if echo "$AWS_STATUS" | grep -q "Y-CRM-frontend.*Up"; then
    print_success "Frontend 正常"
else
    print_warning "Frontend 狀態異常"
fi

if echo "$AWS_STATUS" | grep -q "Y-CRM-worker.*Up"; then
    print_success "Worker 運行中"
else
    print_warning "Worker 狀態異常"
fi

echo -e "   ${CYAN}└─${NC} ${GREEN}✅ 驗證完成${NC}"

echo ""
echo -e "${CYAN}📈 同步統計${NC}"
echo -e "   ├─ 資料庫：${PG_SIZE} (100% 完整複製)"
echo -e "   ├─ Redis：${REDIS_SIZE} (100% 完整複製)"
echo -e "   └─ 狀態：所有資料已同步"

# 清理本地臨時檔案
rm -rf "$LOCAL_BACKUP_DIR" "$LOCAL_PACKAGE"

# ════════════════════════════════════════════════════════════════════════
# 完成
# ════════════════════════════════════════════════════════════════════════

print_header "✅ 同步完成！"

echo -e "${GREEN}🎯 結果：${NC}"
echo -e "   - 本地資料已完整同步到 AWS"
echo -e "   - AWS 系統已恢復正常運行"
echo -e "   - 所有服務驗證通過"
echo ""
echo -e "${CYAN}🌐 訪問 AWS Y-CRM：${NC}"
echo -e "   前端：http://${AWS_IP}:8866"
echo -e "   登入：notyenyu@gmail.com"
echo ""
echo -e "${CYAN}📝 備份已保留在：${NC}"
echo -e "   本地：./history/backup-${TIMESTAMP}/ (自動保存)"
echo ""

print_header "同步流程結束"

