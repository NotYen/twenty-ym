# LINE OA 完整整合與架構設計工程計畫

## 1. 專案總覽與工程目標

### 1.1. 專案目標

本計畫旨在為 Twenty-YM 專案設計並規劃一套完整、安全且可擴展的「LINE 官方帳號 (OA) 整合」功能。此功能將賦予系統雙向通訊能力，不僅能接收並處理來自 LINE Platform 的即時事件，還能主動向使用者發送訊息，並將此能力深度整合至現有的工作流 (Workflow) 系統，成為一個強大的自動化工具。

### 1.2. 工程目標

本計畫不僅是概念設計，更是一份可執行的工程藍圖。其目標涵蓋：

*   **功能完整性：** 實現從金鑰設定、Webhook 接收、訊息發送到工作流整合的完整閉環。
*   **技術準確性：** 嚴格遵循專案現有的技術棧與架構模式（如 `Person` 實體、自訂 ORM 裝飾器、`nx` 工作區指令）。
*   **安全性與健壯性：** 建立包含金鑰加密、簽章驗證、錯誤處理和重試機制的安全通訊鏈路。
*   **可維護性與擴展性：** 採用模組化設計，確保新功能易於理解、測試和未來擴展。
*   **生產級品質：** 包含完整的測試策略、部署考量和監控指標，確保功能上線後的穩定性。

### 1.3. 核心架構與模組依賴

所有新功能將圍繞一個全新的 **`LineIntegrationModule`** 進行構建，確保職責分離和高內聚。

*   **模組依賴關係 (`LineIntegrationModule`)**:
    ```typescript
    @Module({
      imports: [
        // 引入 HttpModule 以便在 LineApiService 中發起對外請求
        HttpModule.register({ timeout: 5000, maxRedirects: 5 }),

        // 引入 TypeORM 相關模組以操作 LineChannelConfig 實體
        // 具體引入方式需參考專案現有 ORM 模組的組織方式

        // 引入 PersonModule 以便在 Webhook 服務中查詢和更新 Person 實體
        PersonModule,

        // 引入工作流相關模組，以便註冊新的 Action
        // 可能是 WorkflowExecutorModule 或相關的核心模組
      ],
      controllers: [LineWebhookController],
      providers: [
        LineConfigService,
        LineApiService,
        LineWebhookService,
        LineSignatureGuard,
        LineConfigResolver,
        SendLineMessageAction, // 註冊為 Provider
      ],
      exports: [
        // 導出服務以便在專案其他地方使用
        LineApiService,
      ],
    })
    export class LineIntegrationModule {}
    ```

---

## 2. 實作階段一：基礎建設

此階段的目標是搭建好所有後續功能所依賴的底層基礎，包括安全設定、資料模型和環境組態。

### 2.1. 設定與安全 (`LineConfigService`)

1.  **資料庫實體 (`LineChannelConfigWorkspaceEntity`)**:
    *   **修正：** 遵循專案實踐，使用 `@WorkspaceEntity` 和 `@WorkspaceField` 裝飾器。
    *   **欄位：** `channelId`, `channelSecret`, `channelAccessToken`, `workspaceId`。

2.  **服務層 (`LineConfigService`)**:
    *   **修正 - 加密邏輯：** 加密/解密操作**必須在 Service 層**完成，而不是在 Entity 層。
        *   **`createOrUpdate(configData)` 方法：** 在將資料傳遞給 `repository.save()` 之前，手動呼叫加密函式對 `channelSecret` 和 `channelAccessToken` 進行加密。
        *   **`getDecryptedConfig(workspaceId)` 方法：** 從資料庫取得實體後，手動呼叫解密函式對相應欄位進行解密，然後再返回給呼叫方（如 `LineApiService`）。
    *   **加密金鑰管理：** 加密用的主金鑰透過環境變數 `LINE_CONFIG_ENCRYPTION_KEY` 注入，絕不硬編碼。

### 2.2. 資料模型擴充 (`Person` 實體)

1.  **實體修正：**
    *   **目標實體：** `PersonWorkspaceEntity`
    *   **檔案路徑：** `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`

2.  **欄位擴充規劃：**
    *   `lineUserId: string | null` (設為 `unique` 索引)
    *   `lineDisplayName: string | null`
    *   `lineProfilePictureUrl: string | null`
    *   `lineStatus: 'active' | 'blocked' | 'unlinked' | null`
    *   `lastLineInteractionAt: Date | null`

3.  **資料庫遷移流程 (Database Migration Process):**
    *   這一步至關重要，用於將 Entity 的變更應用到資料庫結構。
    *   **步驟：**
        1.  在 `PersonWorkspaceEntity.ts` 中完成上述欄位的添加。
        2.  在終端中執行遷移檔案生成指令：
            ```bash
            npx nx run twenty-server:database:migrate:generate -- --migrationName=AddLineFieldsToPerson
            ```
        3.  檢查 `packages/twenty-server/src/migrations/` 目錄下新生成的遷移檔案，確認 SQL 指令是否正確。
        4.  執行資料庫遷移：
            ```bash
            npx nx run twenty-server:database:migrate
            ```

### 2.3. 組態與環境管理

1.  **環境變數範本：**
    *   在 `packages/twenty-server/.env.example` 檔案中新增一行，告知其他開發者需要此環境變數：
        ```
        LINE_CONFIG_ENCRYPTION_KEY=
        ```
2.  **本地開發環境配置：**
    *   在 `deployment/docker-compose.local-test.yml` 中，為 `twenty-server` 服務添加 `environment` 區塊，確保主機的 `.env` 檔案中的 `LINE_CONFIG_ENCRYPTION_KEY` 變數能被傳遞到容器內部。

---

## 3. 實作階段二：雙向通訊

此階段的目標是打通與 LINE Platform 之間的數據鏈路。

### 3.1. 接收端：Webhook 處理

1.  **端點與安全 (`LineWebhookController` & `LineSignatureGuard`)**:
    *   **端點:** `POST /api/v1/webhooks/line`
    *   **`LineSignatureGuard` 深度實作:**
        *   **冪等性處理 (Idempotency):** LINE 在 Webhook 失敗時會重送。為防止重複處理，Guard 或 Service 應：
            1.  從請求中解析出 `webhook.event.id`（如果 LINE 提供唯一事件 ID）。
            2.  使用 Redis 進行 `SETNX` (Set if Not Exists) 操作，以事件 ID 為 key，設定一個短的過期時間（如 1 分鐘）。
            3.  如果 `SETNX` 成功，表示是新事件，繼續處理；如果失敗，表示是重複事件，直接忽略並返回 `200 OK`。

2.  **事件處理 (`LineWebhookService`)**:
    *   **非同步處理:** Controller 應在驗證簽章後，立即將 `events` 陣列傳遞給 Service，並返回 `200 OK`。`LineWebhookService` 中的所有資料庫操作都應是 `async` 的，不應阻塞主線程。對於高流量場景，可考慮將事件處理邏輯再次推入一個內部專用的 BullMQ 佇列，實現徹底的非同步化。
    *   **`handleFollowEvent`:** 修正為操作 `Person` 實體，執行「查詢去重 -> 更新或建立」的完整邏輯。
    *   **`handleUnfollowEvent`:** 修正為操作 `Person` 實體，將 `lineStatus` 更新為 `'blocked'`。

### 3.2. 發送端：API 客戶端 (`LineApiService`)

1.  **錯誤處理與重試機制:**
    *   **Rate Limit 處理:** 當收到 HTTP 429 錯誤時，不應立即失敗，而應實作帶有「指數退避 (Exponential Backoff)」的重試機制。例如，第一次等待 1s，第二次 2s，第三次 4s，最多重試 3-5 次。
    *   **錯誤日誌:** 應詳細記錄每次 API 呼叫失敗的原因、請求參數和 LINE 回傳的 `X-Line-Request-Id`，以便於排查問題。

---

## 4. 實作階段三：應用整合

此階段將已建立的基礎能力與核心業務——工作流系統——進行深度整合。

### 4.1. 工作流整合 (`SendLineMessageAction`)

1.  **共享層 (`packages/twenty-shared`) - 定義契約**:
    *   建立 `send-line-message-action-schema.ts`。
    *   在 `workflow-action-schema.ts` 中註冊。

2.  **後端 (`packages/twenty-server`) - 實作執行**:
    *   **`SendLineMessageAction` 執行器:**
        *   **變數替換引擎:** 需實作一個健壯的引擎來解析 `messageContent` 中的 `{{...}}` 變數。
        *   **前置安全檢查:** 嚴格檢查目標 `Person` 的存在性及其 `lineStatus`。

3.  **前端 (`packages/twenty-front`) - 提供 UI**:
    *   **Action 設定元件 (`WorkflowEditActionSendLineMessage.tsx`)**:
        *   **精確路徑:** `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/components/`
    *   **註冊 Action UI**:
        *   **精確路徑:**
            a. 在 `.../workflow-actions/constants/actions/` 下建立 `SendLineMessageAction.ts` 元數據檔案。
            b. 在 `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/constants/WorkflowActionsMapping.tsx` 中，將 `SEND_LINE_MESSAGE` 型別映射到其對應的 UI 元件 `WorkflowEditActionSendLineMessage`。

### 4.2. 前端使用者介面 (Settings UI)

*   **精確路徑與結構:**
    *   在 `packages/twenty-front/src/modules/settings/` 下，可能需要建立 `integrations` 子目錄。
    *   新元件可命名為 `SettingsIntegrationLine.tsx`。
    *   在 `SettingsRoutes.tsx` 中為其註冊路由。
    *   UI 應複用專案現有的 `SettingsCard`, `SettingsFieldInput` 等元件，以保持風格統一。

---

## 5. 品質保證與測試策略

一個生產級功能必須有對應的測試策略來保證其品質。

*   **5.1. 單元測試 (Unit Tests)**:
    *   對 `LineConfigService` 進行測試，Mock 加密模組，驗證加解密邏輯。
    *   對 `LineApiService` 進行測試，Mock `HttpService`，驗證其是否能根據輸入正確建構 API 請求。
    *   對 `LineWebhookService` 進行測試，Mock `PersonService` 和 `LineApiService`，驗證 `follow`/`unfollow` 的業務邏輯。
    *   對 `LineSignatureGuard` 進行測試，提供偽造的請求和正確的請求，驗證其安全攔截能力。

*   **5.2. 整合測試 (Integration Tests)**:
    *   測試 `LineWebhookController` -> `LineSignatureGuard` -> `LineWebhookService` 的完整呼叫鏈，確保請求能被正確處理。
    *   在一個模擬的工作流執行環境中，測試 `SendLineMessageAction` 是否能正確呼叫 `LineApiService`。

*   **5.3. 端到端測試 (E2E Tests)**:
    *   使用 Cypress 或 Playwright 編寫測試腳本，模擬使用者在前端建立一個包含「發送 LINE 通知」的工作流。
    *   觸發此工作流，並使用 `cy.intercept()` 或類似工具攔截對 LINE API 的對外請求，斷言其請求主體和標頭是否符合預期。

---

## 6. 部署與維運考量

*   **6.1. 環境變數管理:**
    *   在 Staging 和 Production 環境中，`LINE_CONFIG_ENCRYPTION_KEY` 等敏感變數絕不能明文儲存在 `docker-compose` 檔案中。應使用雲端廠商提供的秘密管理服務（如 AWS Secrets Manager, GCP Secret Manager, Doppler）進行管理和注入。

*   **6.2. 監控與告警 (Monitoring & Alerting):**
    *   需定義並接入現有的監控系統（如 Prometheus/Grafana, Datadog）。
    *   **關鍵監控指標:**
        *   `line_webhook_requests_total` (計數, 按狀態碼區分)
        *   `line_api_calls_total` (計數, 按 API 端點和狀態碼區分)
        *   `line_api_call_duration_seconds` (直方圖, 測量延遲)
        *   `line_messages_sent_total` (計數)
    *   **關鍵告警規則:** 當 Webhook 或 API 呼叫的 4xx/5xx 錯誤率在短時間內激增時，應立即發出告警。

*   **6.3. 金鑰輪換策略 (Key Rotation Policy):**
    *   應設計一套流程，用於在 `ChannelAccessToken` 或加密主金鑰需要更新時，能夠平滑地完成替換，避免服務中斷。例如，先在環境變數中更新金鑰，然後滾動重啟 `twenty-server` 服務。
