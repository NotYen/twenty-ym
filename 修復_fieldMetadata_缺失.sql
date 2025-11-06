-- ==========================================
-- Twenty CRM - 手動新增 FieldMetadata 修復模板
-- ==========================================
-- 用途：當遠程更新新增欄位但 metadata sync 失敗時使用
-- 日期：2025-11-06
-- 最近使用：修復 lastCredentialsRefreshedAt 欄位
-- ==========================================

-- 使用說明：
-- 1. 替換 [OBJECT_NAME] 為物件名稱（例如：connectedAccount）
-- 2. 替換 [FIELD_NAME] 為欄位名稱（例如：lastCredentialsRefreshedAt）
-- 3. 替換 [FIELD_TYPE] 為欄位類型（例如：DATE_TIME, TEXT, NUMBER）
-- 4. 替換 [LABEL] 為顯示標籤（例如：Last credentials refreshed at）
-- 5. 執行 SQL
-- 6. 執行 redis-cli FLUSHALL
-- 7. 重啟服務

\echo '=========================================='
\echo '🔧 新增 FieldMetadata'
\echo '=========================================='
\echo ''

-- 步驟 1：查找 objectMetadata ID
\echo '步驟 1: 查找目標物件的 objectMetadata ID...'
SELECT
    id as "Object ID",
    "nameSingular" as "Object Name"
FROM core."objectMetadata"
WHERE "workspaceId" = '3be9d202-5461-4881-a6de-4c1f96e4b02d'
  AND "nameSingular" = '[OBJECT_NAME]';  -- ← 替換這裡

\echo ''

-- 步驟 2：檢查欄位是否已存在
\echo '步驟 2: 檢查 fieldMetadata 是否已存在...'
SELECT
    fm.id,
    fm.name,
    fm.type
FROM core."fieldMetadata" fm
JOIN core."objectMetadata" om ON om.id = fm."objectMetadataId"
WHERE om."nameSingular" = '[OBJECT_NAME]'  -- ← 替換這裡
  AND om."workspaceId" = '3be9d202-5461-4881-a6de-4c1f96e4b02d'
  AND fm.name = '[FIELD_NAME]';  -- ← 替換這裡

\echo ''

-- 步驟 3：新增 fieldMetadata（如果不存在）
\echo '步驟 3: 新增 fieldMetadata...'
\echo '⚠️  請確認上面沒有結果才執行以下 INSERT'
\echo ''

/*
INSERT INTO core."fieldMetadata" (
    id,
    "objectMetadataId",
    "workspaceId",
    type,
    name,
    label,
    description,
    icon,
    "isCustom",
    "isActive",
    "isSystem",
    "isNullable",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    om.id,
    '3be9d202-5461-4881-a6de-4c1f96e4b02d',
    '[FIELD_TYPE]',  -- ← 替換：DATE_TIME, TEXT, NUMBER, BOOLEAN, RELATION 等
    '[FIELD_NAME]',  -- ← 替換：欄位名稱
    '[LABEL]',       -- ← 替換：顯示標籤
    '[LABEL]',       -- ← 替換：描述
    'IconHistory',   -- ← 可選：修改圖示
    false,
    true,
    false,
    true,
    NOW(),
    NOW()
FROM core."objectMetadata" om
WHERE om."nameSingular" = '[OBJECT_NAME]'  -- ← 替換這裡
  AND om."workspaceId" = '3be9d202-5461-4881-a6de-4c1f96e4b02d'
RETURNING id, name, type;
*/

\echo ''
\echo '=========================================='
\echo '✅ 完成！請執行以下步驟：'
\echo '   1. redis-cli FLUSHALL'
\echo '   2. 重啟 Twenty CRM 服務'
\echo '   3. 測試功能'
\echo '=========================================='

-- ==========================================
-- 常用欄位類型參考
-- ==========================================
/*
DATE_TIME   - 日期時間
TEXT        - 文字
NUMBER      - 數字
BOOLEAN     - 布林值
UUID        - UUID
RELATION    - 關聯
SELECT      - 下拉選單
MULTI_SELECT - 多選
CURRENCY    - 貨幣
EMAIL       - 電子郵件
PHONE       - 電話
URL         - 網址
*/

-- ==========================================
-- 成功案例：lastCredentialsRefreshedAt
-- ==========================================
/*
物件：connectedAccount
欄位：lastCredentialsRefreshedAt
類型：DATE_TIME
標籤：Last credentials refreshed at

執行結果：✅ Google 同步成功
日期：2025-11-06
*/

