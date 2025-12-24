# Twenty Metadata 同步機制完整指南

本文件說明 Twenty 從開發到顯示的完整流程，以及什麼情況需要執行 sync-metadata。

---

## 目錄

1. [架構概覽](#1-架構概覽)
2. [Metadata 是什麼？](#2-metadata-是什麼)
3. [從開發到顯示的完整流程](#3-從開發到顯示的完整流程)
4. [什麼情況需要 sync-metadata？](#4-什麼情況需要-sync-metadata)
5. [什麼情況不需要 sync-metadata？](#5-什麼情況不需要-sync-metadata)
6. [sync-metadata 命令詳解](#6-sync-metadata-命令詳解)
7. [常見場景操作指南](#7-常見場景操作指南)
8. [常見問題排解](#8-常見問題排解)

---

## 1. 架構概覽

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           程式碼層                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  @WorkspaceEntity / @WorkspaceField 裝飾器                       │   │
│  │  定義物件結構、欄位、關聯、label 等                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                           sync-metadata 命令
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         core schema（共用）                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  objectMetadata  │  │  fieldMetadata   │  │  view            │      │
│  │  物件定義        │  │  欄位定義        │  │  左側選單        │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                           workspace migration
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    workspace_xxx schema（每個租戶獨立）                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  company         │  │  person          │  │  salesQuote      │      │
│  │  實際資料表      │  │  實際資料表      │  │  實際資料表      │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                              Redis Cache
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           前端顯示                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  左側選單        │  │  資料表格        │  │  表單欄位        │      │
│  │  (從 view 讀取)  │  │  (從 metadata)   │  │  (從 metadata)   │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Metadata 是什麼？

### 2.1 核心概念

Twenty 使用 **Metadata-Driven Architecture**，所有的資料結構都由 metadata 定義，而不是寫死在程式碼中。

### 2.2 Metadata 資料表

| 資料表 | 用途 | 範例 |
|--------|------|------|
| `objectMetadata` | 定義物件（資料表） | company, person, salesQuote |
| `fieldMetadata` | 定義欄位 | name, email, companyId |
| `relationMetadata` | 定義關聯 | company.people, salesQuote.company |
| `indexMetadata` | 定義索引 | 搜尋索引、唯一索引 |
| `view` | 定義左側選單的 view | "All Companies", "報價單列表" |

### 2.3 Metadata 欄位說明

**objectMetadata 重要欄位：**
```sql
SELECT
    "nameSingular",    -- 物件名稱（程式用）：salesQuote
    "namePlural",      -- 複數名稱：salesQuotes
    "labelSingular",   -- 顯示名稱（單數）：報價單
    "labelPlural",     -- 顯示名稱（複數）：報價單列表
    "standardId",      -- 標準物件 ID（用於識別）
    "isCustom"         -- 是否為自訂物件
FROM core."objectMetadata";
```

**fieldMetadata 重要欄位：**
```sql
SELECT
    "name",            -- 欄位名稱：companyId
    "label",           -- 顯示名稱：公司
    "type",            -- 欄位類型：RELATION, TEXT, NUMBER
    "settings"         -- 設定（包含 joinColumnName 等）
FROM core."fieldMetadata";
```

---

## 3. 從開發到顯示的完整流程

### 3.1 新增一個 Standard Object（如 salesQuote）

```
步驟 1: 建立 Entity 檔案
────────────────────────────────────────────────────────────────
檔案: packages/twenty-server/src/modules/sales-quote/standard-objects/sales-quote.workspace-entity.ts

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.salesQuote,
  namePlural: 'salesQuotes',
  labelSingular: msg`報價單`,
  labelPlural: msg`報價單列表`,
})
export class SalesQuoteWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({...})
  mingCheng: string;
}

步驟 2: 註冊 Standard Object ID
────────────────────────────────────────────────────────────────
檔案: packages/twenty-shared/src/metadata/standard-object-ids.ts

export const STANDARD_OBJECT_IDS = {
  salesQuote: '52496086-5666-4876-92d5-455792272895',
  // ...
}

步驟 3: 建立 View 檔案（左側選單）
────────────────────────────────────────────────────────────────
檔案: packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/views/sales-quotes-all.view.ts

步驟 4: 註冊到 prefill-core-views
────────────────────────────────────────────────────────────────
檔案: packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/prefill-core-views.ts

const views = [
  // ...
  salesQuotesAllView(objectMetadataItems, true),
];

步驟 5: Build 並部署
────────────────────────────────────────────────────────────────
./docker/dev-flow/aws/build-amd64-images.sh
./docker/dev-flow/aws/deploy-to-aws.sh

步驟 6: 執行 sync-metadata（自動或手動）
────────────────────────────────────────────────────────────────
# deploy-to-aws.sh 會自動執行，或手動：
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata

步驟 7: 清除 Redis Cache
────────────────────────────────────────────────────────────────
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

### 3.2 流程圖

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  修改程式碼  │ ──→ │  Build      │ ──→ │  部署       │
│  (Entity)   │     │  (Docker)   │     │  (AWS)      │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  前端顯示   │ ←── │  清除 Cache │ ←── │sync-metadata│
│             │     │  (Redis)    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 4. 什麼情況需要 sync-metadata？

### ✅ 需要 sync-metadata 的情況

| 情況 | 說明 | 命令 |
|------|------|------|
| **新增 Standard Object** | 新增了 @WorkspaceEntity | `workspace:sync-metadata` |
| **新增欄位** | 新增了 @WorkspaceField | `workspace:sync-metadata` |
| **修改欄位類型** | 改變了 FieldMetadataType | `workspace:sync-metadata` |
| **新增關聯** | 新增了 @WorkspaceRelation | `workspace:sync-metadata` |
| **修改 label（程式碼）** | 改了 labelSingular/labelPlural | `workspace:sync-metadata` |
| **升級 Twenty 版本** | 新版本可能有新的 standard objects | `workspace:sync-metadata` |
| **修復 metadata 不一致** | 資料庫和程式碼不同步 | `workspace:sync-metadata` |

### 範例：修改 label

```typescript
// 修改前
@WorkspaceEntity({
  labelSingular: msg`Sales Quote`,
  labelPlural: msg`Sales Quotes`,
})

// 修改後
@WorkspaceEntity({
  labelSingular: msg`報價單`,
  labelPlural: msg`報價單列表`,
})
```

**需要執行：**
```bash
# 1. Build 並部署
# 2. sync-metadata
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata
# 3. 清除 cache
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

---

## 5. 什麼情況不需要 sync-metadata？

### ❌ 不需要 sync-metadata 的情況

| 情況 | 說明 | 原因 |
|------|------|------|
| **新建 Workspace** | 用戶註冊新公司 | 系統自動呼叫 sync |
| **修改前端 UI** | 改 React 組件 | 不涉及 metadata |
| **修改 API 邏輯** | 改 Service/Controller | 不涉及 metadata |
| **修改樣式** | 改 CSS/Tailwind | 不涉及 metadata |
| **修改環境變數** | 改 .env | 不涉及 metadata |
| **直接改資料庫 label** | 用 SQL 更新 | 已經直接改了 |

### 範例：直接用 SQL 改 label（不需要 sync）

```sql
-- 直接更新資料庫，不需要 sync-metadata
UPDATE core."objectMetadata"
SET "labelSingular" = '報價單', "labelPlural" = '報價單列表'
WHERE "nameSingular" = 'salesQuote';

-- 但需要清除 cache！
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

---

## 6. sync-metadata 命令詳解

### 6.1 基本用法

```bash
# 同步所有 workspace
npx nx run twenty-server:command workspace:sync-metadata

# 同步特定 workspace
npx nx run twenty-server:command workspace:sync-metadata -w <workspace-id>

# 在 Docker 容器內執行
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata
```

### 6.2 執行流程

```
1. 讀取程式碼中的 @WorkspaceEntity 定義
   ↓
2. 讀取資料庫中的 objectMetadata
   ↓
3. 比較差異
   - 新增的物件/欄位
   - 修改的 label/type
   - 刪除的物件/欄位
   ↓
4. 更新 core.objectMetadata
   ↓
5. 更新 core.fieldMetadata
   ↓
6. 生成 workspace migration
   ↓
7. 執行 migration（建立/修改資料表）
   ↓
8. 更新 workspace.metadataVersion
```

### 6.3 Log 輸出範例

```
[WorkspaceSyncMetadataService] Syncing standard objects and fields metadata
[WorkspaceSyncObjectMetadataService] Comparing standard objects and fields metadata
[WorkspaceSyncObjectMetadataService] Updating workspace metadata
[WorkspaceSyncObjectMetadataService] Generating migrations
[WorkspaceSyncObjectMetadataService] Saving migrations
[WorkspaceSyncMetadataService] Workspace object migrations took 166.85ms
[WorkspaceSyncFieldMetadataService] Updating workspace metadata
[WorkspaceSyncFieldMetadataService] Generating migrations
[WorkspaceSyncFieldMetadataService] Saving migrations
[WorkspaceSyncMetadataService] Workspace field migrations took 141.07ms
[WorkspaceSyncMetadataService] Executing pending migrations
[WorkspaceSyncMetadataService] Execute migrations took 4.10ms
[SyncWorkspaceMetadataCommand] Finished synchronizing workspace.
```

---

## 7. 常見場景操作指南

### 7.1 場景：修改物件的中文名稱

**方法 A：修改程式碼（推薦，會影響新建 workspace）**

```bash
# 1. 修改程式碼
# packages/twenty-server/src/modules/sales-quote/standard-objects/sales-quote.workspace-entity.ts
# labelSingular: msg`報價單`

# 2. Build 並部署
./docker/dev-flow/aws/build-amd64-images.sh --push
./docker/dev-flow/aws/deploy-to-aws.sh --backend-tag xxx --frontend-tag xxx

# 3. sync-metadata（deploy 腳本會自動執行）

# 4. 清除 cache
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

**方法 B：直接改資料庫（快速，只影響現有 workspace）**

```bash
# 1. 更新資料庫
docker exec Y-CRM-postgres psql -U postgres -d default -c "
UPDATE core.\"objectMetadata\"
SET \"labelSingular\" = '報價單', \"labelPlural\" = '報價單列表'
WHERE \"nameSingular\" = 'salesQuote';
"

# 2. 清除 cache
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

### 7.2 場景：新增一個欄位

```bash
# 1. 修改程式碼，新增 @WorkspaceField

# 2. Build 並部署

# 3. sync-metadata（必須！會建立新欄位）
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata

# 4. 清除 cache
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

### 7.3 場景：新增一個 Standard Object

```bash
# 1. 建立 Entity 檔案
# 2. 註冊 Standard Object ID
# 3. 建立 View 檔案
# 4. 註冊到 prefill-core-views
# 5. Build 並部署

# 6. sync-metadata（必須！會建立新資料表）
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata

# 7. 為現有 workspace 建立 view（如果 prefill 沒有自動建立）
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:seed-sales-quote-views

# 8. 清除 cache
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

### 7.4 場景：只修改前端 UI

```bash
# 1. 修改 React 組件

# 2. Build 並部署
./docker/dev-flow/aws/build-amd64-images.sh --push
./docker/dev-flow/aws/deploy-to-aws.sh --backend-tag xxx --frontend-tag xxx

# 不需要 sync-metadata！
# 不需要清除 Redis cache！（除非有 GraphQL schema 變更）
```

---

## 8. 常見問題排解

### 8.1 問題：column xxx does not exist

**原因：** metadata 有這個欄位，但實際資料表沒有

**解決：**
```bash
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

### 8.2 問題：左側選單沒有新物件

**原因：** 缺少 view 記錄

**解決：**
```bash
# 方法 A：執行 seed 命令
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:seed-sales-quote-views

# 方法 B：手動建立 view（SQL）
```

### 8.3 問題：顯示英文而不是中文

**原因：** objectMetadata.labelSingular 是英文

**解決：**
```bash
# 方法 A：修改程式碼 + sync-metadata
# 方法 B：直接改資料庫
docker exec Y-CRM-postgres psql -U postgres -d default -c "
UPDATE core.\"objectMetadata\"
SET \"labelSingular\" = '報價單'
WHERE \"nameSingular\" = 'salesQuote';
"
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

### 8.4 問題：GraphQL schema 錯誤

**原因：** Redis cache 沒清除

**解決：**
```bash
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

### 8.5 問題：sync-metadata 報錯 duplicate key

**原因：** metadata 有重複記錄

**解決：**
```bash
# 1. 找出重複記錄
docker exec Y-CRM-postgres psql -U postgres -d default -c "
SELECT \"nameSingular\", \"workspaceId\", COUNT(*)
FROM core.\"objectMetadata\"
GROUP BY \"nameSingular\", \"workspaceId\"
HAVING COUNT(*) > 1;
"

# 2. 刪除重複記錄（保留一個）
# 3. 重新執行 sync-metadata
```

---

## 快速參考表

| 修改類型 | 需要 Build？ | 需要 sync-metadata？ | 需要清 Cache？ |
|---------|-------------|---------------------|---------------|
| 新增 Standard Object | ✅ | ✅ | ✅ |
| 新增欄位 | ✅ | ✅ | ✅ |
| 修改 label（程式碼） | ✅ | ✅ | ✅ |
| 修改 label（SQL） | ❌ | ❌ | ✅ |
| 修改前端 UI | ✅ | ❌ | ❌ |
| 修改 API 邏輯 | ✅ | ❌ | ❌ |
| 新建 Workspace | ❌ | ❌（自動） | ❌ |

---

*最後更新：2025-12-24*



---

## 9. 文案修改指南

### 9.1 文案的三種來源

| 來源 | 位置 | 範例 | 修改方式 |
|------|------|------|---------|
| **Metadata Label** | `core.objectMetadata` / `core.fieldMetadata` | 左側選單名稱、欄位名稱 | SQL 或 sync-metadata |
| **前端硬編碼** | React 組件 `.tsx` | 按鈕文字、提示訊息 | 修改程式碼 + Build |
| **i18n 翻譯檔** | `.po` 檔案 | 多語言翻譯 | 修改 .po + Build |

### 9.2 修改左側選單名稱（Metadata Label）

**位置：** `core.objectMetadata.labelSingular` / `labelPlural`

**範例：** 把 "Sales Quote" 改成 "報價單"

```bash
# 方法 A：直接改資料庫（快速，推薦）
docker exec Y-CRM-postgres psql -U postgres -d default -c "
UPDATE core.\"objectMetadata\"
SET \"labelSingular\" = '報價單', \"labelPlural\" = '報價單列表'
WHERE \"nameSingular\" = 'salesQuote';
"

# 清除 cache
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

| 需要 Build？ | 需要 sync-metadata？ | 需要清 Cache？ |
|-------------|---------------------|---------------|
| ❌ | ❌ | ✅ |

**方法 B：修改程式碼（會影響新建 workspace）**

```typescript
// packages/twenty-server/src/modules/sales-quote/standard-objects/sales-quote.workspace-entity.ts
@WorkspaceEntity({
  labelSingular: msg`報價單`,
  labelPlural: msg`報價單列表`,
})
```

| 需要 Build？ | 需要 sync-metadata？ | 需要清 Cache？ |
|-------------|---------------------|---------------|
| ✅ | ✅ | ✅ |

---

### 9.3 修改欄位名稱（Metadata Label）

**位置：** `core.fieldMetadata.label`

**範例：** 把 "Name" 改成 "公司名稱"

```bash
# 直接改資料庫
docker exec Y-CRM-postgres psql -U postgres -d default -c "
UPDATE core.\"fieldMetadata\"
SET \"label\" = '公司名稱'
WHERE \"name\" = 'name'
AND \"objectMetadataId\" IN (
  SELECT id FROM core.\"objectMetadata\" WHERE \"nameSingular\" = 'company'
);
"

# 清除 cache
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

| 需要 Build？ | 需要 sync-metadata？ | 需要清 Cache？ |
|-------------|---------------------|---------------|
| ❌ | ❌ | ✅ |

---

### 9.4 修改前端按鈕/提示文字（硬編碼）

**位置：** `packages/twenty-front/src/**/*.tsx`

**範例：** 把按鈕文字從 "Save" 改成 "儲存"

```tsx
// 修改前
<Button>Save</Button>

// 修改後
<Button>儲存</Button>
```

```bash
# 需要 Build 並部署
./docker/dev-flow/aws/build-amd64-images.sh --push
./docker/dev-flow/aws/deploy-to-aws.sh --backend-tag xxx --frontend-tag xxx
```

| 需要 Build？ | 需要 sync-metadata？ | 需要清 Cache？ |
|-------------|---------------------|---------------|
| ✅ | ❌ | ❌ |

---

### 9.5 修改 i18n 翻譯（.po 檔案）

**位置：**
- 前端：`packages/twenty-front/src/locales/zh-TW.po`
- 後端：`packages/twenty-server/src/engine/core-modules/i18n/locales/zh-TW.po`
- Email：`packages/twenty-emails/src/locales/zh-TW.po`

**範例：** 新增或修改翻譯

```po
# packages/twenty-front/src/locales/zh-TW.po

msgid "Save"
msgstr "儲存"

msgid "Cancel"
msgstr "取消"

msgid "Are you sure you want to delete?"
msgstr "確定要刪除嗎？"
```

```bash
# 需要 Build 並部署
./docker/dev-flow/aws/build-amd64-images.sh --push
./docker/dev-flow/aws/deploy-to-aws.sh --backend-tag xxx --frontend-tag xxx
```

| 需要 Build？ | 需要 sync-metadata？ | 需要清 Cache？ |
|-------------|---------------------|---------------|
| ✅ | ❌ | ❌ |

---

### 9.6 文案修改快速參考表

| 文案類型 | 範例 | 位置 | 需要 Build？ | 需要 sync？ | 需要清 Cache？ |
|---------|------|------|-------------|------------|---------------|
| 左側選單名稱 | 報價單列表 | objectMetadata | ❌ | ❌ | ✅ |
| 欄位名稱 | 公司名稱 | fieldMetadata | ❌ | ❌ | ✅ |
| 按鈕文字 | 儲存、取消 | .tsx | ✅ | ❌ | ❌ |
| 提示訊息 | 確定要刪除嗎？ | .tsx | ✅ | ❌ | ❌ |
| 錯誤訊息 | 欄位不能為空 | .tsx | ✅ | ❌ | ❌ |
| i18n 翻譯 | .po 檔案 | locales/*.po | ✅ | ❌ | ❌ |
| View 名稱 | All Companies | core.view | ❌ | ❌ | ✅ |

---

### 9.7 修改 View 名稱

**位置：** `core.view.name`

**範例：** 把 "All {objectLabelPlural}" 改成 "全部報價單"

```bash
# 直接改資料庫
docker exec Y-CRM-postgres psql -U postgres -d default -c "
UPDATE core.view
SET name = '全部報價單'
WHERE \"objectMetadataId\" IN (
  SELECT id FROM core.\"objectMetadata\" WHERE \"nameSingular\" = 'salesQuote'
);
"

# 清除 cache
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

| 需要 Build？ | 需要 sync-metadata？ | 需要清 Cache？ |
|-------------|---------------------|---------------|
| ❌ | ❌ | ✅ |

---

### 9.8 總結：最快的文案修改方式

**改 Metadata（左側選單、欄位名稱、View 名稱）：**
```bash
# 1. 直接改資料庫
docker exec Y-CRM-postgres psql -U postgres -d default -c "UPDATE ..."

# 2. 清除 cache + 重啟
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```
⏱️ 耗時：約 1 分鐘

**改前端文字（按鈕、提示、翻譯）：**
```bash
# 1. 修改程式碼
# 2. Build + 部署
./docker/dev-flow/aws/build-amd64-images.sh --push
./docker/dev-flow/aws/deploy-to-aws.sh
```
⏱️ 耗時：約 30-60 分鐘（Build 時間）

---

*最後更新：2025-12-24*
