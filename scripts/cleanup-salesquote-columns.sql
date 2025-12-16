-- ============================================
-- 清理 salesQuote 相關的重複/錯誤欄位
-- 執行前請先備份資料庫！
-- ============================================

-- Y-CRM workspace: workspace_3joxkr9ofo5hlxjan164egffx
-- 公司A workspace: workspace_9xzzc72owue8dnxdfnywlufdu
-- 公司B workspace: workspace_2lw5mt0pstmb4a039kbnavmaz

-- ============================================
-- 步驟 1: 檢查重複欄位（先執行這些查詢確認問題）
-- ============================================

-- 檢查 Y-CRM 的 favorite 表是否有 salesquoteId (lowercase)
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'workspace_3joxkr9ofo5hlxjan164egffx'
AND table_name = 'favorite'
AND column_name LIKE '%salesquote%';

-- 檢查 Y-CRM 的 noteTarget 表
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'workspace_3joxkr9ofo5hlxjan164egffx'
AND table_name = 'noteTarget'
AND column_name LIKE '%salesquote%';

-- 檢查 Y-CRM 的 taskTarget 表
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'workspace_3joxkr9ofo5hlxjan164egffx'
AND table_name = 'taskTarget'
AND column_name LIKE '%salesquote%';

-- 檢查 Y-CRM 的 timelineActivity 表
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'workspace_3joxkr9ofo5hlxjan164egffx'
AND table_name = 'timelineActivity'
AND column_name LIKE '%salesQuote%';

-- 檢查公司A 是否有錯誤的 salesQuoteLineItems 表（複數）
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'workspace_9xzzc72owue8dnxdfnywlufdu'
AND table_name LIKE '%salesQuote%';

-- ============================================
-- 步驟 2: 清理重複的 lowercase 欄位（如果存在）
-- 注意：只有在確認這些欄位沒有資料或資料已遷移後才執行
-- ============================================

-- Y-CRM: 刪除 favorite 表中的 salesquoteId (lowercase)
-- ALTER TABLE workspace_3joxkr9ofo5hlxjan164egffx.favorite DROP COLUMN IF EXISTS "salesquoteId";

-- Y-CRM: 刪除 noteTarget 表中的 salesquoteId (lowercase)
-- ALTER TABLE workspace_3joxkr9ofo5hlxjan164egffx."noteTarget" DROP COLUMN IF EXISTS "salesquoteId";

-- Y-CRM: 刪除 taskTarget 表中的 salesquoteId (lowercase)
-- ALTER TABLE workspace_3joxkr9ofo5hlxjan164egffx."taskTarget" DROP COLUMN IF EXISTS "salesquoteId";

-- ============================================
-- 步驟 3: 清理公司A 的錯誤表（如果存在）
-- ============================================

-- 公司A: 刪除錯誤的 salesQuoteLineItems 表（複數形式）
-- DROP TABLE IF EXISTS workspace_9xzzc72owue8dnxdfnywlufdu."salesQuoteLineItems";

-- ============================================
-- 步驟 4: 清理 metadata 中的重複記錄
-- ============================================

-- 檢查 Y-CRM 的 fieldMetadata 是否有重複的 salesquoteId
SELECT fm.id, fm.name, fm."objectMetadataId", om."nameSingular"
FROM core."fieldMetadata" fm
JOIN core."objectMetadata" om ON fm."objectMetadataId" = om.id
WHERE om."workspaceId" = '3be9d202-5461-4881-a6de-4c1f96e4b02d'
AND fm.name LIKE '%salesquote%';

-- 如果有重複的 metadata 記錄，需要刪除 lowercase 版本
-- DELETE FROM core."fieldMetadata" WHERE id = '<重複記錄的id>';

-- ============================================
-- 完成後執行 sync-metadata 命令
-- ============================================
-- docker compose -f docker/docker-compose.yml exec -T backend node dist/src/command/command.js workspace:sync-metadata -w 3be9d202-5461-4881-a6de-4c1f96e4b02d
-- docker compose -f docker/docker-compose.yml exec -T backend node dist/src/command/command.js workspace:sync-metadata -w a7f92f09-6149-4fff-83eb-fe7dce4f3e62
-- docker compose -f docker/docker-compose.yml exec -T backend node dist/src/command/command.js workspace:sync-metadata -w 2c0e0174-8cfa-49a5-aff19fc338ab
-- docker compose -f docker/docker-compose.yml exec -T backend node dist/src/command/command.js cache:flush
