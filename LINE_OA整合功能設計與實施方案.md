# LINE OA 整合功能：深度設計與實施方案報告

## 摘要

本報告旨在為 Twenty-YM 專案提供一份完整且可執行的「LINE 官方帳號 (Official Account, OA) 整合」功能設計與實施方案。基於對專案現有架構（NestJS 後端、React 前端、TypeORM、BullMQ）的深入理解，本方案將詳細闡述從系統設定、事件接收到資料整合的每一個環節，並提供具體的技術選型和實作步驟建議，以確保新功能能夠無縫、安全、且可擴展地融入現有系統。

---

## 第一部分：認證資訊的儲存與管理

### **作業目標**
安全地儲存一個 LINE 官方帳號的 Channel ID, Channel Secret, 和 Channel Access Token，並為系統管理員或使用者提供一個直觀、安全的設定介面。

### **分析與評估**

在現代化的多租戶 SaaS 應用中，金鑰等敏感資訊的管理是安全設計的核心。我們對比了幾種常見的儲存方案：

*   **方案 A：靜態檔案 (如 `.env`)**
    *   **評估：** 此方案僅適用於開發環境或單一、固定的系統級設定。其安全性低（易洩漏）、靈活性差（需重啟服務）、且完全不支援多租戶場景，因此**不予採用**。

*   **方案 B：資料庫 (Database)**
    *   **評估：** 這是高度推薦的方案。它不僅能透過 UI 實現動態更新，滿足多租戶需求（每個 Workspace 一組金鑰），更重要的是，它允許我們對敏感資料（Secret 和 Token）進行應用層級的加密。這意味著即使資料庫本身被未經授權的存取，攻擊者也無法直接獲得明文金鑰。這完全符合當前專案由資料庫驅動的設計哲學。

### **深度實作方式**

#### **後端 (Backend - `packages/twenty-server`)**

1.  **建立新模組 (`LineIntegrationModule`)**
    *   在 `src/modules/` 下建立一個新的 NestJS 模組，用於統一管理所有與 LINE 相關的控制器、服務、實體等，確保功能的內聚性和獨立性。

2.  **建立資料庫實體 (`LineChannelConfigWorkspaceEntity`)**
    *   在新模組中，建立一個新的 TypeORM 實體。
    *   **欄位規劃：**
        *   `id`: Primary Key.
        *   `channelId`: `string`, 用於公開識別。
        *   `channelSecret`: `string`, **必須加密儲存**。
        *   `channelAccessToken`: `string`, 長期權杖，**必須加密儲存**。
        *   `workspaceId`: `string`, 關聯到 `Workspace` 的外鍵，實現多租戶隔離。
    *   **加密實作細節：**
        *   應使用強加密演算法，如 `AES-256-GCM`。加密金鑰 (Encryption Key) **絕不能**硬編碼在程式中，而應透過環境變數（如 `LINE_CONFIG_ENCRYPTION_KEY`）注入到 `LineConfigService` 中。
        *   在 Entity 中使用 TypeORM 的 `BeforeInsert()` 和 `BeforeUpdate()` 監聽器，在寫入資料庫前自動呼叫加密服務對 `channelSecret` 和 `channelAccessToken` 欄位進行加密。

3.  **建立服務層 (`LineConfigService`)**
    *   建立 `LineConfigService`，封裝對 `LineChannelConfig` 的所有資料庫操作。
    *   **核心方法：**
        *   `createOrUpdate(configData)`: 接收前端傳來的明文資料，在內部完成加密後，寫入資料庫。
        *   `getDecryptedConfig(workspaceId)`: 根據 `workspaceId` 查找設定，並在返回前對 Secret 和 Token 進行解密。**此方法應極度謹慎使用，僅供後端內部服務（如簽章驗證、API 呼叫）調用，絕不能直接暴露給 API 端點。**
        *   `getPublicConfig(workspaceId)`: 一個安全的讀取方法，只返回 `channelId` 等非敏感資訊，供前端介面顯示。

4.  **建立 API 端點 (`LineConfigResolver`)**
    *   建立一個 GraphQL Resolver，提供兩個主要的 Mutation 和一個 Query：
        *   `mutation updateLineConfig(input: UpdateLineConfigInput!): PublicLineConfig`: 接收包含所有金鑰的輸入，呼叫 `LineConfigService.createOrUpdate`。成功後返回 `PublicLineConfig`（只含非敏感資訊）。
        *   `query getLineConfig: PublicLineConfig`: 呼叫 `LineConfigService.getPublicConfig`，讓前端可以確認是否已設定。

#### **前端 (Frontend - `packages/twenty-front`)**

1.  **建立設定頁面與表單**
    *   在系統的「設定」或「應用整合」區塊，建立一個新的 React 元件作為 "LINE 整合" 頁面。
    *   頁面中提供一個表單，讓使用者輸入 Channel ID, Channel Secret, 和 Channel Access Token。輸入框應使用 `type="password"` 來隱藏敏感資訊。

2.  **增加「測試連線」功能**
    *   為了提升使用者體驗，可以在表單旁增加一個「測試連線」按鈕。
    *   點擊後，前端呼叫一個專門的後端 Mutation (`testLineConnection`)。後端收到請求後，使用已儲存的 Access Token 嘗試呼叫一個簡單的 LINE API（例如 `https://api.line.me/v2/bot/info`）。
    *   根據 LINE API 的回傳結果，後端向前端返回成功或失敗的訊息，讓使用者可以即時確認所填寫的金鑰是否有效。

---

## 第二部分：LINE Webhook Endpoint 的建立

### **作業目標**
建立一個穩定、安全的公開 HTTPS 端點來接收 LINE Platform 的即時事件，並優先處理使用者的「加入好友 (follow)」與「封鎖 (unfollow)」事件。

### **分析與評估**

*   **端點設計：** Webhook 是一個非同步的、由外部系統觸發的入口，必須設計為無狀態且能快速響應。在 NestJS 中，Controller 是實現此功能的標準模式。
*   **核心挑戰 - 安全性：** Webhook 端點是公開的，因此極易受到偽造請求的攻擊。LINE 提供的 `X-Line-Signature` 簽章驗證機制是防禦此類攻擊的唯一屏障，必須嚴格實作。
*   **處理流程：** 收到事件後，應立即回傳 `200 OK` 給 LINE Platform，避免超時。所有耗時的業務邏輯（如查詢資料庫、更新聯絡人）都應以非同步方式處理，或推送到另一個內部佇列中，以防止阻塞 Webhook 響應。

### **深度實作方式**

#### **後端 (Backend - `packages/twenty-server`)**

1.  **建立控制器 (`LineWebhookController`)**
    *   在 `LineIntegrationModule` 中，建立 `line-webhook.controller.ts`。
    *   定義一個 POST 路由：`@Post('/api/v1/webhooks/line')`。此路由**不能**使用專案現有的身份驗證 Guard。

2.  **實作簽章驗證中介層 (`LineSignatureGuard`)**
    *   建立一個繼承自 `CanActivate` 的 NestJS Guard。
    *   **詳細驗證步驟：**
        1.  從請求中獲取 `X-Line-Signature` 標頭和 `rawBody`。**注意：** 需要設定 NestJS 的 `json` 中介層保留 `rawBody`。
        2.  從 `LineConfigService` 中獲取當前 Workspace（可從請求路徑或子網域中解析）對應的已解密的 `ChannelSecret`。
        3.  使用 Node.js 的 `crypto` 模組，以 `ChannelSecret` 為金鑰，對 `rawBody` 進行 `HMAC-SHA256` 雜湊運算。
        4.  將運算結果進行 `Base64` 編碼。
        5.  嚴格比對編碼後的結果與 `X-Line-Signature` 標頭的值是否完全一致。
        6.  若一致，Guard 返回 `true`，請求繼續；若不一致，則拋出 `ForbiddenException`，請求被終止。

3.  **建立事件處理服務 (`LineWebhookService`)**
    *   此服務負責處理所有 Webhook 事件的具體業務邏輯。
    *   **`handleEvents(events: LineEvent[])` 方法：**
        *   Controller 在驗證通過後，會呼叫此方法並傳入事件陣列。
        *   此方法應立即返回 `Promise<void>`，並在內部以 `Promise.all` 或迴圈非同步處理每個事件。
        *   **事件分發邏輯 (Event Dispatching):**
            ```typescript
            for (const event of events) {
              switch (event.type) {
                case 'follow':
                  await this.handleFollowEvent(event);
                  break;
                case 'unfollow':
                  await this.handleUnfollowEvent(event);
                  break;
                // ... 其他事件類型，如 'message'
                default:
                  // 忽略或記錄未處理的事件類型
                  break;
              }
            }
            ```
    *   **`handleFollowEvent(event)` 方法：**
        1.  從 `event.source.userId` 取得 LINE 使用者 ID。
        2.  呼叫 `ContactService`，優先用 `lineUserId` 查詢聯絡人是否存在，防止重複建立。
        3.  若聯絡人已存在，則更新其 `lineStatus` 為 `active`。
        4.  若不存在，則呼叫 LINE Get Profile API 獲取使用者名稱 (`displayName`) 和頭像 (`pictureUrl`)。
        5.  使用獲取到的資訊，建立一筆新的 `Contact` 紀錄，並填入 `name`, `lineUserId`, `lineDisplayName`, `lineProfilePictureUrl`, `lineStatus` 等欄位。
        6.  可考慮觸發一個內部事件 `contact.line.followed`，供工作流或其他模組使用。

    *   **`handleUnfollowEvent(event)` 方法：**
        1.  從 `event.source.userId` 取得 LINE 使用者 ID。
        2.  呼叫 `ContactService`，用 `lineUserId` 查詢對應的聯絡人。
        3.  若找到，則更新其 `lineStatus` 欄位為 `blocked`，並可清空 `lineDisplayName` 等資訊。
        4.  同樣地，觸發內部事件 `contact.line.unfollowed`。

---

## 第三部分：工作流寄送對象與 LINE 使用者資料的關聯分析

### **作業目標**
分析並確定儲存 LINE 使用者 ID 的最佳資料載體，使其能與現有系統（特別是工作流）無縫對接。

### **分析與評估**

*   **對象主體識別：**
    *   在任何 CRM 或商業通訊平台中，通訊的核心對象都是代表外部個體的**聯絡人 (`Contact`)**。`User` 是系統的內部操作者，而 `Contact` 則是企業與之互動的客戶或潛在客戶。工作流中的「寄送郵件」或未來的「發送 LINE 訊息」等動作，其目標對象必然是 `Contact`。
    *   因此，`Contact` 物件及其對應的資料表是本次資料整合的唯一合理選擇。

*   **資料關聯方案深度比較：**
    *   **方案一：在 `Contact` 表中新增欄位 (一對一)**
        *   **評估：** 此方案將 `lineUserId` 視為 `Contact` 的一個原生屬性，就像 `email` 或 `phone` 一樣。這在業務邏輯上是完全合理的，因為一個聯絡人通常只會使用一個主要的 LINE 帳號與企業互動。此方案在性能和實現簡單性上具有壓倒性優勢。
    *   **方案二：建立新的關聯表 (一對多)**
        *   **評估：** 此方案將關係抽象化，雖然提供了極高的靈活性，但也帶來了不必要的複雜性。對於發送通知這類目標明確的場景，每次都需要額外的 `JOIN` 查詢，會增加資料庫負擔和程式碼的複雜度。除非業務需求明確指出一個聯絡人需要管理多個 LINE 身份，否則應避免此方案。

### **結論與實施規劃**

**最終選擇：方案一**。直接在 `Contact` 實體中擴充與 LINE 相關的欄位。

#### **規劃的資料庫遷移 (Migration)**

需要建立一個新的資料庫遷移檔案，對 `contact` 資料表進行以下修改：

1.  **定位 `Contact` 實體檔案：**
    *   路徑可能為 `packages/twenty-server/src/modules/contact/standard-objects/contact.workspace-entity.ts`。

2.  **規劃新增的欄位：**
    *   `lineUserId: string | null`
        *   **用途：** 儲存 LINE Platform 的使用者 ID，是發送訊息的唯一識別碼。
        *   **屬性：** `nullable` (因為不是所有聯絡人都有 LINE)，`unique` (一個 LINE 帳號只能綁定一個聯絡人)。
    *   `lineDisplayName: string | null`
        *   **用途：** 儲存使用者在 LINE 上的公開顯示名稱，方便客服人員識別。
    *   `lineProfilePictureUrl: string | null`
        *   **用途：** 儲存 LINE 頭像的 URL，可在聯絡人詳情頁顯示。
    *   `lineStatus: 'active' | 'blocked' | 'unlinked' | null`
        *   **用途：** 追蹤聯絡人與 LINE OA 的互動狀態。`active` 表示正常好友，`blocked` 表示已封鎖，`unlinked` 表示手動解除綁定。
    *   `lastLineInteractionAt: Date | null`
        *   **用途：** 記錄最後一次透過 LINE 互動的時間，可用於分析使用者活躍度。

透過以上設計，`Contact` 實體將成為一個富含 LINE 資訊的中心載體。未來，當工作流需要執行「發送 LINE 訊息」的動作時，只需在其設定中選擇一個 `Contact` 紀錄，執行器就能從中讀取 `lineUserId`，並呼叫 LINE Messaging API 完成訊息發送。
