#!/bin/bash

###############################################################################
# Twenty CRM - 數據庫清理腳本
# 用途：清理演示數據，只保留真實用戶和業務數據
# 使用場景：部署到新環境（AWS/其他雲服務）後執行
###############################################################################

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置變數（根據實際環境修改）
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-twenty-db-test}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-default}"
WORKSPACE_SCHEMA="${WORKSPACE_SCHEMA:-workspace_1wgvd1injqtife6y4rvfbu3h5}"

# 要保留的用戶 email
KEEP_USER_EMAIL="${KEEP_USER_EMAIL:-notyenyu@gmail.com}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Twenty CRM 數據庫清理工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 檢查 Docker 容器是否運行
echo -e "${YELLOW}🔍 檢查 Docker 容器...${NC}"
if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
    echo -e "${RED}❌ 錯誤: 找不到運行中的容器 '$DB_CONTAINER_NAME'${NC}"
    echo -e "${YELLOW}💡 提示: 請先啟動 Docker Compose${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 容器運行正常${NC}"
echo ""

# 顯示當前用戶數量
echo -e "${YELLOW}📊 檢查當前數據庫狀態...${NC}"
TOTAL_USERS=$(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM core.\"user\";")
DEMO_USERS=$(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM core.\"user\" WHERE email LIKE '%@apple.dev';")
echo -e "   總用戶數: ${BLUE}$TOTAL_USERS${NC}"
echo -e "   演示用戶數: ${BLUE}$DEMO_USERS${NC}"
echo ""

# 列出所有 workspace schemas
echo -e "${YELLOW}📊 檢查 workspace schemas...${NC}"
docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT schemaname
FROM pg_catalog.pg_namespace
WHERE nspname LIKE 'workspace_%';
"
echo ""

# 詢問用戶確認
echo -e "${YELLOW}⚠️  警告: 此操作將：${NC}"
echo -e "   1. 刪除所有演示用戶 (@apple.dev)"
echo -e "   2. 刪除多餘的 workspace schemas"
echo -e "   3. 只保留用戶: ${GREEN}$KEEP_USER_EMAIL${NC}"
echo ""
read -p "確定要繼續嗎？(y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 操作已取消${NC}"
    exit 0
fi
echo ""

# 備份當前數據庫（可選）
echo -e "${YELLOW}💾 是否要先備份當前數據庫？${NC}"
read -p "建議備份以防萬一 (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BACKUP_FILE="$HOME/twenty-backup-before-clean-$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${BLUE}📦 備份到: $BACKUP_FILE${NC}"
    docker exec "$DB_CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"
    echo -e "${GREEN}✅ 備份完成${NC}"
    echo ""
fi

# ==================== 步驟 1: 找出並刪除多餘的 workspace schemas ====================
echo -e "${BLUE}步驟 1: 清理多餘的 workspace schemas${NC}"
echo -e "${BLUE}==========================================${NC}"

# 獲取所有 workspace schemas
SCHEMAS=$(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT nspname
FROM pg_catalog.pg_namespace
WHERE nspname LIKE 'workspace_%'
  AND nspname != '$WORKSPACE_SCHEMA';
")

if [ -z "$SCHEMAS" ]; then
    echo -e "${GREEN}✅ 沒有多餘的 workspace schemas${NC}"
else
    echo -e "${YELLOW}🗑️  找到多餘的 schemas:${NC}"
    echo "$SCHEMAS"

    for schema in $SCHEMAS; do
        schema=$(echo $schema | xargs)  # 去除空白
        if [ ! -z "$schema" ]; then
            echo -e "${YELLOW}   刪除 schema: $schema${NC}"
            docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
            DROP SCHEMA IF EXISTS $schema CASCADE;
            "
        fi
    done
    echo -e "${GREEN}✅ 多餘的 schemas 已刪除${NC}"
fi
echo ""

# ==================== 步驟 2: 刪除演示用戶 ====================
echo -e "${BLUE}步驟 2: 刪除演示用戶 (@apple.dev)${NC}"
echo -e "${BLUE}==========================================${NC}"

DELETED_DEMO=$(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
DELETE FROM core.\"user\"
WHERE email LIKE '%@apple.dev'
RETURNING id;
" | wc -l)

echo -e "${GREEN}✅ 已刪除 $DELETED_DEMO 個演示用戶${NC}"
echo ""

# ==================== 步驟 3: 獲取要保留的用戶列表 ====================
echo -e "${BLUE}步驟 3: 列出當前所有用戶${NC}"
echo -e "${BLUE}==========================================${NC}"

docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
    email,
    \"firstName\",
    \"lastName\",
    \"createdAt\"
FROM core.\"user\"
ORDER BY \"createdAt\";
"
echo ""

# 詢問要保留哪些用戶
echo -e "${YELLOW}📝 請輸入要保留的用戶 emails (用逗號分隔，預設只保留 $KEEP_USER_EMAIL):${NC}"
read -p "保留用戶: " KEEP_USERS
if [ -z "$KEEP_USERS" ]; then
    KEEP_USERS="$KEEP_USER_EMAIL"
fi
echo ""

# ==================== 步驟 4: 刪除不需要的用戶 ====================
echo -e "${BLUE}步驟 4: 刪除不需要的用戶${NC}"
echo -e "${BLUE}==========================================${NC}"

# 將逗號分隔的 emails 轉換為 SQL IN 格式
IFS=',' read -ra EMAILS <<< "$KEEP_USERS"
SQL_EMAILS=""
for email in "${EMAILS[@]}"; do
    email=$(echo $email | xargs)  # 去除空白
    if [ -z "$SQL_EMAILS" ]; then
        SQL_EMAILS="'$email'"
    else
        SQL_EMAILS="$SQL_EMAILS, '$email'"
    fi
done

# 先從 workspace 成員表刪除
echo -e "${YELLOW}🗑️  從 workspace 成員表刪除不需要的用戶...${NC}"
docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
DELETE FROM $WORKSPACE_SCHEMA.\"workspaceMember\"
WHERE \"userEmail\" NOT IN ($SQL_EMAILS);
"

# 再從用戶表刪除
echo -e "${YELLOW}🗑️  從用戶表刪除不需要的用戶...${NC}"
DELETED_USERS=$(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
DELETE FROM core.\"user\"
WHERE email NOT IN ($SQL_EMAILS)
RETURNING id;
" | wc -l)

echo -e "${GREEN}✅ 已刪除 $DELETED_USERS 個不需要的用戶${NC}"
echo ""

# ==================== 步驟 5: 確保保留的用戶都在 workspace 中 ====================
echo -e "${BLUE}步驟 5: 確保保留的用戶都在 workspace 中${NC}"
echo -e "${BLUE}==========================================${NC}"

# 找出不在 workspace 中的用戶
USERS_NOT_IN_WORKSPACE=$(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT u.id, u.email
FROM core.\"user\" u
WHERE NOT EXISTS (
    SELECT 1
    FROM $WORKSPACE_SCHEMA.\"workspaceMember\" wm
    WHERE wm.\"userId\" = u.id
);
")

if [ -z "$USERS_NOT_IN_WORKSPACE" ]; then
    echo -e "${GREEN}✅ 所有用戶都已在 workspace 中${NC}"
else
    echo -e "${YELLOW}➕ 將用戶添加到 workspace...${NC}"

    # 讀取用戶 ID 和 email，並添加到 workspace
    while IFS='|' read -r user_id email; do
        user_id=$(echo $user_id | xargs)
        email=$(echo $email | xargs)

        if [ ! -z "$user_id" ]; then
            echo -e "${YELLOW}   添加用戶: $email${NC}"
            docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
            INSERT INTO $WORKSPACE_SCHEMA.\"workspaceMember\" (
                id,
                \"userId\",
                \"userEmail\",
                \"nameFirstName\",
                \"nameLastName\",
                \"locale\",
                \"avatarUrl\",
                \"colorScheme\",
                \"dateFormat\",
                \"timeFormat\",
                \"timeZone\",
                \"createdAt\",
                \"updatedAt\",
                \"deletedAt\"
            )
            SELECT
                gen_random_uuid(),
                '$user_id',
                '$email',
                '',
                '',
                'en',
                '',
                'System',
                'SYSTEM',
                'SYSTEM',
                'system',
                NOW(),
                NOW(),
                NULL
            WHERE NOT EXISTS (
                SELECT 1 FROM $WORKSPACE_SCHEMA.\"workspaceMember\" WHERE \"userId\" = '$user_id'
            );
            "
        fi
    done <<< "$USERS_NOT_IN_WORKSPACE"

    echo -e "${GREEN}✅ 用戶已添加到 workspace${NC}"
fi
echo ""

# ==================== 步驟 6: 顯示最終結果 ====================
echo -e "${BLUE}步驟 6: 驗證最終結果${NC}"
echo -e "${BLUE}==========================================${NC}"

echo -e "${YELLOW}📊 最終用戶列表:${NC}"
docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
    u.email,
    u.\"firstName\",
    u.\"lastName\",
    CASE WHEN wm.id IS NOT NULL THEN '✅' ELSE '❌' END as in_workspace
FROM core.\"user\" u
LEFT JOIN $WORKSPACE_SCHEMA.\"workspaceMember\" wm ON wm.\"userId\" = u.id
ORDER BY u.\"createdAt\";
"
echo ""

# ==================== 完成 ====================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 數據庫清理完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 後續步驟:${NC}"
echo -e "   1. 重啟 Docker 服務讓修改生效"
echo -e "   2. 測試登入功能"
echo -e "   3. 如果滿意，可以備份這個乾淨的數據庫"
echo ""
echo -e "${BLUE}備份指令:${NC}"
echo -e "   docker exec $DB_CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > ~/twenty-clean-db-\$(date +%Y%m%d).sql"
echo ""

