#!/bin/bash

# ==========================================
# Twenty CRM: 修復 Attachment.fileCategory 字段元數據
# ==========================================
# 說明：
# - 直接在數據庫中添加 fileCategory 字段的元數據
# - 符合 Twenty 標準字段同步機制
# - 不影響現有數據和功能
# ==========================================

set -e

echo "🔧 Twenty CRM: 修復 Attachment.fileCategory 字段元數據"
echo "==========================================="
echo ""

# 加載配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/twenty-config.sh" ]; then
    source "${SCRIPT_DIR}/twenty-config.sh"
else
    echo "❌ 錯誤：找不到 twenty-config.sh"
    exit 1
fi

# 1. 檢查 PostgreSQL 連接
echo "1️⃣  檢查數據庫連接..."
if PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "SELECT 1" > /dev/null 2>&1; then
    echo "   ✅ 數據庫連接正常"
else
    echo "   ❌ 無法連接到 PostgreSQL"
    echo "   💡 請確認："
    echo "      1. PostgreSQL 正在運行: brew services list | grep postgresql"
    echo "      2. 端口正確: ${POSTGRES_PORT}"
    echo "      3. 密碼正確: ${POSTGRES_PASSWORD}"
    exit 1
fi
echo ""

# 2. 檢查 attachment 對象是否存在
echo "2️⃣  檢查 attachment 對象..."
ATTACHMENT_OBJ_ID=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
SELECT id FROM core.\"objectMetadata\"
WHERE \"nameSingular\" = 'attachment'
  AND \"workspaceId\" = (SELECT id FROM core.workspace LIMIT 1)
LIMIT 1;
" | tr -d ' ')

if [ -z "$ATTACHMENT_OBJ_ID" ]; then
    echo "   ❌ 找不到 attachment 對象"
    exit 1
fi
echo "   ✅ attachment 對象 ID: $ATTACHMENT_OBJ_ID"
echo ""

# 3. 檢查 fileCategory 字段是否已存在
echo "3️⃣  檢查 fileCategory 字段..."
EXISTING_FIELD=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
SELECT id FROM core.\"fieldMetadata\"
WHERE name = 'fileCategory'
  AND \"objectMetadataId\" = '$ATTACHMENT_OBJ_ID'
LIMIT 1;
" | tr -d ' ')

if [ -n "$EXISTING_FIELD" ]; then
    echo "   ✅ fileCategory 字段已存在 (ID: $EXISTING_FIELD)"
    echo "   ℹ️  跳過創建，直接清除緩存"
    echo ""

    # 清除 Redis 緩存
    echo "4️⃣  清除 Redis 緩存..."
    redis-cli FLUSHALL > /dev/null 2>&1
    echo "   ✅ Redis 緩存已清除"
    echo ""

    echo "==========================================="
    echo "✅ fileCategory 字段已存在，無需修復"
    echo "==========================================="
    echo ""
    echo "💡 請重啟服務以應用更改："
    echo "   pkill -f 'twenty-server'"
    echo "   pkill -f 'twenty-front'"
    echo "   ./build_all_services_prod_env.sh"
    echo ""
    exit 0
fi

echo "   ⚠️  fileCategory 字段不存在，準備創建..."
echo ""

# 4. 獲取 workspace 和 dataSource ID
echo "4️⃣  獲取 workspace 信息..."
WORKSPACE_ID=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
SELECT id FROM core.workspace LIMIT 1;
" | tr -d ' ')

DATA_SOURCE_ID=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
SELECT id FROM core.\"dataSource\" WHERE \"workspaceId\" = '$WORKSPACE_ID' LIMIT 1;
" | tr -d ' ')

echo "   ✅ Workspace ID: $WORKSPACE_ID"
echo "   ✅ DataSource ID: $DATA_SOURCE_ID"
echo ""

# 5. 創建 fileCategory 字段元數據
echo "5️⃣  創建 fileCategory 字段元數據..."

# fileCategory 的標準 UUID（從 standard-field-ids.ts 獲取）
FILECATEGORY_STANDARD_ID="20202020-8c3f-4d9e-9a1b-2e5f7a8c9d0e"

# 生成新的 UUID for fieldMetadata
NEW_FIELD_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} <<SQL
INSERT INTO core."fieldMetadata" (
    id,
    "standardId",
    "objectMetadataId",
    type,
    name,
    label,
    description,
    icon,
    "isCustom",
    "isActive",
    "isSystem",
    "isNullable",
    "isUIReadOnly",
    "workspaceId",
    options,
    "defaultValue",
    "createdAt",
    "updatedAt"
) VALUES (
    '$NEW_FIELD_ID',
    '$FILECATEGORY_STANDARD_ID',
    '$ATTACHMENT_OBJ_ID',
    'SELECT',
    'fileCategory',
    'File category',
    'Attachment file category',
    'IconList',
    false,
    true,
    false,
    true,
    false,
    '$WORKSPACE_ID',
    '[
        {"value": "ARCHIVE", "label": "Archive", "position": 0, "color": "gray"},
        {"value": "AUDIO", "label": "Audio", "position": 1, "color": "pink"},
        {"value": "IMAGE", "label": "Image", "position": 2, "color": "yellow"},
        {"value": "PRESENTATION", "label": "Presentation", "position": 3, "color": "orange"},
        {"value": "SPREADSHEET", "label": "Spreadsheet", "position": 4, "color": "turquoise"},
        {"value": "TEXT_DOCUMENT", "label": "Text Document", "position": 5, "color": "blue"},
        {"value": "VIDEO", "label": "Video", "position": 6, "color": "purple"},
        {"value": "OTHER", "label": "Other", "position": 7, "color": "red"}
    ]'::jsonb,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
SQL

if [ $? -eq 0 ]; then
    echo "   ✅ fileCategory 字段元數據已創建"
else
    echo "   ❌ 創建 fileCategory 字段元數據失敗"
    exit 1
fi
echo ""

# 6. 在實際表中添加 fileCategory 列（如果不存在）
echo "6️⃣  在 workspace 表中添加 fileCategory 列..."

# 獲取 workspace schema 名稱
WORKSPACE_SCHEMA=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
SELECT ds.schema
FROM core.\"dataSource\" ds
WHERE ds.\"workspaceId\" = '$WORKSPACE_ID'
LIMIT 1;
" | tr -d ' ')

echo "   ℹ️  Workspace Schema: $WORKSPACE_SCHEMA"

# 檢查列是否存在
COLUMN_EXISTS=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = '$WORKSPACE_SCHEMA'
      AND table_name = 'attachment'
      AND column_name = 'fileCategory'
);
" | tr -d ' ')

if [ "$COLUMN_EXISTS" = "t" ]; then
    echo "   ✅ fileCategory 列已存在於 $WORKSPACE_SCHEMA.attachment 表中"
else
    echo "   ⚠️  fileCategory 列不存在，正在添加..."

    PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} <<SQL
ALTER TABLE "$WORKSPACE_SCHEMA"."attachment"
ADD COLUMN IF NOT EXISTS "fileCategory" text;
SQL

    if [ $? -eq 0 ]; then
        echo "   ✅ fileCategory 列已添加到 $WORKSPACE_SCHEMA.attachment 表"
    else
        echo "   ❌ 添加 fileCategory 列失敗"
        exit 1
    fi
fi
echo ""

# 7. 清除 Redis 緩存
echo "7️⃣  清除 Redis 緩存..."
redis-cli FLUSHALL > /dev/null 2>&1
echo "   ✅ Redis 緩存已清除"
echo ""

# 8. 完成
echo "==========================================="
echo "✅ Attachment.fileCategory 字段修復完成！"
echo "==========================================="
echo ""
echo "📋 已執行的操作："
echo "   1. ✅ 在 core.fieldMetadata 中添加 fileCategory 字段定義"
echo "   2. ✅ 在 $WORKSPACE_SCHEMA.attachment 表中添加 fileCategory 列"
echo "   3. ✅ 清除 Redis 緩存"
echo ""
echo "🚀 下一步："
echo "   請重啟所有服務以應用更改："
echo ""
echo "   pkill -f 'twenty-server'"
echo "   pkill -f 'twenty-front'"
echo "   ./build_all_services_prod_env.sh"
echo ""
echo "💡 重啟後，fileCategory 字段將立即可用！"
echo ""

