# Firebase Google Analytics 整合

這個模組提供了 Firebase Google Analytics 的完整整合方案，用於追蹤用戶行為和應用數據。

## 📋 目錄結構

```
firebase/
├── config/
│   └── firebase.config.ts          # Firebase 配置
├── services/
│   └── firebase-analytics.service.ts  # Analytics 初始化服務
├── hooks/
│   ├── useFirebaseAnalytics.ts     # Firebase Analytics Hook
│   └── usePageTracking.ts          # 頁面追蹤 Hook
├── utils/
│   └── analytics.utils.ts          # Analytics 工具函數
├── index.ts                        # 模組導出
└── README.md                       # 本文件
```

## 🚀 設置步驟

### 1. 配置環境變數

在專案根目錄的 `.env` 文件中添加以下配置：

```bash
# Firebase 配置
REACT_APP_FIREBASE_API_KEY=你的_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=你的專案.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=你的專案ID
REACT_APP_FIREBASE_STORAGE_BUCKET=你的專案.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=你的_SENDER_ID
REACT_APP_FIREBASE_APP_ID=你的_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. 獲取 Firebase 配置

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇或創建專案
3. 點擊「專案設定」> 「一般」
4. 在「您的應用程式」區塊中，選擇網頁應用
5. 複製配置資訊到 `.env` 文件

### 3. 啟用 Google Analytics

1. 在 Firebase Console 中選擇「Analytics」
2. 如果尚未啟用，點擊「啟用 Google Analytics」
3. 按照指示完成設置

## 📖 使用方法

### 基本使用

Firebase Analytics 已經在 `App.tsx` 中自動初始化，頁面瀏覽追蹤也已自動啟用。

### 追蹤自定義事件

```typescript
import { trackEvent } from '@/analytics/firebase';

// 追蹤按鈕點擊
const handleClick = () => {
  trackEvent('button_click', {
    button_name: 'create_record',
    location: 'main_toolbar',
  });
};
```

### 使用內建快捷方法

```typescript
import {
  trackButtonClick,
  trackSearch,
  trackFormSubmit,
  trackError,
} from '@/analytics/firebase';

// 追蹤按鈕點擊
trackButtonClick('save_button', 'settings_page');

// 追蹤搜尋
trackSearch('customer data');

// 追蹤表單提交
trackFormSubmit('contact_form', true);

// 追蹤錯誤
trackError('API request failed', 'user_profile_page');
```

### 設置用戶資訊

```typescript
import {
  setAnalyticsUserId,
  setAnalyticsUserProperties,
} from '@/analytics/firebase';

// 用戶登入時設置 User ID
const handleLogin = (user) => {
  setAnalyticsUserId(user.id);

  setAnalyticsUserProperties({
    plan: user.subscriptionPlan,
    workspace: user.workspaceId,
    role: user.role,
  });
};
```

### 手動追蹤頁面瀏覽

如果需要手動追蹤特定頁面：

```typescript
import { trackPageView } from '@/analytics/firebase';

trackPageView('/custom-page', 'Custom Page Title');
```

## 🎯 常用事件範例

### 1. 記錄創建

```typescript
trackEvent('record_created', {
  record_type: 'contact',
  source: 'manual_input',
});
```

### 2. 功能使用

```typescript
trackEvent('feature_used', {
  feature_name: 'export_data',
  format: 'csv',
  record_count: 100,
});
```

### 3. 工作流程執行

```typescript
trackEvent('workflow_executed', {
  workflow_id: 'wf_123',
  workflow_name: 'Email Campaign',
  status: 'success',
});
```

### 4. API 調用

```typescript
trackEvent('api_call', {
  endpoint: '/api/users',
  method: 'POST',
  status_code: 200,
  duration_ms: 250,
});
```

## 🔍 在 Firebase Console 查看數據

### 即時數據

1. 前往 Firebase Console > Analytics > 即時
2. 查看當前活躍用戶和即時事件

### 歷史數據

1. 前往 Firebase Console > Analytics > 事件
2. 查看各種事件的統計數據
3. 使用「報表」功能創建自定義報表

## ⚙️ 進階配置

### 條件式啟用

Firebase Analytics 會自動檢查環境變數，只有在配置完整時才會啟用：

```typescript
import { isFirebaseEnabled } from '@/analytics/firebase';

if (isFirebaseEnabled()) {
  console.log('Firebase Analytics 已啟用');
}
```

### 自定義初始化

如果需要自定義初始化邏輯：

```typescript
import { initializeFirebaseAnalytics } from '@/analytics/firebase';

const analytics = await initializeFirebaseAnalytics();
if (analytics) {
  // Firebase Analytics 初始化成功
}
```

## 🛡️ 隱私和合規

- 確保遵守 GDPR、CCPA 等隱私法規
- 在需要時實現 Cookie 同意橫幅
- 避免記錄敏感個人資訊（PII）
- 使用用戶 ID 而非電子郵件或姓名

## 🐛 故障排除

### Analytics 未初始化

檢查：

1. 環境變數是否正確設置
2. 瀏覽器控制台是否有錯誤訊息
3. Firebase 專案是否已啟用 Analytics

### 事件未顯示

注意：

- 即時事件通常會在 1-2 分鐘內顯示
- 歷史數據可能需要 24-48 小時處理
- 檢查 Firebase Console 的「DebugView」以查看測試事件

### 開發環境測試

啟用 Debug 模式：

```bash
# Chrome 擴充功能
安裝 Google Analytics Debugger 擴充功能

# 或在 URL 中添加參數
?debug=true
```

## 📚 相關資源

- [Firebase Analytics 官方文檔](https://firebase.google.com/docs/analytics)
- [GA4 事件參考](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [隱私和安全](https://firebase.google.com/support/privacy)
