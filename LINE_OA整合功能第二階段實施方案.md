# LINE OA 整合功能：第二階段深度設計與實施方案報告

## 摘要

本報告為「LINE 官方帳號整合」功能的第二階段實施方案，旨在第一階段的基礎上，進一步規劃主動訊息發送、資料流程轉換，以及將其無縫整合至現有工作流 (Workflow) 系統的完整技術路徑。報告將深入探討每個功能的架構設計、模組職責、資料流、錯誤處理機制以及與現有系統的互動方式，為開發團隊提供一份清晰、詳盡且可執行的技術藍圖。

---

## 第一部分：主動發送 LINE 訊息模組 (`LineApiService`)

### **作業目標**
建立一個獨立、健壯且可擴展的後端服務，專門負責與所有 LINE Messaging API 進行主動通訊，特別是實現 Push Message 的功能。

### **架構定位與設計哲學**

`LineApiService` 將作為 `LineIntegrationModule` 的核心元件之一。它將被設計為一個無狀態的單例服務 (`@Injectable({ scope: Scope.DEFAULT })`)，其職責是將內部業務需求（如「向某人發送某段文字」）轉換為對 LINE Platform 的標準化、安全的 HTTP API 呼叫。它將完全封裝 API 的複雜性，包括認證、端點、格式和錯誤處理，為上層應用（如工作流執行器）提供一個極簡的介面。

### **深度實作方式**

1.  **建立 API 服務 (`LineApiService`)**
    *   **位置：** `packages/twenty-server/src/modules/LineIntegrationModule/line-api.service.ts`
    *   **依賴注入：**
        *   `HttpService` (from `@nestjs/axios`): 用於發起 HTTP 請求。建議在 `LineIntegrationModule` 中使用 `HttpModule.register` 為其設定全域超時時間 (timeout) 和請求攔截器 (interceptor) 以便於日誌記錄。
        *   `LineConfigService`: 用於在執行期間安全地獲取當前 Workspace 的已解密金鑰。

2.  **核心方法深度設計**
    *   `async pushMessage(to: string, messages: LineMessage[]): Promise<LineApiResult>`
        1.  **動態認證：** 方法開始時，首先呼叫 `await this.lineConfigService.getDecryptedConfig()`，傳入當前請求上下文中的 `workspaceId`，以獲取對應的 `ChannelAccessToken`。**此過程確保了在多租戶環境下，總是使用正確的 Token。**
        2.  **建構請求：**
            *   **標頭 (Headers):** 建立一個包含 `Authorization: 'Bearer ' + accessToken` 和 `Content-Type: 'application/json'` 的標頭物件。
            *   **主體 (Body):** 建立一個包含 `{ to, messages }` 的請求主體。`LineMessage` 型別應在共享層 (`packages/twenty-shared`) 中定義，以確保型別安全。
        3.  **發起請求與日誌：** 使用 `this.httpService.post(...)` 向 `https://api.line.me/v2/bot/message/push` 發起請求。建議使用攔截器 (Interceptor) 來記錄每一次對外 API 呼叫的請求參數和回應，這對於後續的除錯至關重要。
        4.  **精細化錯誤處理：**
            *   在 `catch` 區塊中，詳細分析來自 `axios` 的錯誤。
            *   **401/403 (Unauthorized/Forbidden):** 表示 Access Token 可能已失效或權限不足。應記錄嚴重錯誤日誌，並可考慮觸發一個系統事件，通知管理員需要更新金鑰。
            *   **400 (Bad Request):** 通常表示請求參數錯誤，例如 `to` 的 `userId` 無效。應記錄此錯誤，並在返回的結果中標明原因。
            *   **429 (Too Many Requests):** 表示已達 API 速率限制。應實作一個基於指數退避 (Exponential Backoff) 的重試機制。
        5.  **定義返回型別 `LineApiResult`：** 此型別應包含 `success: boolean` 和一個可選的 `error` 物件，`error` 物件中包含 `code` 和 `message`，以便上層服務根據錯誤類型做不同處理。

    *   `async getProfile(userId: string): Promise<LineProfile>`
        *   此方法的實作流程與 `pushMessage` 類似，但目標是 `GET /v2/bot/profile/{userId}`。它將在 Webhook 的 `follow` 事件處理中使用，以豐富新建聯絡人的資料。

---

## 第二部分：資料格式轉換與事件後續處理

### **作業目標**
將系統內部的資料模型與 LINE API 的格式進行雙向轉換，並完成 Webhook `follow` / `unfollow` 事件觸發的資料庫落地操作。

### **資料流與處理流程詳解**

#### **A. Webhook 事件處理 (`LineWebhookService`)**

此服務是連接 LINE 事件與內部 CRM 資料的橋樑。

*   **`handleFollowEvent` 完整事務流程：**
    1.  從事件中取得 `userId`。
    2.  **查詢去重：** 呼叫 `ContactService.findOne({ where: { lineUserId: userId } })`。這一步至關重要，可以防止因 LINE 事件重送等原因導致的重複聯絡人。
    3.  **更新現有聯絡人：** 如果查詢到聯絡人，則呼叫 `ContactService.update()`，將其 `lineStatus` 更新為 `'active'`。可選擇性地再次呼叫 `LineApiService.getProfile()` 來更新其顯示名稱和頭像，以保持資料同步。
    4.  **建立新聯絡人：** 如果未查詢到聯絡人，則執行以下原子操作（建議在一個 `try-catch` 塊中）：
        a. 呼叫 `LineApiService.getProfile(userId)`。
        b. 若成功獲取 Profile，則呼叫 `ContactService.create()`，將 `name` (可預設為 LINE 的 `displayName`)、`lineUserId`、`lineDisplayName`、`lineProfilePictureUrl` 等欄位一次性寫入資料庫，並將 `lineStatus` 設為 `'active'`。

*   **`handleUnfollowEvent` 完整事務流程：**
    1.  從事件中取得 `userId`。
    2.  呼叫 `ContactService.findOne({ where: { lineUserId: userId } })`。
    3.  如果找到聯絡人，則呼叫 `ContactService.update()`，僅將其 `lineStatus` 更新為 `'blocked'`。不應刪除聯絡人或其 `lineUserId`，以便保留歷史互動記錄和防止未來重新加入時的資料混亂。

#### **B. Push 訊息資料轉換 (`LineApiService`)**

*   **變數替換引擎：** 工作流的訊息內容 (`messageContent`) 將包含 `{{...}}` 格式的變數。在 `SendLineMessageAction` 的 `execute` 方法中，需要實作一個變數替換引擎。
    *   **實作方式：** 可以使用正則表達式 ` /\{\{([^}]+)\}\}/g ` 來匹配所有變數佔位符。
    *   對於每一個匹配到的路徑（如 `trigger.record.name`），使用一個輔助函式（如 `lodash.get`）安全地從工作流的 `context` 物件中讀取對應的值。
    *   如果值不存在，可以選擇替換為空字串或保留原樣。
    *   這個替換過程應在呼叫 `LineApiService.pushTextMessage` **之前**完成。

---

## 第三部分：新增工作流 Action: "發送 LINE 通知"

### **作業目標**
深度整合到現有的聲明式工作流架構中，建立一個功能完整、體驗一致的「發送 LINE 通知」Action。

### **深度實作方式**

#### **1. 共享層 (`packages/twenty-shared`) - 數據契約定義**

*   **建立 Schema (`send-line-message-action-schema.ts`)：**
    *   這是 Action 的「數據契約」，使用 Zod 進行定義，確保前後端對其結構有一致的理解。
    *   `settings.input` 應至少包含：
        *   `recipientContactId: z.string()`: 目標聯絡人 ID。
        *   `messageContent: z.string().min(1)`: 訊息內容模板，不允許為空。
*   **註冊 Action 型別：** 在 `workflow-action-schema.ts` 的 `z.discriminatedUnion` 陣列中，加入 `sendLineMessageActionSchema`，使之成為系統認可的合法 Action 型別。

#### **2. 後端 (`packages/twenty-server`) - 執行邏輯實作**

*   **建立 Action 執行器 (`send-line-message.workflow-action.ts`)**
    *   **位置：** `src/modules/workflow/workflow-executor/workflow-actions/`
    *   **`SendLineMessageAction` 類別：**
        *   實現 `IWorkflowAction` 介面，這意味著它必須有一個 `execute` 方法。
        *   透過 NestJS 的 DI 容器注入 `LineApiService` 和 `ContactService`。
*   **`execute(input: WorkflowActionInput)` 方法深度解析：**
    1.  **上下文解析：**
        a. 呼叫前述的「變數替換引擎」，使用 `input.context` 來解析 `settings.input.recipientContactId` 和 `settings.input.messageContent`，得到實際的 `contactId` 和 `message` 字串。
    2.  **目標驗證：**
        a. 使用解析出的 `contactId` 呼叫 `this.contactService.findOne(...)`。
        b. **執行前置安全檢查 (Pre-flight Checks):**
            *   `if (!contact)`: 如果聯絡人不存在，返回 SKIPPED 狀態。
            *   `if (!contact.lineUserId)`: 如果聯絡人沒有綁定 LINE，返回 SKIPPED 狀態。
            *   `if (contact.lineStatus !== 'active')`: 如果聯絡人已封鎖，返回 SKIPPED 狀態。
        c. 這些檢查可以防止不必要的 API 呼叫和潛在的 API 錯誤，並使工作流日誌更清晰。
    3.  **執行發送：**
        a. 呼叫 `await this.lineApiService.pushTextMessage(contact.lineUserId, resolvedMessageContent)`。
    4.  **返回結果：**
        a. 在 `try` 區塊中，如果 API 呼叫成功，返回 `Promise.resolve({ status: 'SUCCESS' })`。
        b. 在 `catch` 區塊中，捕獲 `LineApiService` 拋出的自訂錯誤，並將其格式化後返回 `Promise.resolve({ status: 'FAILED', error: { message: e.message, code: e.code } })`。
*   **註冊到工廠 (`WorkflowActionFactory`)：**
    *   在工廠服務的建構函式或模組初始化時，將 `'SEND_LINE_MESSAGE'` 字串與 `SendLineMessageAction` 類別的實例關聯起來。

#### **3. 前端 (`packages/twenty-front`) - 使用者設定介面**

*   **建立 Action 設定元件 (`WorkflowEditActionSendLineMessage.tsx`)**
    *   **位置：** `src/modules/workflow/workflow-steps/workflow-actions/components/`
    *   **功能與互動：**
        *   此元件會接收 `stepId` 作為 props。
        *   它會使用 Recoil 的 `useRecoilValue` Hook 來讀取當前步驟的 `settings`。
        *   **「接收者」欄位：** 這不僅是一個輸入框，它旁邊應有一個「變數」圖示按鈕。點擊後會彈出 `WorkflowVariablePicker` 元件。這個選擇器會透過 `useAvailableVariablesInWorkflowStep` Hook，智能地分析工作流圖，只列出此步驟之前所有步驟的輸出變數，特別是 `Contact` 型別的紀錄，方便使用者選擇。
        *   **「訊息內容」欄位：** 一個 `Textarea` 元件，同樣整合 `WorkflowVariablePicker`，允許使用者在訊息中自由插入如 `{{trigger.record.name}}` 等動態內容。
        *   **狀態持久化：** 每當使用者修改輸入框的內容時，元件會觸發 `onChange` 事件，並呼叫 `useUpdateStep` Hook，將新的 `settings` 物件非同步地更新到後端，實現即時保存。
*   **加入節點庫 (Node Library)**
    *   **定義節點外觀與元數據：** 在 `.../constants/actions/` 下建立 `SendLineMessageAction.ts`，定義 `{ type: 'SEND_LINE_MESSAGE', label: '發送 LINE 通知', icon: 'IconBrandLine', category: 'MESSAGING' }`。
    *   **註冊到分類：** 將此定義匯入並添加到 `.../constants/` 下的某個分類陣列中（如 `CoreActions.ts` 或新建的 `MessagingActions.ts`），確保它能正確地顯示在工作流編輯器的「新增步驟」選單中。
