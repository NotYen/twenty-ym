# Sentry.io 極低負載整合指南 (Zero-Lag Configuration)

這份指南專為 **「極度重視效能，絕對不能卡頓」** 的需求所設計。我們將只開啟最核心的錯誤捕捉功能，並**強制關閉**所有會消耗 CPU 與網路頻寬的監控功能。

## 1. 原理說明

Sentry 為什麼會卡？通常是因為開啟了以下兩個功能：
1.  **Performance Monitoring (效能監控)**: 會攔截每一個 API 請求，計算時間。
2.  **Session Replay (畫面重播)**: 會持續錄製 DOM 變化，非常吃記憶體。

**我們的策略：** 完全不安裝、不啟用這兩個模組。只保留「當程式崩潰時，送出一個 HTTP 請求」的最基本功能。這對使用者的操作體驗影響趨近於零。

---

## 2. 實作步驟 (Frontend)

### 步驟 A: 安裝最輕量套件
請只安裝核心套件，不要安裝額外的 Profiling 工具。

```bash
yarn workspace twenty-front add @sentry/react
```

### 步驟 B: 初始化設定 (關鍵！)
在 `packages/twenty-front/src/main.tsx` (或入口檔案) 加入以下設定。
**請務必照抄此設定，這是效能最佳化的關鍵：**

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "您的_SENTRY_DSN_網址",

  // 🔴 關鍵設定：強制關閉效能監控
  tracesSampleRate: 0,

  // 🔴 關鍵設定：強制關閉畫面錄影
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // 🟢 僅開啟：環境標記 (用於區分測試站與正式站)
  environment: import.meta.env.MODE,

  // 🟢 僅開啟：防止發送一樣的錯誤 (Deduplication)
  integrations: [],
});
```

### 步驟 C: 使用方式
通常您不需要做什麼，它會自動捕捉。但如果您想手動紀錄非崩潰的錯誤（例如 API 失敗），可以這樣寫：

```typescript
try {
  // 執行某些危險操作
} catch (error) {
  // 手動回報給 Sentry，不會影響使用者
  Sentry.captureException(error);
}
```

---

## 3. 實作步驟 (Backend)

後端已經整合在程式碼中了，您只需要設定環境變數。

### 設定 `env.local`
在您的環境變數檔案中加入：

```bash
# Sentry DSN (從 Sentry 後台取得)
SENTRY_DSN=https://xxxxxxxx@xxx.ingest.sentry.io/xxxxxxx

# 也是設為 0 以確保後端效能
SENTRY_TRACES_SAMPLE_RATE=0
```

---

## 4. 如何取得 SENTRY_DSN？

1.  前往 [Sentry.io](https://sentry.io/) 註冊帳號。
2.  建立新專案 (Create Project) -> 選擇 **React** (前端) 或 **Node.js** (後端)。
3.  在 **Settings** -> **Client Keys (DSN)** 中找到 `https://...` 開頭的網址。
4.  這就是您的 DSN。

---

## 5. 總結風險評估

| 項目 | 影響程度 | 說明 |
| :--- | :--- | :--- |
| **JS 檔案大小** | 極輕微增加 | 約增加 20KB，對寬頻網路無感。 |
| **CPU 運算** | **趨近於 0** | 因關閉了 Tracing/Replay，平常完全靜止。 |
| **網路請求** | **趨近於 0** | 只有在「真的出錯」那瞬間才會發送一個請求。 |

**結論：此配置保證不會造成 User 有卡頓的感覺，是目前最安全的監控方案。**
