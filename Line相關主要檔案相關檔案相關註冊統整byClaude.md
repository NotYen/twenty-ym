# Line相關主要檔案相關檔案相關註冊統整

## 第一部分：主要檔案相關檔案相關註冊統整

### 根目錄文檔
```
/mnt/d/project/twenty-ym/
├── LINE_INTEGRATION_PHASE1_技術說明文件.md
├── LINE_INTEGRATION_PHASE2_技術說明文件.md
├── LINE_INTEGRATION_PHASE3_技術說明文件.md
├── LINE_INTEGRATION_TASK8_實作總結.md
├── LINE_INTEGRATION_完成總結.md
├── LINE_INTEGRATION_實作總結與部署指南.md
├── LINE_INTEGRATION_深度分析與待辦任務規劃.md
├── LINE_INTEGRATION_資料庫架構與部署指南.md
├── LINE_OA_完整整合與架構設計_工程計畫.md
├── LINE_OA_完整整合與架構設計方案.md
├── LINE_OA_完整整合與架構設計方案問題.txt
├── LINE_OA整合功能第二階段實施方案.md
├── LINE_OA整合功能設計與實施方案.md
└── NEXT_SESSION_PROMPT_LINE_測試.md
```

### 後端 - Line Integration Module (核心模組)
```
packages/twenty-server/src/modules/line-integration/
├── line-integration.module.ts                      # LINE整合模組的主要註冊檔
├── controllers/
│   └── line-webhook.controller.ts                  # Webhook端點控制器
├── guards/
│   └── line-signature.guard.ts                     # LINE簽章驗證守衛
├── middleware/
│   └── line-raw-body.middleware.ts                 # 原始Body中間件(用於簽章驗證)
├── resolvers/
│   └── line-config.resolver.ts                     # GraphQL Resolver(前端設定API)
├── services/
│   ├── line-api.service.ts                         # LINE Messaging API客戶端
│   ├── line-config.service.ts                      # LINE設定管理服務
│   ├── line-encryption.service.ts                  # 加密/解密服務
│   ├── line-person.service.ts                      # Person與LINE整合服務
│   └── line-webhook.service.ts                     # Webhook事件處理服務
├── types/
│   └── line-webhook-event.type.ts                  # Webhook事件類型定義
├── dtos/
│   └── line-config.dto.ts                          # GraphQL DTO定義
└── entities/
    └── line-channel-config.entity.ts               # LINE Channel設定實體
```

### 後端 - Workflow Actions (LINE訊息發送)
```
packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/line-message/
├── line-message-action.module.ts                   # LINE訊息Action模組註冊
├── send-line-message.workflow-action.ts            # 發送LINE訊息的Workflow Action
├── guards/
│   └── is-workflow-send-line-message-action.guard.ts  # 類型守衛
└── types/
    ├── workflow-send-line-message-action-input.type.ts    # Action輸入類型
    └── workflow-send-line-message-action-settings.type.ts # Action設定類型
```

### 後端 - Workflow 整合註冊
```
packages/twenty-server/src/modules/workflow/workflow-executor/
├── workflow-executor.module.ts                     # Workflow執行器模組(導入LineMessageActionModule)
├── factories/
│   └── workflow-action.factory.ts                  # Action工廠(註冊SendLineMessageWorkflowAction)
└── workflow-actions/types/
    ├── workflow-action.type.ts                     # 定義SEND_LINE_MESSAGE類型
    └── workflow-action-settings.type.ts            # 包含Line訊息設定類型
```

### 後端 - 資料庫 Migrations
```
packages/twenty-server/src/database/typeorm/core/migrations/common/
├── 1763373200000-CreateLineChannelConfig.ts        # 建立LINE Channel設定表
└── 1763373253828-AddBotUserIdToLineChannelConfig.ts  # 新增Bot User ID欄位
```

### 後端 - Person 實體 (LINE欄位)
```
packages/twenty-server/src/modules/person/standard-objects/
└── person.workspace-entity.ts                      # Person實體(包含LINE相關欄位)
    ├── lineUserId: LINE User ID
    ├── lineDisplayName: LINE顯示名稱
    ├── lineProfilePictureUrl: LINE頭像URL
    ├── lineStatus: LINE好友狀態(active/blocked/unlinked)
    └── lastLineInteractionAt: 最後互動時間
```

### 後端 - 模組註冊
```
packages/twenty-server/src/
├── modules/modules.module.ts                       # 全域模組註冊(導入LineIntegrationModule)
└── engine/api/graphql/
    └── metadata-graphql-api.module.ts              # GraphQL API模組(整合LineConfigResolver)
```

### 前端 - Settings Pages & Components
```
packages/twenty-front/src/
├── pages/settings/integrations/
│   └── SettingsIntegrationLine.tsx                 # LINE設定頁面UI元件
├── modules/settings/integrations/
│   ├── constants/
│   │   └── SettingsIntegrationLine.ts              # LINE整合註冊常數
│   ├── components/
│   │   └── SettingsIntegrationComponent.tsx        # 整合設定通用元件
│   ├── hooks/
│   │   └── useSettingsIntegrationCategories.ts     # 整合類別Hook(註冊LINE)
│   ├── types/
│   │   └── SettingsIntegrationCategory.ts          # 整合類別類型定義
│   └── line/graphql/
│       ├── queries/
│       │   └── getLineConfig.ts                    # 查詢LINE設定GraphQL
│       └── mutations/
│           ├── updateLineConfig.ts                 # 更新LINE設定GraphQL
│           ├── deleteLineConfig.ts                 # 刪除LINE設定GraphQL
│           └── testLineConnection.ts               # 測試LINE連線GraphQL
└── modules/app/components/
    └── SettingsRoutes.tsx                          # 路由註冊(LINE設定路由)
```

### 前端 - Shared Types
```
packages/twenty-shared/src/types/
└── SettingsPath.ts                                 # 路由路徑定義(Line = 'line')
```

### 配置檔案
```
packages/twenty-server/
├── .env.example                                    # LINE環境變數範例
├── .env.local                                      # 本地LINE設定
└── .env                                            # LINE環境變數
    ├── LINE_CHANNEL_ID
    ├── LINE_CHANNEL_SECRET
    ├── LINE_CHANNEL_ACCESS_TOKEN
    └── LINE_ENCRYPTION_KEY

deployment/
└── docker-compose.local-test.yml                   # Docker設定(包含LINE環境變數)
```

### 編譯輸出 (Build Artifacts)
```
packages/twenty-server/dist/src/
├── modules/line-integration/                       # LINE整合模組編譯檔
├── modules/workflow/workflow-executor/workflow-actions/line-message/  # Workflow Action編譯檔
└── database/typeorm/core/migrations/common/        # Migration編譯檔
```

---

## 第二部分：程式運作流程

### a. Line Settings的設定

#### 程式碼檔案：

**前端路由與UI：**
- `/mnt/d/project/twenty-ym/packages/twenty-front/src/pages/settings/integrations/SettingsIntegrationLine.tsx`
- `/mnt/d/project/twenty-ym/packages/twenty-front/src/modules/settings/integrations/constants/SettingsIntegrationLine.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-shared/src/types/SettingsPath.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-front/src/modules/settings/integrations/hooks/useSettingsIntegrationCategories.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`
- `/mnt/d/project/twenty-ym/packages/twenty-front/src/modules/settings/integrations/components/SettingsIntegrationComponent.tsx`

**前端GraphQL：**
- `/mnt/d/project/twenty-ym/packages/twenty-front/src/modules/settings/integrations/line/graphql/queries/getLineConfig.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-front/src/modules/settings/integrations/line/graphql/mutations/updateLineConfig.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-front/src/modules/settings/integrations/line/graphql/mutations/deleteLineConfig.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-front/src/modules/settings/integrations/line/graphql/mutations/testLineConnection.ts`

**後端GraphQL與服務：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/engine/api/graphql/metadata-graphql-api.module.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/resolvers/line-config.resolver.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/dtos/line-config.dto.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-config.service.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-encryption.service.ts`

**後端實體與資料庫：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/entities/line-channel-config.entity.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/database/typeorm/core/migrations/common/1763373200000-CreateLineChannelConfig.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/database/typeorm/core/migrations/common/1763373253828-AddBotUserIdToLineChannelConfig.ts`

**模組註冊：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/line-integration.module.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/modules.module.ts`

#### 程式碼檔案功能與關係：

**SettingsIntegrationLine.tsx**
這個檔案包含了LINE設定頁面的實際UI程式碼，包含輸入框、按鈕等的表單元件。使用者在此頁面輸入LINE Channel ID、Channel Secret和Channel Access Token。元件內部呼叫GraphQL mutations來儲存設定。

**SettingsIntegrationLine.ts**
這個檔案的目的是作為LINE整合功能在前端介面中的「註冊表」。它定義了LINE整合的基本資訊，例如：
* 名稱 (Title)：讓使用者在介面中看到「LINE」這個選項。
* 圖示 (Icon)：顯示在設定介面中的視覺標識。
* 路徑 (Path)：定義了點擊後會導向的URL (例如 http://localhost:9999/settings/integrations/line)。
* 指向的實際UI元件 (Component)：指明了SettingsIntegrationLine.tsx這個檔案才是真正負責渲染設定介面的地方。
* 導航和顯示：useSettingsIntegrationCategories這個hook會使用這個SettingsIntegrationLine.ts檔案所提供的資訊，將LINE整合功能加入到主「整合」設定頁面的清單中。這樣，使用者才能在/settings/integrations頁面看到一個關於LINE整合的圖示或連結，並點擊它來導覽到SettingsIntegrationLine.tsx所呈現的詳細設定介面。

**SettingsPath.ts**
列舉是所有應用程式設定路由的集中註冊表。透過將`Line = 'line'`加入此列舉，建立了一個符號常數(SettingsPath.Line)，可以在前端程式碼中一致地使用它來指代LINE整合設定頁面。這提高了可維護性並防止硬編碼URL。`getSettingsPath`工具函數將使用此列舉成員來生成實際的URL，例如`/settings/integrations/line`。將`Line = 'line'`添加到SettingsPath列舉中，對於定義LINE整合設定的清晰、型別安全且集中管理的路由區段至關重要。這與其他設定頁面（例如`Accounts='accounts'`）的現有模式保持一致。透過將此列舉成員與`getSettingsPath(SettingsPath.Integrations, SettingsPath.Line)`結合使用，前端可以動態且可靠地構建完整的URL（`/settings/integrations/line`）。這確保了一致性並簡化了路由結構的未來維護。

**useSettingsIntegrationCategories**
hook負責提供顯示在`/settings/integrations`頁面上的整合類別列表。透過導入新建立的`SETTINGS_INTEGRATION_LINE_CATEGORY`並將其添加到返回的陣列中，確保LINE整合已正確註冊並在使用者介面中可見。這完成了LINE整合的前端註冊。

**SettingsRoutes.tsx**
是設定頁面的中央路由器。需要為LINE整合在此處添加一個新的Route條目。為了確保當使用者導航到LINE整合設定頁面時，SettingsIntegrationLine.tsx元件能夠被渲染，應用程式的路由設定中需要定義一個特定的路由。這涉及到在SettingsRoutes.tsx中添加一個新的`<Route>`元素。這個新路由將把使用SettingsPath.Integrations和SettingsPath.Line（解析為`/settings/integrations/line`）構建的URL路徑映射到SettingsIntegrationLine元件。這使得LINE設定頁面可以透過其專用URL在應用程式中直接存取。添加新路由將它邏輯上放在`API_KEYS_AND_WEBHOOKS`保護包裝器內，與現有的`SettingsIntegrations`路由並列。

**SettingsIntegrationComponent.tsx**
SettingsIntegrationLine.ts中的'Goto'按鈕在此檔案定義。這是一個可重用的元件，用於顯示整合設定的通用介面元素，包括導航按鈕、狀態指示器等。

**GraphQL Queries & Mutations**
前端使用四個GraphQL操作與後端通訊：
1. `getLineConfig.ts`：查詢當前workspace的LINE設定。使用Apollo Client發送query到後端的LineConfigResolver。
2. `updateLineConfig.ts`：更新或建立LINE設定。將使用者輸入的Channel ID、Secret和Access Token發送到後端。
3. `deleteLineConfig.ts`：刪除LINE設定。
4. `testLineConnection.ts`：測試LINE連線。呼叫LINE API的Get Bot Info端點驗證設定是否正確。

**metadata-graphql-api.module.ts**
這是GraphQL API的主模組註冊檔。它導入了LineIntegrationModule，使得LineConfigResolver可以被GraphQL API使用。這是連接前端GraphQL請求與後端服務的關鍵註冊點。

**line-config.resolver.ts**
GraphQL Resolver，處理前端的查詢和變更請求。它定義了以下操作：
* `getLineConfig(workspaceId)`: 查詢LINE設定
* `updateLineConfig(workspaceId, input)`: 更新或建立LINE設定
* `deleteLineConfig(workspaceId)`: 刪除LINE設定
* `testLineConnection(workspaceId)`: 測試LINE連線

Resolver內部呼叫LineConfigService來執行實際的業務邏輯。

**line-config.dto.ts**
定義了GraphQL的輸入和輸出類型。包括：
* `LineConfigDto`: 輸出類型，包含channelId、workspaceId等（不包含敏感資訊）
* `UpdateLineConfigInput`: 輸入類型，包含channelId、channelSecret、channelAccessToken

**line-config.service.ts**
核心業務邏輯服務，負責：
1. 從資料庫查詢LINE設定
2. 建立或更新LINE設定
3. 刪除LINE設定
4. 呼叫LineEncryptionService進行敏感資料加密/解密
5. 使用TypeORM與LineChannelConfigEntity互動
6. 呼叫LineApiService測試連線並取得Bot User ID

服務層的關鍵邏輯：
* 儲存前：使用LineEncryptionService加密channelSecret和channelAccessToken
* 讀取後：解密敏感資料（僅在需要時）
* 建立設定時：呼叫LINE API取得Bot User ID並儲存（用於webhook路由）

**line-encryption.service.ts**
負責加密和解密敏感資料（Channel Secret和Access Token）。使用AES-256-GCM演算法，密鑰從環境變數`LINE_ENCRYPTION_KEY`讀取。確保儲存在資料庫中的敏感資料是加密狀態，符合安全性最佳實踐。

**line-channel-config.entity.ts**
TypeORM實體，定義了LINE設定的資料庫表結構：
* `id`: UUID主鍵
* `channelId`: LINE Channel ID
* `channelSecretEncrypted`: 加密後的Channel Secret
* `channelAccessTokenEncrypted`: 加密後的Channel Access Token
* `botUserId`: LINE Bot User ID（用於webhook destination查詢）
* `workspaceId`: 工作區ID（支援多租戶隔離）
* `createdAt`: 建立時間
* `updatedAt`: 更新時間

索引設計：
* `IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID`: workspaceId索引（查詢優化）
* `IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID_UNIQUE`: workspaceId唯一索引（一個workspace只能有一個LINE設定）
* `IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID`: botUserId唯一索引（webhook路由查詢）

**CreateLineChannelConfig Migration**
建立`lineChannelConfig`表的資料庫遷移檔。定義了表結構、欄位類型和索引。在專案初始化或部署時執行，確保資料庫schema正確。

**AddBotUserIdToLineChannelConfig Migration**
為`lineChannelConfig`表新增`botUserId`欄位的遷移檔。這是後續功能增強，用於支援從webhook的destination欄位查詢對應的workspace。

**line-integration.module.ts**
LINE整合的NestJS模組註冊檔。它：
1. 導入HttpModule（用於呼叫LINE API）
2. 註冊TypeORM實體（LineChannelConfigEntity）
3. 註冊所有服務（LineConfigService、LineApiService等）
4. 註冊Controller（LineWebhookController）
5. 註冊Guard（LineSignatureGuard）
6. 註冊Resolver（LineConfigResolver）
7. 配置Middleware（LineRawBodyMiddleware）
8. 導出服務供其他模組使用

**modules.module.ts**
全域模組註冊檔，將LineIntegrationModule導入到應用程式中，使其在整個後端可用。

#### 運作流程總結：

1. **前端註冊**：SettingsIntegrationLine.ts定義LINE整合 → useSettingsIntegrationCategories註冊到整合清單 → SettingsPath.ts定義路由路徑 → SettingsRoutes.tsx註冊路由
2. **使用者操作**：使用者導航到`/settings/integrations/line` → SettingsIntegrationLine.tsx渲染UI → 使用者輸入設定
3. **前端請求**：SettingsIntegrationLine.tsx呼叫GraphQL mutation（updateLineConfig）→ Apollo Client發送請求到後端
4. **後端處理**：metadata-graphql-api.module.ts接收請求 → LineConfigResolver處理mutation → LineConfigService執行業務邏輯
5. **資料加密**：LineEncryptionService加密channelSecret和channelAccessToken
6. **API呼叫**：LineApiService呼叫LINE API取得Bot User ID
7. **資料儲存**：使用TypeORM將加密後的設定儲存到LineChannelConfigEntity（lineChannelConfig表）
8. **回應前端**：返回成功訊息給前端 → 前端顯示成功提示

### b. Webhook的訊息接收與處理

#### 程式碼檔案：

**Webhook接收端點：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/controllers/line-webhook.controller.ts`

**Webhook處理服務：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-webhook.service.ts`

**安全驗證：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/guards/line-signature.guard.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/middleware/line-raw-body.middleware.ts`

**支援服務：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-api.service.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-person.service.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-config.service.ts`

**類型定義：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/types/line-webhook-event.type.ts`

**實體與資料庫：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/entities/line-channel-config.entity.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`

**模組註冊：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/line-integration.module.ts`

#### 程式碼檔案功能與關係：

**line-webhook.controller.ts**
這是接收LINE Platform webhook事件的HTTP控制器。關鍵功能包括：

1. **端點定義**：
   * 路由：`POST /api/v1/webhooks/line`
   * 必須是公開端點（不需要身份驗證）
   * 使用`@UseGuards(LineSignatureGuard)`確保請求來自LINE Platform

2. **WorkspaceId查詢**：
   * 從webhook body的`destination`欄位（Bot User ID）查詢LineChannelConfig
   * 透過botUserId索引快速查詢對應的workspaceId
   * 如果找不到對應的workspace，仍返回200 OK避免LINE重送

3. **非同步處理**：
   * 使用`setImmediate`立即返回200 OK給LINE Platform（必須在5秒內）
   * 實際事件處理交給LineWebhookService在背景執行
   * 避免阻塞HTTP響應，符合LINE Platform的要求

4. **錯誤處理**：
   * 所有錯誤都被捕獲並記錄，但仍返回200 OK
   * 防止LINE Platform因為錯誤而重複發送事件

**line-webhook.service.ts**
負責處理從LINE Platform接收到的webhook事件的核心業務邏輯服務。關鍵功能：

1. **事件處理入口**：
   * `handleEvents(workspaceId, events)`：處理事件陣列
   * 使用`Promise.allSettled`並行處理多個事件
   * 單一事件失敗不影響其他事件處理

2. **支援的事件類型**：
   * `follow`事件：使用者加入好友
     - 呼叫LineApiService取得使用者Profile
     - 呼叫LinePersonService建立或更新Person實體
     - 儲存lineUserId、lineDisplayName、lineProfilePictureUrl
     - 設定lineStatus為'active'
     - 更新lastLineInteractionAt

   * `unfollow`事件：使用者封鎖或刪除好友
     - 呼叫LinePersonService更新lineStatus為'blocked'
     - 更新lastLineInteractionAt

   * `message`事件：使用者發送訊息（目前僅記錄，未完整實作）
     - 預留擴充：更新lastLineInteractionAt
     - 預留擴充：觸發工作流
     - 預留擴充：自動回覆

3. **錯誤處理**：
   * 每個事件的錯誤都被獨立捕獲和記錄
   * 使用Logger記錄詳細的錯誤訊息
   * 錯誤不會中斷其他事件的處理

**line-signature.guard.ts**
NestJS Guard，驗證webhook請求確實來自LINE Platform。這是關鍵的安全機制：

1. **簽章驗證流程**：
   * 從請求標頭取得`X-Line-Signature`
   * 讀取請求的原始body（raw body）
   * 從body的destination取得Bot User ID並查詢workspaceId
   * 使用對應workspace的Channel Secret進行HMAC-SHA256運算
   * 使用`timingSafeEqual`進行恆定時間比對，防止時序攻擊
   * 如果簽章不符，拋出`ForbiddenException`

2. **冪等性檢查**：
   * 使用Redis儲存已處理的`webhookEventId`
   * TTL設定為60秒
   * 使用`cacheStorage.acquireLock`實作SETNX語義
   * 如果檢測到重複事件，仍返回true但在Service層被忽略
   * 確保LINE Platform的重送不會造成重複處理

3. **WorkspaceId取得**：
   * 從LineChannelConfigEntity查詢botUserId對應的workspaceId
   * 支援多租戶隔離，每個workspace有獨立的LINE設定
   * 使用botUserId唯一索引快速查詢

4. **安全性特性**：
   * 使用HMAC-SHA256加密演算法
   * 恆定時間比對防止時序攻擊
   * 冪等性檢查防止重複處理
   * 簽章驗證防止偽造請求

**line-raw-body.middleware.ts**
NestJS中間件，確保LINE webhook請求的raw body可用於簽章驗證。關鍵功能：

1. **Raw Body處理**：
   * NestJS預設會解析JSON body，但LINE簽章驗證需要原始的body string
   * 此middleware將原始body附加到`request.rawBody`
   * 如果rawBody不存在但body存在，手動轉換為JSON字串

2. **型別擴展**：
   * 擴展Express Request類型以包含rawBody屬性
   * 使全域可用`req.rawBody`

3. **註冊方式**：
   * 在LineIntegrationModule的`configure`方法中註冊
   * 僅套用在`/api/v1/webhooks/line`路徑
   * 確保不影響其他路由的性能

**line-api.service.ts**
LINE Messaging API的客戶端服務，封裝所有對LINE Platform的API呼叫。關鍵功能：

1. **Get Profile API**：
   * `getProfile(workspaceId, userId)`：取得LINE使用者資料
   * 端點：`GET https://api.line.me/v2/bot/profile/{userId}`
   * 使用LineConfigService取得對應workspace的Access Token
   * 返回displayName、pictureUrl、statusMessage

2. **Push Message API**：
   * `pushTextMessage(workspaceId, to, text)`：發送文字訊息
   * 端點：`POST https://api.line.me/v2/bot/message/push`
   * 支援主動推送訊息給使用者
   * 帶重試機制處理Rate Limit（429錯誤）

3. **Reply Message API**：
   * `replyTextMessage(workspaceId, replyToken, text)`：回覆訊息
   * 端點：`POST https://api.line.me/v2/bot/message/reply`
   * 使用webhook事件的replyToken
   * 僅能使用一次，有效期限制

4. **Test Connection API**：
   * `testConnection(workspaceId)`：測試連線
   * 端點：`GET https://api.line.me/v2/bot/info`
   * 驗證Channel Access Token是否有效
   * 返回Bot資訊（displayName、userId、pictureUrl）

5. **錯誤處理與重試**：
   * `executeWithRetry`：實作指數退避重試策略
   * 處理Rate Limit（429）錯誤，最多重試3次
   * 初始延遲1秒，每次重試延遲翻倍
   * 詳細記錄API錯誤（status、message、requestId）

**line-person.service.ts**
管理LINE使用者與Twenty CRM Person實體的整合服務。使用TwentyORMManager存取Person資料。關鍵功能：

1. **查詢Person**：
   * `findByLineUserId(lineUserId)`：根據LINE User ID查詢Person
   * 使用TwentyORMManager取得Person repository
   * 返回對應的Person實體或null

2. **建立或更新Person**：
   * `createOrUpdateFromLineProfile(lineProfile)`：從LINE Profile建立或更新Person
   * 先查詢是否已存在（根據lineUserId）
   * 如果存在：更新lineDisplayName、lineProfilePictureUrl、lineStatus、lastLineInteractionAt
   * 如果不存在：建立新Person，使用LINE Display Name作為預設姓名（name.firstName）
   * 設定lineStatus為'active'

3. **更新LINE狀態**：
   * `updateLineStatus(lineUserId, status)`：更新Person的LINE狀態
   * 支援三種狀態：'active'（好友）、'blocked'（封鎖）、'unlinked'（未連結）
   * 同時更新lastLineInteractionAt

4. **批次更新互動時間**：
   * `updateLastInteractionTime(lineUserIds)`：批次更新多個Person的最後互動時間
   * 使用QueryBuilder進行批次更新，提升性能

5. **統計查詢**：
   * `getLineLinkedPersonCount()`：取得所有有LINE連結的Person數量
   * 用於儀表板統計

**line-webhook-event.type.ts**
定義了LINE Webhook事件的TypeScript類型。包括：

1. **LineWebhookBody**：
   * `destination`：Bot User ID（用於查詢workspaceId）
   * `events`：事件陣列

2. **LineWebhookEvent**：
   * 聯合類型：LineFollowEvent | LineUnfollowEvent | LineMessageEvent | LinePostbackEvent
   * 所有事件共享LineBaseEvent的基礎屬性

3. **LineBaseEvent**：
   * `type`：事件類型
   * `timestamp`：時間戳
   * `source`：事件來源（user、group、room）
   * `webhookEventId`：事件唯一ID（用於冪等性檢查）
   * `deliveryContext`：包含isRedelivery標記

4. **LineEventSource**：
   * `type`：來源類型（user、group、room）
   * `userId`：LINE User ID（如果是user類型）
   * `groupId`：群組ID（如果是group類型）
   * `roomId`：聊天室ID（如果是room類型）

5. **具體事件類型**：
   * `LineFollowEvent`：包含replyToken
   * `LineUnfollowEvent`：不包含replyToken
   * `LineMessageEvent`：包含message物件（id、type、text等）
   * `LinePostbackEvent`：包含postback資料

**person.workspace-entity.ts**
Person實體的LINE整合欄位定義。使用TwentyORM的裝飾器系統。LINE相關欄位：

1. **lineUserId**：
   * 類型：TEXT
   * 可為null
   * LINE Official Account的使用者ID
   * 用於識別和查詢Person

2. **lineDisplayName**：
   * 類型：TEXT
   * 可為null
   * LINE顯示名稱
   * 從LINE Profile同步

3. **lineProfilePictureUrl**：
   * 類型：TEXT
   * 可為null
   * LINE頭像URL
   * 從LINE Profile同步

4. **lineStatus**：
   * 類型：SELECT
   * 可為null
   * 選項：'active'（綠色）、'blocked'（紅色）、'unlinked'（灰色）
   * 預設值：'unlinked'
   * 表示LINE好友狀態

5. **lastLineInteractionAt**：
   * 類型：DATE_TIME
   * 可為null
   * 最後與LINE OA互動的時間戳
   * 在follow、unfollow、message事件時更新

這些欄位透過TwentyORM自動同步到資料庫schema，支援GraphQL查詢和變更。

**line-integration.module.ts**
LINE整合的NestJS模組註冊檔。關鍵配置：

1. **Imports**：
   * `HttpModule.register()`：配置HTTP客戶端，用於呼叫LINE API
   * `TypeOrmModule.forFeature([LineChannelConfigEntity])`：註冊TypeORM實體

2. **Controllers**：
   * `LineWebhookController`：註冊webhook端點

3. **Providers**：
   * `LineConfigService`：設定管理
   * `LineApiService`：API客戶端
   * `LineWebhookService`：webhook處理
   * `LinePersonService`：Person整合
   * `LineEncryptionService`：加密服務
   * `LineSignatureGuard`：簽章驗證
   * `LineConfigResolver`：GraphQL resolver

4. **Exports**：
   * 導出`LineApiService`、`LineConfigService`、`LinePersonService`
   * 供其他模組使用（如workflow）

5. **Middleware配置**：
   * `configure(consumer)`方法註冊`LineRawBodyMiddleware`
   * 僅套用在`/api/v1/webhooks/line`路徑

#### 運作流程總結：

1. **LINE Platform發送Webhook**：
   * LINE Platform檢測到事件（如使用者加入好友）
   * 發送POST請求到`https://yourdomain.com/api/v1/webhooks/line`
   * 包含`X-Line-Signature`標頭和JSON body

2. **Middleware處理**：
   * `LineRawBodyMiddleware`將原始body附加到`request.rawBody`
   * 確保簽章驗證可以使用原始body

3. **Guard驗證**：
   * `LineSignatureGuard`執行驗證流程：
     - 從body的destination取得Bot User ID
     - 查詢LineChannelConfig取得對應的workspaceId和Channel Secret
     - 使用Channel Secret計算HMAC-SHA256簽章
     - 與請求標頭的簽章比對（恆定時間比對）
     - 檢查冪等性（使用Redis和webhookEventId）
   * 如果驗證失敗，拋出`ForbiddenException`（返回403）
   * 如果驗證成功，繼續到Controller

4. **Controller處理**：
   * `LineWebhookController.handleWebhook`接收請求
   * 從body取得destination並查詢workspaceId
   * 如果找不到workspaceId，記錄警告但仍返回200 OK
   * 使用`setImmediate`立即返回200 OK給LINE Platform
   * 非同步呼叫`LineWebhookService.handleEvents`

5. **Service處理事件**：
   * `LineWebhookService.handleEvents`接收workspaceId和events陣列
   * 使用`Promise.allSettled`並行處理多個事件
   * 對每個事件呼叫`handleSingleEvent`

6. **事件類型分派**：
   * 根據event.type分派到不同的handler：
     - `follow` → `handleFollowEvent`
     - `unfollow` → `handleUnfollowEvent`
     - `message` → 記錄但不處理（未來擴充）

7. **Follow事件處理**：
   * 從event.source取得userId
   * 呼叫`LineApiService.getProfile(workspaceId, userId)`取得使用者Profile
   * 呼叫`LinePersonService.createOrUpdateFromLineProfile`：
     - 查詢是否已存在Person（根據lineUserId）
     - 如果存在：更新lineDisplayName、lineProfilePictureUrl、lineStatus='active'、lastLineInteractionAt
     - 如果不存在：建立新Person，設定所有LINE欄位
   * （可選）使用replyToken發送歡迎訊息

8. **Unfollow事件處理**：
   * 從event.source取得userId
   * 呼叫`LinePersonService.updateLineStatus(userId, 'blocked')`
   * 更新Person的lineStatus和lastLineInteractionAt

9. **錯誤處理**：
   * 所有階段的錯誤都被捕獲和記錄
   * 單一事件失敗不影響其他事件
   * Controller層確保始終返回200 OK給LINE Platform

10. **冪等性保證**：
    * 使用webhookEventId和Redis確保同一事件不會被重複處理
    * TTL 60秒後自動過期，釋放記憶體

### c. Workflow的LINE Action

#### 程式碼檔案：

**Workflow Action實作：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/line-message/send-line-message.workflow-action.ts`

**Action模組註冊：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/line-message/line-message-action.module.ts`

**類型定義與守衛：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/line-message/types/workflow-send-line-message-action-input.type.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/line-message/types/workflow-send-line-message-action-settings.type.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/line-message/guards/is-workflow-send-line-message-action.guard.ts`

**Workflow整合註冊：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/workflow-executor.module.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/factories/workflow-action.factory.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action.type.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action-settings.type.ts`

**支援服務：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-api.service.ts`

#### 程式碼檔案功能與關係：

**send-line-message.workflow-action.ts**
這是LINE訊息發送的Workflow Action實作，實現`WorkflowAction`介面。關鍵功能：

1. **Action介面實作**：
   * `execute(input: WorkflowActionInput): Promise<WorkflowActionOutput>`：執行action的核心方法
   * 從`input`取得`currentStepId`、`steps`、`runInfo`、`context`
   * 使用`findStepOrThrow`找到當前步驟的設定

2. **步驟驗證**：
   * 使用`isWorkflowSendLineMessageAction`類型守衛驗證步驟類型
   * 如果類型不符，拋出`WorkflowStepExecutorException`

3. **輸入解析**：
   * 使用`resolveInput`解析動態變數
   * 支援在訊息內容中使用工作流變數（如`{{trigger.person.name}}`）
   * 將`step.settings.input`解析為`WorkflowSendLineMessageActionInput`

4. **參數驗證**：
   * 驗證`lineUserId`是否存在（必填）
   * 驗證`message`是否存在且非空（必填）
   * 如果驗證失敗，拋出`WorkflowStepExecutorException`

5. **發送訊息**：
   * 呼叫`LineApiService.pushTextMessage(workspaceId, lineUserId, message)`
   * 使用try-catch捕獲錯誤
   * 記錄發送狀態（成功或失敗）

6. **輸出結果**：
   * 成功時返回：
     ```typescript
     {
       result: {
         success: true,
         lineUserId: '...',
         messageSent: '...' // 前50字元
       }
     }
     ```
   * 失敗時拋出`WorkflowStepExecutorException`

**line-message-action.module.ts**
LINE訊息Action的NestJS模組註冊檔。關鍵配置：

1. **Imports**：
   * 導入`LineIntegrationModule`以使用`LineApiService`

2. **Providers**：
   * 註冊`SendLineMessageWorkflowAction`

3. **Exports**：
   * 導出`SendLineMessageWorkflowAction`供WorkflowExecutorModule使用

**workflow-send-line-message-action-input.type.ts**
定義Action的輸入類型：
```typescript
export type WorkflowSendLineMessageActionInput = {
  lineUserId: string;  // LINE User ID（來自Person實體或手動輸入）
  message: string;     // 訊息內容（支援動態變數）
};
```

**workflow-send-line-message-action-settings.type.ts**
定義Action的設定類型：
```typescript
export type WorkflowSendLineMessageActionSettings = {
  input: {
    lineUserId: string | VariableExpression;  // 支援變數表達式
    message: string | VariableExpression;     // 支援變數表達式
  };
  errorHandlingOptions: {
    retryOnFailure: {
      value: boolean;
    };
    continueOnFailure: {
      value: boolean;
    };
  };
};
```

**is-workflow-send-line-message-action.guard.ts**
TypeScript類型守衛函數，用於驗證步驟是否為LINE訊息Action：
```typescript
export const isWorkflowSendLineMessageAction = (
  step: WorkflowAction,
): step is WorkflowSendLineMessageAction => {
  return step.type === WorkflowActionType.SEND_LINE_MESSAGE;
};
```

**workflow-executor.module.ts**
Workflow執行器的主模組。關鍵配置：

1. **Imports**：
   * 導入`LineMessageActionModule`
   * 導入其他所有Action模組（CodeActionModule、RecordCrudActionModule等）

2. **Providers**：
   * 註冊`WorkflowActionFactory`
   * 註冊所有Workflow相關服務

這是將LINE Action整合到Workflow系統的關鍵註冊點。

**workflow-action.factory.ts**
Action工廠模式實作，負責根據action類型返回對應的執行器。關鍵功能：

1. **Constructor注入**：
   * 注入`SendLineMessageWorkflowAction`
   * 注入其他所有Action（CodeWorkflowAction、SendEmailWorkflowAction等）

2. **get方法**：
   * 根據`stepType`返回對應的Action執行器
   * `case WorkflowActionType.SEND_LINE_MESSAGE: return this.sendLineMessageWorkflowAction;`
   * 如果類型不匹配，拋出異常

這是工作流系統的核心分派機制，確保每個action類型都有對應的執行器。

**workflow-action.type.ts**
定義所有Workflow Action類型的列舉和類型。關鍵內容：

1. **WorkflowActionType列舉**：
   ```typescript
   export enum WorkflowActionType {
     CODE = 'CODE',
     SEND_EMAIL = 'SEND_EMAIL',
     SEND_LINE_MESSAGE = 'SEND_LINE_MESSAGE',  // LINE訊息類型
     CREATE_RECORD = 'CREATE_RECORD',
     // ... 其他類型
   }
   ```

2. **WorkflowSendLineMessageAction類型**：
   ```typescript
   export type WorkflowSendLineMessageAction = BaseWorkflowAction & {
     type: WorkflowActionType.SEND_LINE_MESSAGE;
     settings: WorkflowSendLineMessageActionSettings;
   };
   ```

3. **WorkflowAction聯合類型**：
   * 包含所有Action類型的聯合
   * 包括`WorkflowSendLineMessageAction`

**workflow-action-settings.type.ts**
定義所有Action設定類型的聯合類型。導入並包含`WorkflowSendLineMessageActionSettings`，使其可以在工作流系統中使用。

**line-api.service.ts**
（在webhook章節已詳細說明）這個服務提供：
* `pushTextMessage(workspaceId, to, text)`：發送文字訊息
* 重試機制處理Rate Limit
* 錯誤記錄和處理

#### 運作流程總結：

1. **前端工作流設計**：
   * 使用者在工作流編輯器中新增「發送LINE訊息」Action
   * 配置lineUserId（可以使用變數如`{{trigger.person.lineUserId}}`）
   * 配置message內容（可以使用動態變數如`{{trigger.person.name}}，您的訂單已確認`）
   * 配置錯誤處理選項（是否重試、是否繼續）

2. **工作流觸發**：
   * 當工作流被觸發（例如：「建立訂單」事件）
   * Workflow執行器載入工作流定義
   * 解析步驟並準備執行

3. **Action分派**：
   * Workflow執行器檢查當前步驟的類型
   * 呼叫`WorkflowActionFactory.get(WorkflowActionType.SEND_LINE_MESSAGE)`
   * 取得`SendLineMessageWorkflowAction`實例

4. **Action執行**：
   * 呼叫`SendLineMessageWorkflowAction.execute(input)`
   * `input.context`包含觸發事件的資料（如Person、Order等）
   * `input.currentStepId`指向當前步驟
   * `input.steps`包含所有步驟的定義
   * `input.runInfo`包含workspaceId等執行資訊

5. **步驟驗證**：
   * 使用`findStepOrThrow`找到當前步驟設定
   * 使用`isWorkflowSendLineMessageAction`驗證步驟類型

6. **輸入解析**：
   * 使用`resolveInput(step.settings.input, context)`解析動態變數
   * 例如：`{{trigger.person.lineUserId}}` → `"U1234567890abcdef"`
   * 例如：`{{trigger.person.name}}，您的訂單已確認` → `"張三，您的訂單已確認"`

7. **參數驗證**：
   * 驗證lineUserId存在且非空
   * 驗證message存在且非空
   * 如果驗證失敗，拋出異常並記錄

8. **發送訊息**：
   * 呼叫`LineApiService.pushTextMessage(workspaceId, lineUserId, message)`
   * LineApiService取得對應workspace的Channel Access Token
   * 發送POST請求到LINE Messaging API
   * 處理Rate Limit（自動重試）

9. **結果處理**：
   * 成功：返回包含success=true的結果物件
   * 失敗：拋出`WorkflowStepExecutorException`，記錄錯誤

10. **錯誤處理選項**：
    * 如果配置了`retryOnFailure`，系統會自動重試
    * 如果配置了`continueOnFailure`，工作流會繼續執行下一步驟
    * 否則，工作流停止並標記為失敗

11. **日誌與監控**：
    * 所有操作都被詳細記錄（Logger）
    * 包括發送成功、失敗、重試等狀態
    * 便於除錯和監控

### d. LINE Action發送Push訊息

#### 程式碼檔案：

**核心API服務：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-api.service.ts`

**Workflow Action（呼叫層）：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/line-message/send-line-message.workflow-action.ts`

**設定與Token管理：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-config.service.ts`
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/services/line-encryption.service.ts`

**實體與資料庫：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/entities/line-channel-config.entity.ts`

**模組註冊：**
- `/mnt/d/project/twenty-ym/packages/twenty-server/src/modules/line-integration/line-integration.module.ts`

#### 程式碼檔案功能與關係：

**line-api.service.ts - pushTextMessage方法**
這是發送LINE Push訊息的核心實作。詳細流程：

1. **方法簽名**：
   ```typescript
   async pushTextMessage(
     workspaceId: string,
     to: string,           // LINE User ID
     text: string,         // 訊息內容
   ): Promise<void>
   ```

2. **取得Access Token**：
   * 呼叫`LineConfigService.getDecryptedConfig(workspaceId)`
   * 從資料庫取得加密的設定
   * 使用`LineEncryptionService`解密Channel Access Token
   * 如果設定不存在，拋出錯誤

3. **建構訊息格式**：
   * 按照LINE Messaging API規範建構payload：
     ```typescript
     {
       to: 'U1234567890abcdef',  // LINE User ID
       messages: [
         {
           type: 'text',
           text: '訊息內容'
         }
       ]
     }
     ```
   * 支援一次發送多個訊息（messages陣列）
   * 本實作簡化為單一文字訊息

4. **執行API呼叫**：
   * 端點：`POST https://api.line.me/v2/bot/message/push`
   * Headers：
     - `Content-Type: application/json`
     - `Authorization: Bearer {channelAccessToken}`
   * 使用HttpService（基於axios）發送請求
   * 使用`firstValueFrom`將Observable轉換為Promise

5. **重試機制**：
   * 呼叫`executeWithRetry`包裝API請求
   * 處理Rate Limit（429錯誤）
   * 指數退避策略：
     - 初始延遲：1秒
     - 最大重試次數：3次
     - 延遲計算：`delay = 1000 * Math.pow(2, attempt - 1)`
     - 第1次重試：1秒後
     - 第2次重試：2秒後
     - 第3次重試：4秒後

6. **錯誤處理**：
   * 記錄API錯誤詳情：
     - HTTP狀態碼
     - 錯誤訊息
     - LINE Request ID（用於追蹤）
   * 如果重試次數耗盡或遇到非429錯誤，拋出異常
   * 錯誤會向上傳播到呼叫層（Workflow Action）

7. **成功處理**：
   * 記錄成功訊息和Request ID
   * Request ID可用於追蹤訊息狀態
   * 返回void（無返回值）

**line-config.service.ts - getDecryptedConfig方法**
負責取得並解密LINE設定。關鍵流程：

1. **查詢設定**：
   * 使用TypeORM從`lineChannelConfig`表查詢
   * 條件：`workspaceId = ?`
   * 取得加密的channelSecret和channelAccessToken

2. **解密處理**：
   * 呼叫`LineEncryptionService.decrypt(channelSecretEncrypted)`
   * 呼叫`LineEncryptionService.decrypt(channelAccessTokenEncrypted)`
   * 返回解密後的設定物件

3. **錯誤處理**：
   * 如果設定不存在，返回null
   * 如果解密失敗，拋出異常

**line-encryption.service.ts**
負責加密和解密敏感資料（Channel Secret和Access Token）。關鍵實作：

1. **加密演算法**：
   * 使用AES-256-GCM（Galois/Counter Mode）
   * 提供認證加密（AEAD - Authenticated Encryption with Associated Data）
   * 同時提供保密性和完整性

2. **密鑰管理**：
   * 從環境變數`LINE_ENCRYPTION_KEY`讀取密鑰
   * 密鑰應為32位元組（256位元）的隨機字串
   * 建議使用：`openssl rand -hex 32`生成

3. **加密流程**：
   * 生成隨機IV（Initialization Vector）
   * 使用密鑰和IV建立cipher
   * 加密明文
   * 取得認證標籤（auth tag）
   * 組合：`iv:encryptedData:authTag`（使用冒號分隔）
   * Base64編碼

4. **解密流程**：
   * Base64解碼
   * 拆分：`iv:encryptedData:authTag`
   * 使用密鑰和IV建立decipher
   * 設定認證標籤
   * 解密並驗證
   * 返回明文

5. **安全性特性**：
   * GCM模式提供認證，防止篡改
   * 每次加密使用不同的IV，防止重放攻擊
   * 認證標籤確保完整性

**send-line-message.workflow-action.ts**
（在workflow章節已詳細說明）這是呼叫層，負責：
* 驗證輸入參數
* 解析動態變數
* 呼叫`LineApiService.pushTextMessage`
* 處理結果和錯誤

**line-channel-config.entity.ts**
（在settings章節已詳細說明）儲存加密的設定：
* `channelSecretEncrypted`：加密的Channel Secret
* `channelAccessTokenEncrypted`：加密的Channel Access Token
* `workspaceId`：工作區隔離
* `botUserId`：Bot User ID

**line-integration.module.ts**
（在前面章節已詳細說明）註冊所有服務和依賴：
* 註冊`HttpModule`用於API請求
* 註冊`LineApiService`、`LineConfigService`、`LineEncryptionService`
* 導出服務供其他模組使用

#### 運作流程總結：

1. **Workflow Action呼叫**：
   * `SendLineMessageWorkflowAction.execute`被觸發
   * 已解析lineUserId和message
   * 準備呼叫API服務

2. **呼叫API服務**：
   * 呼叫`LineApiService.pushTextMessage(workspaceId, lineUserId, message)`
   * 傳入workspaceId用於多租戶隔離
   * 傳入lineUserId作為目標使用者
   * 傳入message作為訊息內容

3. **取得設定**：
   * `LineApiService`呼叫`LineConfigService.getDecryptedConfig(workspaceId)`
   * `LineConfigService`使用TypeORM查詢`lineChannelConfig`表
   * 條件：`WHERE workspaceId = ?`

4. **解密Token**：
   * 取得`channelAccessTokenEncrypted`
   * 呼叫`LineEncryptionService.decrypt(channelAccessTokenEncrypted)`
   * 從環境變數讀取`LINE_ENCRYPTION_KEY`
   * 解析加密資料（IV、密文、認證標籤）
   * 使用AES-256-GCM解密
   * 驗證認證標籤確保完整性
   * 返回明文Access Token

5. **建構API請求**：
   * 建構LINE Messaging API的payload：
     ```json
     {
       "to": "U1234567890abcdef",
       "messages": [
         {
           "type": "text",
           "text": "您的訂單已確認"
         }
       ]
     }
     ```
   * 設定Headers：
     - `Content-Type: application/json`
     - `Authorization: Bearer {解密後的Access Token}`

6. **發送HTTP請求**：
   * 使用`HttpService.post`發送請求
   * 端點：`https://api.line.me/v2/bot/message/push`
   * 使用`firstValueFrom`等待響應

7. **處理Rate Limit**：
   * 如果收到429錯誤（Too Many Requests）
   * `executeWithRetry`捕獲錯誤
   * 檢查重試次數（最多3次）
   * 計算延遲時間（指數退避）
   * 使用`sleep`等待
   * 重新發送請求

8. **錯誤處理**：
   * 如果遇到其他錯誤（如401 Unauthorized、400 Bad Request）
   * 記錄錯誤詳情：
     - 狀態碼
     - 錯誤訊息
     - Request ID
   * 拋出異常給呼叫層
   * Workflow Action捕獲並處理

9. **成功響應**：
   * LINE Platform返回200 OK
   * 響應包含Request ID
   * `LineApiService`記錄成功訊息和Request ID
   * 返回void給呼叫層

10. **Workflow繼續**：
    * `SendLineMessageWorkflowAction`收到成功響應
    * 返回結果物件：
      ```typescript
      {
        result: {
          success: true,
          lineUserId: 'U1234567890abcdef',
          messageSent: '您的訂單已確認'
        }
      }
      ```
    * Workflow執行器記錄步驟成功
    * 繼續執行下一個步驟

11. **監控與日誌**：
    * 所有關鍵操作都被記錄：
      - 開始發送訊息（包含workspaceId和lineUserId）
      - API請求發送
      - Rate Limit重試
      - 成功或失敗
    * 使用NestJS的Logger服務
    * 日誌包含timestamp、context、message
    * 便於追蹤和除錯

12. **安全性考量**：
    * Access Token從不在日誌中顯示
    * 使用加密儲存在資料庫
    * 使用HTTPS傳輸
    * 多租戶隔離（workspaceId）
    * 認證加密確保完整性

---

## 第三部分：關鍵技術細節

### 安全性設計

#### 1. 資料加密
- **演算法**：AES-256-GCM（認證加密）
- **密鑰管理**：從環境變數讀取，不存於程式碼
- **加密範圍**：Channel Secret、Channel Access Token
- **儲存格式**：`iv:encryptedData:authTag`（Base64編碼）

#### 2. Webhook簽章驗證
- **演算法**：HMAC-SHA256
- **比對方式**：timingSafeEqual（防止時序攻擊）
- **驗證流程**：
  1. 讀取原始body（raw body）
  2. 使用Channel Secret計算HMAC
  3. 與`X-Line-Signature`標頭比對

#### 3. 冪等性保證
- **機制**：Redis + webhookEventId
- **TTL**：60秒
- **實作**：使用`acquireLock`（SETNX語義）
- **目的**：防止LINE Platform重送造成重複處理

#### 4. 多租戶隔離
- **隔離層級**：workspaceId
- **資料隔離**：每個workspace有獨立的LINE設定
- **API隔離**：使用對應workspace的Access Token
- **Person隔離**：透過TwentyORM的workspace機制

### 錯誤處理策略

#### 1. Rate Limit處理
- **狀態碼**：429 Too Many Requests
- **策略**：指數退避重試
- **參數**：
  - 最大重試次數：3次
  - 初始延遲：1秒
  - 延遲倍增：每次×2

#### 2. Webhook錯誤處理
- **原則**：始終返回200 OK給LINE Platform
- **理由**：防止LINE重送造成重複處理
- **實作**：
  - 所有錯誤都被捕獲
  - 記錄詳細日誌
  - 返回`{ status: 'ok' }`

#### 3. Workflow錯誤處理
- **配置化**：支援retryOnFailure、continueOnFailure
- **異常傳播**：使用`WorkflowStepExecutorException`
- **日誌記錄**：包含workspaceId、lineUserId、錯誤訊息

### 效能優化

#### 1. 非同步處理
- **Webhook處理**：使用`setImmediate`立即返回200 OK
- **事件處理**：在背景執行，不阻塞HTTP響應
- **並行處理**：使用`Promise.allSettled`並行處理多個事件

#### 2. 資料庫索引
- **workspaceId索引**：快速查詢設定
- **botUserId唯一索引**：快速路由webhook
- **lineUserId索引**（Person）：快速查詢Person

#### 3. Redis快取
- **冪等性快取**：webhookEventId，TTL 60秒
- **未來擴充**：可快取Access Token、Profile等

### 可擴展性設計

#### 1. 模組化架構
- **LineIntegrationModule**：獨立模組，易於維護
- **LineMessageActionModule**：可獨立啟用/停用
- **服務層抽象**：易於替換實作

#### 2. 類型安全
- **TypeScript**：完整的類型定義
- **DTO驗證**：GraphQL輸入驗證
- **類型守衛**：執行時類型檢查

#### 3. 未來擴充點
- **訊息類型**：目前僅支援文字，可擴充圖片、影片、Flex Message
- **webhook事件**：目前處理follow/unfollow，可擴充message、postback
- **自動化流程**：可基於message事件觸發工作流
- **聊天機器人**：可整合AI服務實作自動回覆

---

## 第四部分：部署與配置

### 環境變數配置

**必需的環境變數**：
```bash
# LINE Channel設定
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token

# 加密密鑰（使用 openssl rand -hex 32 生成）
LINE_ENCRYPTION_KEY=64_character_hex_string

# Webhook URL（用於LINE Platform設定）
LINE_WEBHOOK_URL=https://yourdomain.com/api/v1/webhooks/line
```

### 資料庫遷移

**執行順序**：
1. `1763373200000-CreateLineChannelConfig.ts`
2. `1763373253828-AddBotUserIdToLineChannelConfig.ts`

**執行命令**：
```bash
npx nx run twenty-server:database:migrate:prod
```

### LINE Platform設定

1. **建立LINE Official Account**
2. **取得Channel ID、Secret、Access Token**
3. **設定Webhook URL**：`https://yourdomain.com/api/v1/webhooks/line`
4. **啟用Webhook**
5. **測試連線**：在Twenty CRM設定頁面點擊「測試連線」

### Redis配置

**用途**：冪等性檢查
**Namespace**：`ModuleLine`
**TTL**：60秒

確保Redis服務運行且可連線。

---

## 附錄：檔案數量統計

- **後端核心模組**：13個檔案
- **Workflow Action**：5個檔案
- **資料庫遷移**：2個檔案
- **前端元件**：7個檔案
- **GraphQL操作**：4個檔案
- **共享類型**：1個檔案
- **配置檔案**：4個檔案
- **文檔檔案**：14個檔案

**總計**：56+個原始碼檔案（不含編譯輸出）

---

*本文檔由Claude Code生成，涵蓋所有LINE相關功能的完整實作細節。*
