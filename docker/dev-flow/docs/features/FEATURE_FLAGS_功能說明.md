# Twenty CRM - Feature Flags 功能說明完整清單

> 📌 **使用說明：** 在 Admin Panel 中可以為每個 workspace 單獨開啟/關閉這些功能

---

## 📂 核心功能

### 1. Dashboard 儀表板
- **Key:** `IS_PAGE_LAYOUT_ENABLED`
- **說明:** 啟用自定義 Dashboard 儀表板功能，可視化數據分析
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐⭐ 核心功能

---

## 📂 郵件功能

### 2. Google 郵件整合
- **Key:** `IS_GOOGLE_MESSAGING_ENABLED`
- **說明:** 通過 Google OAuth 連接 Gmail 帳號，發送和接收郵件
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐⭐ 必備功能
- **用途:** 
  - 在 Settings → Accounts → Email 中連接 Gmail
  - 在 Workflow 中使用 Gmail 發送郵件
  - 同步 Gmail 收件箱到 CRM

### 3. Microsoft 郵件整合
- **Key:** `IS_MICROSOFT_MESSAGING_ENABLED`
- **說明:** 通過 Microsoft OAuth 連接 Outlook 帳號，發送和接收郵件
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐⭐ 必備功能
- **用途:**
  - 在 Settings → Accounts → Email 中連接 Outlook
  - 在 Workflow 中使用 Outlook 發送郵件
  - 同步 Outlook 收件箱到 CRM

### 4. IMAP/SMTP/CalDAV
- **Key:** `IS_IMAP_SMTP_CALDAV_ENABLED`
- **說明:** 支援任何 IMAP 郵件帳號、SMTP 發送郵件、CalDAV 日曆同步
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐⭐ 必備功能
- **用途:**
  - 手動配置任何郵件服務商（Gmail、Outlook、自建郵件伺服器等）
  - 在 Settings → Accounts → Email 中點擊 "Connect Account"
  - 填寫 IMAP/SMTP 設定

### 5. 郵件資料夾控制
- **Key:** `IS_MESSAGE_FOLDER_CONTROL_ENABLED`
- **說明:** 控制哪些郵件資料夾需要同步
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐ 進階功能
- **用途:** 選擇性同步特定郵件資料夾，節省儲存空間

### 6. 郵件域名
- **Key:** `IS_EMAILING_DOMAIN_ENABLED`
- **說明:** 啟用自定義郵件域名功能
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐ 進階功能

---

## 📂 日曆功能

### 7. Google 日曆整合
- **Key:** `IS_GOOGLE_CALENDAR_ENABLED`
- **說明:** 與 Google Calendar 同步，管理日曆事件
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐ 推薦功能
- **用途:** 
  - 同步 Google Calendar 到 CRM
  - 在 CRM 中查看和創建日曆事件
  - 與客戶會議自動關聯

### 8. Microsoft 日曆整合
- **Key:** `IS_MICROSOFT_CALENDAR_ENABLED`
- **說明:** 與 Microsoft Calendar 同步，管理日曆事件
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐ 推薦功能
- **用途:**
  - 同步 Outlook Calendar 到 CRM
  - 在 CRM 中查看和創建日曆事件

### 9. 日曆視圖
- **Key:** `IS_CALENDAR_VIEW_ENABLED`
- **說明:** 以日曆格式查看和管理記錄（例如會議、任務等）
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐ 推薦功能
- **用途:** 在表格視圖旁邊切換到日曆視圖

---

## 📂 Workflow 自動化

### 10. Workflow 迭代器
- **Key:** `IS_WORKFLOW_ITERATOR_ENABLED`
- **說明:** 在 Workflow 中迭代處理列表項目（實驗性功能）
- **建議套餐:** 專業版
- **重要性:** ⭐⭐⭐ 進階功能
- **用途:** 批量處理多筆記錄（例如：給所有客戶發送郵件）

---

## 📂 AI 功能

### 11. AI 功能
- **Key:** `IS_AI_ENABLED`
- **說明:** AI 輔助功能，包括智能建議、自動填充、數據分析等
- **建議套餐:** 專業版
- **重要性:** ⭐⭐⭐⭐ 推薦功能
- **用途:**
  - AI 自動填充客戶資料
  - 智能建議下一步行動
  - AI 分析客戶行為

---

## 📂 視圖功能

### 12. 分組功能
- **Key:** `IS_GROUP_BY_ENABLED`
- **說明:** 在表格視圖中按欄位分組顯示記錄
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐ 推薦功能
- **用途:** 按狀態、負責人、標籤等分組查看記錄

---

## 📂 整合功能

### 13. Airtable 整合
- **Key:** `IS_AIRTABLE_INTEGRATION_ENABLED`
- **說明:** 與 Airtable 資料庫整合，可以同步和導入 Airtable 資料
- **建議套餐:** 專業版
- **重要性:** ⭐⭐⭐ 進階功能
- **用途:** 從 Airtable 遷移數據到 Twenty CRM

### 14. PostgreSQL 整合
- **Key:** `IS_POSTGRESQL_INTEGRATION_ENABLED`
- **說明:** 與外部 PostgreSQL 資料庫整合，可以同步和查詢外部數據
- **建議套餐:** 專業版
- **重要性:** ⭐⭐⭐⭐ 企業功能
- **用途:** 連接現有的 PostgreSQL 資料庫，實現數據互通

### 15. Stripe 支付整合
- **Key:** `IS_STRIPE_INTEGRATION_ENABLED`
- **說明:** 與 Stripe 支付系統整合，管理訂閱和支付
- **建議套餐:** 專業版
- **重要性:** ⭐⭐⭐⭐ 商業功能
- **用途:** 
  - 管理客戶訂閱
  - 追蹤支付狀態
  - 自動化計費流程

---

## 📂 數據功能

### 16. 多態關聯
- **Key:** `IS_MORPH_RELATION_ENABLED`
- **說明:** 啟用多態關聯功能（一個欄位可以關聯多種對象類型）
- **建議套餐:** 專業版
- **重要性:** ⭐⭐⭐ 進階功能
- **用途:** 例如「附件」欄位可以關聯到公司、聯絡人、任務等多種對象

### 17. 關聯連接
- **Key:** `IS_RELATION_CONNECT_ENABLED`
- **說明:** 啟用關聯欄位的連接功能
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐ 推薦功能

### 18. 唯一索引
- **Key:** `IS_UNIQUE_INDEXES_ENABLED`
- **說明:** 啟用唯一索引功能，確保數據唯一性
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐ 數據完整性

---

## 📂 搜索功能

### 19. 動態搜索欄位
- **Key:** `IS_DYNAMIC_SEARCH_FIELDS_ENABLED`
- **說明:** 啟用動態搜索欄位功能，提供更靈活的搜索選項
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐ 進階功能

---

## 📂 篩選功能

### 20. JSON 篩選
- **Key:** `IS_JSON_FILTER_ENABLED`
- **說明:** 啟用 JSON 欄位的進階篩選功能
- **建議套餐:** 專業版
- **重要性:** ⭐⭐ 技術功能

---

## 📂 系統功能

### 21. 核心視圖
- **Key:** `IS_CORE_VIEW_ENABLED`
- **說明:** 啟用核心視圖功能（系統內部使用）
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐ 系統功能
- **備註:** 建議保持啟用

### 22. 核心視圖同步
- **Key:** `IS_CORE_VIEW_SYNCING_ENABLED`
- **說明:** 啟用核心視圖的自動同步功能
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐⭐ 系統功能
- **備註:** 建議保持啟用

### 23. 公開域名
- **Key:** `IS_PUBLIC_DOMAIN_ENABLED`
- **說明:** 啟用公開域名功能，允許外部訪問
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐ 多租戶功能

### 24. Workspace 遷移 V2
- **Key:** `IS_WORKSPACE_MIGRATION_V2_ENABLED`
- **說明:** 啟用新版 Workspace 遷移功能
- **建議套餐:** 基礎版
- **重要性:** ⭐⭐⭐ 系統功能

---

## 📦 推薦套餐配置

### 🟢 基礎版（$29/月）- 小型團隊
**必備功能：**
```
✅ IS_PAGE_LAYOUT_ENABLED              # Dashboard
✅ IS_GOOGLE_MESSAGING_ENABLED         # Gmail 整合
✅ IS_MICROSOFT_MESSAGING_ENABLED      # Outlook 整合
✅ IS_IMAP_SMTP_CALDAV_ENABLED        # 通用郵件
✅ IS_GOOGLE_CALENDAR_ENABLED          # Google 日曆
✅ IS_MICROSOFT_CALENDAR_ENABLED       # Microsoft 日曆
✅ IS_CALENDAR_VIEW_ENABLED            # 日曆視圖
✅ IS_GROUP_BY_ENABLED                 # 分組功能
✅ IS_MESSAGE_FOLDER_CONTROL_ENABLED   # 郵件資料夾
✅ IS_EMAILING_DOMAIN_ENABLED          # 郵件域名
✅ IS_RELATION_CONNECT_ENABLED         # 關聯連接
✅ IS_UNIQUE_INDEXES_ENABLED           # 唯一索引
✅ IS_DYNAMIC_SEARCH_FIELDS_ENABLED    # 動態搜索
✅ IS_PUBLIC_DOMAIN_ENABLED            # 公開域名
✅ IS_CORE_VIEW_ENABLED                # 核心視圖
✅ IS_CORE_VIEW_SYNCING_ENABLED        # 視圖同步
✅ IS_WORKSPACE_MIGRATION_V2_ENABLED   # Workspace 遷移
```

---

### 🟡 專業版（$99/月）- 成長型企業
**基礎版 + 以下功能：**
```
✅ IS_AI_ENABLED                       # AI 功能
✅ IS_WORKFLOW_ITERATOR_ENABLED        # Workflow 迭代器
✅ IS_AIRTABLE_INTEGRATION_ENABLED     # Airtable 整合
✅ IS_POSTGRESQL_INTEGRATION_ENABLED   # PostgreSQL 整合
✅ IS_STRIPE_INTEGRATION_ENABLED       # Stripe 支付
✅ IS_MORPH_RELATION_ENABLED           # 多態關聯
✅ IS_JSON_FILTER_ENABLED              # JSON 篩選
```

---

### 🔴 企業版（$299/月）- 大型企業
**專業版 + 以下功能：**
```
✅ IS_SSO_ENABLED                      # 單點登錄（未來功能）
✅ IS_SAML_ENABLED                     # SAML 認證（未來功能）
✅ IS_REMOTE_TABLE_ENABLED             # 遠程數據表（未來功能）
✅ IS_COPILOT_ENABLED                  # AI Copilot（未來功能）
✅ IS_AGENT_ENABLED                    # AI Agent（未來功能）
```

---

## 🎯 快速啟用指南

### 方法 1: 通過 Admin Panel（推薦）

1. **登入 Admin Panel**
   ```
   http://apple.118.168.188.27.nip.io:8866/settings/admin-panel
   使用帳號: notyenyu@gmail.com / YM168888
   ```

2. **搜索 Workspace**
   - 輸入 workspace 名稱或子域名
   - 點擊進入 workspace 詳情頁

3. **開啟功能**
   - 滾動到 "Feature Flag" 部分
   - 點擊 Toggle 開關啟用功能
   - 修改立即生效，無需重啟

### 方法 2: 批量啟用（適合新 workspace）

如果要為新 workspace 啟用所有基礎功能，可以在 Admin Panel 中逐一開啟，或者參考 Apple workspace 的配置。

---

## ⚠️ 重要注意事項

1. **Workspace 級別**
   - Feature Flags 是 workspace 級別的設置
   - 一個 workspace 的所有用戶共享相同的功能

2. **立即生效**
   - 在 Admin Panel 中修改後立即生效
   - 用戶只需刷新頁面即可看到變化

3. **依賴關係**
   - 某些功能需要對應的數據對象存在
   - 例如：Dashboard 功能需要 `dashboard` object
   - 新建的 workspace 會自動創建這些對象

4. **郵件功能組合**
   - 要在前端看到郵件連接選項，需要啟用：
     - `IS_GOOGLE_MESSAGING_ENABLED` 或
     - `IS_MICROSOFT_MESSAGING_ENABLED` 或
     - `IS_IMAP_SMTP_CALDAV_ENABLED`
   - 至少啟用一個才會顯示連接介面

---

## 📞 技術支持

如果遇到問題：
1. 確認使用超級管理員帳號
2. 確認 `canAccessFullAdminPanel` 權限已開啟
3. 檢查瀏覽器控制台錯誤信息
4. 確認服務正常運行

---

**最後更新：** 2025-10-13
**版本：** Twenty CRM v0.x

