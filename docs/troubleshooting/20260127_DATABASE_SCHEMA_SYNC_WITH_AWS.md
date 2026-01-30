# 本地資料庫 Schema 同步 AWS 環境

**日期**: 2026-01-27
**目的**: 將本地環境的所有資料表結構同步到與 AWS 環境一致

## 背景

用戶登入後出現錯誤：`column company.gongSiTongBian does not exist`

經檢查發現 AWS 環境有用戶新增的自定義欄位，需要將本地環境同步到與 AWS 環境一模一樣。

## 檢查結果

### 資料表數量
- **AWS 環境**: 35 個資料表
- **本地環境**: 43 個資料表（多出 8 個舊的或 view 相關的表）

### 需要同步的資料表
共 15 個資料表需要同步欄位：

| 資料表 | AWS 欄位數 | 本地欄位數 | 狀態 |
|--------|-----------|-----------|------|
| company | 50 | 51 | ⚠️ 本地多 1 個 (keHuLianLuoRenId) |
| person | 51 | 52 | ⚠️ 本地多 1 個 (lianLuoDianHua) |
| opportunity | 23 | 19 | ❌ 缺少 4 個 |
| task | 16 | 15 | ❌ 缺少 1 個 |
| note | 13 | 12 | ❌ 缺少 1 個 |
| attachment | 28 | 23 | ❌ 缺少 5 個 + 重命名 2 個 |
| messageChannel | 22 | 20 | ❌ 缺少 2 個 |
| timelineActivity | 28 | 27 | ❌ 缺少 1 個 + 重命名 2 個 |
| workflow | 13 | 12 | ❌ 缺少 1 個 |
| workflowRun | 18 | 17 | ❌ 缺少 1 個 |
| workflowVersion | 11 | 10 | ❌ 缺少 1 個 |
| favorite | 25 | 24 | ❌ 缺少 1 個 + 重命名 2 個 |
| _pet | 44 | 43 | ❌ 缺少 1 個 |
| _rocket | 12 | 11 | ❌ 缺少 1 個 |
| _surveyResult | 18 | 17 | ❌ 缺少 1 個 |

## 同步內容

### 1. person 表 (新增 14 個欄位)

**LINE 整合相關欄位**:
- `lineId` (text) - LINE ID
- `lineUserId` (text) - LINE User ID
- `lineDisplayName` (text) - LINE 顯示名稱
- `lineProfilePictureUrl` (text) - LINE 頭像 URL
- `lineStatus` (text) - LINE 狀態
- `lastLineInteractionAt` (timestamp) - 最後 LINE 互動時間

**聯絡資訊欄位**:
- `lianLuoDianHuaFenJi` (text) - 聯絡電話分機
- `shouJiHaoMaPrimaryPhoneNumber` (text) - 手機號碼（主要）
- `shouJiHaoMaPrimaryPhoneCountryCode` (text) - 手機國碼
- `shouJiHaoMaPrimaryPhoneCallingCode` (text) - 手機區號
- `shouJiHaoMaAdditionalPhones` (jsonb) - 其他手機號碼
- `dianZiYouJianEmailPrimaryEmail` (text) - 電子郵件（主要）
- `dianZiYouJianEmailAdditionalEmails` (jsonb) - 其他電子郵件

**搜尋欄位**:
- `searchVector` (tsvector) - 全文搜尋向量

### 2. opportunity 表 (新增 4 個欄位)

- `searchVector` (tsvector) - 全文搜尋向量
- `chengAnLu` (double precision) - 成案率
- `yuJiJieDanRiQi` (timestamp) - 預計結單日期
- `shuoMing` (text) - 說明

### 3. 其他資料表

所有以下資料表都新增了 `searchVector` 欄位和對應的 GIN 索引：
- task
- note
- workflow
- workflowRun
- workflowVersion
- _pet
- _rocket
- _surveyResult

### 4. attachment 表 (新增 5 個欄位 + 重命名 2 個)

**重命名欄位**:
- `salesquoteId` → `salesQuoteId`
- `salesquotelineitemId` → `salesQuoteLineItemId`

**新增欄位**:
- `createdBySource` (enum) - 建立來源
- `createdByWorkspaceMemberId` (uuid) - 建立者 ID
- `createdByName` (text) - 建立者名稱
- `createdByContext` (jsonb) - 建立者上下文
- `yeJiMuBiaoId` (uuid) - 業績目標 ID

### 5. timelineActivity 表 (新增 1 個欄位 + 重命名 2 個)

**重命名欄位**:
- `salesquoteId` → `salesQuoteId`
- `salesquotelineitemId` → `salesQuoteLineItemId`

**新增欄位**:
- `yeJiMuBiaoId` (uuid) - 業績目標 ID

### 6. favorite 表 (新增 1 個欄位 + 重命名 2 個)

**重命名欄位**:
- `salesquoteId` → `salesQuoteId`
- `salesquotelineitemId` → `salesQuoteLineItemId`

**新增欄位**:
- `yeJiMuBiaoId` (uuid) - 業績目標 ID

### 7. messageChannel 表 (新增 2 個欄位)

- `syncAllFolders` (boolean) - 同步所有資料夾
- `pendingGroupEmailsAction` (text) - 待處理群組郵件動作

## 執行步驟

1. **建立同步腳本**: `scripts/sync-all-tables-with-aws.sql`
2. **執行 SQL 腳本**: 新增所有缺少的欄位和索引
3. **清除 Redis cache**: `docker exec Y-CRM-redis redis-cli FLUSHALL`
4. **重啟服務**: `docker compose restart backend worker`
5. **重新註冊 CRON jobs**: 19 個 CRON jobs 成功註冊

## 驗證結果

### 同步後的欄位數量

| 資料表 | 欄位數 | 狀態 |
|--------|--------|------|
| company | 51 | ✅ (本地多 keHuLianLuoRenId) |
| person | 52 | ✅ (本地多 lianLuoDianHua) |
| opportunity | 23 | ✅ |
| task | 16 | ✅ |
| note | 13 | ✅ |
| attachment | 28 | ✅ |
| messageChannel | 22 | ✅ |
| timelineActivity | 28 | ✅ |
| workflow | 13 | ✅ |
| workflowRun | 18 | ✅ |
| workflowVersion | 11 | ✅ |
| favorite | 25 | ✅ |
| _pet | 44 | ✅ |
| _rocket | 12 | ✅ |
| _surveyResult | 18 | ✅ |

### 本地多出的欄位（保留）

這些是本地自定義的欄位，AWS 環境沒有，但我們保留：

1. **company.keHuLianLuoRenId** (uuid) - 客戶聯絡人 ID
2. **person.lianLuoDianHua** (text) - 聯絡電話（舊欄位）

## 重要發現

### LINE 整合功能

AWS 環境的 `person` 表有完整的 LINE 整合欄位，包括：
- LINE ID、User ID、顯示名稱、頭像 URL
- LINE 狀態和最後互動時間

這表示 AWS 環境已經部署了 LINE@ 整合功能。

### searchVector 欄位

幾乎所有主要資料表都有 `searchVector` 欄位和 GIN 索引，用於全文搜尋功能。這是 Twenty CRM 的核心搜尋機制。

### 欄位命名規範

發現舊的欄位命名（小寫）已經改為駝峰式命名（camelCase）：
- `salesquoteId` → `salesQuoteId`
- `salesquotelineitemId` → `salesQuoteLineItemId`

## 相關檔案

- SQL 腳本: `scripts/sync-all-tables-with-aws.sql`
- 比較腳本: `scripts/compare-all-tables.sh`
- 欄位差異腳本: `scripts/find-missing-columns.sh`

## 後續工作

1. ✅ 清除 Redis cache
2. ✅ 重啟 backend 和 worker 服務
3. ✅ 重新註冊 19 個 CRON jobs
4. ✅ 修正 person 表欄位的 nullable 屬性
5. ⏳ 測試前端是否能正常顯示所有資料
6. ⏳ 驗證 LINE 整合功能是否正常

## 問題修正記錄

### 問題 1: person 表欄位 nullable 錯誤

**錯誤訊息**: `Cannot return null for non-nullable field Person.lianLuoDianHuaFenJi`

**原因**: 新增欄位時沒有設定正確的 NOT NULL 和 DEFAULT 值

**修正**:
1. 將所有 null 值更新為預設值（空字串或預設國碼）
2. 設定欄位為 NOT NULL 並加上 DEFAULT 值

```sql
-- 更新 37 筆 person 記錄的 null 值
UPDATE person SET "lianLuoDianHuaFenJi" = '' WHERE "lianLuoDianHuaFenJi" IS NULL;
UPDATE person SET "lineId" = '' WHERE "lineId" IS NULL;
UPDATE person SET "shouJiHaoMaPrimaryPhoneNumber" = '' WHERE "shouJiHaoMaPrimaryPhoneNumber" IS NULL;
UPDATE person SET "shouJiHaoMaPrimaryPhoneCountryCode" = 'TW' WHERE "shouJiHaoMaPrimaryPhoneCountryCode" IS NULL;
UPDATE person SET "shouJiHaoMaPrimaryPhoneCallingCode" = '886' WHERE "shouJiHaoMaPrimaryPhoneCallingCode" IS NULL;

-- 設定 NOT NULL 和 DEFAULT
ALTER TABLE person ALTER COLUMN "lianLuoDianHuaFenJi" SET NOT NULL, ALTER COLUMN "lianLuoDianHuaFenJi" SET DEFAULT ''::text;
ALTER TABLE person ALTER COLUMN "lineId" SET NOT NULL, ALTER COLUMN "lineId" SET DEFAULT ''::text;
```

**欄位中文說明**:
- `lianLuoDianHuaFenJi` = 聯絡電話分機 (phone extension)

## 注意事項

- 不需要 rebuild Docker images，資料庫欄位變更後直接刷新瀏覽器即可
- 本地保留的 `keHuLianLuoRenId` 和 `lianLuoDianHua` 欄位不影響 AWS 環境
- 所有 searchVector 欄位都建立了 GIN 索引以提升搜尋效能
