# Firebase Google Analytics 設置完整指南

## ✅ 已完成的工作

所有 Firebase GA 埋點代碼已經完成並整合到專案中！

### 已創建的檔案

```
packages/twenty-front/src/modules/analytics/firebase/
├── config/
│   └── firebase.config.ts                     # Firebase 配置管理
├── services/
│   └── firebase-analytics.service.ts          # Analytics 初始化服務
├── hooks/
│   ├── useFirebaseAnalytics.ts                # Firebase Analytics Hook
│   └── usePageTracking.ts                     # 自動頁面追蹤
├── utils/
│   └── analytics.utils.ts                     # 事件追蹤工具函數
├── index.ts                                   # 統一導出
└── README.md                                  # 詳細文檔
```

### 已整合的功能

✅ **自動初始化** - 在 `App.tsx` 中自動初始化 Firebase  
✅ **頁面追蹤** - 在 `AppRouter.tsx` 中自動追蹤所有頁面瀏覽  
✅ **事件追蹤** - 提供豐富的工具函數追蹤用戶行為  
✅ **用戶屬性** - 支持設置用戶 ID 和自定義屬性  
✅ **錯誤處理** - 完善的錯誤處理和日誌記錄  

## 🚀 接下來的步驟

### 第一步：申請 Firebase 專案

1. **前往 Firebase Console**
   - 網址：https://console.firebase.google.com/
   - 使用 Google 帳號登入

2. **創建新專案**
   - 點擊「新增專案」
   - 輸入專案名稱（例如：twenty-crm-analytics）
   - 選擇是否啟用 Google Analytics（建議啟用）
   - 如果啟用 Analytics，選擇或創建 GA4 帳戶
   - 點擊「建立專案」

3. **添加網頁應用**
   - 在專案概覽頁面，點擊「網頁」圖示 (</>)
   - 輸入應用暱稱（例如：Twenty CRM Frontend）
   - ✅ 勾選「同時為這個應用程式設定 Firebase 代管」（可選）
   - 點擊「註冊應用程式」

4. **複製配置資訊**
   - 你會看到類似這樣的程式碼：
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890",
     measurementId: "G-XXXXXXXXXX"
   };
   ```
   - 複製這些值，等下會用到

### 第二步：配置環境變數

1. **在專案根目錄找到或創建 `.env` 文件**
   ```bash
   cd /Users/ym/twenty-ym/packages/twenty-front
   ```

2. **添加以下配置**（使用你從 Firebase 複製的實際值）：
   ```bash
   # Firebase Google Analytics 配置
   REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
   REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
   REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **確保 `.env` 在 `.gitignore` 中**
   ```bash
   # 檢查 .gitignore
   cat .gitignore | grep .env
   ```

### 第三步：啟動並測試

1. **啟動開發伺服器**
   ```bash
   cd /Users/ym/twenty-ym
   yarn nx start twenty-front
   ```

2. **檢查瀏覽器控制台**
   - 打開 Chrome DevTools (F12)
   - 查看 Console 標籤
   - 應該看到：
     ```
     [Firebase] Firebase App 已初始化
     [Firebase] Firebase Analytics 已初始化
     [GA] Event tracked: page_view
     ```

3. **查看 Firebase Console 即時數據**
   - 前往 Firebase Console > Analytics > 即時
   - 應該能看到你的即時訪問
   - 瀏覽不同頁面，觀察事件變化

### 第四步：驗證事件追蹤

1. **測試頁面瀏覽**
   - 在應用中切換不同頁面
   - 在控制台看到 `[GA] Event tracked: page_view`

2. **測試自定義事件**（選擇性）
   - 可以在任何組件中添加事件追蹤
   - 例如在按鈕點擊時：
   ```typescript
   import { trackButtonClick } from '@/analytics/firebase';
   
   const handleClick = () => {
     trackButtonClick('test_button', 'homepage');
     // 其他邏輯...
   };
   ```

## 📊 使用範例

### 1. 追蹤記錄創建

在創建記錄的組件中：
```typescript
import { trackEvent } from '@/analytics/firebase';

const handleCreateRecord = async (data) => {
  try {
    await createRecord(data);
    
    // 追蹤成功創建
    trackEvent('record_created', {
      record_type: 'contact',
      source: 'manual',
    });
  } catch (error) {
    // 追蹤錯誤
    trackError('Failed to create record', 'create_contact_form');
  }
};
```

### 2. 追蹤搜尋行為

在搜尋組件中：
```typescript
import { trackSearch } from '@/analytics/firebase';

const handleSearch = (searchTerm: string) => {
  trackSearch(searchTerm);
  // 執行搜尋邏輯...
};
```

### 3. 追蹤用戶登入

在登入邏輯中：
```typescript
import { setAnalyticsUserId, setAnalyticsUserProperties } from '@/analytics/firebase';

const handleLogin = (user) => {
  // 設置用戶 ID
  setAnalyticsUserId(user.id);
  
  // 設置用戶屬性
  setAnalyticsUserProperties({
    workspace: user.workspaceId,
    role: user.role,
    plan: user.subscriptionPlan,
  });
};
```

### 4. 追蹤功能使用

在功能組件中：
```typescript
import { trackEvent } from '@/analytics/firebase';

const handleExport = (format: string, count: number) => {
  trackEvent('data_exported', {
    format: format,
    record_count: count,
    export_source: 'contacts_list',
  });
  
  // 執行導出邏輯...
};
```

## 🔍 查看數據

### Firebase Console

1. **即時數據**
   - Firebase Console > Analytics > 即時
   - 查看當前活躍用戶和事件

2. **事件報表**
   - Firebase Console > Analytics > 事件
   - 查看各種事件的統計

3. **使用者報表**
   - Firebase Console > Analytics > 使用者
   - 查看用戶行為和屬性

### Google Analytics 4

如果你連接了 GA4：
1. 前往 Google Analytics (analytics.google.com)
2. 選擇對應的屬性
3. 在「報表」中查看詳細數據

## 🛠️ 故障排除

### 問題 1：控制台沒有顯示初始化訊息

**可能原因：**
- 環境變數未正確設置
- 環境變數格式錯誤

**解決方法：**
```bash
# 檢查環境變數是否載入
echo $REACT_APP_FIREBASE_API_KEY

# 重新啟動開發伺服器
yarn nx start twenty-front
```

### 問題 2：Firebase Console 沒有即時數據

**可能原因：**
- 需要等待 1-2 分鐘
- 瀏覽器阻擋了追蹤

**解決方法：**
- 等待幾分鐘再檢查
- 檢查瀏覽器是否安裝廣告攔截器
- 使用無痕模式測試

### 問題 3：部署後無法追蹤

**解決方法：**
- 確保生產環境的 `.env` 已設置 Firebase 配置
- 檢查 Firebase 專案的授權網域設定
  - Firebase Console > Authentication > Settings > Authorized domains
  - 添加你的生產網域

## 📝 開發建議

### 1. 環境分離

建議為開發和生產環境使用不同的 Firebase 專案：

```bash
# .env.development
REACT_APP_FIREBASE_PROJECT_ID=twenty-dev

# .env.production  
REACT_APP_FIREBASE_PROJECT_ID=twenty-prod
```

### 2. 事件命名規範

使用一致的命名規範：
- 使用 snake_case（例如：`button_clicked`）
- 使用動詞過去式（例如：`record_created`）
- 保持簡潔明確

### 3. 隱私考量

- ❌ 不要追蹤個人身份資訊（PII）
- ❌ 不要記錄密碼、信用卡號等敏感資訊
- ✅ 使用匿名的用戶 ID
- ✅ 遵守 GDPR、CCPA 等法規

## 📚 更多資源

- **詳細文檔**：`packages/twenty-front/src/modules/analytics/firebase/README.md`
- **Firebase 文檔**：https://firebase.google.com/docs/analytics
- **GA4 事件參考**：https://developers.google.com/analytics/devguides/collection/ga4/reference/events

## ✨ 完成！

所有代碼已經準備就緒！只需要：
1. ✅ 申請 Firebase 專案（你正在做）
2. ⏳ 配置環境變數
3. ⏳ 啟動測試

有任何問題隨時告訴我！🚀


