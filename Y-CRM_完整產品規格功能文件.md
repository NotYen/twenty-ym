# Y-CRM 完整產品規格功能文件

> **系統名稱**: Y-CRM (基於 Twenty CRM)
> **文檔版本**: 1.0.0
> **最後更新**: 2025-12-04
> **適用對象**: 產品經理、開發團隊、客戶服務團隊

---

## 📋 目錄

1. [系統概述](#1-系統概述)
2. [核心功能模組](#2-核心功能模組)
3. [數據模型](#3-數據模型)
4. [自動化功能](#4-自動化功能)
5. [圖表與分析](#5-圖表與分析)
6. [整合功能](#6-整合功能)
7. [用戶界面](#7-用戶界面)
8. [權限管理](#8-權限管理)
9. [API 與 Webhook](#9-api-與-webhook)
10. [技術架構](#10-技術架構)
11. [功能標誌說明](#11-功能標誌說明)
12. [套餐配置建議](#12-套餐配置建議)

---

## 1. 系統概述

### 1.1 產品定位

Y-CRM 是一個開源的客戶關係管理系統，專為現代企業設計，提供：

- **高度可定制化**：完全自定義數據模型、字段和視圖
- **強大的自動化**：工作流自動化引擎，無需編碼即可實現複雜業務流程
- **智能分析**：多種圖表類型，實時數據分析
- **企業級整合**：與 Gmail、Outlook、日曆、支付系統等無縫整合
- **多租戶架構**：支持 SaaS 模式，每個客戶獨立的 Workspace

### 1.2 核心價值

- ✅ **開源免費**：無供應商鎖定，可自行部署
- ✅ **社區驅動**：由數百名開發者共同維護
- ✅ **成本效益**：無需支付高昂的授權費用
- ✅ **數據主權**：完全控制客戶數據
- ✅ **靈活擴展**：可根據業務需求自定義功能

---

## 2. 核心功能模組

### 2.1 聯絡人管理 (People)

**功能描述**：管理所有客戶聯絡人資訊

**核心功能**：
- ✅ 完整的聯絡人資料管理（姓名、郵箱、電話、地址等）
- ✅ 多個郵箱和電話號碼支持
- ✅ 社交媒體連結（LinkedIn、Twitter/X）
- ✅ 聯絡人與公司的關聯
- ✅ 互動歷史記錄（郵件、任務、活動）
- ✅ 時間軸視圖（Timeline）
- ✅ 自定義字段支持

**標準字段**：
- `name` - 姓名（Full Name）
- `email` - 郵箱（Emails，多值）
- `phone` - 電話（Phones，多值）
- `city` - 城市
- `jobTitle` - 職位
- `linkedinLink` - LinkedIn 連結
- `xLink` - Twitter/X 連結
- `avatarUrl` - 頭像

**使用場景**：
- 銷售團隊管理潛在客戶
- 客戶服務追蹤客戶互動
- 市場營銷管理聯絡人列表

---

### 2.2 公司管理 (Companies)

**功能描述**：管理企業客戶和合作夥伴資訊

**核心功能**：
- ✅ 公司基本資料（名稱、行業、規模）
- ✅ 公司網站域名（自動獲取 Logo）
- ✅ 員工數量追蹤
- ✅ 社交媒體連結
- ✅ 公司與聯絡人的關聯（One-to-Many）
- ✅ 公司與商機的關聯
- ✅ 自定義字段支持

**標準字段**：
- `name` - 公司名稱
- `domainName` - 網站域名（Links，唯一）
- `address` - 地址（Address）
- `employees` - 員工數量（Number）
- `linkedinLink` - LinkedIn 連結
- `xLink` - Twitter/X 連結
- `annualRecurringRevenue` - 年度經常性收入（Currency）
- `idealCustomerProfile` - 理想客戶檔案（Boolean）

**使用場景**：
- B2B 銷售管理企業客戶
- 合作夥伴關係管理
- 市場分析與客戶分層

---

### 2.3 商機管理 (Opportunities)

**功能描述**：追蹤銷售機會和交易進度

**核心功能**：
- ✅ 銷售管道（Pipeline）管理
- ✅ 可自定義階段（Stages）
- ✅ 商機金額追蹤
- ✅ 預期成交日期
- ✅ 商機與公司、聯絡人關聯
- ✅ Kanban 視圖（看板）
- ✅ 表格視圖
- ✅ 日曆視圖
- ✅ 自定義字段支持

**標準字段**：
- `name` - 商機名稱
- `amount` - 金額（Currency）
- `closeDate` - 預期成交日期（Date）
- `probability` - 成交概率（Rating，0-100）
- `stage` - 階段（Select）
- `pointOfContact` - 主要聯絡人（Relation → Person）

**使用場景**：
- 銷售團隊追蹤交易進度
- 銷售預測與分析
- 銷售漏斗管理

---

### 2.4 任務管理 (Tasks)

**功能描述**：管理待辦事項和活動

**核心功能**：
- ✅ 任務創建與分配
- ✅ 截止日期設定
- ✅ 任務狀態追蹤
- ✅ 任務與多個對象關聯（多態關聯）
- ✅ 提醒通知
- ✅ 任務完成追蹤
- ✅ 自定義字段支持

**標準字段**：
- `title` - 任務標題
- `status` - 狀態（Select：Not Started, In Progress, Completed）
- `dueAt` - 截止日期（DateTime）
- `completedAt` - 完成時間（DateTime）
- `assignee` - 負責人（Relation → WorkspaceMember）

**使用場景**：
- 銷售跟進任務
- 客戶服務工單
- 專案管理

---

### 2.5 筆記管理 (Notes)

**功能描述**：記錄與客戶互動的筆記和備註

**核心功能**：
- ✅ 富文本編輯器（BlockNote）
- ✅ 筆記與多個對象關聯
- ✅ 時間戳記錄
- ✅ 作者追蹤
- ✅ 自定義字段支持

**標準字段**：
- `body` - 筆記內容（Rich Text）
- `author` - 作者（Relation → WorkspaceMember）

**使用場景**：
- 會議記錄
- 客戶溝通備註
- 內部協作筆記

---

### 2.6 活動管理 (Activities)

**功能描述**：統一管理所有客戶互動活動

**核心功能**：
- ✅ 自動記錄郵件、任務、筆記等活動
- ✅ 時間軸視圖
- ✅ 活動類型分類
- ✅ 活動與對象關聯
- ✅ 活動搜索與篩選

**使用場景**：
- 查看客戶完整互動歷史
- 銷售活動追蹤
- 客戶服務記錄

---

### 2.7 報價單管理 (Sales Quotes)

**功能描述**：專業的報價單生成與管理系統

**核心功能**：
- ✅ 報價單主記錄管理
- ✅ 報價單明細項目（Line Items）
- ✅ 自動金額計算（小計、稅金、總計）
- ✅ 專業 PDF 導出（支持中英文、公司 Logo）
- ✅ 狀態管理（草稿、已發送、已接受、已拒絕、已過期）
- ✅ 報價單編號自動生成
- ✅ 與商機關聯
- ✅ 工作流自動化支持

**標準字段**：
- `quoteNumber` - 報價單編號（Text，唯一）
- `title` - 標題
- `company` - 客戶公司（Relation → Company）
- `person` - 聯絡人（Relation → Person）
- `issueDate` - 開立日期（Date）
- `expiryDate` - 有效期限（Date）
- `status` - 狀態（Select）
- `subtotal` - 小計（Currency）
- `taxRate` - 稅率（Number）
- `taxAmount` - 稅金（Currency）
- `total` - 總計（Currency）
- `terms` - 條款說明（Rich Text）
- `notes` - 備註（Rich Text）

**報價單明細項目字段**：
- `productName` - 產品名稱
- `description` - 描述
- `quantity` - 數量
- `unitPrice` - 單價（Currency）
- `discount` - 折扣（Number，百分比）
- `amount` - 金額（Currency，自動計算）

**使用場景**：
- 銷售團隊快速生成報價單
- 客戶報價管理與追蹤
- 報價轉訂單流程

---

## 3. 數據模型

### 3.1 標準對象

系統預設提供以下標準對象：

| 對象名稱 | 單數名稱 | 複數名稱 | 用途 |
|---------|---------|---------|------|
| **People** | person | people | 聯絡人管理 |
| **Companies** | company | companies | 公司管理 |
| **Opportunities** | opportunity | opportunities | 商機管理 |
| **Tasks** | task | tasks | 任務管理 |
| **Notes** | note | notes | 筆記管理 |
| **Activities** | activity | activities | 活動管理 |
| **Sales Quotes** | salesquote | salesquotes | 報價單管理 |

### 3.2 自定義對象

**功能描述**：創建符合業務需求的自定義對象

**核心功能**：
- ✅ 無限制創建自定義對象
- ✅ 自定義對象名稱（單數/複數）
- ✅ 自定義圖標
- ✅ 自定義描述
- ✅ 對象之間的關聯關係
- ✅ 對象級別權限控制

**使用場景**：
- 產品目錄管理
- 專案管理
- 訂單管理
- 庫存管理
- 任何業務實體

### 3.3 字段類型

系統支持以下字段類型：

| 字段類型 | 說明 | 使用場景 |
|---------|------|---------|
| **TEXT** | 單行文本 | 名稱、標題 |
| **PHONES** | 電話號碼（多值） | 聯絡電話 |
| **EMAILS** | 郵箱地址（多值） | 電子郵件 |
| **DATE_TIME** | 日期時間 | 截止日期、創建時間 |
| **DATE** | 日期 | 生日、簽約日期 |
| **BOOLEAN** | 布林值 | 是否、開關 |
| **NUMBER** | 數字 | 數量、評分 |
| **NUMERIC** | 精確數字 | 金額、百分比 |
| **CURRENCY** | 貨幣 | 價格、收入（微單位存儲） |
| **FULL_NAME** | 全名 | 聯絡人姓名 |
| **RATING** | 評分 | 1-5 星評分 |
| **SELECT** | 單選下拉 | 狀態、類別 |
| **MULTI_SELECT** | 多選下拉 | 標籤、技能 |
| **RELATION** | 關聯字段 | 一對一、一對多、多對多 |
| **MORPH_RELATION** | 多態關聯 | 一個字段關聯多種對象類型 |
| **LINKS** | 連結（多值） | 網站、社交媒體 |
| **POSITION** | 位置 | 地理座標 |
| **ADDRESS** | 地址 | 完整地址信息 |
| **RAW_JSON** | JSON 數據 | 結構化數據 |
| **RICH_TEXT** | 富文本 | 描述、備註 |
| **RICH_TEXT_V2** | 富文本 V2 | 新版富文本編輯器 |
| **ARRAY** | 數組 | 列表數據 |

### 3.4 關聯關係

**支持的關聯類型**：
- ✅ **One-to-One**：一對一關係
- ✅ **One-to-Many**：一對多關係
- ✅ **Many-to-Many**：多對多關係
- ✅ **Morph Relation**：多態關聯（一個字段可關聯多種對象類型）

**使用場景**：
- 公司 → 聯絡人（One-to-Many）
- 商機 → 公司（Many-to-One）
- 任務 → 多個對象（Morph Relation）
- 附件 → 多個對象（Morph Relation）

---

## 4. 自動化功能

### 4.1 工作流 (Workflows)

**功能描述**：強大的無代碼自動化引擎

#### 4.1.1 觸發器 (Triggers)

| 觸發器類型 | 說明 | 使用場景 |
|-----------|------|---------|
| **Record is Created** | 記錄創建時觸發 | 新客戶註冊自動發送歡迎郵件 |
| **Record is Updated** | 記錄更新時觸發 | 商機狀態變更時通知團隊 |
| **Record is Updated or Created** | 創建或更新時觸發 | 統一處理記錄變更 |
| **Record is Deleted** | 記錄刪除時觸發 | 刪除記錄時備份數據 |
| **Launch Manually** | 手動觸發 | 批量處理、報表生成 |
| **On a Schedule** | 定時觸發 | 每日報表、定期提醒 |
| **Webhook** | Webhook 觸發 | 接收外部系統事件 |

**手動觸發配置**：
- **Global**：全局觸發，無需選擇記錄
- **Single**：單記錄觸發，可選擇多個記錄分別執行
- **Bulk**：批量觸發，所有選中記錄作為一個批次處理

#### 4.1.2 動作 (Actions)

| 動作類型 | 說明 | 使用場景 |
|---------|------|---------|
| **Create a Record** | 創建記錄 | 自動創建任務、筆記 |
| **Update a Record** | 更新記錄 | 自動更新狀態、金額 |
| **Delete a Record** | 刪除記錄 | 清理過期數據 |
| **Send Email** | 發送郵件 | 通知、提醒、報表 |
| **Create Note** | 創建筆記 | 記錄自動化操作 |
| **Create Task** | 創建任務 | 自動分配跟進任務 |
| **Update Field** | 更新字段 | 自動計算、狀態更新 |
| **HTTP Request** | HTTP 請求 | 調用外部 API |
| **Code** | 執行代碼 | 複雜邏輯處理 |
| **Iterator** | 迭代處理 | 批量處理列表數據 |
| **Condition** | 條件判斷 | 分支邏輯 |
| **AI Agent** | AI 代理 | AI 輔助決策 |

#### 4.1.3 工作流管理

**核心功能**：
- ✅ 可視化工作流編輯器
- ✅ 版本控制（草稿、已發布）
- ✅ 工作流執行歷史
- ✅ 錯誤日誌與調試
- ✅ 工作流暫停/恢復
- ✅ 執行統計（觸發次數、成功率）

**使用場景**：
- 銷售流程自動化
- 客戶服務自動化
- 數據同步
- 報表自動生成
- 與外部系統整合

---

### 4.2 報價單自動化

**已實現的自動化功能**：

1. **自動計算報價單總額**
   - 觸發：QuoteLineItem 創建或更新
   - 動作：重新計算 Quote 的小計、稅金、總計

2. **自動更新過期狀態**
   - 觸發：定時任務（每日執行）
   - 動作：將過期的報價單狀態更新為 EXPIRED

3. **發送報價單郵件通知**
   - 觸發：報價單狀態變更為 SENT
   - 動作：發送包含 PDF 附件的郵件給客戶

---

## 5. 圖表與分析

### 5.1 Dashboard 儀表板

**功能描述**：可視化數據分析儀表板

**核心功能**：
- ✅ 自定義 Dashboard 布局
- ✅ 多種 Widget 類型
- ✅ 拖拽排序
- ✅ 實時數據更新
- ✅ 多個 Dashboard 支持

### 5.2 圖表類型

#### 5.2.1 Pie Chart（圓餅圖）

**適用場景**：
- 顯示比例和佔比
- 分類數據分布
- 快速了解最大佔比

**支持功能**：
- ✅ 百分比顯示
- ✅ 圖例顯示
- ✅ 數據標籤
- ✅ 顏色配置
- ✅ 日期粒度（當 Group By 是日期欄位時）
- ✅ 排序選項
- ✅ 過濾器

**使用案例**：
- 銷售額按產品類別分布
- 客戶按地區分布
- 任務按狀態分布

#### 5.2.2 Bar Chart（長條圖）

**適用場景**：
- 比較不同類別的數值
- 排名分析
- 時間序列比較

**支持功能**：
- ✅ 垂直長條圖
- ✅ 水平長條圖
- ✅ 單維度/雙維度分組
- ✅ 堆疊/分組模式
- ✅ **累積模式**（日期欄位）
- ✅ 數據標籤
- ✅ 軸名稱顯示
- ✅ 範圍過濾
- ✅ 顏色配置

**使用案例**：
- 各產品銷售額比較
- 每月新增客戶數
- 累積銷售額趨勢

#### 5.2.3 Line Chart（折線圖）

**適用場景**：
- 時間序列趨勢分析
- 連續數據變化
- 累積增長追蹤

**支持功能**：
- ✅ 單線/多線
- ✅ 面積圖模式
- ✅ **累積模式**（日期欄位）
- ✅ 數據標籤
- ✅ 軸名稱顯示
- ✅ 範圍過濾
- ✅ 顏色配置
- ✅ 圖例顯示

**使用案例**：
- 每日新增客戶趨勢
- 累積客戶總數
- 月度收入趨勢

#### 5.2.4 Aggregate Chart（聚合圖表）

**適用場景**：
- 顯示單一聚合值
- KPI 指標展示
- 總計、平均值等統計

**支持功能**：
- ✅ 顯示單一聚合值
- ✅ 前綴設定（例如：$）
- ✅ 後綴設定（例如：元、人）
- ✅ 格式化選項
- ✅ 標籤顯示

**使用案例**：
- 總銷售額
- 平均訂單金額
- 客戶總數

#### 5.2.5 Gauge Chart（儀表圖）

**適用場景**：
- 進度顯示
- 目標完成度
- 百分比指標

**支持功能**：
- ✅ 儀表盤顯示
- ✅ 百分比顯示
- ✅ 顏色配置
- ✅ 數據標籤

**使用案例**：
- 銷售目標完成度
- 任務完成率
- KPI 達成率

### 5.3 數據分組與聚合

**支持的操作**：
- ✅ **Group By**：按字段分組
- ✅ **Aggregate**：聚合計算（Sum、Average、Count、Min、Max）
- ✅ **Filter**：數據過濾
- ✅ **Sort**：排序
- ✅ **Date Granularity**：日期粒度（日、週、月、年）

---

## 6. 整合功能

### 6.1 郵件整合

#### 6.1.1 Gmail 整合

**功能描述**：通過 Google OAuth 連接 Gmail 帳號

**核心功能**：
- ✅ OAuth 2.0 認證
- ✅ 郵件同步（收件箱、發件箱）
- ✅ 發送郵件
- ✅ 郵件與聯絡人/公司關聯
- ✅ 郵件線程管理
- ✅ 郵件資料夾同步控制

**使用場景**：
- 在 CRM 中查看客戶郵件
- 從 CRM 發送郵件
- 郵件自動關聯到客戶記錄

#### 6.1.2 Microsoft Outlook 整合

**功能描述**：通過 Microsoft OAuth 連接 Outlook 帳號

**核心功能**：
- ✅ OAuth 2.0 認證
- ✅ 郵件同步
- ✅ 發送郵件
- ✅ 郵件與聯絡人/公司關聯

#### 6.1.3 IMAP/SMTP/CalDAV

**功能描述**：支持任何 IMAP 郵件服務商

**核心功能**：
- ✅ 手動配置 IMAP/SMTP 設定
- ✅ 支持任何郵件服務商
- ✅ CalDAV 日曆同步
- ✅ 自建郵件伺服器支持

**配置方式**：
- Settings → Accounts → Email → Connect Account
- 填寫 IMAP/SMTP 設定

### 6.2 日曆整合

#### 6.2.1 Google Calendar

**功能描述**：與 Google Calendar 同步

**核心功能**：
- ✅ 雙向同步
- ✅ 在 CRM 中查看日曆事件
- ✅ 創建日曆事件
- ✅ 事件與客戶關聯

#### 6.2.2 Microsoft Calendar

**功能描述**：與 Outlook Calendar 同步

**核心功能**：
- ✅ 雙向同步
- ✅ 在 CRM 中查看日曆事件
- ✅ 創建日曆事件

#### 6.2.3 日曆視圖

**功能描述**：以日曆格式查看記錄

**核心功能**：
- ✅ 月視圖、週視圖、日視圖
- ✅ 拖拽調整日期
- ✅ 點擊查看詳情
- ✅ 支持任何有日期字段的對象

### 6.3 數據庫整合

#### 6.3.1 Airtable 整合

**功能描述**：與 Airtable 資料庫整合

**核心功能**：
- ✅ 數據同步
- ✅ 數據導入
- ✅ 從 Airtable 遷移到 Twenty CRM

#### 6.3.2 PostgreSQL 整合

**功能描述**：與外部 PostgreSQL 資料庫整合

**核心功能**：
- ✅ 連接外部 PostgreSQL
- ✅ 數據查詢
- ✅ 數據同步
- ✅ 實現數據互通

### 6.4 支付整合

#### 6.4.1 Stripe 整合

**功能描述**：與 Stripe 支付系統整合

**核心功能**：
- ✅ 管理客戶訂閱
- ✅ 追蹤支付狀態
- ✅ 自動化計費流程
- ✅ Webhook 處理支付事件

### 6.5 AI 整合

#### 6.5.1 AI 功能

**功能描述**：AI 輔助功能

**核心功能**：
- ✅ AI 自動填充客戶資料
- ✅ 智能建議下一步行動
- ✅ AI 分析客戶行為
- ✅ AI 生成內容

#### 6.5.2 AI Agent

**功能描述**：AI 代理自動化

**核心功能**：
- ✅ 在工作流中使用 AI Agent
- ✅ AI 輔助決策
- ✅ 自動化 AI 處理

**支持的 AI 服務**：
- OpenAI (GPT)
- Anthropic (Claude)
- xAI (Grok)

---

## 7. 用戶界面

### 7.1 視圖類型

#### 7.1.1 表格視圖 (Table View)

**核心功能**：
- ✅ 可自定義列
- ✅ 排序（升序/降序）
- ✅ 篩選（多條件）
- ✅ 分組（Group By）
- ✅ 搜索
- ✅ 批量操作
- ✅ 行內編輯

#### 7.1.2 Kanban 視圖 (看板視圖)

**核心功能**：
- ✅ 拖拽移動卡片
- ✅ 自定義列（階段）
- ✅ 卡片詳情顯示
- ✅ 快速編輯
- ✅ 篩選與搜索

**適用對象**：
- Opportunities（商機）
- Tasks（任務）
- 任何有狀態字段的對象

#### 7.1.3 日曆視圖 (Calendar View)

**核心功能**：
- ✅ 月視圖、週視圖、日視圖
- ✅ 拖拽調整日期
- ✅ 點擊查看詳情
- ✅ 創建新記錄

**適用對象**：
- Calendar Events（日曆事件）
- Tasks（任務）
- 任何有日期字段的對象

### 7.2 記錄詳情頁

**核心功能**：
- ✅ 完整記錄信息顯示
- ✅ 關聯記錄展示
- ✅ 時間軸（Timeline）
- ✅ 活動記錄
- ✅ 快速操作菜單
- ✅ 自定義操作（如 PDF 導出）

### 7.3 命令菜單 (Cmd+K)

**功能描述**：快速命令搜索與執行

**核心功能**：
- ✅ 全局搜索（Cmd+K 或 Ctrl+K）
- ✅ 快速導航
- ✅ 快速創建記錄
- ✅ 執行工作流
- ✅ 搜索記錄

### 7.4 響應式設計

**核心功能**：
- ✅ 桌面端優化
- ✅ 平板適配
- ✅ 移動端適配（部分功能）

---

## 8. 權限管理

### 8.1 角色系統

**預設角色**：
- **Admin**：管理員，完整權限
- **Member**：成員，基礎權限

**自定義角色**：
- ✅ 創建自定義角色
- ✅ 分配權限
- ✅ 設置默認角色

### 8.2 權限類型

#### 8.2.1 對象級權限

**權限選項**：
- **See Record**：查看記錄
- **Edit Records**：編輯記錄
- **Delete Records**：刪除記錄（軟刪除）
- **Destroy Records**：永久刪除

**配置方式**：
- 全局設置（All Objects）
- 對象級別覆蓋（Object-Level Permissions）

#### 8.2.2 字段級權限

**權限選項**：
- **See Field**：查看字段
- **Edit Field**：編輯字段
- **No Access**：無權限

**配置方式**：
- 繼承對象權限
- 字段級別覆蓋

#### 8.2.3 設置權限

**權限選項**：
- **Settings All Access**：完整設置權限
- **API Keys & Webhooks**：API 密鑰和 Webhook 管理
- **Workspace**：工作區設置
- **Users**：用戶管理
- **Roles**：角色管理
- **Data Model**：數據模型配置
- **Security**：安全設置
- **Workflows**：工作流管理
- **SSO Bypass**：SSO 繞過選項
- **Impersonate**：模擬用戶

#### 8.2.4 操作權限

**權限選項**：
- **Application All Access**：完整操作權限
- **Send Email**：發送郵件
- **Import CSV**：導入 CSV
- **Export CSV**：導出 CSV

### 8.3 權限繼承

**規則**：
- 對象權限繼承全局設置
- 字段權限繼承對象權限
- 可以覆蓋繼承的權限
- 支持撤銷覆蓋，恢復繼承

---

## 9. API 與 Webhook

### 9.1 GraphQL API

**功能描述**：完整的 GraphQL API 支持

**核心功能**：
- ✅ 查詢（Query）
- ✅ 變更（Mutation）
- ✅ 訂閱（Subscription，實時更新）
- ✅ 文件上傳
- ✅ 認證（JWT Token）
- ✅ API 密鑰支持

**使用場景**：
- 自定義應用整合
- 數據導入/導出
- 第三方系統整合

### 9.2 REST API

**功能描述**：RESTful API 支持

**核心功能**：
- ✅ 標準 REST 端點
- ✅ CRUD 操作
- ✅ 認證支持

### 9.3 Webhook

**功能描述**：實時事件通知

**核心功能**：
- ✅ 創建 Webhook
- ✅ 配置 Webhook URL
- ✅ 接收事件通知（記錄創建、更新、刪除）
- ✅ 事件過濾
- ✅ Webhook 管理（編輯、刪除）

**使用場景**：
- 外部系統同步
- 自動化觸發
- 數據備份

### 9.4 API 密鑰管理

**核心功能**：
- ✅ 生成 API 密鑰
- ✅ 密鑰權限控制
- ✅ 密鑰過期設置
- ✅ 密鑰撤銷

---

## 10. 技術架構

### 10.1 前端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| **React** | 18.3.1 | UI 框架 |
| **TypeScript** | 5.9.2 | 類型安全 |
| **Vite** | 7.0.0 | 構建工具 |
| **Recoil** | 0.7.7 | 狀態管理 |
| **Apollo Client** | 3.7.17 | GraphQL 客戶端 |
| **@wyw-in-js** | 0.7.0 | CSS-in-JS |
| **@nivo** | 0.99.0 | 圖表庫 |
| **BlockNote** | 0.31.1 | 富文本編輯器 |

### 10.2 後端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 24.5.0 | 運行環境 |
| **NestJS** | 9.4.3 | 後端框架 |
| **TypeORM** | 0.3.20 | ORM |
| **GraphQL** | 16.8.0 | API 查詢語言 |
| **BullMQ** | 5.40.0 | 任務隊列 |
| **PostgreSQL** | 16 | 主數據庫 |
| **Redis** | latest | 緩存、隊列 |

### 10.3 部署架構

**支持部署方式**：
- ✅ Docker Compose
- ✅ Kubernetes
- ✅ 本地開發（Yarn）
- ✅ 雲端部署（AWS、Render 等）

**多租戶架構**：
- ✅ Workspace 級別隔離
- ✅ 獨立數據庫 Schema
- ✅ 功能標誌控制

---

## 11. 功能標誌說明

### 11.1 核心功能

| 功能標誌 | 說明 | 推薦套餐 |
|---------|------|---------|
| `IS_PAGE_LAYOUT_ENABLED` | Dashboard 儀表板 | 基礎版+ |

### 11.2 郵件功能

| 功能標誌 | 說明 | 推薦套餐 |
|---------|------|---------|
| `IS_GOOGLE_MESSAGING_ENABLED` | Google 郵件整合 | 基礎版+ |
| `IS_MICROSOFT_MESSAGING_ENABLED` | Microsoft 郵件整合 | 基礎版+ |
| `IS_IMAP_SMTP_CALDAV_ENABLED` | IMAP/SMTP/CalDAV | 基礎版+ |
| `IS_MESSAGE_FOLDER_CONTROL_ENABLED` | 郵件資料夾控制 | 基礎版+ |
| `IS_EMAILING_DOMAIN_ENABLED` | 郵件域名 | 基礎版+ |

### 11.3 日曆功能

| 功能標誌 | 說明 | 推薦套餐 |
|---------|------|---------|
| `IS_GOOGLE_CALENDAR_ENABLED` | Google 日曆整合 | 基礎版+ |
| `IS_MICROSOFT_CALENDAR_ENABLED` | Microsoft 日曆整合 | 基礎版+ |
| `IS_CALENDAR_VIEW_ENABLED` | 日曆視圖 | 基礎版+ |

### 11.4 自動化功能

| 功能標誌 | 說明 | 推薦套餐 |
|---------|------|---------|
| `IS_WORKFLOW_ENABLED` | 工作流自動化 | 專業版+ |
| `IS_WORKFLOW_ITERATOR_ENABLED` | Workflow 迭代器 | 專業版+ |

### 11.5 AI 功能

| 功能標誌 | 說明 | 推薦套餐 |
|---------|------|---------|
| `IS_AI_ENABLED` | AI 功能 | 專業版+ |
| `IS_COPILOT_ENABLED` | AI Copilot | 企業版 |
| `IS_AGENT_ENABLED` | AI Agent | 企業版 |

### 11.6 視圖功能

| 功能標誌 | 說明 | 推薦套餐 |
|---------|------|---------|
| `IS_GROUP_BY_ENABLED` | 分組功能 | 基礎版+ |
| `IS_CORE_VIEW_ENABLED` | 核心視圖 | 基礎版+ |
| `IS_CORE_VIEW_SYNCING_ENABLED` | 核心視圖同步 | 基礎版+ |

### 11.7 整合功能

| 功能標誌 | 說明 | 推薦套餐 |
|---------|------|---------|
| `IS_AIRTABLE_INTEGRATION_ENABLED` | Airtable 整合 | 專業版+ |
| `IS_POSTGRESQL_INTEGRATION_ENABLED` | PostgreSQL 整合 | 專業版+ |
| `IS_STRIPE_INTEGRATION_ENABLED` | Stripe 支付整合 | 專業版+ |

### 11.8 數據功能

| 功能標誌 | 說明 | 推薦套餐 |
|---------|------|---------|
| `IS_MORPH_RELATION_ENABLED` | 多態關聯 | 專業版+ |
| `IS_RELATION_CONNECT_ENABLED` | 關聯連接 | 基礎版+ |
| `IS_UNIQUE_INDEXES_ENABLED` | 唯一索引 | 基礎版+ |
| `IS_DYNAMIC_SEARCH_FIELDS_ENABLED` | 動態搜索欄位 | 基礎版+ |
| `IS_JSON_FILTER_ENABLED` | JSON 篩選 | 專業版+ |
| `IS_CUSTOM_OBJECT_ENABLED` | 自定義對象 | 專業版+ |

### 11.9 系統功能

| 功能標誌 | 說明 | 推薦套餐 |
|---------|------|---------|
| `IS_PUBLIC_DOMAIN_ENABLED` | 公開域名 | 基礎版+ |
| `IS_WORKSPACE_MIGRATION_V2_ENABLED` | Workspace 遷移 V2 | 基礎版+ |
| `IS_SSO_ENABLED` | 單點登錄 | 企業版 |
| `IS_SAML_ENABLED` | SAML 認證 | 企業版 |
| `IS_REMOTE_TABLE_ENABLED` | 遠程表 | 企業版 |
| `IS_API_ENABLED` | API 訪問 | 專業版+ |

### 11.10 功能標誌管理

**管理方式**：
- ✅ Admin Panel 可視化管理
- ✅ Workspace 級別控制
- ✅ 實時生效（無需重啟）
- ✅ 批量配置支持

---

## 12. 套餐配置建議

### 12.1 基礎版（$29/月）

**目標客戶**：小型團隊、初創公司

**包含功能**：
- ✅ Dashboard 儀表板
- ✅ 聯絡人、公司、商機管理
- ✅ 郵件整合（Gmail、Outlook、IMAP）
- ✅ 日曆整合（Google、Microsoft）
- ✅ 日曆視圖
- ✅ 分組功能
- ✅ 表格、Kanban、日曆視圖
- ✅ 基礎權限管理
- ✅ CSV 導入/導出

**功能標誌配置**：
```
✅ IS_PAGE_LAYOUT_ENABLED
✅ IS_GOOGLE_MESSAGING_ENABLED
✅ IS_MICROSOFT_MESSAGING_ENABLED
✅ IS_IMAP_SMTP_CALDAV_ENABLED
✅ IS_GOOGLE_CALENDAR_ENABLED
✅ IS_MICROSOFT_CALENDAR_ENABLED
✅ IS_CALENDAR_VIEW_ENABLED
✅ IS_GROUP_BY_ENABLED
✅ IS_RELATION_CONNECT_ENABLED
✅ IS_UNIQUE_INDEXES_ENABLED
✅ IS_DYNAMIC_SEARCH_FIELDS_ENABLED
✅ IS_PUBLIC_DOMAIN_ENABLED
✅ IS_CORE_VIEW_ENABLED
✅ IS_CORE_VIEW_SYNCING_ENABLED
```

### 12.2 專業版（$99/月）

**目標客戶**：成長型企業、需要自動化的團隊

**包含功能**：
- ✅ 基礎版所有功能
- ✅ 工作流自動化
- ✅ AI 輔助功能
- ✅ 自定義對象
- ✅ Airtable 整合
- ✅ PostgreSQL 整合
- ✅ Stripe 支付整合
- ✅ API 訪問
- ✅ 多態關聯
- ✅ JSON 篩選

**功能標誌配置**：
```
✅ 基礎版所有功能標誌
✅ IS_WORKFLOW_ENABLED
✅ IS_WORKFLOW_ITERATOR_ENABLED
✅ IS_AI_ENABLED
✅ IS_AIRTABLE_INTEGRATION_ENABLED
✅ IS_POSTGRESQL_INTEGRATION_ENABLED
✅ IS_STRIPE_INTEGRATION_ENABLED
✅ IS_API_ENABLED
✅ IS_CUSTOM_OBJECT_ENABLED
✅ IS_MORPH_RELATION_ENABLED
✅ IS_JSON_FILTER_ENABLED
```

### 12.3 企業版（$299/月）

**目標客戶**：大型企業、有嚴格安全要求的組織

**包含功能**：
- ✅ 專業版所有功能
- ✅ 單點登錄（SSO）
- ✅ SAML 認證
- ✅ 遠程數據表
- ✅ AI Copilot
- ✅ AI Agent
- ✅ 高級安全功能
- ✅ 優先技術支持

**功能標誌配置**：
```
✅ 專業版所有功能標誌
✅ IS_SSO_ENABLED
✅ IS_SAML_ENABLED
✅ IS_REMOTE_TABLE_ENABLED
✅ IS_COPILOT_ENABLED
✅ IS_AGENT_ENABLED
```

---

## 附錄

### A. 標準對象字段完整列表

詳細字段列表請參考系統文檔或直接在系統中查看 Settings → Data Model。

### B. 工作流觸發器與動作完整列表

詳細列表請參考系統文檔或直接在系統中查看 Settings → Workflows。

### C. 圖表配置選項

詳細配置選項請參考系統文檔或在 Dashboard 中創建圖表時查看。

### D. API 文檔

GraphQL API 文檔可通過訪問 `/graphql` 端點查看 GraphiQL 界面。

### E. 技術支持

如有問題，請聯繫技術支持團隊或查看官方文檔。

---

**文檔版本**: 1.0.0
**最後更新**: 2025-12-04
**維護者**: Y-CRM 開發團隊

