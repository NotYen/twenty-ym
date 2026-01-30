-- 修正所有欄位屬性不一致的問題
-- 2026-01-27

\set SCHEMA 'workspace_3joxkr9ofo5hlxjan164egffx'

\echo '=========================================='
\echo '修正欄位屬性不一致問題'
\echo '=========================================='
\echo ''

-- ==========================================
-- 1. opportunity 表
-- ==========================================
\echo '修正 opportunity 表...'

-- 修正 stage 的 default 值
ALTER TABLE :SCHEMA.opportunity
ALTER COLUMN stage SET DEFAULT 'OPT6_WEI_CHENG_JIAO_CLOSED_LOST'::workspace_3joxkr9ofo5hlxjan164egffx.opportunity_stage_enum;

-- 修正 shuoMing 的 nullable (先更新 null 值)
UPDATE :SCHEMA.opportunity SET "shuoMing" = '' WHERE "shuoMing" IS NULL;
ALTER TABLE :SCHEMA.opportunity
ALTER COLUMN "shuoMing" SET NOT NULL,
ALTER COLUMN "shuoMing" SET DEFAULT ''::text;

\echo '  ✅ opportunity 表修正完成'
\echo ''

-- ==========================================
-- 2. task 表
-- ==========================================
\echo '修正 task 表...'

-- 修正 status 的 default 值
ALTER TABLE :SCHEMA.task
ALTER COLUMN status SET DEFAULT 'SHANG_WEI_ZHI_PAI'::workspace_3joxkr9ofo5hlxjan164egffx.task_status_enum;

\echo '  ✅ task 表修正完成'
\echo ''

-- ==========================================
-- 3. workspaceMember 表
-- ==========================================
\echo '修正 workspaceMember 表...'

-- 修正 locale 的 default 值
ALTER TABLE :SCHEMA."workspaceMember"
ALTER COLUMN locale SET DEFAULT 'zh-TW'::text;

\echo '  ✅ workspaceMember 表修正完成'
\echo ''

-- ==========================================
-- 4. messageChannel 表
-- ==========================================
\echo '修正 messageChannel 表...'

-- 修正 syncAllFolders 的 default 值
ALTER TABLE :SCHEMA."messageChannel"
ALTER COLUMN "syncAllFolders" SET DEFAULT true;

-- 修正 pendingGroupEmailsAction 的 nullable (先更新 null 值)
UPDATE :SCHEMA."messageChannel" SET "pendingGroupEmailsAction" = '' WHERE "pendingGroupEmailsAction" IS NULL;
ALTER TABLE :SCHEMA."messageChannel"
ALTER COLUMN "pendingGroupEmailsAction" SET NOT NULL,
ALTER COLUMN "pendingGroupEmailsAction" SET DEFAULT ''::text;

\echo '  ✅ messageChannel 表修正完成'
\echo ''

-- ==========================================
-- 驗證修正結果
-- ==========================================
\echo '=========================================='
\echo '驗證修正結果'
\echo '=========================================='
\echo ''

\echo 'opportunity.stage:'
SELECT column_default FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'opportunity' AND column_name = 'stage';

\echo ''
\echo 'opportunity.shuoMing:'
SELECT is_nullable, column_default FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'opportunity' AND column_name = 'shuoMing';

\echo ''
\echo 'task.status:'
SELECT column_default FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'task' AND column_name = 'status';

\echo ''
\echo 'workspaceMember.locale:'
SELECT column_default FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'workspaceMember' AND column_name = 'locale';

\echo ''
\echo 'messageChannel.syncAllFolders:'
SELECT column_default FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'messageChannel' AND column_name = 'syncAllFolders';

\echo ''
\echo 'messageChannel.pendingGroupEmailsAction:'
SELECT is_nullable, column_default FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'messageChannel' AND column_name = 'pendingGroupEmailsAction';

\echo ''
\echo '=========================================='
\echo '所有欄位屬性修正完成！'
\echo '=========================================='
