-- RICH_TEXT_V2 遷移 SQL（AWS 環境）
-- 執行日期：2026-01-07
-- 執行狀態：✅ 已完成

-- ============================================
-- 步驟 1: 為所有 workspace 新增 V2 子欄位
-- ============================================

-- workspace_3joxkr9ofo5hlxjan164egffx（有 28 筆報價單資料）
ALTER TABLE workspace_3joxkr9ofo5hlxjan164egffx."salesQuote"
ADD COLUMN IF NOT EXISTS "jiaoYiTiaoJianBlocknote" text,
ADD COLUMN IF NOT EXISTS "jiaoYiTiaoJianMarkdown" text,
ADD COLUMN IF NOT EXISTS "beiZhuBlocknote" text,
ADD COLUMN IF NOT EXISTS "beiZhuMarkdown" text;

-- workspace_407lopjyyvm7bxeutk1tvqkpo
ALTER TABLE workspace_407lopjyyvm7bxeutk1tvqkpo."salesQuote"
ADD COLUMN IF NOT EXISTS "jiaoYiTiaoJianBlocknote" text,
ADD COLUMN IF NOT EXISTS "jiaoYiTiaoJianMarkdown" text,
ADD COLUMN IF NOT EXISTS "beiZhuBlocknote" text,
ADD COLUMN IF NOT EXISTS "beiZhuMarkdown" text;

-- workspace_5sgeef4h8tfcbqihsmg9numuh
ALTER TABLE workspace_5sgeef4h8tfcbqihsmg9numuh."salesQuote"
ADD COLUMN IF NOT EXISTS "jiaoYiTiaoJianBlocknote" text,
ADD COLUMN IF NOT EXISTS "jiaoYiTiaoJianMarkdown" text,
ADD COLUMN IF NOT EXISTS "beiZhuBlocknote" text,
ADD COLUMN IF NOT EXISTS "beiZhuMarkdown" text;

-- workspace_bx5fnlere7ghn0fip8m9fqub8
ALTER TABLE workspace_bx5fnlere7ghn0fip8m9fqub8."salesQuote"
ADD COLUMN IF NOT EXISTS "jiaoYiTiaoJianBlocknote" text,
ADD COLUMN IF NOT EXISTS "jiaoYiTiaoJianMarkdown" text,
ADD COLUMN IF NOT EXISTS "beiZhuBlocknote" text,
ADD COLUMN IF NOT EXISTS "beiZhuMarkdown" text;

-- ============================================
-- 步驟 2: 遷移舊資料到 Markdown 欄位
-- （只有 workspace_3joxkr9ofo5hlxjan164egffx 有資料）
-- ============================================

-- 遷移 jiaoYiTiaoJian（28 筆）
UPDATE workspace_3joxkr9ofo5hlxjan164egffx."salesQuote"
SET "jiaoYiTiaoJianMarkdown" = "jiaoYiTiaoJian"
WHERE "jiaoYiTiaoJian" IS NOT NULL;

-- 遷移 beiZhu（28 筆）
UPDATE workspace_3joxkr9ofo5hlxjan164egffx."salesQuote"
SET "beiZhuMarkdown" = "beiZhu"
WHERE "beiZhu" IS NOT NULL;

-- ============================================
-- 步驟 3: 更新 fieldMetadata 類型
-- ============================================

UPDATE core."fieldMetadata"
SET type = 'RICH_TEXT_V2'
WHERE name IN ('jiaoYiTiaoJian', 'beiZhu')
AND type = 'RICH_TEXT';
-- 結果：UPDATE 8（4 個 workspace × 2 個欄位）

-- ============================================
-- 步驟 4: 後續操作（已執行）
-- ============================================

-- 1. sync-metadata
-- docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata

-- 2. 清除 Redis cache
-- docker exec Y-CRM-redis redis-cli FLUSHALL

-- 3. 重啟 backend 和 worker
-- docker compose -f ~/docker-compose.aws.yml restart backend worker

-- 4. 重新註冊 CRON jobs（19 個）
-- docker compose -f ~/docker-compose.aws.yml exec backend yarn command:prod cron:register:all

-- ============================================
-- 注意事項
-- ============================================
-- ⚠️ 舊欄位（jiaoYiTiaoJian、beiZhu）已保留，未刪除
-- ⚠️ 資料已複製到 *Markdown 欄位，原始資料完整保留
