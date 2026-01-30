-- 修正所有新增欄位的 nullable 和 default 值
-- 確保與 AWS 環境完全一致

\set SCHEMA 'workspace_3joxkr9ofo5hlxjan164egffx'

-- ==========================================
-- person 表：已修正 lianLuoDianHuaFenJi 和 lineId
-- ==========================================
\echo '檢查 person 表的欄位屬性...'
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = :'SCHEMA'
  AND table_name = 'person'
  AND column_name IN (
    'lianLuoDianHuaFenJi',
    'lineId',
    'line',
    'shouJiHaoMaPrimaryPhoneNumber',
    'lineUserId',
    'lineDisplayName',
    'lineProfilePictureUrl',
    'dianZiYouJianEmailPrimaryEmail'
  )
ORDER BY column_name;

-- ==========================================
-- opportunity 表：檢查新增欄位
-- ==========================================
\echo ''
\echo '檢查 opportunity 表的欄位屬性...'
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = :'SCHEMA'
  AND table_name = 'opportunity'
  AND column_name IN ('chengAnLu', 'yuJiJieDanRiQi', 'shuoMing')
ORDER BY column_name;

-- ==========================================
-- attachment 表：檢查 createdBy 欄位
-- ==========================================
\echo ''
\echo '檢查 attachment 表的欄位屬性...'
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = :'SCHEMA'
  AND table_name = 'attachment'
  AND column_name IN (
    'createdBySource',
    'createdByWorkspaceMemberId',
    'createdByName',
    'createdByContext',
    'yeJiMuBiaoId'
  )
ORDER BY column_name;

-- ==========================================
-- messageChannel 表：檢查新增欄位
-- ==========================================
\echo ''
\echo '檢查 messageChannel 表的欄位屬性...'
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = :'SCHEMA'
  AND table_name = 'messageChannel'
  AND column_name IN ('syncAllFolders', 'pendingGroupEmailsAction')
ORDER BY column_name;

\echo ''
\echo '=========================================='
\echo '所有欄位屬性檢查完成'
\echo '=========================================='
