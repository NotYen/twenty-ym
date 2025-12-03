# LINE OA 完整整合與架構設計方案

## 1. 總體介紹與架構概述

### 1.1. 專案目標

本方案旨在為 Twenty-YM 專案設計並規劃一套完整、安全且可擴展的「LINE 官方帳號 (OA) 整合」功能。最終目標是讓系統能夠：
1.  **接收** 來自 LINE Platform 的即時事件（如使用者加好友、封鎖）。
2.  **發送** 主動訊息給已綁定的 LINE 使用者。
3.  將收發訊息的能力**整合**到現有的工作流 (Workflow) 系統中，成為一個可供使用者自由編排的自動化動作。

### 1.2. 核心架構設計

為實現此目標，我們將採用模組化的設計，在後端 `packages/twenty-server` 中建立一個全新的 `LineIntegrationModule`。此模組將作為所有 LINE 相關功能的中心樞紐，負責處理認證、安全性、API 通訊和業務邏輯。

**新模組與服務的職責劃分：**

*   **`LineIntegrationModule`**: 整個功能的容器，整合並導出所有相關服務。
*   **`LineConfigService`**: **設定與安全核心**。負責安全地儲存、管理和提供 LINE Channel 的金鑰。
*   **`LineWebhookController` & `LineWebhookService`**: **接收端核心**。負責接收並處理來自 LINE 的 Webhook 事件。
*   **`LineApiService`**: **發送端核心**。負責封裝所有對 LINE Messaging API 的主動呼叫。
*   **`SendLineMessageAction`**: **工作流整合核心**。作為一個新的工作流動作執行器，將 LINE 發送能力與自動化流程連接起來。

**資料流示意圖：**

*   **接收流程 (Inbound):**
    `LINE Platform -> Webhook -> LineWebhookController -> [SignatureGuard] -> LineWebhookService -> ContactService -> Database`
*   **發送流程 (Outbound via Workflow):**
    `Workflow Engine -> SendLineMessageAction -> LineApiService -> LineConfigService -> LINE Platform`

---

## 2. 模組一：設定與安全 (`LineConfigService` & UI)

### 2.1. 上下文與設計目標

任何與第三方 API 的整合，第一步都是安全地管理其認證金鑰。此模組的目標是建立一個從前端 UI 到後端資料庫的完整、安全的金鑰設定流程。

### 2.2. 後端實作辦法 (`LineConfigService`)

1.  **資料庫實體 (`LineChannelConfigWorkspaceEntity`)**:
    *   **定位:** `packages/twenty-server/src/modules/LineIntegrationModule/entities/`
    *   **欄位規劃:**
        *   `channelId: string`
        *   `channelSecret: string` (加密儲存)
        *   `channelAccessToken: string` (加密儲存)
        *   `workspaceId: string` (外鍵，實現多租戶)
    *   **加密策略:**
        *   **演算法:** 推薦使用 `AES-256-GCM` 對稱加密。
        *   **金鑰管理:** 加密用的主金鑰 (Master Key) **絕不能**儲存在資料庫或程式碼中。它必須透過環境變數 (`process.env.LINE_CONFIG_ENCRYPTION_KEY`) 提供給 `LineConfigService`。
        *   **自動加密:** 利用 TypeORM 的 `@BeforeInsert()` 和 `@BeforeUpdate()` 裝飾器，在實體存入資料庫前自動對 `channelSecret` 和 `channelAccessToken` 進行加密。

2.  **服務層 (`LineConfigService`)**:
    *   **定位:** `packages/twenty-server/src/modules/LineIntegrationModule/services/line-config.service.ts`
    *   **核心方法:**
        *   `createOrUpdate(configData)`: 接收明文金鑰，內部完成加密後寫入資料庫。
        *   `getDecryptedConfig(workspaceId)`: **僅供後端內部使用**。根據 `workspaceId` 查找設定，並在記憶體中解密金鑰後返回，用於 API 呼叫和簽章驗證。
        *   `getPublicConfig(workspaceId)`: 安全的讀取方法，只返回 `channelId` 等非敏感資訊，供前端 UI 顯示。

3.  **API 層 (`LineConfigResolver`)**:
    *   **定位:** `packages/twenty-server/src/modules/LineIntegrationModule/resolvers/`
    *   **GraphQL API 設計:**
        *   `mutation updateLineConfig(input: ...)`: 接收金鑰並呼叫 `LineConfigService` 儲存。
        *   `query getLineConfig`: 呼叫 `getPublicConfig` 讓前端確認設定狀態。
        *   `mutation testLineConnection`: 觸發後端使用已存金鑰嘗試呼叫 LINE API，返回連線結果，提升使用者體驗。

### 2.3. 前端實作辦法 (Settings UI)

*   **定位:** `packages/twenty-front/src/modules/settings/components/`
*   **功能:** 建立一個新的設定頁面，提供表單讓使用者輸入金鑰，並可觸發「測試連線」功能。

---

## 3. 模組二：接收端 - Webhook 處理

### 3.1. 上下文與設計目標

此模組的目標是建立一個公開的端點，用於接收 LINE Platform 推送的即時事件，並將這些事件轉化為系統內部的業務操作（如更新聯絡人）。

### 32. 後端實作辦法

1.  **端點與安全 (`LineWebhookController` & `LineSignatureGuard`)**:
    *   **定位:** `.../LineIntegrationModule/controllers/` 和 `.../LineIntegrationModule/guards/`
    *   **端點:** 建立一個公開的 POST 路由 `@Post('/api/v1/webhooks/line')`。
    *   **簽章驗證 (`LineSignatureGuard`):** 這是 Webhook 的安全命脈。
        1.  此 Guard 必須在 Controller 的方法上啟用。
        2.  它會從請求標頭獲取 `X-Line-Signature`。
        3.  它需要讀取請求的原始主體 (raw body)，這需要在 NestJS 的 `main.ts` 中進行設定。
        4.  呼叫 `LineConfigService.getDecryptedConfig()` 獲取 `ChannelSecret`。
        5.  使用 Node.js 的 `crypto` 模組，以 `ChannelSecret` 為金鑰，對 `rawBody` 進行 `HMAC-SHA256` 運算，然後進行 `Base64` 編碼。
        6.  比對結果與標頭，不符則直接拋出 `ForbiddenException`。

2.  **事件處理 (`LineWebhookService`)**:
    *   **定位:** `.../LineIntegrationModule/services/line-webhook.service.ts`
    *   **職責:** 處理通過安全驗證的 Webhook 事件，將其與 CRM 核心業務邏輯連接。
    *   **`handleEvents(events)` 方法:**
        *   接收 Controller 傳來的事件陣列，並立即回傳 `200 OK` 給 LINE Platform。所有後續操作均為非同步。
        *   內部使用 `switch (event.type)` 分發事件。
    *   **`handleFollowEvent(event)` 完整邏輯:**
        1.  取得 `event.source.userId`。
        2.  呼叫 `ContactService` 查詢 `lineUserId` 是否已存在，以防止重複。
        3.  若存在，則更新該聯絡人的 `lineStatus` 為 `'active'`。
        4.  若不存在，則呼叫 `LineApiService.getProfile()` 獲取使用者資料，然後呼叫 `ContactService.create()` 建立一筆包含完整 LINE 資訊的新聯絡人。
    *   **`handleUnfollowEvent(event)` 完整邏輯:**
        1.  取得 `event.source.userId`。
        2.  呼叫 `ContactService` 查找聯絡人。
        3.  若存在，則更新其 `lineStatus` 為 `'blocked'`，以保留記錄並防止後續騷擾。

---

## 4. 模組三：發送端 - API 客戶端 (`LineApiService`)

### 4.1. 上下文與設計目標

此模組是對 LINE Messaging API 的一層抽象封裝，旨在為系統其他部分提供一個簡單、統一的介面來發送訊息，而無需關心底層的 HTTP 呼叫和認證細節。

### 4.2. 後端實作辦法

*   **定位:** `.../LineIntegrationModule/services/line-api.service.ts`
*   **核心方法詳解:**
    *   `async pushTextMessage(to: string, text: string)`:
        1.  **動態認證:** 呼叫 `LineConfigService` 獲取 `ChannelAccessToken`。
        2.  **格式轉換:** 將傳入的 `text` 字串封裝成 LINE API 要求的格式：`messages: [{ type: 'text', text: text }]`。
        3.  **API 呼叫:** 使用 `HttpService` 帶上 `Authorization: Bearer ...` 標頭，向 `.../message/push` 端點發起請求。
        4.  **錯誤處理:** 捕獲並解析 API 回傳的錯誤，轉換為應用程式層級的自訂異常。

---

## 5. 模組四：資料模型整合 (`Contact` Entity)

### 5.1. 上下文與設計目標

為了讓 LINE 的身份與 CRM 的核心客戶資料關聯起來，我們需要擴充現有的 `Contact` 資料模型。這是連接接收端和發送端的資料基礎。

### 5.2. 實作辦法

*   **定位:** `packages/twenty-server/src/modules/contact/standard-objects/contact.workspace-entity.ts`
*   **欄位擴充規劃:**
    *   在 `ContactWorkspaceEntity` 類別中，規劃新增以下欄位。這將需要一次資料庫遷移 (migration)。
    *   `lineUserId: string | null`: **核心識別碼**。設為 `unique` 索引，確保唯一性。
    *   `lineDisplayName: string | null`: LINE 顯示名稱。
    *   `lineProfilePictureUrl: string | null`: LINE 頭像 URL。
    *   `lineStatus: 'active' | 'blocked' | 'unlinked' | null`: 聯絡人與 OA 的關係狀態。
    *   `lastLineInteractionAt: Date | null`: 最後互動時間戳。

---

## 6. 模組五：工作流整合 (`SendLineMessageAction`)

### 6.1. 上下文與設計目標

這是整個整合功能的最終呈現。將 LINE 訊息發送能力，作為一個原子性的、可配置的動作，無縫嵌入到工作流引擎中，賦予使用者自動化與客戶透過 LINE 互動的能力。

### 6.2. 深度實作辦法

#### **A. 共享層 (`packages/twenty-shared`) - 定義契約**

1.  **建立 Schema (`send-line-message-action-schema.ts`)**:
    *   在 `src/workflow/schemas/` 下建立檔案，使用 Zod 定義 Action 的設定結構，包含 `recipientContactId` 和 `messageContent`。
2.  **註冊 Action 型別**:
    *   在 `workflow-action-schema.ts` 中，將新 Schema 加入 `z.discriminatedUnion`。

#### **B. 後端 (`packages/twenty-server`) - 實作執行**

1.  **建立 Action 執行器 (`send-line-message.workflow-action.ts`)**:
    *   **定位:** `.../workflow/workflow-executor/workflow-actions/`
    *   **`SendLineMessageAction` 類別**:
        *   實現 `IWorkflowAction` 介面。
        *   注入 `LineApiService` 和 `ContactService`。
    *   **`execute` 方法完整流程**:
        1.  **變數解析:** 實作一個變數替換引擎，使用正則表達式和 `lodash.get` 等工具，從 `input.context` 中安全地解析出 `recipientContactId` 和 `messageContent` 的最終值。
        2.  **前置安全檢查:** 呼叫 `ContactService` 獲取聯絡人後，嚴格檢查其是否存在、是否綁定 `lineUserId`、以及 `lineStatus` 是否為 `'active'`。任一條件不滿足，則返回 SKIPPED 狀態，並在工作流日誌中留下清晰原因。
        3.  **執行發送:** 呼叫 `LineApiService.pushTextMessage`。
        4.  **結果回報:** 根據 API 呼叫的成功或失敗，返回 `SUCCESS` 或 `FAILED` 的 `WorkflowActionOutput`。

2.  **註冊到工廠 (`WorkflowActionFactory`)**:
    *   將 `'SEND_LINE_MESSAGE'` 型別與 `SendLineMessageAction` 類別實例進行映射。

#### **C. 前端 (`packages/twenty-front`) - 提供 UI**

1.  **建立 Action 設定元件 (`WorkflowEditActionSendLineMessage.tsx`)**:
    *   **定位:** `.../workflow/workflow-steps/workflow-actions/components/`
    *   **UI/UX 設計:**
        *   **「接收者」欄位:** 整合 `WorkflowVariablePicker`，讓使用者能從視覺化列表中選擇上游步驟（如觸發器）提供的 `Contact` 紀錄 ID。
        *   **「訊息內容」欄位:** 一個支援變數插入的 `Textarea`，同樣整合 `WorkflowVariablePicker`。
        *   **即時保存:** 所有使用者輸入都應透過 `useUpdateStep` Hook 即時同步到後端。

2.  **加入節點庫**:
    *   在 `.../constants/actions/` 下定義新 Action 的元數據（標籤、圖示、分類）。
    *   將其加入到對應的分類陣列中，使其出現在工作流編輯器的「新增步驟」選單內。
