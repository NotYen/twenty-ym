# 下次會話提示詞 - LINE Official Account 整合測試

**提供給**: Claude Code (下次會話)
**專案**: Twenty CRM - LINE Official Account 整合
**當前狀態**: ✅ 實作完成，準備進行實際測試
**分支**: `dev_singleuser`
**日期**: 2025-11-28

---

## 🎯 會話目標

**主要任務**: 進行 LINE Official Account 整合的實際端到端測試

**預期完成項目**:
1. 設定 LINE Developers Console
2. 在 Twenty CRM 中配置 LINE Channel 憑證
3. 測試 Webhook 接收與處理
4. 測試 Person 自動建立與更新
5. 測試訊息發送功能
6. 驗證 Workflow 整合
7. 記錄測試結果與問題

---

## 📚 專案背景與上下文

### 已完成的工作

我們已經完成 LINE Official Account (OA) 與 Twenty CRM 的完整整合實作，包括：

#### Phase 1: 基礎建設 ✅
- 建立 `LineChannelConfigEntity` (Core Schema) 儲存 LINE 憑證
- 實作 AES-256-GCM 加密服務保護敏感資料
- 建立 GraphQL API (Query/Mutation) 管理 LINE 設定
- Core Migration: `CreateLineChannelConfig`, `AddBotUserIdToLineChannelConfig`

#### Phase 2: 雙向通訊 ✅
- 實作 Webhook Controller (`POST /api/v1/webhooks/line`)
- 實作 LINE 簽章驗證 (HMAC-SHA256)
- 實作 LINE Messaging API 客戶端 (發送訊息、取得 Profile)
- 支援 follow/unfollow/message 事件處理

#### Phase 3: 工作流整合 ✅
- 整合到 Twenty Workflow 引擎
- 支援 `SEND_LINE_MESSAGE` Action

#### Task 8: Person 實體整合 (方案 A) ✅
- 擴充 Person 實體，新增 5 個 LINE 欄位
- 實作 `LinePersonService` 管理 LINE 使用者與 Person 的對應
- Follow 事件自動建立/更新 Person (status = 'active')
- Unfollow 事件更新 Person (status = 'blocked')
- 從 Webhook `destination` (Bot User ID) 查詢 workspaceId

### 程式碼架構

```
packages/twenty-server/src/modules/line-integration/
├── controllers/
│   └── line-webhook.controller.ts        # Webhook 端點
├── services/
│   ├── line-config.service.ts            # 設定管理
│   ├── line-api.service.ts               # LINE API 客戶端
│   ├── line-webhook.service.ts           # 事件處理
│   ├── line-encryption.service.ts        # 加密/解密
│   └── line-person.service.ts            # Person 整合
├── resolvers/
│   └── line-config.resolver.ts           # GraphQL Resolver
├── guards/
│   └── line-signature.guard.ts           # 簽章驗證
├── middleware/
│   └── line-raw-body.middleware.ts       # 原始 Body 中介軟體
├── entities/
│   └── line-channel-config.entity.ts     # LINE 設定 Entity
├── dtos/
│   └── line-config.dto.ts                # GraphQL DTO
├── types/
│   └── line-webhook-event.type.ts        # Webhook 事件型別
└── line-integration.module.ts            # 模組主檔
```

### 資料庫結構

#### Core Schema
- **表**: `core.lineChannelConfig`
- **欄位**:
  - `id`, `channelId`, `channelSecretEncrypted`, `channelAccessTokenEncrypted`
  - `botUserId` (用於 Webhook 查詢 workspaceId)
  - `workspaceId`, `createdAt`, `updatedAt`

#### Workspace Schema
- **表**: `workspace_{workspaceId}.person`
- **新增欄位** (5 個):
  - `lineUserId` (TEXT): LINE User ID
  - `lineDisplayName` (TEXT): LINE 顯示名稱
  - `lineProfilePictureUrl` (TEXT): LINE 個人照片 URL
  - `lineStatus` (SELECT): LINE 狀態 (active/blocked/unlinked)
  - `lastLineInteractionAt` (TIMESTAMP): 最後互動時間

### 關鍵技術決策

1. **加密演算法**: AES-256-GCM (需要 `LINE_CONFIG_ENCRYPTION_KEY` 環境變數)
2. **簽章驗證**: HMAC-SHA256 (LINE Platform 標準)
3. **Person 整合方案**: 方案 A - 直接擴充 Person 實體 (零 JOIN, 高效能)
4. **Workspace 隔離**: 使用 TwentyORMManager 自動處理多租戶
5. **非同步處理**: Webhook 立即返回 200 OK，事件異步處理

---

## 🔧 環境準備檢查

### 必要環境變數

確認 `.env` 檔案包含:

```bash
# LINE Integration (必填)
LINE_CONFIG_ENCRYPTION_KEY=<64位16進位字元>

# PostgreSQL
PG_DATABASE_URL=postgres://user:password@localhost:5432/twenty

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server (確保可從外部存取，供 LINE Webhook 使用)
SERVER_URL=https://your-domain.com  # 或使用 ngrok
```

### 資料庫 Migration 狀態

**應已執行**:
1. Core Migration:
   ```bash
   npx nx run twenty-server:database:migrate
   ```

2. Workspace Metadata Sync:
   ```bash
   npx nx run twenty-server:command workspace:sync-metadata
   ```

**驗證**:
```bash
# 檢查 lineChannelConfig 表存在
psql -U user -d twenty -c "\dt core.lineChannelConfig"

# 檢查 Person 表包含 LINE 欄位
psql -U user -d twenty -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'person' AND column_name LIKE 'line%';"
```

### 服務啟動

```bash
# 啟動完整開發環境
yarn start

# 或分別啟動
npx nx start twenty-server   # Backend (http://localhost:3000)
npx nx start twenty-front    # Frontend (http://localhost:3000)
npx nx run twenty-server:worker  # Background worker
```

---

## 📋 測試計畫

### Test 1: LINE Developers Console 設定

**目標**: 建立 LINE Official Account 並取得憑證

**步驟**:
1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立 Provider (如果沒有)
3. 建立 Messaging API Channel
4. 記錄以下資訊:
   - **Channel ID**: 在 "Basic settings" 頁面
   - **Channel Secret**: 在 "Basic settings" 頁面
   - **Channel Access Token**: 在 "Messaging API" 頁面點擊 "Issue" 按鈕
   - **Bot User ID** (destination): 在 "Messaging API" 頁面

**注意事項**:
- 需要 LINE Business Account
- Channel Access Token 長期有效 (不會過期)
- 先不要設定 Webhook URL (等 Twenty 設定完成後再設定)

---

### Test 2: Twenty CRM 設定 LINE Channel

**目標**: 在 Twenty CRM 中儲存 LINE 憑證

**步驟**:

#### 2.1 使用 GraphQL Playground

開啟: `http://localhost:3000/graphql`

執行 Mutation:
```graphql
mutation {
  updateLineConfig(
    channelId: "YOUR_CHANNEL_ID"
    channelSecret: "YOUR_CHANNEL_SECRET"
    channelAccessToken: "YOUR_CHANNEL_ACCESS_TOKEN"
  ) {
    id
    channelId
    botUserId
    createdAt
  }
}
```

#### 2.2 驗證儲存成功

執行 Query:
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

**預期結果**:
- `channelId` 應為明文
- `botUserId` 應已自動填充 (透過 `testLineConnection` 取得)
- 資料庫中的 `channelSecretEncrypted` 和 `channelAccessTokenEncrypted` 應為加密狀態

#### 2.3 檢查資料庫

```bash
psql -U user -d twenty

# 查看儲存的設定
SELECT id, "channelId", "botUserId", "workspaceId", length("channelSecretEncrypted"), length("channelAccessTokenEncrypted")
FROM core."lineChannelConfig";
```

**預期**:
- `channelSecretEncrypted` 和 `channelAccessTokenEncrypted` 長度 > 50 (加密後)
- `botUserId` 不為 NULL

---

### Test 3: 測試 LINE API 連線

**目標**: 驗證憑證正確，可呼叫 LINE API

**步驟**:

#### 3.1 使用 testLineConnection Mutation

```graphql
mutation {
  testLineConnection
}
```

**預期結果**:
- 返回 `true` (連線成功)
- 如果返回錯誤，檢查:
  - Channel Access Token 是否正確
  - Token 是否已過期
  - 網路連線是否正常

#### 3.2 檢查 botUserId 自動填充

執行 `testLineConnection` 後，`botUserId` 應自動儲存:

```graphql
query {
  lineConfig {
    botUserId  # 應該有值
  }
}
```

---

### Test 4: 設定 Webhook URL

**目標**: 讓 LINE Platform 可以發送事件到 Twenty CRM

**步驟**:

#### 4.1 準備公開 URL

**選項 A: 使用 ngrok (開發環境)**
```bash
# 安裝 ngrok
brew install ngrok  # macOS
# 或下載: https://ngrok.com/download

# 啟動 ngrok
ngrok http 3000

# 記錄 ngrok URL (如: https://abc123.ngrok.io)
```

**選項 B: 使用實際域名 (生產環境)**
- 確保 `https://your-domain.com` 可存取
- 確保 SSL 憑證有效 (LINE 要求 HTTPS)

#### 4.2 在 LINE Developers Console 設定 Webhook

1. 前往 "Messaging API" 頁面
2. 設定 Webhook URL:
   ```
   https://your-domain.com/api/v1/webhooks/line
   或
   https://abc123.ngrok.io/api/v1/webhooks/line
   ```
3. 啟用 "Use webhook"
4. 點擊 "Verify" 按鈕測試連線

**預期結果**:
- LINE Platform 顯示 "Success" (驗證成功)
- Twenty 後端 log 應出現: `Received LINE webhook: 0 events, destination: ...`

**如果驗證失敗**:
- 檢查 URL 是否正確
- 檢查 Twenty Server 是否正在運行
- 檢查防火牆設定
- 檢查 ngrok 是否正常運作
- 查看 Twenty 後端 log 是否有錯誤

---

### Test 5: 測試 Follow 事件 (Person 自動建立)

**目標**: 使用者加入 LINE OA 時，自動建立 Person

**步驟**:

#### 5.1 使用手機加入 LINE OA

1. 在 LINE Developers Console 取得 QR Code
   - "Messaging API" 頁面 → "Bot information" → QR Code
2. 使用手機 LINE App 掃描 QR Code
3. 點擊「加入」

#### 5.2 檢查 Twenty 後端 Log

應該出現:
```
[LineWebhookController] Received LINE webhook: 1 events, destination: U...
[LineWebhookService] Processing 1 LINE webhook events for workspace <workspaceId>
[LineWebhookService] User U... followed the LINE OA
[LinePersonService] Successfully created/updated person for LINE user U...: <personId>
```

#### 5.3 檢查資料庫 Person 表

```bash
psql -U user -d twenty

# 查詢新建立的 Person (替換 workspaceId)
SELECT id, "firstName", "lastName", "lineUserId", "lineDisplayName", "lineStatus"
FROM workspace_<workspaceId>.person
WHERE "lineUserId" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 5;
```

**預期結果**:
- 應該有一筆新的 Person 記錄
- `lineUserId` = LINE User ID (如: `U1234567890abcdef`)
- `lineDisplayName` = LINE 上的顯示名稱
- `lineStatus` = `'active'`
- `lineProfilePictureUrl` = 個人照片 URL (如果有)

#### 5.4 使用 GraphQL 查詢 Person

```graphql
query {
  people(filter: { lineUserId: { neq: null } }) {
    edges {
      node {
        id
        firstName
        lastName
        lineUserId
        lineDisplayName
        lineProfilePictureUrl
        lineStatus
        lastLineInteractionAt
      }
    }
  }
}
```

---

### Test 6: 測試 Unfollow 事件 (Person 狀態更新)

**目標**: 使用者封鎖 LINE OA 時，更新 Person 狀態

**步驟**:

#### 6.1 使用手機封鎖 LINE OA

1. 在 LINE App 中開啟與 OA 的對話
2. 點擊右上角選單 → 「封鎖」

#### 6.2 檢查 Twenty 後端 Log

應該出現:
```
[LineWebhookController] Received LINE webhook: 1 events, destination: U...
[LineWebhookService] User U... unfollowed the LINE OA
[LinePersonService] Successfully marked LINE user U... as blocked
```

#### 6.3 檢查資料庫

```bash
# 查詢該 Person 的 lineStatus
SELECT id, "lineUserId", "lineDisplayName", "lineStatus"
FROM workspace_<workspaceId>.person
WHERE "lineUserId" = 'U1234567890abcdef';  # 替換成實際的 LINE User ID
```

**預期結果**:
- `lineStatus` 應更新為 `'blocked'`

#### 6.4 測試重新加入

1. 解除封鎖並重新加入 LINE OA
2. 檢查 `lineStatus` 應更新為 `'active'`

---

### Test 7: 測試訊息發送

**目標**: 從 Twenty CRM 發送訊息到 LINE

**步驟**:

#### 7.1 準備測試資料

- LINE User ID (從 Test 5 取得)
- 確保該使用者狀態為 `active` (未封鎖)

#### 7.2 使用 LineApiService 發送訊息

**選項 A: 直接測試 Service (需寫臨時測試程式)**

在 `line-api.service.ts` 加入臨時測試方法:
```typescript
async testPushMessage(lineUserId: string): Promise<void> {
  const workspaceId = '<your-workspace-id>';
  await this.pushMessage(workspaceId, lineUserId, [
    { type: 'text', text: 'Hello from Twenty CRM! 🎉' },
  ]);
}
```

**選項 B: 透過 Workflow (推薦)**

1. 在 Twenty CRM 前端建立 Workflow
2. 新增 Trigger (如: Manual Trigger)
3. 新增 Action: `SEND_LINE_MESSAGE`
   - 輸入 `lineUserId`: 從 Person 取得
   - 輸入 `messages`: `[{ type: 'text', text: 'Test message' }]`
4. 執行 Workflow

#### 7.3 檢查手機 LINE App

**預期結果**:
- 應該收到訊息 "Hello from Twenty CRM! 🎉"

**如果沒收到訊息**:
- 檢查 Twenty 後端 log 是否有錯誤
- 檢查 Channel Access Token 是否正確
- 檢查 LINE User ID 是否正確
- 檢查使用者是否已封鎖 OA

---

### Test 8: 簽章驗證測試

**目標**: 驗證 Webhook 簽章驗證機制正常運作

**步驟**:

#### 8.1 發送無效簽章的請求

使用 curl 或 Postman:
```bash
curl -X POST http://localhost:3000/api/v1/webhooks/line \
  -H "Content-Type: application/json" \
  -H "x-line-signature: invalid_signature" \
  -d '{
    "destination": "Uxxxxxxxx",
    "events": []
  }'
```

**預期結果**:
- HTTP 狀態碼: `403 Forbidden`
- 響應: `{ "message": "Invalid signature" }`

#### 8.2 檢查後端 Log

應該出現:
```
[LineSignatureGuard] Invalid LINE signature
```

---

### Test 9: WorkspaceId 查詢測試

**目標**: 驗證從 `destination` (Bot User ID) 正確查詢到 workspaceId

**步驟**:

#### 9.1 檢查 botUserId 已儲存

```bash
psql -U user -d twenty

SELECT "botUserId", "workspaceId"
FROM core."lineChannelConfig";
```

**預期**: `botUserId` 不為 NULL

#### 9.2 發送測試 Webhook (使用正確簽章)

- 從 LINE Platform 發送實際事件（如加入好友）
- 檢查後端 log:

```
[LineWebhookController] Querying workspaceId for LINE Bot User ID: U...
[LineWebhookController] Found workspaceId: <workspaceId> for Bot User ID: U...
```

**如果查詢失敗**:
- 檢查 `botUserId` 是否已儲存到資料庫
- 檢查 Webhook body 的 `destination` 欄位
- 檢查資料庫索引是否建立 (`IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID`)

---

## 🐛 常見問題排除

### 問題 1: Webhook 驗證失敗

**症狀**: LINE Developers Console 顯示 "Failed to verify webhook"

**可能原因**:
1. Server URL 無法從外部存取
2. HTTPS 憑證無效
3. Twenty Server 未啟動
4. 防火牆阻擋

**解決方法**:
```bash
# 檢查 Twenty Server 是否運行
curl http://localhost:3000/health

# 檢查 ngrok 是否正常
curl https://your-ngrok-url.ngrok.io/health

# 檢查防火牆
sudo ufw status  # Linux
# 或檢查 Cloud Provider 安全群組設定
```

---

### 問題 2: 簽章驗證失敗

**症狀**: 後端 log 顯示 "Invalid LINE signature"

**可能原因**:
1. Channel Secret 設定錯誤
2. Request body 被修改（middleware 問題）
3. 加密金鑰不一致

**解決方法**:
1. 重新確認 Channel Secret:
   ```graphql
   mutation {
     updateLineConfig(
       channelId: "..."
       channelSecret: "YOUR_CHANNEL_SECRET"  # 重新輸入
       channelAccessToken: "..."
     ) { id }
   }
   ```

2. 檢查 `LineRawBodyMiddleware` 是否正確套用:
   ```typescript
   // line-integration.module.ts
   configure(consumer: MiddlewareConsumer) {
     consumer
       .apply(LineRawBodyMiddleware)
       .forRoutes({ path: 'api/v1/webhooks/line', method: RequestMethod.POST });
   }
   ```

---

### 問題 3: Person 沒有自動建立

**症狀**: Follow 事件接收成功，但資料庫沒有新 Person

**可能原因**:
1. `LinePersonService` 未正確注入
2. TwentyORMManager 連線錯誤
3. WorkspaceId 查詢失敗
4. Person 欄位未建立（metadata sync 未執行）

**解決方法**:
1. 檢查後端 log 是否有錯誤
2. 驗證 Person 表包含 LINE 欄位:
   ```bash
   psql -U user -d twenty
   \d workspace_<workspaceId>.person
   # 應該包含 lineUserId, lineDisplayName 等欄位
   ```

3. 重新執行 metadata sync:
   ```bash
   npx nx run twenty-server:command workspace:sync-metadata
   ```

---

### 問題 4: 無法發送訊息

**症狀**: `pushMessage` 呼叫失敗

**可能原因**:
1. Channel Access Token 無效或過期
2. LINE User ID 錯誤
3. 使用者已封鎖 OA
4. 網路連線問題

**解決方法**:
1. 檢查後端 log 的錯誤訊息:
   ```
   [LineApiService] Failed to send LINE message: ...
   ```

2. 重新 Issue Channel Access Token (LINE Developers Console)

3. 確認使用者狀態:
   ```sql
   SELECT "lineUserId", "lineStatus"
   FROM workspace_<workspaceId>.person
   WHERE "lineUserId" = 'U...';
   ```

---

## 📝 測試報告模板

測試完成後，請記錄以下資訊:

```markdown
# LINE 整合測試報告

**日期**: YYYY-MM-DD
**測試者**: Your Name
**環境**: Development / Staging / Production

## 測試結果

### Test 1: LINE Developers Console 設定
- [ ] 已建立 LINE Channel
- [ ] 已取得 Channel ID, Secret, Access Token
- **Bot User ID**: U...

### Test 2: Twenty CRM 設定
- [ ] GraphQL Mutation 成功
- [ ] 設定已加密儲存
- [ ] botUserId 已自動填充

### Test 3: API 連線測試
- [ ] testLineConnection 成功
- **結果**: PASS / FAIL
- **錯誤訊息** (如有): ...

### Test 4: Webhook URL 設定
- [ ] Webhook 驗證成功
- **Webhook URL**: https://...
- **驗證結果**: PASS / FAIL

### Test 5: Follow 事件測試
- [ ] Person 自動建立
- **Person ID**: ...
- **LINE User ID**: U...
- **LINE Display Name**: ...
- **Status**: active

### Test 6: Unfollow 事件測試
- [ ] Person status 更新為 blocked
- **測試時間**: ...
- **結果**: PASS / FAIL

### Test 7: 訊息發送測試
- [ ] 成功收到訊息
- **發送方式**: Service / Workflow
- **訊息內容**: ...
- **結果**: PASS / FAIL

### Test 8: 簽章驗證測試
- [ ] 無效簽章被拒絕
- **HTTP 狀態碼**: 403
- **結果**: PASS / FAIL

### Test 9: WorkspaceId 查詢測試
- [ ] 正確查詢到 workspaceId
- **Destination**: U...
- **WorkspaceId**: ...
- **結果**: PASS / FAIL

## 遇到的問題

1. **問題描述**: ...
   - **解決方法**: ...
   - **狀態**: 已解決 / 待處理

## 效能觀察

- **Webhook 響應時間**: < 1000ms
- **Person 建立時間**: ...
- **訊息發送延遲**: ...

## 建議與改進

1. ...
2. ...

## 總結

- **通過測試數**: X / 9
- **整體狀態**: PASS / FAIL
- **可投入生產**: YES / NO
```

---

## 📂 重要檔案參考

### 後端核心檔案

```
packages/twenty-server/src/modules/line-integration/
├── controllers/line-webhook.controller.ts     # Webhook 端點 (修改此處調整路由)
├── services/
│   ├── line-api.service.ts                   # LINE API 呼叫 (修改此處調整 API 邏輯)
│   ├── line-webhook.service.ts               # 事件處理 (修改此處調整事件處理)
│   └── line-person.service.ts                # Person 整合 (修改此處調整 Person 邏輯)
├── guards/line-signature.guard.ts            # 簽章驗證 (修改此處調整驗證邏輯)
└── line-integration.module.ts                # 模組設定 (修改此處調整依賴)
```

### 資料庫相關

```
packages/twenty-server/src/
├── database/typeorm/core/migrations/common/
│   ├── 1763373200000-CreateLineChannelConfig.ts          # Core Migration 1
│   └── 1763373253828-AddBotUserIdToLineChannelConfig.ts  # Core Migration 2
├── modules/person/standard-objects/
│   └── person.workspace-entity.ts                        # Person 欄位定義
└── engine/workspace-manager/workspace-sync-metadata/constants/
    └── standard-field-ids.ts                             # StandardId 定義
```

### 文件

```
專案根目錄/
├── LINE_INTEGRATION_資料庫架構與部署指南.md     # 資料庫架構說明
├── LINE_INTEGRATION_TASK8_實作總結.md          # Task 8 實作細節
├── LINE_INTEGRATION_實作總結與部署指南.md       # 完整實作總結
└── NEXT_SESSION_PROMPT_LINE_測試.md            # 本文件
```

---

## 🚀 快速啟動指令

```bash
# 1. 確保環境變數設定正確
cat .env | grep LINE_CONFIG_ENCRYPTION_KEY

# 2. 啟動服務
yarn start

# 3. (選填) 啟動 ngrok
ngrok http 3000

# 4. 開啟 GraphQL Playground
open http://localhost:3000/graphql

# 5. 檢查資料庫
psql -U user -d twenty

# 6. 查看即時 log
# (在另一個終端機)
tail -f logs/twenty-server.log  # 或使用 console 輸出
```

---

## ✅ 測試前檢查清單

在開始測試前，請確認:

- [ ] `.env` 包含 `LINE_CONFIG_ENCRYPTION_KEY`
- [ ] 資料庫 Migration 已執行 (Core + Workspace)
- [ ] Twenty Server 正在運行 (`http://localhost:3000`)
- [ ] PostgreSQL 正在運行
- [ ] Redis 正在運行
- [ ] 已建立 LINE Official Account
- [ ] 已取得 Channel ID, Secret, Access Token
- [ ] (開發環境) ngrok 已安裝並可運行

---

## 🎯 預期成果

測試完成後，應該達成:

1. ✅ LINE OA 可正常接收 Webhook 事件
2. ✅ 使用者加入/封鎖 OA 時，Person 自動建立/更新
3. ✅ 可從 Twenty CRM 發送訊息到 LINE
4. ✅ 簽章驗證機制正常運作
5. ✅ WorkspaceId 查詢機制正常運作
6. ✅ 所有 LINE 欄位正確儲存到 Person 表
7. ✅ 加密/解密機制正常運作
8. ✅ 錯誤處理與日誌記錄完整

---

**祝測試順利！如有任何問題，請參考上方的「常見問題排除」或查看詳細的實作文件。**

**文件版本**: 1.0
**建立日期**: 2025-11-28
**適用分支**: `dev_singleuser`
