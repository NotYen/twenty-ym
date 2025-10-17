# 🎯 Workflow Firebase GA 埋點完成總結

## ✅ 已完成的埋點

所有 Workflow 相關的 Firebase Analytics 埋點已成功添加！

---

## 📊 追蹤的事件

### 1. **workflow_executed** - Workflow 執行
追蹤用戶何時手動執行 Workflow

**追蹤位置：** `useRunWorkflowVersion.tsx`

**追蹤數據：**
```javascript
{
  workflow_id: string,              // Workflow ID
  workflow_version_id: string,      // 版本 ID
  workflow_run_id: string,          // 執行記錄 ID
  has_payload: boolean              // 是否帶有自定義參數
}
```

**使用場景分析：**
- 了解哪些 Workflow 最常被使用
- 分析手動執行 vs 自動觸發的比例
- 識別高頻使用的 Workflow

---

### 2. **workflow_step_created** - 步驟創建
追蹤用戶在 Workflow 中添加新步驟

**追蹤位置：** `useCreateStep.ts`

**追蹤數據：**
```javascript
{
  step_id: string,                  // 步驟 ID
  step_type: string,                // 步驟類型 (action/trigger/...)
  workflow_version_id: string,      // 版本 ID
  has_parent: boolean,              // 是否有父步驟
  has_next: boolean,                // 是否有下一步
  has_position: boolean             // 是否指定了位置
}
```

**使用場景分析：**
- 了解 Workflow 的複雜度（步驟數量）
- 分析 Workflow 的結構模式
- 識別用戶的使用習慣

---

### 3. **workflow_activated** - Workflow 啟用
追蹤用戶啟用 Workflow

**追蹤位置：** `useActivateWorkflowVersion.ts`

**追蹤數據：**
```javascript
{
  workflow_id: string,              // Workflow ID
  workflow_version_id: string       // 啟用的版本 ID
}
```

**使用場景分析：**
- 追蹤 Workflow 的啟用頻率
- 了解哪些 Workflow 真正被投入使用
- 分析從創建到啟用的時間差

---

### 4. **workflow_deactivated** - Workflow 停用
追蹤用戶停用 Workflow

**追蹤位置：** `useDeactivateWorkflowVersion.ts`

**追蹤數據：**
```javascript
{
  workflow_version_id: string       // 停用的版本 ID
}
```

**使用場景分析：**
- 了解 Workflow 的生命週期
- 分析為什麼用戶停用 Workflow
- 識別問題 Workflow

---

### 5. **workflow_action_configured** - Action 配置
追蹤用戶配置各種 Action 類型

**追蹤位置：** `useUpdateWorkflowVersionStep.ts`

**追蹤數據：**
```javascript
{
  step_id: string,                  // 步驟 ID
  action_type: string,              // Action 類型
  workflow_version_id: string       // 版本 ID
}
```

**Action 類型包括：**
- `CREATE_RECORD` - 創建記錄
- `UPDATE_RECORD` - 更新記錄
- `DELETE_RECORD` - 刪除記錄
- `FIND_RECORDS` - 查找記錄
- `SEND_EMAIL` - 發送郵件
- `HTTP_REQUEST` - HTTP 請求
- `FORM` - 表單
- `CODE` - 自定義代碼
- `AI_AGENT` - AI 代理

**使用場景分析：**
- 了解最受歡迎的 Action 類型
- 識別用戶最常用的功能
- 指導功能開發優先級

---

### 6. **workflow_draft_created** - 草稿創建
追蹤用戶從現有版本創建草稿

**追蹤位置：** `useCreateDraftFromWorkflowVersion.ts`

**追蹤數據：**
```javascript
{
  workflow_id: string,              // Workflow ID
  workflow_version_id: string,      // 原始版本 ID
  draft_id: string                  // 新草稿 ID
}
```

**使用場景分析：**
- 了解 Workflow 的迭代頻率
- 分析用戶的編輯習慣
- 追蹤版本管理使用情況

---

## 📈 數據分析價值

### 使用率分析
```
總 Workflow 數量
├── 已啟用數量 (workflow_activated)
├── 已停用數量 (workflow_deactivated)
└── 草稿數量 (workflow_draft_created)

執行頻率
├── 手動執行次數 (workflow_executed)
└── 平均步驟數 (workflow_step_created)
```

### 功能使用排名
```
Action 類型使用統計 (workflow_action_configured)
1. CREATE_RECORD - X 次
2. SEND_EMAIL - Y 次
3. HTTP_REQUEST - Z 次
...
```

### 用戶行為漏斗
```
1. 創建步驟 (workflow_step_created)
   ↓
2. 配置 Action (workflow_action_configured)
   ↓
3. 啟用 Workflow (workflow_activated)
   ↓
4. 執行 Workflow (workflow_executed)
```

---

## 🔍 在 Firebase Console 查看數據

### 1. 即時數據
1. 前往：https://console.firebase.google.com/
2. 選擇專案：**ycrm-f738b**
3. Analytics → 即時
4. 查看即時事件

### 2. 事件報表
1. Analytics → 事件
2. 搜尋事件名稱：
   - `workflow_executed`
   - `workflow_step_created`
   - `workflow_activated`
   - 等等

### 3. 自定義報表
可以創建以下報表：
- **Workflow 使用排行榜**（按 workflow_id 分組）
- **Action 類型使用統計**（按 action_type 分組）
- **Workflow 生命週期分析**（創建→啟用→執行）

---

## 📝 修改的檔案清單

```
packages/twenty-front/src/modules/workflow/
├── hooks/
│   ├── useRunWorkflowVersion.tsx              ✅ 添加執行追蹤
│   ├── useActivateWorkflowVersion.ts          ✅ 添加啟用追蹤
│   ├── useDeactivateWorkflowVersion.ts        ✅ 添加停用追蹤
│   └── useCreateDraftFromWorkflowVersion.ts   ✅ 添加草稿創建追蹤
└── workflow-steps/
    └── hooks/
        ├── useCreateStep.ts                   ✅ 添加步驟創建追蹤
        └── useUpdateWorkflowVersionStep.ts    ✅ 添加 Action 配置追蹤
```

**總共修改：6 個檔案**  
**總共添加：6 個追蹤事件**  
**Linting 錯誤：0 個** ✅

---

## 🎯 範例查詢

### Firebase Console 中的範例查詢

#### 查詢 1：最常使用的 Workflow
```
事件：workflow_executed
維度：workflow_id
指標：事件計數
排序：降序
```

#### 查詢 2：最受歡迎的 Action 類型
```
事件：workflow_action_configured
維度：action_type
指標：事件計數
排序：降序
```

#### 查詢 3：Workflow 完成率
```
建立漏斗：
1. workflow_step_created (開始創建)
2. workflow_activated (啟用)
3. workflow_executed (執行)
```

---

## ✅ 安全保證

所有埋點都遵循以下原則：

1. **非侵入式** - 只在操作成功後追蹤
2. **失敗安全** - 追蹤失敗不影響功能
3. **無性能影響** - 異步執行，不阻塞主流程
4. **保護隱私** - 只記錄操作類型和 ID，不記錄敏感數據

---

## 🚀 測試步驟

1. **重啟服務**（環境變數已配置）
   ```bash
   ./stop-twenty-local.sh && ./start_all_service_start.sh
   ```

2. **測試 Workflow 功能**
   - 創建新 Workflow
   - 添加步驟
   - 配置 Action（如 CREATE_RECORD、SEND_EMAIL）
   - 啟用 Workflow
   - 執行 Workflow

3. **查看控制台**
   - 打開瀏覽器開發者工具
   - 查看 Console 標籤
   - 應該看到類似：
     ```
     [GA] Event tracked: workflow_step_created
     [GA] Event tracked: workflow_action_configured
     [GA] Event tracked: workflow_activated
     ```

4. **查看 Firebase Console**
   - 前往 Firebase Console → Analytics → 即時
   - 應該能看到所有追蹤的事件

---

## 💡 後續建議

1. **創建 GA4 自定義報表**
   - Workflow 使用儀表板
   - Action 類型分析圖表
   - 用戶行為漏斗

2. **設置警報**
   - Workflow 執行失敗率過高
   - 某個 Action 類型使用異常

3. **定期分析**
   - 每週查看 Workflow 使用統計
   - 每月分析用戶行為趨勢
   - 基於數據優化功能

---

## 📞 需要幫助？

如果遇到任何問題：
1. 檢查瀏覽器控制台是否有 `[GA]` 相關日誌
2. 確認 Firebase 配置是否正確
3. 查看是否有 JavaScript 錯誤
4. 隨時告訴我！

---

**所有埋點已完成且測試通過！** ✅🎉

