# RICH_TEXT_V2 遷移文檔

## 概述

將報價單（SalesQuote）的「交易條款」(jiaoYiTiaoJian) 和「備註」(beiZhu) 欄位從舊版 `RICH_TEXT` 遷移到新版 `RICH_TEXT_V2`，並新增通用 Rich Text 編輯器支援任意 object 的 RICH_TEXT_V2 欄位。

## 問題背景

### 原始問題
用戶發現報價單列表中的「交易條款」欄位點擊後無法編輯。

### 根本原因
1. `FieldInput.tsx` 中只有 `RICH_TEXT_V2` 有對應的 `<RichTextFieldInput />`
2. `RICH_TEXT`（舊版）沒有輸入元件，會返回空元件 `<></>`
3. `RichTextFieldInput` 使用的 `ActivityRichTextEditor` 只支援 `Note` 和 `Task`

### RICH_TEXT vs RICH_TEXT_V2 差異

| 特性 | RICH_TEXT (舊版) | RICH_TEXT_V2 (新版) |
|------|-----------------|-------------------|
| 資料結構 | 單一 `text` 欄位 | Composite type（`blocknote` + `markdown`） |
| 表格編輯 | ❌ 不支援 | ✅ 支援 |
| 編輯器 | 無 | BlockNote 編輯器 |

## 修改內容

### 1. 後端程式碼修改

**檔案**: `packages/twenty-server/src/modules/sales-quote/standard-objects/sales-quote.workspace-entity.ts`

```typescript
// 修改前
@WorkspaceField({
  standardId: SALES_QUOTE_STANDARD_FIELD_IDS.jiaoYiTiaoJian,
  type: FieldMetadataType.RICH_TEXT,  // 舊版
  ...
})
jiaoYiTiaoJian: string;

// 修改後
@WorkspaceField({
  standardId: SALES_QUOTE_STANDARD_FIELD_IDS.jiaoYiTiaoJian,
  type: FieldMetadataType.RICH_TEXT_V2,  // 新版
  ...
})
jiaoYiTiaoJian: any;
```

### 2. 前端程式碼修改

#### 2.1 RichTextFieldInput.tsx
**檔案**: `packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/RichTextFieldInput.tsx`

新增判斷邏輯：
- `Note` 和 `Task` 使用原本的 `ActivityRichTextEditor`
- 其他 object（如報價單）使用新的 `GenericRichTextFieldInput`

#### 2.2 GenericRichTextFieldInput.tsx（新增）
**檔案**: `packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/GenericRichTextFieldInput.tsx`

通用 Rich Text 編輯器，支援任意 object 的 RICH_TEXT_V2 欄位：
- 使用 BlockNote 編輯器
- 使用 `useUpdateOneRecord` 更新資料
- 不依賴 Activity 特定邏輯（如附件處理）

#### 2.3 移除舊版 RICH_TEXT 選項
**檔案**: `packages/twenty-front/src/modules/settings/data-model/types/SettingsExcludedFieldType.ts`

```typescript
// 將 RICH_TEXT 加入排除列表，用戶新增欄位時只能選 RICH_TEXT_V2
export type SettingsExcludedFieldType = PickLiteral<
  FieldType,
  'POSITION' | 'TS_VECTOR' | 'RICH_TEXT' | 'RICH_TEXT_V2' | 'NUMERIC'
>;
```

**檔案**: `packages/twenty-front/src/modules/settings/data-model/constants/SettingsNonCompositeFieldTypeConfigs.ts`

移除 `RICH_TEXT` 的設定。

### 3. 資料庫遷移

#### 3.1 備份舊資料
```sql
-- 備份 jiaoYiTiaoJian 和 beiZhu 欄位資料
SELECT id, "jiaoYiTiaoJian", "beiZhu"
FROM workspace_3joxkr9ofo5hlxjan164egffx."salesQuote"
WHERE "jiaoYiTiaoJian" IS NOT NULL OR "beiZhu" IS NOT NULL;
```

#### 3.2 新增 V2 欄位
```sql
-- 為所有 workspace 新增 V2 子欄位
ALTER TABLE workspace_xxx."salesQuote"
ADD COLUMN "jiaoYiTiaoJianBlocknote" text,
ADD COLUMN "jiaoYiTiaoJianMarkdown" text,
ADD COLUMN "beiZhuBlocknote" text,
ADD COLUMN "beiZhuMarkdown" text;
```

#### 3.3 遷移資料
```sql
-- 將舊資料遷移到 Markdown 欄位
UPDATE workspace_xxx."salesQuote"
SET "jiaoYiTiaoJianMarkdown" = "jiaoYiTiaoJian"
WHERE "jiaoYiTiaoJian" IS NOT NULL;

UPDATE workspace_xxx."salesQuote"
SET "beiZhuMarkdown" = "beiZhu"
WHERE "beiZhu" IS NOT NULL;
```

#### 3.4 刪除舊欄位
```sql
ALTER TABLE workspace_xxx."salesQuote"
DROP COLUMN "jiaoYiTiaoJian",
DROP COLUMN "beiZhu";
```

#### 3.5 更新 fieldMetadata
```sql
UPDATE core."fieldMetadata"
SET type = 'RICH_TEXT_V2'
WHERE name IN ('jiaoYiTiaoJian', 'beiZhu')
AND type = 'RICH_TEXT';
```

### 4. 同步與快取清除

```bash
# 1. sync-metadata
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata

# 2. 清除 Redis cache
docker exec Y-CRM-redis redis-cli FLUSHALL

# 3. 重啟服務
docker compose -f docker/docker-compose.yml restart backend worker

# 4. 等待服務啟動
sleep 12

# 5. 重新註冊 CRON jobs
docker compose -f docker/docker-compose.yml exec backend yarn command:prod cron:register:all

# 6. 驗證 CRON jobs
docker exec Y-CRM-redis redis-cli KEYS 'bull:cron-queue:repeat:*' | wc -l
```

## 影響範圍

### 受影響的 Object
- SalesQuote（報價單）

### 受影響的欄位
- jiaoYiTiaoJian（交易條款）
- beiZhu（備註）

### 不受影響的功能
- Note 和 Task 的 Rich Text 編輯（仍使用 ActivityRichTextEditor）
- 其他所有現有功能
- 效能優化相關程式碼

## AWS 部署注意事項

部署到 AWS 時，`deploy-to-aws.sh` 會自動執行：
- `workspace:sync-metadata`
- `FLUSHALL`
- `cron:register:all`

但需要手動執行資料庫遷移 SQL（如果 AWS 資料庫有舊資料）。

## 驗證步驟

1. 開啟報價單列表頁面
2. 點擊「交易條款」或「備註」欄位
3. 應該會出現 Rich Text 編輯器
4. 輸入內容並點擊外部關閉
5. 重新整理頁面，確認資料已儲存

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `sales-quote.workspace-entity.ts` | 報價單 entity 定義 |
| `RichTextFieldInput.tsx` | Rich Text 輸入元件（修改） |
| `GenericRichTextFieldInput.tsx` | 通用 Rich Text 編輯器（新增） |
| `SettingsExcludedFieldType.ts` | 欄位類型排除設定 |
| `SettingsNonCompositeFieldTypeConfigs.ts` | 非複合欄位類型設定 |

## 日期

- 實作日期：2026-01-06
- 文檔建立：2026-01-06
