# Google OAuth 配置指南

## 📋 步驟 1: 在 Google Cloud Console 創建項目和憑證

### 1.1 創建或選擇項目

1. 訪問 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊頂部項目選擇器
3. 點擊 "**新建項目**" 或選擇現有項目
4. 輸入項目名稱（例如：`Twenty CRM Integration`）
5. 點擊 "**創建**"

---

### 1.2 啟用必要的 API

在項目中啟用以下 API：

#### 🔹 Gmail API
1. 訪問 [Gmail API 庫](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
2. 點擊 "**啟用**"

#### 🔹 Google Calendar API
1. 訪問 [Google Calendar API 庫](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)
2. 點擊 "**啟用**"

#### 🔹 People API
1. 訪問 [People API 庫](https://console.cloud.google.com/apis/library/people.googleapis.com)
2. 點擊 "**啟用**"

---

### 1.3 配置 OAuth 同意屏幕

1. 訪問 [OAuth 同意屏幕](https://console.cloud.google.com/apis/credentials/consent)
2. 選擇 "**外部**"（如果您的應用是公開的）
3. 填寫應用信息：
   - **應用名稱**: `Twenty CRM`（或您的自定義名稱）
   - **用戶支持電子郵件**: 選擇您的 Gmail 地址
   - **應用程序主頁鏈接**: `http://118.168.188.27.nip.io:8866`（根據您的實際地址）
   - **應用程序隱私政策鏈接**: `http://118.168.188.27.nip.io:8866`（可選）
   - **應用程序服務條款鏈接**: `http://118.168.188.27.nip.io:8866`（可選）
   - **授權的網域**: `nip.io`（或您的實際網域）
4. 點擊 "**保存並繼續**"
5. 在 "**範圍**" 頁面，點擊 "**添加或刪除範圍**"，然後點擊 "**保存並繼續**"
6. 在 "**測試用戶**" 頁面（如果您的應用處於測試模式）：
   - 點擊 "**添加用戶**"
   - 輸入您的 Gmail 地址（例如：`notyenyu@gmail.com`）
   - 點擊 "**添加**"
7. 點擊 "**保存並繼續**" 完成配置

---

### 1.4 創建 OAuth 2.0 客戶端 ID

1. 訪問 [憑證頁面](https://console.cloud.google.com/apis/credentials)
2. 點擊頂部 "**創建憑證**" → "**OAuth 客戶端 ID**"
3. 如果提示配置 OAuth 同意屏幕，先完成步驟 1.3
4. 選擇應用程序類型：**Web 應用程序**
5. 輸入名稱：`Twenty CRM OAuth Client`
6. **授權的重定向 URI**（非常重要！）：
   ```
   http://118.168.188.27.nip.io:8867/auth/google/redirect
   http://118.168.188.27.nip.io:8867/auth/google-apis/get-access-token
   ```
   ⚠️ **注意**：
   - 第一個 URI 用於 Google SSO 登入（可選）
   - 第二個 URI 用於 Gmail 和 Calendar 整合（必需）
   - 請根據您的實際 `EXTERNAL_HOST` 和 `BACKEND_PORT` 修改
7. 點擊 "**創建**"
8. **重要**：複製並保存以下信息：
   - **客戶端 ID**（例如：`123456789-abcdefghijklmnop.apps.googleusercontent.com`）
   - **客戶端密鑰**（例如：`GOCSPX-abcdefghijklmnopqrstuvwxyz`）
   ⚠️ **客戶端密鑰只顯示一次，請務必保存！**

---

## 📋 步驟 2: 配置 Twenty CRM

### 2.1 更新 twenty-config.sh

在 `twenty-config.sh` 文件中添加以下配置：

```bash
# ==========================================
# Google OAuth 配置（Gmail 和 Calendar 整合）
# ==========================================
# 啟用 Gmail 整合
export MESSAGING_PROVIDER_GMAIL_ENABLED="true"

# 啟用 Google Calendar 整合
export CALENDAR_PROVIDER_GOOGLE_ENABLED="true"

# Google OAuth 憑證（從 Google Cloud Console 獲取）
export AUTH_GOOGLE_CLIENT_ID="您的_CLIENT_ID"
export AUTH_GOOGLE_CLIENT_SECRET="您的_CLIENT_SECRET"

# Google OAuth 回調 URL（根據您的實際地址修改）
export AUTH_GOOGLE_CALLBACK_URL="http://118.168.188.27.nip.io:8867/auth/google/redirect"
export AUTH_GOOGLE_APIS_CALLBACK_URL="http://118.168.188.27.nip.io:8867/auth/google-apis/get-access-token"

# 可選：啟用 Google SSO 登入（如果需要）
# export AUTH_GOOGLE_ENABLED="true"
```

---

### 2.2 驗證配置

運行以下命令檢查配置是否正確：

```bash
source twenty-config.sh --show
```

---

## 📋 步驟 3: 重新啟動服務

### 3.1 停止當前服務

```bash
pkill -f "twenty-server"
pkill -f "twenty-front"
```

### 3.2 重新啟動服務

```bash
source twenty-config.sh
./build_all_services_prod_env.sh
```

---

## 📋 步驟 4: 測試連接

### 4.1 在前端測試

1. 登入 Twenty CRM
2. 前往 **設定** → **帳號**
3. 點擊 "**Connect with Google**"
4. 選擇您的 Google 帳號
5. 授權所需的權限（Gmail、Calendar）
6. 確認連接成功

### 4.2 驗證功能

- ✅ **Gmail**: 在 Twenty 中查看 Gmail 郵件
- ✅ **Google Calendar**: 在 Twenty 中查看和管理日曆事件

---

## 🔧 故障排除

### 問題 1: "redirect_uri_mismatch" 錯誤

**原因**: 回調 URL 不匹配

**解決方案**:
1. 檢查 Google Cloud Console 中的 "授權的重定向 URI" 是否與 `twenty-config.sh` 中的配置一致
2. 確保 URI 完全匹配（包括協議、域名、端口、路徑）

---

### 問題 2: "access_denied" 錯誤

**原因**: 應用處於測試模式，用戶未添加到測試用戶列表

**解決方案**:
1. 前往 [OAuth 同意屏幕](https://console.cloud.google.com/apis/credentials/consent)
2. 在 "**測試用戶**" 部分添加您的 Gmail 地址
3. 重新嘗試連接

---

### 問題 3: 前端顯示 "Connect with Google" 按鈕，但點擊無反應

**原因**: 後端配置未正確加載

**解決方案**:
1. 檢查後端日誌確認環境變量是否正確加載
2. 確認 `MESSAGING_PROVIDER_GMAIL_ENABLED` 或 `CALENDAR_PROVIDER_GOOGLE_ENABLED` 為 `true`
3. 重啟後端服務

---

## 📝 注意事項

1. **生產環境**：如果您的應用需要公開使用，需要提交 OAuth 同意屏幕進行驗證
2. **安全性**：不要將 `AUTH_GOOGLE_CLIENT_SECRET` 提交到 Git 倉庫
3. **網域變更**：如果更改 `EXTERNAL_HOST`，需要同步更新 Google Cloud Console 中的重定向 URI
4. **測試模式限制**：測試模式下，最多只能添加 100 個測試用戶

---

## ✅ 完成檢查清單

- [ ] 在 Google Cloud Console 創建項目
- [ ] 啟用 Gmail API、Calendar API、People API
- [ ] 配置 OAuth 同意屏幕
- [ ] 創建 OAuth 2.0 客戶端 ID
- [ ] 添加重定向 URI
- [ ] 複製並保存 Client ID 和 Client Secret
- [ ] 更新 `twenty-config.sh` 配置
- [ ] 重新啟動服務
- [ ] 在前端測試連接
- [ ] 驗證 Gmail 和 Calendar 功能

---

**配置完成後，您就可以在 Twenty CRM 中使用 Gmail 和 Google Calendar 了！** 🎉


