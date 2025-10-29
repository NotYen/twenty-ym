# Firebase GA 快速開始

## 🎯 5 分鐘快速設置

### 1. 獲取 Firebase 配置

訪問：https://console.firebase.google.com/ → 創建專案 → 添加網頁應用

### 2. 設置環境變數

在專案的 `.env` 文件中添加：

```bash
REACT_APP_FIREBASE_API_KEY=你的值
REACT_APP_FIREBASE_AUTH_DOMAIN=你的值
REACT_APP_FIREBASE_PROJECT_ID=你的值
REACT_APP_FIREBASE_STORAGE_BUCKET=你的值
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=你的值
REACT_APP_FIREBASE_APP_ID=你的值
REACT_APP_FIREBASE_MEASUREMENT_ID=你的值
```

### 3. 啟動應用

```bash
yarn nx start twenty-front
```

### 4. 驗證

打開瀏覽器控制台，應該看到：

```
[Firebase] Firebase App 已初始化
[Firebase] Firebase Analytics 已初始化
```

## 📝 常用代碼片段

### 追蹤按鈕點擊

```typescript
import { trackButtonClick } from '@/analytics/firebase';

trackButtonClick('save_button', 'settings_page');
```

### 追蹤搜尋

```typescript
import { trackSearch } from '@/analytics/firebase';

trackSearch('customer data');
```

### 追蹤自定義事件

```typescript
import { trackEvent } from '@/analytics/firebase';

trackEvent('record_created', {
  type: 'contact',
  source: 'import',
});
```

### 設置用戶資訊

```typescript
import {
  setAnalyticsUserId,
  setAnalyticsUserProperties,
} from '@/analytics/firebase';

// 登入時
setAnalyticsUserId(user.id);
setAnalyticsUserProperties({
  plan: 'premium',
  workspace: user.workspaceId,
});
```

### 追蹤表單提交

```typescript
import { trackFormSubmit } from '@/analytics/firebase';

trackFormSubmit('contact_form', true);
```

### 追蹤錯誤

```typescript
import { trackError } from '@/analytics/firebase';

trackError('API request failed', 'user_profile');
```

## 🔍 查看數據

Firebase Console → Analytics → 即時（查看即時事件）

## 📚 完整文檔

查看 `README.md` 獲取完整文檔和進階功能
