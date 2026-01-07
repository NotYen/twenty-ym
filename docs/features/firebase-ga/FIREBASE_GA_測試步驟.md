# 🎯 Firebase GA 測試步驟

## ✅ 環境變數已配置完成！

你的 Firebase 配置已經成功添加到 `.env` 文件：

```
專案 ID: ycrm-f738b
Measurement ID: G-4PN0FL50YE
```

---

## 🚀 立即測試

### 步驟 1: 啟動開發伺服器

```bash
cd /Users/ym/twenty-ym
yarn nx start twenty-front
```

### 步驟 2: 打開瀏覽器

訪問：http://118.168.188.27.nip.io:8866

### 步驟 3: 打開開發者工具

按 `F12` 或右鍵 → 檢查 → Console 標籤

### 步驟 4: 查看初始化日誌

你應該會看到：
```
✅ [Firebase] Firebase App 已初始化
✅ [Firebase] Firebase Analytics 已初始化
✅ [GA] Event tracked: page_view
```

### 步驟 5: 測試頁面追蹤

1. 在應用中切換不同頁面
2. 每次切換應該看到：
   ```
   [GA] Event tracked: page_view
   ```

---

## 📊 查看即時數據

### 方法 1: Firebase Console

1. 訪問：https://console.firebase.google.com/
2. 選擇專案：**ycrm-f738b**
3. 左側邊欄 → **Analytics** → **即時**
4. 應該能看到你的即時訪問！

### 方法 2: Google Analytics

1. 訪問：https://analytics.google.com/
2. 找到對應的屬性（GA4）
3. 即時報表

---

## 🧪 測試自定義事件（選擇性）

你可以在任何組件中測試事件追蹤：

### 在瀏覽器 Console 手動測試

打開瀏覽器 Console，輸入：

```javascript
// 測試按鈕點擊追蹤
window.trackButtonClick?.('test_button', 'console_test');

// 測試自定義事件
window.trackEvent?.('test_event', { 
  source: 'manual_test',
  timestamp: new Date().toISOString()
});
```

> 注意：如果 window 上沒有這些函數，可以先忽略此步驟

---

## ❌ 如果沒有看到初始化日誌

### 排查步驟：

1. **確認環境變數已載入**
   ```bash
   # 重新啟動開發伺服器
   # 先停止當前的 (Ctrl+C)
   yarn nx start twenty-front
   ```

2. **檢查瀏覽器控制台是否有錯誤**
   - 紅色錯誤訊息？
   - Firebase 相關錯誤？

3. **確認瀏覽器支援**
   - 使用 Chrome、Firefox、Edge 等現代瀏覽器
   - 關閉廣告攔截器
   - 嘗試無痕模式

4. **清除快取**
   ```bash
   # 停止伺服器
   # 清除 node_modules/.vite
   rm -rf /Users/ym/twenty-ym/node_modules/.vite
   # 重新啟動
   yarn nx start twenty-front
   ```

---

## ✨ 成功指標

當你看到以下內容，代表設置成功：

✅ **瀏覽器控制台**
```
[Firebase] Firebase App 已初始化
[Firebase] Firebase Analytics 已初始化
[GA] Event tracked: page_view
```

✅ **Firebase Console → Analytics → 即時**
- 看到「1 位使用者活躍」
- 看到 page_view 事件
- 看到你訪問的頁面路徑

✅ **沒有錯誤訊息**
- 控制台沒有紅色錯誤
- Firebase 正常運作

---

## 🎯 下一步

成功後，你可以：

1. **添加更多追蹤**
   - 在按鈕點擊時使用 `trackButtonClick()`
   - 在記錄創建時使用 `trackEvent('record_created')`
   - 在搜尋時使用 `trackSearch()`

2. **查看詳細文檔**
   - `packages/twenty-front/src/modules/analytics/firebase/README.md`
   - `packages/twenty-front/src/modules/analytics/firebase/QUICK_START.md`

3. **查看使用範例**
   - `packages/twenty-front/src/modules/analytics/firebase/examples/ComponentExample.tsx`

---

## 📞 需要幫助？

如果遇到任何問題：
1. 檢查瀏覽器控制台的錯誤訊息
2. 查看 Firebase Console 的專案設定
3. 確認環境變數格式正確
4. 隨時告訴我！

---

祝你測試順利！🚀
