# LINE 整合 - 資料庫架構與部署指南

**日期**: 2025-11-17
**目的**: 說明 LINE 整合功能的資料庫架構、建立方式與部署流程

---

## 📊 Twenty CRM 資料庫架構總覽

Twenty CRM 使用 **雙軌資料庫管理系統**：

### 1️⃣ Core Schema (核心資料表)
**管理方式**: TypeORM Migration (手動)
**用途**: 系統級設定、跨 workspace 資料
**Schema**: `core`

### 2️⃣ Workspace Schema (工作區資料表)
**管理方式**: WorkspaceEntity + Metadata Sync (自動)
**用途**: 業務資料、支援多租戶
**Schema**: `workspace_{workspaceId}`

---

## 🗂️ LINE 整合資料表架構

LINE 整合功能使用了 **兩種資料表**：

### 資料表 1: `lineChannelConfig` (Core Schema)

#### 📍 位置
```
Schema: core
Table: lineChannelConfig
```

#### 🎯 用途
儲存 LINE Official Account 的設定資訊（跨 workspace 共用資料表）

#### 📋 欄位結構

| 欄位名稱 | 類型 | 約束 | 說明 |
|---------|------|------|------|
| `id` | uuid | PK | 主鍵 |
| `channelId` | varchar | NOT NULL | LINE Channel ID |
| `channelSecretEncrypted` | text | NOT NULL | 加密的 Channel Secret (AES-256-GCM) |
| `channelAccessTokenEncrypted` | text | NOT NULL | 加密的 Access Token (AES-256-GCM) |
| `botUserId` | varchar | UNIQUE, NULLABLE | LINE Bot User ID (用於 Webhook 查詢) |
| `workspaceId` | uuid | UNIQUE, NOT NULL | 所屬工作區 ID |
| `createdAt` | timestamptz | NOT NULL | 建立時間 |
| `updatedAt` | timestamptz | NOT NULL | 更新時間 |

#### 🔑 索引
```sql
-- 主索引
PK: id

-- 唯一索引
UNIQUE: workspaceId (一個 workspace 只能有一個 LINE 設定)
UNIQUE: botUserId (每個 Bot 唯一)

-- 查詢索引
INDEX: IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID ON (workspaceId)
INDEX: IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID ON (botUserId)
```

#### 🏗️ 建立方式
**TypeORM Entity + Manual Migration**

1. **Entity 定義**:
   ```typescript
   // packages/twenty-server/src/modules/line-integration/entities/line-channel-config.entity.ts
   @Entity({ name: 'lineChannelConfig', schema: 'core' })
   export class LineChannelConfigEntity {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ unique: false })
     channelId: string;

     // ... 其他欄位
   }
   ```

2. **手動 Migration**:
   ```typescript
   // packages/twenty-server/src/database/typeorm/core/migrations/common/[timestamp]-CreateLineChannelConfig.ts
   export class CreateLineChannelConfig implements MigrationInterface {
     public async up(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.query(
         `CREATE TABLE "core"."lineChannelConfig" (...)`
       );
     }
   }
   ```

---

### 資料表 2: `person` (Workspace Schema)

#### 📍 位置
```
Schema: workspace_{workspaceId} (每個 workspace 獨立)
Table: person
```

#### 🎯 用途
儲存聯絡人資料，包括 LINE 使用者資訊

#### 📋 新增的 LINE 欄位

| 欄位名稱 | 類型 | 約束 | 說明 |
|---------|------|------|------|
| `lineUserId` | varchar | NULLABLE | LINE User ID |
| `lineDisplayName` | varchar | NULLABLE | LINE 顯示名稱 |
| `lineProfilePictureUrl` | varchar | NULLABLE | LINE 個人照片 URL |
| `lineStatus` | varchar | NULLABLE, DEFAULT 'unlinked' | LINE 狀態 (active/blocked/unlinked) |
| `lastLineInteractionAt` | timestamptz | NULLABLE | 最後 LINE 互動時間 |

#### 🏗️ 建立方式
**WorkspaceEntity + Metadata Sync (自動)**

1. **WorkspaceEntity 定義**:
   ```typescript
   // packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts
   @WorkspaceEntity({
     standardId: PERSON_STANDARD_OBJECT_ID,
     namePlural: 'people',
     // ...
   })
   export class PersonWorkspaceEntity {
     // 新增 LINE 欄位
     @WorkspaceField({
       standardId: PERSON_STANDARD_FIELD_IDS.lineUserId,
       type: FieldMetadataType.TEXT,
       label: msg`LINE User ID`,
       // ...
     })
     @WorkspaceIsNullable()
     lineUserId: string | null;

     // ... 其他 LINE 欄位
   }
   ```

2. **StandardId 註冊**:
   ```typescript
   // packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids.ts
   export const PERSON_STANDARD_FIELD_IDS = {
     // ... 現有欄位
     lineUserId: '20202020-943f-49bb-822b-4c8322a97557',
     lineDisplayName: '20202020-93a7-49c6-819a-8ce1b9992760',
     // ...
   } as const;
   ```

3. **自動同步**:
   ```bash
   npx nx run twenty-server:command workspace:sync-metadata
   ```

---

## 🔄 資料表建立流程詳解

### 流程圖
```
┌─────────────────────────────────────────────────────────┐
│  LINE 整合資料表建立流程                                   │
└─────────────────────────────────────────────────────────┘

【Core Schema - lineChannelConfig】
  ↓
  1. 定義 TypeORM Entity
  ↓
  2. 撰寫 Migration 檔案 (手動) - 共 2 個
     • Migration 1: CreateLineChannelConfig (建立表)
     • Migration 2: AddBotUserIdToLineChannelConfig (新增 botUserId 欄位)
  ↓
  3. 執行 Migration
     $ npx nx run twenty-server:database:migrate
     (會依序執行兩個 migration 檔案)
  ↓
  ✅ Core 資料表建立完成

【Workspace Schema - person (LINE 欄位)】
  ↓
  1. 定義 WorkspaceField 裝飾器
  ↓
  2. 註冊 StandardId 到常數檔案
  ↓
  3. 執行 Metadata Sync
     $ npx nx run twenty-server:command workspace:sync-metadata
  ↓
  4. 系統自動處理:
     • 掃描 WorkspaceEntity
     • 比對資料庫 metadata
     • 產生 WorkspaceMigration
     • 執行 ALTER TABLE (每個 workspace schema)
  ↓
  ✅ Workspace 資料表欄位建立完成
```

---

## 📝 詳細步驟說明

### ⭐ Core Schema 資料表建立 (lineChannelConfig)

#### Step 1: 建立 Entity
```typescript
// packages/twenty-server/src/modules/line-integration/entities/line-channel-config.entity.ts
@Entity({ name: 'lineChannelConfig', schema: 'core' })
export class LineChannelConfigEntity {
  // 欄位定義
}
```

#### Step 2: 撰寫 Migration

**Migration 1: 建立 lineChannelConfig 表**
```typescript
// packages/twenty-server/src/database/typeorm/core/migrations/common/1763373200000-CreateLineChannelConfig.ts
export class CreateLineChannelConfig1763373200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 建立 lineChannelConfig 表
    await queryRunner.query(
      `CREATE TABLE "core"."lineChannelConfig" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "channelId" character varying NOT NULL,
        "channelSecretEncrypted" text NOT NULL,
        "channelAccessTokenEncrypted" text NOT NULL,
        "workspaceId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lineChannelConfig" PRIMARY KEY ("id")
      )`
    );
    // 建立索引
    await queryRunner.query(
      `CREATE INDEX "IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID" ON "core"."lineChannelConfig" ("workspaceId")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID_UNIQUE" ON "core"."lineChannelConfig" ("workspaceId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "core"."lineChannelConfig"`);
  }
}
```

**Migration 2: 新增 botUserId 欄位**
```typescript
// packages/twenty-server/src/database/typeorm/core/migrations/common/1763373253828-AddBotUserIdToLineChannelConfig.ts
export class AddBotUserIdToLineChannelConfig1763373253828 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 新增 botUserId 欄位
    await queryRunner.query(
      `ALTER TABLE "core"."lineChannelConfig" ADD "botUserId" character varying`
    );
    // 建立唯一約束與索引
    await queryRunner.query(
      `ALTER TABLE "core"."lineChannelConfig" ADD CONSTRAINT "UQ_LINE_CHANNEL_CONFIG_BOT_USER_ID" UNIQUE ("botUserId")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID" ON "core"."lineChannelConfig" ("botUserId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "core"."IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID"`
    );
    await queryRunner.query(
      `ALTER TABLE "core"."lineChannelConfig" DROP CONSTRAINT "UQ_LINE_CHANNEL_CONFIG_BOT_USER_ID"`
    );
    await queryRunner.query(
      `ALTER TABLE "core"."lineChannelConfig" DROP COLUMN "botUserId"`
    );
  }
}
```

#### Step 3: 執行 Migration
```bash
npx nx run twenty-server:database:migrate
```

**注意事項**:
- ⚠️ Migration 檔案命名格式: `[timestamp]-[Description].ts`
- ⚠️ Timestamp 必須遞增（使用 `date +%s%3N`）
- ⚠️ 必須同時實作 `up()` 和 `down()` 方法
- ⚠️ Migration 是**單向**的，一旦執行不可回退（生產環境）

**📌 LINE 整合的 Migration 檔案說明**:

LINE 整合功能的 `lineChannelConfig` 表是透過以下 **兩個 migration 檔案** 建立的：

1. **`1763373200000-CreateLineChannelConfig.ts`** (第一個)
   - 建立 `core.lineChannelConfig` 表
   - 包含初始欄位: id, channelId, channelSecretEncrypted, channelAccessTokenEncrypted, workspaceId, createdAt, updatedAt
   - 建立 workspaceId 索引和唯一索引

2. **`1763373253828-AddBotUserIdToLineChannelConfig.ts`** (第二個)
   - 新增 `botUserId` 欄位到現有的 `lineChannelConfig` 表
   - 建立 botUserId 唯一約束與索引
   - 用於從 LINE Webhook 的 destination 查詢 workspaceId

**為什麼有兩個 migration?**
- CreateLineChannelConfig 是在 Phase 1 建立的（初始實作）
- AddBotUserIdToLineChannelConfig 是在 Task 8 建立的（新增 webhook 查詢功能）
- 這符合資料庫 schema 演進的最佳實踐：每次結構變更都應該有對應的 migration 檔案

**執行順序**:
當執行 `npx nx run twenty-server:database:migrate` 時，TypeORM 會自動依照 timestamp 順序執行這兩個 migration。

---

### ⭐ Workspace Schema 欄位建立 (Person LINE 欄位)

#### Step 1: 定義 WorkspaceField
```typescript
// packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts
@WorkspaceField({
  standardId: PERSON_STANDARD_FIELD_IDS.lineUserId,
  type: FieldMetadataType.TEXT,
  label: msg`LINE User ID`,
  description: msg`LINE Official Account user ID`,
  icon: 'IconBrandLine',
})
@WorkspaceIsNullable()
lineUserId: string | null;
```

#### Step 2: 註冊 StandardId
```typescript
// packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids.ts
export const PERSON_STANDARD_FIELD_IDS = {
  // ... 現有欄位
  lineUserId: '20202020-943f-49bb-822b-4c8322a97557', // 使用 createDeterministicUuid() 生成
} as const;
```

**StandardId 生成方式**:
```typescript
import { createDeterministicUuid } from 'src/engine/workspace-manager/workspace-sync-metadata/utils/create-deterministic-uuid.util';

const lineUserIdStandardId = createDeterministicUuid('person.lineUserId');
// 輸出: 20202020-943f-49bb-822b-4c8322a97557
```

#### Step 3: 執行 Metadata Sync
```bash
npx nx run twenty-server:command workspace:sync-metadata
```

**背後發生的事情**:
```
1. WorkspaceSyncMetadataService 啟動
   ↓
2. 掃描所有 @WorkspaceEntity 裝飾的類別
   ↓
3. 提取所有 @WorkspaceField 的 metadata
   ↓
4. 查詢資料庫現有的 field metadata
   ↓
5. 比對差異 (Diff):
   • 新欄位 → 產生 CREATE COLUMN migration
   • 刪除欄位 → 產生 DROP COLUMN migration
   • 修改欄位 → 產生 ALTER COLUMN migration
   ↓
6. 產生 WorkspaceMigration 實體 (儲存在 core.workspaceMigration)
   ↓
7. 對每個 workspace schema 執行 migration:
   • workspace_abc123.person
   • workspace_def456.person
   • ...
   ↓
8. 更新 field metadata 表 (core.fieldMetadata)
   ↓
✅ 完成！所有 workspace 的 person 表都新增了 LINE 欄位
```

---

## 🚀 部署流程 (其他開發者使用 LINE 整合)

### 情境: 合併 LINE 功能分支到主分支

當其他開發者或部署環境需要使用 LINE 整合功能時，需要執行以下步驟：

---

### 📋 完整部署檢查清單

#### ✅ 1. 程式碼層級
```bash
# 合併分支
git checkout main
git merge feature/line-integration

# 安裝依賴（如果有新增）
yarn install
```

---

#### ✅ 2. 環境變數設定
```bash
# 編輯 .env 檔案，新增以下變數：

# LINE Integration
LINE_CONFIG_ENCRYPTION_KEY=<64位16進位字元>  # 必填！用於加密 LINE 憑證

# Redis (如果還沒有)
REDIS_HOST=localhost
REDIS_PORT=6379
```

**生成加密金鑰**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

#### ✅ 3. 資料庫 Migration (Core Schema)

**必須執行！**

```bash
# 執行 Core Schema Migration (建立 lineChannelConfig 資料表)
npx nx run twenty-server:database:migrate
```

**這會執行的 Migration**:
1. `CreateLineChannelConfig` - 建立 `core.lineChannelConfig` 資料表
2. `AddBotUserIdToLineChannelConfig` - 新增 `botUserId` 欄位

**驗證**:
```bash
# 連接 PostgreSQL
psql -U your_user -d your_database

# 檢查資料表是否存在
\dt core.lineChannelConfig

# 檢查欄位
\d core."lineChannelConfig"
```

預期輸出應包含:
```
                     Table "core.lineChannelConfig"
          Column           |           Type           | Nullable |
---------------------------+--------------------------+----------+
 id                        | uuid                     | not null |
 channelId                 | character varying        | not null |
 channelSecretEncrypted    | text                     | not null |
 channelAccessTokenEncrypted| text                    | not null |
 botUserId                 | character varying        |          |
 workspaceId               | uuid                     | not null |
 createdAt                 | timestamp with time zone | not null |
 updatedAt                 | timestamp with time zone | not null |
```

---

#### ✅ 4. Workspace Metadata Sync

**必須執行！**

```bash
# 同步 Person 實體的 LINE 欄位到所有 workspace
npx nx run twenty-server:command workspace:sync-metadata
```

**這會做什麼**:
- 掃描 `PersonWorkspaceEntity` 的新欄位定義
- 對每個 `workspace_*` schema 執行 `ALTER TABLE person ADD COLUMN ...`
- 新增 5 個 LINE 欄位:
  - `lineUserId`
  - `lineDisplayName`
  - `lineProfilePictureUrl`
  - `lineStatus`
  - `lastLineInteractionAt`

**驗證**:
```sql
-- 檢查某個 workspace 的 person 表
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'workspace_YOUR_WORKSPACE_ID'
  AND table_name = 'person'
  AND column_name LIKE 'line%';
```

預期輸出:
```
     column_name      | data_type | is_nullable | column_default
----------------------+-----------+-------------+----------------
 lineUserId           | varchar   | YES         | NULL
 lineDisplayName      | varchar   | YES         | NULL
 lineProfilePictureUrl| varchar   | YES         | NULL
 lineStatus           | varchar   | YES         | 'unlinked'
 lastLineInteractionAt| timestamp | YES         | NULL
```

---

#### ✅ 5. 重啟服務

```bash
# 開發環境
npx nx start twenty-server

# 生產環境 (使用 PM2)
pm2 restart twenty-server

# 生產環境 (使用 Docker)
docker-compose restart twenty-server
```

---

#### ✅ 6. 驗證部署

##### 6.1 檢查 GraphQL Schema
```bash
# 訪問 GraphQL Playground
open http://localhost:3000/graphql
```

執行測試查詢:
```graphql
query {
  lineConfig {
    isConfigured
    channelId
  }
}
```

##### 6.2 檢查 Webhook 端點
```bash
# 測試 Webhook 端點是否可訪問（應返回 405 Method Not Allowed，表示端點存在）
curl -X GET http://localhost:3000/api/v1/webhooks/line
```

##### 6.3 檢查服務日誌
```bash
# 確認 LINE 模組載入成功
# 應看到類似訊誌:
# [LineIntegrationModule] LINE Integration Module initialized
```

---

## ⚠️ 常見問題與排查

### Q1: Migration 執行失敗
**錯誤**: `relation "lineChannelConfig" already exists`

**原因**: 資料表已存在（可能之前執行過）

**解決**:
```bash
# 檢查 migration 記錄
SELECT * FROM core.migrations ORDER BY timestamp DESC LIMIT 10;

# 如果確認已執行，跳過即可
# 如果資料表損壞，需手動刪除後重新執行
DROP TABLE IF EXISTS core."lineChannelConfig" CASCADE;
npx nx run twenty-server:database:migrate
```

---

### Q2: Metadata Sync 沒有新增欄位
**錯誤**: Person 表沒有 LINE 欄位

**排查步驟**:
```bash
# 1. 檢查 standardId 是否正確註冊
grep -r "lineUserId" packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/

# 2. 檢查 WorkspaceEntity 是否正確定義
grep -A 10 "lineUserId" packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts

# 3. 重新執行 sync（加上 --force 強制同步）
npx nx run twenty-server:command workspace:sync-metadata -- --force
```

---

### Q3: 加密金鑰未設定
**錯誤**: `LINE_CONFIG_ENCRYPTION_KEY is not defined`

**解決**:
```bash
# 生成新金鑰
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 加入 .env
echo "LINE_CONFIG_ENCRYPTION_KEY=your_generated_key_here" >> .env

# 重啟服務
npx nx start twenty-server
```

---

### Q4: Webhook 收不到事件
**可能原因**:
1. ❌ `botUserId` 欄位未建立 → 執行 Migration
2. ❌ WorkspaceId 查詢失敗 → 檢查 LINE Channel Config 是否有設定
3. ❌ 簽章驗證失敗 → 檢查 Channel Secret 是否正確

**排查**:
```bash
# 檢查 webhook controller 日誌
# 應看到類似訊息:
# [LineWebhookController] Received LINE webhook: 1 events, destination: U1234567890abcdef
# [LineWebhookController] Found workspaceId: abc-123-def for Bot User ID: U1234567890abcdef
```

---

## 📦 完整部署腳本範例

```bash
#!/bin/bash
# LINE 整合功能部署腳本

set -e  # 遇到錯誤立即停止

echo "🚀 開始部署 LINE 整合功能..."

# 1. 檢查環境變數
if [ -z "$LINE_CONFIG_ENCRYPTION_KEY" ]; then
  echo "❌ 錯誤: LINE_CONFIG_ENCRYPTION_KEY 未設定"
  echo "請執行: export LINE_CONFIG_ENCRYPTION_KEY=\$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
  exit 1
fi

echo "✅ 環境變數檢查通過"

# 2. 執行 Core Schema Migration
echo "📊 執行資料庫 Migration..."
npx nx run twenty-server:database:migrate

echo "✅ Migration 執行完成"

# 3. 執行 Workspace Metadata Sync
echo "🔄 同步 Workspace Metadata..."
npx nx run twenty-server:command workspace:sync-metadata

echo "✅ Metadata Sync 完成"

# 4. 重啟服務
echo "🔄 重啟服務..."
pm2 restart twenty-server || echo "⚠️ PM2 未安裝，請手動重啟服務"

echo "🎉 LINE 整合功能部署完成！"
echo ""
echo "📝 下一步:"
echo "  1. 訪問 Settings > Integrations > LINE"
echo "  2. 輸入 LINE Channel 憑證"
echo "  3. 測試連線"
echo "  4. 設定 Webhook URL: https://your-domain.com/api/v1/webhooks/line"
```

---

## 📋 總結對照表

| 資料表/欄位 | Schema | 建立方式 | 部署時需執行 | 指令 |
|------------|--------|---------|-------------|------|
| **lineChannelConfig** (整個資料表) | `core` | TypeORM Migration (手動) | ✅ 必須 | `npx nx run twenty-server:database:migrate` |
| **person.lineUserId** | `workspace_*` | WorkspaceEntity + Metadata Sync (自動) | ✅ 必須 | `npx nx run twenty-server:command workspace:sync-metadata` |
| **person.lineDisplayName** | `workspace_*` | WorkspaceEntity + Metadata Sync (自動) | ✅ 必須 | 同上 |
| **person.lineProfilePictureUrl** | `workspace_*` | WorkspaceEntity + Metadata Sync (自動) | ✅ 必須 | 同上 |
| **person.lineStatus** | `workspace_*` | WorkspaceEntity + Metadata Sync (自動) | ✅ 必須 | 同上 |
| **person.lastLineInteractionAt** | `workspace_*` | WorkspaceEntity + Metadata Sync (自動) | ✅ 必須 | 同上 |

---

## 🎯 快速部署指令摘要

```bash
# 1. 設定環境變數（只需執行一次）
export LINE_CONFIG_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "LINE_CONFIG_ENCRYPTION_KEY=$LINE_CONFIG_ENCRYPTION_KEY" >> .env

# 2. 執行資料庫 Migration（建立 Core 資料表）
npx nx run twenty-server:database:migrate

# 3. 同步 Workspace Metadata（新增 Person 欄位）
npx nx run twenty-server:command workspace:sync-metadata

# 4. 重啟服務
npx nx start twenty-server  # 開發環境
# 或
pm2 restart twenty-server   # 生產環境
```

---

## 📚 相關文件

- [LINE_INTEGRATION_完成總結.md](./LINE_INTEGRATION_完成總結.md) - 專案總覽
- [LINE_INTEGRATION_TASK8_實作總結.md](./LINE_INTEGRATION_TASK8_實作總結.md) - 實作細節
- [LINE_INTEGRATION_深度分析與待辦任務規劃.md](./LINE_INTEGRATION_深度分析與待辦任務規劃.md) - 技術分析

---

**文件版本**: 1.0
**最後更新**: 2025-11-17
**作者**: Claude Code
**狀態**: ✅ 完整部署指南
