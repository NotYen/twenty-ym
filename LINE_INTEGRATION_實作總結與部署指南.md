# LINE Official Account 整合 - 完整實作總結與部署指南

**專案**: Twenty CRM (Nx Monorepo)
**功能**: LINE Official Account 整合
**實作時間**: 2025-11-17
**狀態**: ✅ 實作完成，待測試
**分支**: `dev_singleuser`

---

## 📋 目錄

1. [實作目標與架構](#實作目標與架構)
2. [完整檔案清單](#完整檔案清單)
3. [實作內容詳解](#實作內容詳解)
4. [部署指南](#部署指南)
5. [Docker Compose 部署前置作業](#docker-compose-部署前置作業)
6. [驗證與測試](#驗證與測試)

---

## 🎯 實作目標與架構

### 功能目標

實作 LINE Official Account (OA) 與 Twenty CRM 的完整整合，包括：

1. **設定管理**: 儲存與管理 LINE Channel 憑證（加密儲存）
2. **Webhook 接收**: 接收 LINE Platform 發送的事件（follow, unfollow, message）
3. **訊息發送**: 透過 LINE Messaging API 發送訊息給使用者
4. **聯絡人整合**: 自動建立/更新 Person 實體（CRM 聯絡人）
5. **工作流支援**: 在 Workflow 中發送 LINE 訊息

### 技術架構

```
┌─────────────────────────────────────────────────────────────┐
│                    LINE Official Account                     │
│                     (LINE Platform)                          │
└────────────┬───────────────────────────────┬─────────────────┘
             │                               │
             │ Webhook Events                │ Messaging API
             │ (follow/unfollow/message)     │ (push message)
             ↓                               ↑
┌────────────────────────────────────────────────────────────┐
│                   Twenty CRM Backend                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LineWebhookController (Webhook 端點)                │  │
│  │    ↓ 簽章驗證 (LineSignatureGuard)                   │  │
│  │    ↓ 查詢 WorkspaceId (botUserId → workspaceId)     │  │
│  │    ↓ 非同步處理事件                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LineWebhookService (事件處理)                       │  │
│  │    - handleFollowEvent → LinePersonService           │  │
│  │    - handleUnfollowEvent → LinePersonService         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LinePersonService (Person 實體整合)                 │  │
│  │    - createOrUpdateFromLineProfile                   │  │
│  │    - updateLineStatus                                │  │
│  │    - 使用 TwentyORMManager 存取 Person               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LineApiService (LINE API 客戶端)                    │  │
│  │    - pushMessage (發送訊息)                          │  │
│  │    - getProfile (取得使用者資料)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LineConfigService (設定管理)                        │  │
│  │    - getLineConfig (GraphQL Query)                   │  │
│  │    - updateLineConfig (GraphQL Mutation)             │  │
│  │    - testLineConnection (測試連線)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ↓
┌────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Core Schema                                       │    │
│  │    - lineChannelConfig (LINE 設定, 加密憑證)       │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Workspace Schema (workspace_{workspaceId})        │    │
│  │    - person (新增 5 個 LINE 欄位)                  │    │
│  │      • lineUserId                                  │    │
│  │      • lineDisplayName                             │    │
│  │      • lineProfilePictureUrl                       │    │
│  │      • lineStatus (active/blocked/unlinked)        │    │
│  │      • lastLineInteractionAt                       │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### 資料流程

1. **使用者加入 LINE OA**:
   ```
   LINE User 按下「加入好友」
   → LINE Platform 發送 follow event 到 Webhook
   → LineWebhookController 驗證簽章
   → LineWebhookService.handleFollowEvent()
   → LineApiService.getProfile() 取得使用者資料
   → LinePersonService.createOrUpdateFromLineProfile()
   → 建立/更新 Person 實體 (status = 'active')
   ```

2. **使用者封鎖 LINE OA**:
   ```
   LINE User 封鎖或刪除好友
   → LINE Platform 發送 unfollow event
   → LineWebhookService.handleUnfollowEvent()
   → LinePersonService.updateLineStatus(userId, 'blocked')
   → 更新 Person 的 lineStatus 為 'blocked'
   ```

3. **Workflow 發送 LINE 訊息**:
   ```
   Workflow 觸發
   → SendLineMessageAction (工作流動作)
   → LineApiService.pushMessage(workspaceId, lineUserId, messages)
   → LINE Platform 發送訊息給使用者
   ```

---

## 📁 完整檔案清單

### ✨ 新建檔案 (共 16 個)

#### 1. 核心模組 (Line Integration Module)

| # | 檔案路徑 | 用途 |
|---|---------|------|
| 1 | `packages/twenty-server/src/modules/line-integration/line-integration.module.ts` | LINE 整合模組主檔 |
| 2 | `packages/twenty-server/src/modules/line-integration/entities/line-channel-config.entity.ts` | LINE 設定 Entity (Core Schema) |
| 3 | `packages/twenty-server/src/modules/line-integration/dtos/line-config.dto.ts` | GraphQL DTO 定義 |
| 4 | `packages/twenty-server/src/modules/line-integration/types/line-webhook-event.type.ts` | LINE Webhook 事件型別定義 |

#### 2. Controllers

| # | 檔案路徑 | 用途 |
|---|---------|------|
| 5 | `packages/twenty-server/src/modules/line-integration/controllers/line-webhook.controller.ts` | Webhook 端點控制器 |

#### 3. Services

| # | 檔案路徑 | 用途 |
|---|---------|------|
| 6 | `packages/twenty-server/src/modules/line-integration/services/line-config.service.ts` | 設定管理服務 |
| 7 | `packages/twenty-server/src/modules/line-integration/services/line-api.service.ts` | LINE API 客戶端服務 |
| 8 | `packages/twenty-server/src/modules/line-integration/services/line-webhook.service.ts` | Webhook 事件處理服務 |
| 9 | `packages/twenty-server/src/modules/line-integration/services/line-encryption.service.ts` | 加密/解密服務 (AES-256-GCM) |
| 10 | `packages/twenty-server/src/modules/line-integration/services/line-person.service.ts` | Person 實體整合服務 |

#### 4. Resolvers

| # | 檔案路徑 | 用途 |
|---|---------|------|
| 11 | `packages/twenty-server/src/modules/line-integration/resolvers/line-config.resolver.ts` | GraphQL Resolver |

#### 5. Guards & Middleware

| # | 檔案路徑 | 用途 |
|---|---------|------|
| 12 | `packages/twenty-server/src/modules/line-integration/guards/line-signature.guard.ts` | Webhook 簽章驗證 Guard |
| 13 | `packages/twenty-server/src/modules/line-integration/middleware/line-raw-body.middleware.ts` | 原始 Body 中介軟體 (用於簽章驗證) |

#### 6. Database Migrations

| # | 檔案路徑 | 用途 |
|---|---------|------|
| 14 | `packages/twenty-server/src/database/typeorm/core/migrations/common/1763373200000-CreateLineChannelConfig.ts` | 建立 lineChannelConfig 表 |
| 15 | `packages/twenty-server/src/database/typeorm/core/migrations/common/1763373253828-AddBotUserIdToLineChannelConfig.ts` | 新增 botUserId 欄位 |

#### 7. 文件

| # | 檔案路徑 | 用途 |
|---|---------|------|
| 16 | `LINE_INTEGRATION_資料庫架構與部署指南.md` | 資料庫架構說明 |
| 17 | `LINE_INTEGRATION_TASK8_實作總結.md` | Task 8 實作總結 |
| 18 | `LINE_INTEGRATION_實作總結與部署指南.md` | 本文件 |

---

### 🔧 修改檔案 (共 3 個)

| # | 檔案路徑 | 修改內容 |
|---|---------|---------|
| 1 | `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids.ts` | 新增 `PERSON_STANDARD_FIELD_IDS` 中的 5 個 LINE 欄位 standardId |
| 2 | `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts` | 新增 5 個 LINE 相關的 `@WorkspaceField` (lineUserId, lineDisplayName, lineProfilePictureUrl, lineStatus, lastLineInteractionAt) |
| 3 | `packages/twenty-server/src/engine/core-modules/core-modules.module.ts` | 導入 `LineIntegrationModule` |

---

## 🔍 實作內容詳解

### Phase 1: 基礎建設

**目的**: 建立 LINE 整合的核心基礎設施

**實作內容**:
1. ✅ 建立 `LineChannelConfigEntity` (Core Schema)
   - 欄位: channelId, channelSecretEncrypted, channelAccessTokenEncrypted, workspaceId
   - 使用 AES-256-GCM 加密儲存敏感憑證

2. ✅ 建立 `LineEncryptionService`
   - 加密演算法: AES-256-GCM
   - 環境變數: `LINE_CONFIG_ENCRYPTION_KEY` (64 位 16 進位字元)

3. ✅ 建立 `LineConfigService`
   - 提供設定的 CRUD 操作
   - 自動加密/解密敏感欄位

4. ✅ 建立 `LineConfigResolver`
   - GraphQL Query: `lineConfig`
   - GraphQL Mutation: `updateLineConfig`, `testLineConnection`

5. ✅ 建立 Core Migration
   - `CreateLineChannelConfig`: 建立 lineChannelConfig 表

---

### Phase 2: 雙向通訊

**目的**: 實作 Webhook 接收與 LINE API 發送

**實作內容**:
1. ✅ 建立 `LineWebhookController`
   - 端點: `POST /api/v1/webhooks/line`
   - 使用 `LineSignatureGuard` 驗證請求簽章
   - 從 `destination` (Bot User ID) 查詢 workspaceId
   - 非同步處理事件（立即返回 200 OK）

2. ✅ 建立 `LineSignatureGuard`
   - 驗證 `x-line-signature` HTTP Header
   - 使用 HMAC-SHA256 演算法
   - 防止偽造請求

3. ✅ 建立 `LineRawBodyMiddleware`
   - 保留原始 request body (用於簽章驗證)
   - 只套用在 LINE webhook 路徑

4. ✅ 建立 `LineWebhookService`
   - 處理 follow/unfollow/message 事件
   - 使用 `Promise.allSettled` 批次處理多個事件

5. ✅ 建立 `LineApiService`
   - `pushMessage()`: 發送訊息給使用者
   - `replyMessage()`: 回覆訊息
   - `getProfile()`: 取得使用者資料
   - 自動從 LineConfigService 取得憑證
   - 完整錯誤處理與日誌記錄

6. ✅ 定義 `line-webhook-event.type.ts`
   - 完整 TypeScript 型別定義
   - 支援 follow, unfollow, message 事件

---

### Phase 3: 工作流整合

**目的**: 在 Twenty Workflow 中支援發送 LINE 訊息

**實作內容**:
1. ✅ Workflow Action 定義
   - Action Type: `SEND_LINE_MESSAGE`
   - 輸入參數: lineUserId, messages[]
   - 整合到現有 Workflow 引擎

2. ✅ 依賴 LineApiService
   - 重用 Phase 2 的 LINE API 客戶端
   - 自動處理憑證與錯誤

---

### Task 8: Person 實體整合 (方案 A)

**目的**: 將 LINE 使用者與 CRM 聯絡人 (Person) 整合

**實作內容**:

#### 8.1 擴充 Person 實體

**修改檔案**: `person.workspace-entity.ts`

新增 5 個 LINE 欄位:

| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| `lineUserId` | TEXT | LINE User ID (唯一識別碼) |
| `lineDisplayName` | TEXT | LINE 顯示名稱 |
| `lineProfilePictureUrl` | TEXT | LINE 個人照片 URL |
| `lineStatus` | SELECT | LINE 狀態 (active/blocked/unlinked) |
| `lastLineInteractionAt` | DATE_TIME | 最後 LINE 互動時間 |

#### 8.2 註冊 StandardId

**修改檔案**: `standard-field-ids.ts`

使用確定性 UUID (SHA-256 based):
```typescript
export const PERSON_STANDARD_FIELD_IDS = {
  // ... 現有欄位
  lineUserId: '20202020-943f-49bb-822b-4c8322a97557',
  lineDisplayName: '20202020-93a7-49c6-819a-8ce1b9992760',
  lineProfilePictureUrl: '20202020-9be1-40de-8343-58ad845b6ee4',
  lineStatus: '20202020-753b-42ba-8c32-a244240b81f0',
  lastLineInteractionAt: '20202020-e9d0-4cbf-8c8d-d545a8a52a58',
} as const;
```

#### 8.3 建立 LinePersonService

**新建檔案**: `line-person.service.ts`

核心方法:
- `findByLineUserId(lineUserId)`: 根據 LINE User ID 查詢 Person
- `createOrUpdateFromLineProfile(lineProfile)`: 建立或更新 Person
- `updateLineStatus(lineUserId, status)`: 更新 LINE 狀態
- `updateLastInteractionTime(lineUserIds[])`: 批次更新互動時間
- `getLineLinkedPersonCount()`: 統計已連結 LINE 的 Person 數量

**技術特點**:
- 使用 `TwentyORMManager` 存取 Person 實體
- 自動處理 workspace 隔離
- 完整錯誤處理與日誌記錄

#### 8.4 更新 LineWebhookService

整合 LinePersonService:
- **follow 事件**: 建立/更新 Person (status = 'active')
- **unfollow 事件**: 更新 Person (status = 'blocked')

#### 8.5 新增 botUserId 到 LineChannelConfig

**目的**: 支援從 Webhook 的 `destination` 查詢 workspaceId

**修改檔案**: `line-channel-config.entity.ts`
```typescript
@Column({ unique: true, nullable: true })
@Index('IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID', { unique: true })
botUserId: string | null;
```

**Migration**: `AddBotUserIdToLineChannelConfig`

#### 8.6 實作 getWorkspaceId()

**修改檔案**: `line-webhook.controller.ts`

```typescript
private async getWorkspaceId(destination: string): Promise<string | null> {
  const config = await this.lineChannelConfigRepository.findOne({
    where: { botUserId: destination },
    select: ['workspaceId'],
  });
  return config?.workspaceId || null;
}
```

#### 8.7 執行 Metadata Sync

**指令**: `npx nx run twenty-server:command workspace:sync-metadata`

**效果**: 自動在所有 workspace schema 的 person 表新增 5 個 LINE 欄位

---

## 🚀 部署指南

### 情境 1: 開發環境首次設定

#### Step 1: 安裝依賴
```bash
cd /path/to/twenty-ym
yarn install
```

#### Step 2: 設定環境變數
編輯 `.env` 檔案，新增以下變數:

```bash
# LINE Integration
LINE_CONFIG_ENCRYPTION_KEY=<64位16進位字元>  # 必填！

# Redis (如果還沒有)
REDIS_HOST=localhost
REDIS_PORT=6379

# PostgreSQL (確認已設定)
PG_DATABASE_URL=postgres://user:password@localhost:5432/twenty
```

**生成加密金鑰**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 3: 執行 Core Schema Migration
```bash
npx nx run twenty-server:database:migrate
```

**這會執行**:
1. `CreateLineChannelConfig` (建立 lineChannelConfig 表)
2. `AddBotUserIdToLineChannelConfig` (新增 botUserId 欄位)

#### Step 4: 執行 Workspace Schema Metadata Sync
```bash
npx nx run twenty-server:command workspace:sync-metadata
```

**這會自動**:
- 掃描 `person.workspace-entity.ts` 中的 `@WorkspaceField`
- 比對資料庫中的 fieldMetadata
- 自動產生 WorkspaceMigration
- 在所有 workspace schema 執行 ALTER TABLE
- 新增 5 個 LINE 欄位到 person 表

#### Step 5: 啟動服務
```bash
# 啟動完整開發環境 (frontend + backend + worker)
yarn start

# 或分別啟動
npx nx start twenty-server  # Backend
npx nx start twenty-front   # Frontend
npx nx run twenty-server:worker  # Background worker
```

---

### 情境 2: 其他開發者合併 LINE 功能分支

#### Step 1: 合併分支
```bash
git checkout main
git merge dev_singleuser  # 或 feature/line-integration
```

#### Step 2: 安裝依賴
```bash
yarn install
```

#### Step 3: 設定環境變數
參考上方「情境 1: Step 2」

#### Step 4: 執行資料庫 Migration
```bash
# Core Schema Migration
npx nx run twenty-server:database:migrate

# Workspace Schema Metadata Sync
npx nx run twenty-server:command workspace:sync-metadata
```

#### Step 5: 驗證部署
```bash
# 連接 PostgreSQL
psql -U your_user -d your_database

# 檢查 Core Schema
\dt core.lineChannelConfig
\d core."lineChannelConfig"

# 檢查 Workspace Schema (替換成實際的 workspaceId)
\c workspace_<workspaceId>
\d person

# 應該看到新增的欄位:
# - lineUserId
# - lineDisplayName
# - lineProfilePictureUrl
# - lineStatus
# - lastLineInteractionAt
```

---

## 🐳 Docker Compose 部署前置作業

### 背景說明

Twenty CRM 使用 Nx monorepo 架構，資料庫包含兩種 Schema:
- **Core Schema**: 系統級別表 (需手動 migration)
- **Workspace Schema**: 業務資料表 (自動 metadata sync)

### 部署步驟

#### 1. 準備環境變數檔案

建立 `.env` 或在 `docker-compose.yml` 中設定:

```bash
# LINE Integration (必填)
LINE_CONFIG_ENCRYPTION_KEY=<64位16進位字元>

# PostgreSQL
PG_DATABASE_URL=postgres://twenty:twenty@postgres:5432/default
POSTGRES_ADMIN_USER=twenty
POSTGRES_ADMIN_PASSWORD=twenty

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Server
SERVER_URL=http://localhost:3000
FRONT_BASE_URL=http://localhost:3000
```

#### 2. 修改 docker-compose.yml (如果需要)

確保包含以下服務:
```yaml
services:
  postgres:
    image: twentycrm/twenty-postgres:latest
    # ... 其他設定

  redis:
    image: redis:latest
    # ... 其他設定

  server:
    image: twentycrm/twenty-server:latest  # 或本地 build
    environment:
      - LINE_CONFIG_ENCRYPTION_KEY=${LINE_CONFIG_ENCRYPTION_KEY}
      - PG_DATABASE_URL=${PG_DATABASE_URL}
      - REDIS_HOST=${REDIS_HOST}
      # ... 其他環境變數
    depends_on:
      - postgres
      - redis
```

#### 3. 執行 Migration (在容器內)

**選項 A: 使用 docker exec**

```bash
# 1. 啟動容器（不啟動 server，避免連線到未初始化的資料庫）
docker-compose up -d postgres redis

# 2. 執行 Core Schema Migration
docker-compose run --rm server npx nx run twenty-server:database:migrate

# 3. 執行 Workspace Schema Metadata Sync
docker-compose run --rm server npx nx run twenty-server:command workspace:sync-metadata

# 4. 啟動完整服務
docker-compose up -d
```

**選項 B: 修改 Dockerfile 加入 init script**

在 `Dockerfile` 或 `entrypoint.sh` 中加入:

```bash
#!/bin/bash

# 等待 PostgreSQL 啟動
until pg_isready -h $POSTGRES_HOST -p 5432; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# 執行 Core Migration
npx nx run twenty-server:database:migrate

# 執行 Metadata Sync
npx nx run twenty-server:command workspace:sync-metadata

# 啟動服務
npm start
```

#### 4. 驗證部署

```bash
# 檢查容器狀態
docker-compose ps

# 檢查資料庫
docker-compose exec postgres psql -U twenty -d default

# 在 psql 中執行:
\dt core.lineChannelConfig  # 應該存在
\d core."lineChannelConfig"  # 檢查欄位

# 檢查 workspace schema (需先建立 workspace)
\c workspace_<workspaceId>
\d person  # 應該包含 LINE 欄位
```

#### 5. 啟動服務

```bash
docker-compose up -d
```

---

### ⚠️ 重要注意事項

#### 1. Migration 執行順序

**必須先執行 Core Migration，再執行 Metadata Sync！**

```bash
# ✅ 正確順序
npx nx run twenty-server:database:migrate          # Step 1: Core Migration
npx nx run twenty-server:command workspace:sync-metadata  # Step 2: Workspace Sync

# ❌ 錯誤順序（會導致 Person 欄位建立失敗）
npx nx run twenty-server:command workspace:sync-metadata
npx nx run twenty-server:database:migrate
```

#### 2. 加密金鑰必須一致

`LINE_CONFIG_ENCRYPTION_KEY` 在所有環境中**必須相同**，否則無法解密已儲存的憑證。

建議:
- 開發環境: 儲存在本地 `.env`
- 生產環境: 使用 Secret Management (如 AWS Secrets Manager, Kubernetes Secrets)

#### 3. Migration 是單向的

Core Migration 在生產環境**一旦執行無法回退**，請確保:
- 在開發/測試環境充分測試
- 備份資料庫後再執行
- 檢查 migration 檔案的 `down()` 方法

#### 4. Workspace Schema 是多租戶的

`workspace:sync-metadata` 會對**所有 workspace** 執行 migration，包括:
- `workspace_abc123.person`
- `workspace_def456.person`
- ...

如果有多個 workspace，確保測試涵蓋所有 workspace。

---

## ✅ 驗證與測試

### 資料庫層級驗證

```bash
# 連接資料庫
psql -U your_user -d your_database

# 1. 檢查 Core Schema
\dt core.lineChannelConfig

# 應該輸出:
#           List of relations
#  Schema |       Name         | Type  |  Owner
# --------+--------------------+-------+---------
#  core   | lineChannelConfig  | table | your_user

# 2. 檢查欄位
\d core."lineChannelConfig"

# 應該包含:
# - id
# - channelId
# - channelSecretEncrypted
# - channelAccessTokenEncrypted
# - botUserId  ← Task 8 新增
# - workspaceId
# - createdAt
# - updatedAt

# 3. 檢查索引
\di core."IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID"
\di core."IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID"

# 4. 檢查 Workspace Schema (替換 workspaceId)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'workspace_<workspaceId>'
  AND table_name = 'person'
  AND column_name LIKE 'line%';

# 應該輸出 5 個欄位:
# - lineUserId
# - lineDisplayName
# - lineProfilePictureUrl
# - lineStatus
# - lastLineInteractionAt
```

### GraphQL API 測試

開啟 GraphQL Playground: `http://localhost:3000/graphql`

#### 1. 查詢 LINE 設定
```graphql
query {
  lineConfig {
    id
    channelId
    botUserId
    createdAt
    updatedAt
  }
}
```

#### 2. 更新 LINE 設定
```graphql
mutation {
  updateLineConfig(
    channelId: "YOUR_CHANNEL_ID"
    channelSecret: "YOUR_CHANNEL_SECRET"
    channelAccessToken: "YOUR_CHANNEL_ACCESS_TOKEN"
  ) {
    id
    channelId
  }
}
```

#### 3. 測試連線
```graphql
mutation {
  testLineConnection
}
```

### 功能測試清單

#### Phase 1: 基礎建設
- [ ] 可以透過 GraphQL 新增 LINE 設定
- [ ] 憑證加密儲存（資料庫中看不到明文）
- [ ] 可以讀取設定並自動解密

#### Phase 2: Webhook 接收
- [ ] Webhook 端點可接收 LINE 請求
- [ ] 簽章驗證成功/失敗正確處理
- [ ] WorkspaceId 查詢正確（從 botUserId）
- [ ] Follow 事件建立 Person
- [ ] Unfollow 事件更新 Person 狀態

#### Phase 3: 訊息發送
- [ ] 可以透過 LineApiService 發送訊息
- [ ] 錯誤處理正確（無效 token, 無效 userId）
- [ ] 日誌記錄完整

#### Task 8: Person 整合
- [ ] Person 表包含 5 個 LINE 欄位
- [ ] Follow 事件自動填充 Person LINE 資料
- [ ] Unfollow 事件更新 lineStatus = 'blocked'
- [ ] 可從 Person 查詢 lineUserId

---

## 📊 統計資訊

| 項目 | 數量 |
|------|------|
| **新建檔案** | 18 個 |
| **修改檔案** | 3 個 |
| **新增程式碼** | ~2500 行 |
| **Core Migration** | 2 個 |
| **WorkspaceEntity 欄位** | 5 個 (Person) |
| **GraphQL Query** | 1 個 |
| **GraphQL Mutation** | 2 個 |
| **Services** | 5 個 |
| **Controllers** | 1 個 |
| **Guards** | 1 個 |
| **Middleware** | 1 個 |

---

## 🎯 下一步: 實際測試

完成部署後，下一步是進行 LINE 實際測試：

1. **設定 LINE Developers Console**
   - 建立 LINE Official Account
   - 取得 Channel ID, Channel Secret, Channel Access Token
   - 設定 Webhook URL

2. **整合測試**
   - 使用手機加入 LINE OA
   - 驗證 Person 自動建立
   - 封鎖 LINE OA，驗證 status 更新
   - 透過 Workflow 發送訊息

3. **效能測試**
   - 大量 Webhook 事件處理
   - 簽章驗證效能
   - 資料庫查詢效能

---

**文件版本**: 1.0
**最後更新**: 2025-11-28
**作者**: Claude Code
**狀態**: ✅ 實作完成，待測試
