-- 同步本地環境所有資料表與 AWS 環境
-- 執行日期: 2026-01-27

\set SCHEMA 'workspace_3joxkr9ofo5hlxjan164egffx'

-- ==========================================
-- 1. person 表 (缺少 13 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "lineId" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "lianLuoDianHuaFenJi" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "shouJiHaoMaPrimaryPhoneNumber" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "shouJiHaoMaPrimaryPhoneCountryCode" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "shouJiHaoMaPrimaryPhoneCallingCode" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "shouJiHaoMaAdditionalPhones" jsonb;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "lineUserId" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "lineDisplayName" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "lineProfilePictureUrl" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "lineStatus" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "lastLineInteractionAt" timestamp with time zone;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "dianZiYouJianEmailPrimaryEmail" text;

ALTER TABLE :SCHEMA.person
ADD COLUMN IF NOT EXISTS "dianZiYouJianEmailAdditionalEmails" jsonb;

-- 建立 person searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX_person_searchVector"
ON :SCHEMA.person USING gin("searchVector");

-- ==========================================
-- 2. opportunity 表 (缺少 4 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA.opportunity
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

ALTER TABLE :SCHEMA.opportunity
ADD COLUMN IF NOT EXISTS "chengAnLu" double precision;

ALTER TABLE :SCHEMA.opportunity
ADD COLUMN IF NOT EXISTS "yuJiJieDanRiQi" timestamp with time zone;

ALTER TABLE :SCHEMA.opportunity
ADD COLUMN IF NOT EXISTS "shuoMing" text;

-- 建立 opportunity searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX_opportunity_searchVector"
ON :SCHEMA.opportunity USING gin("searchVector");

-- ==========================================
-- 3. task 表 (缺少 1 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA.task
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 建立 task searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX_task_searchVector"
ON :SCHEMA.task USING gin("searchVector");

-- ==========================================
-- 4. note 表 (缺少 1 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA.note
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 建立 note searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX_note_searchVector"
ON :SCHEMA.note USING gin("searchVector");

-- ==========================================
-- 5. attachment 表 (缺少 7 個欄位，需要重命名 2 個)
-- ==========================================
-- 先重命名舊欄位
ALTER TABLE :SCHEMA.attachment
RENAME COLUMN "salesquoteId" TO "salesQuoteId";

ALTER TABLE :SCHEMA.attachment
RENAME COLUMN "salesquotelineitemId" TO "salesQuoteLineItemId";

-- 新增缺少的欄位
ALTER TABLE :SCHEMA.attachment
ADD COLUMN IF NOT EXISTS "createdBySource" :SCHEMA."attachment_createdBySource_enum" NOT NULL DEFAULT 'MANUAL';

ALTER TABLE :SCHEMA.attachment
ADD COLUMN IF NOT EXISTS "createdByWorkspaceMemberId" uuid;

ALTER TABLE :SCHEMA.attachment
ADD COLUMN IF NOT EXISTS "createdByName" text NOT NULL DEFAULT 'System';

ALTER TABLE :SCHEMA.attachment
ADD COLUMN IF NOT EXISTS "createdByContext" jsonb;

ALTER TABLE :SCHEMA.attachment
ADD COLUMN IF NOT EXISTS "yeJiMuBiaoId" uuid;

-- ==========================================
-- 6. messageChannel 表 (缺少 2 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA."messageChannel"
ADD COLUMN IF NOT EXISTS "syncAllFolders" boolean NOT NULL DEFAULT false;

ALTER TABLE :SCHEMA."messageChannel"
ADD COLUMN IF NOT EXISTS "pendingGroupEmailsAction" text;

-- ==========================================
-- 7. timelineActivity 表 (缺少 3 個欄位，需要重命名 2 個)
-- ==========================================
-- 先重命名舊欄位
ALTER TABLE :SCHEMA."timelineActivity"
RENAME COLUMN "salesquoteId" TO "salesQuoteId";

ALTER TABLE :SCHEMA."timelineActivity"
RENAME COLUMN "salesquotelineitemId" TO "salesQuoteLineItemId";

-- 新增缺少的欄位
ALTER TABLE :SCHEMA."timelineActivity"
ADD COLUMN IF NOT EXISTS "yeJiMuBiaoId" uuid;

-- ==========================================
-- 8. workflow 表 (缺少 1 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA.workflow
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 建立 workflow searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX_workflow_searchVector"
ON :SCHEMA.workflow USING gin("searchVector");

-- ==========================================
-- 9. workflowRun 表 (缺少 1 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA."workflowRun"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 建立 workflowRun searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX_workflowRun_searchVector"
ON :SCHEMA."workflowRun" USING gin("searchVector");

-- ==========================================
-- 10. workflowVersion 表 (缺少 1 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA."workflowVersion"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 建立 workflowVersion searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX_workflowVersion_searchVector"
ON :SCHEMA."workflowVersion" USING gin("searchVector");

-- ==========================================
-- 11. favorite 表 (缺少 3 個欄位，需要重命名 2 個)
-- ==========================================
-- 先重命名舊欄位
ALTER TABLE :SCHEMA.favorite
RENAME COLUMN "salesquoteId" TO "salesQuoteId";

ALTER TABLE :SCHEMA.favorite
RENAME COLUMN "salesquotelineitemId" TO "salesQuoteLineItemId";

-- 新增缺少的欄位
ALTER TABLE :SCHEMA.favorite
ADD COLUMN IF NOT EXISTS "yeJiMuBiaoId" uuid;

-- ==========================================
-- 12. _pet 表 (缺少 1 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA._pet
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 建立 _pet searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX__pet_searchVector"
ON :SCHEMA._pet USING gin("searchVector");

-- ==========================================
-- 13. _rocket 表 (缺少 1 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA._rocket
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 建立 _rocket searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX__rocket_searchVector"
ON :SCHEMA._rocket USING gin("searchVector");

-- ==========================================
-- 14. _surveyResult 表 (缺少 1 個欄位)
-- ==========================================
ALTER TABLE :SCHEMA."_surveyResult"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 建立 _surveyResult searchVector 索引
CREATE INDEX IF NOT EXISTS "IDX__surveyResult_searchVector"
ON :SCHEMA."_surveyResult" USING gin("searchVector");

-- ==========================================
-- 驗證結果
-- ==========================================
\echo '=========================================='
\echo '同步完成！驗證欄位數量...'
\echo '=========================================='

SELECT 'company' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'company'
UNION ALL
SELECT 'person', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'person'
UNION ALL
SELECT 'opportunity', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'opportunity'
UNION ALL
SELECT 'task', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'task'
UNION ALL
SELECT 'note', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'note'
UNION ALL
SELECT 'attachment', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'attachment'
UNION ALL
SELECT 'messageChannel', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'messageChannel'
UNION ALL
SELECT 'timelineActivity', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'timelineActivity'
UNION ALL
SELECT 'workflow', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'workflow'
UNION ALL
SELECT 'workflowRun', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'workflowRun'
UNION ALL
SELECT 'workflowVersion', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'workflowVersion'
UNION ALL
SELECT 'favorite', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = 'favorite'
UNION ALL
SELECT '_pet', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = '_pet'
UNION ALL
SELECT '_rocket', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = '_rocket'
UNION ALL
SELECT '_surveyResult', COUNT(*)
FROM information_schema.columns
WHERE table_schema = :'SCHEMA' AND table_name = '_surveyResult';
