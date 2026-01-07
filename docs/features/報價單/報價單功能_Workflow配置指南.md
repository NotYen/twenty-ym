# 報價單功能 - Workflow 自動化配置指南

本指南將教您如何在 Twenty CRM 中配置 Workflow 來實現報價單的自動化功能。

---

## 📋 Workflow 概述

我們將創建 3 個 Workflow：

1. **自動計算報價單總額** - 當報價項目變更時，自動重新計算報價單的小計、稅金和總計
2. **自動更新過期狀態** - 當報價單過期時，自動將狀態更新為 EXPIRED
3. **發送通知郵件** - 當報價單狀態變為 SENT 時，發送郵件通知

---

## 🔧 Workflow 1: 自動計算報價單總額

### **目的**
當 QuoteLineItem 被創建、更新或刪除時，自動重新計算對應 Quote 的小計、稅金和總計。

### **配置步驟**

#### 1. 創建 Workflow

```
Settings → Workflows → + New Workflow
名稱：Auto Calculate Quote Totals
描述：自動計算報價單總額
狀態：Active
```

#### 2. 配置觸發器 (Trigger)

```yaml
觸發類型：Database Event Trigger
對象：Quote Line Item (quoteLineItem)
事件：Record Created, Record Updated, Record Deleted
條件：所有記錄
```

#### 3. 添加查詢步驟 (Step 1: Find Records)

```yaml
步驟名稱：Find All Line Items
動作類型：Find Records
對象：Quote Line Item (quoteLineItem)
條件：
  - quoteId equals {{trigger.record.quoteId}}
輸出變量名：lineItems
```

#### 4. 添加代碼步驟 (Step 2: Calculate Totals)

```yaml
步驟名稱：Calculate Quote Totals
動作類型：Code
輸入變量：
  - lineItems: {{steps.findAllLineItems.records}}
  - taxRate: {{trigger.record.quote.taxRate}}

代碼：
```

```javascript
// 計算小計
const subtotalMicros = lineItems.reduce((sum, item) => {
  return sum + (item.amount?.amountMicros || 0);
}, 0);

// 計算稅金
const taxRate = {{trigger.record.quote.taxRate}} || 0;
const taxAmountMicros = Math.round((subtotalMicros * taxRate) / 100);

// 計算總計
const totalMicros = subtotalMicros + taxAmountMicros;

// 輸出結果
return {
  subtotal: { amountMicros: subtotalMicros },
  taxAmount: { amountMicros: taxAmountMicros },
  total: { amountMicros: totalMicros }
};
```

```yaml
輸出變量名：calculatedAmounts
```

#### 5. 添加更新步驟 (Step 3: Update Quote)

```yaml
步驟名稱：Update Quote Record
動作類型：Update Record
對象：Quote (quote)
記錄 ID：{{trigger.record.quoteId}}
更新字段：
  - subtotal: {{steps.calculateTotals.subtotal}}
  - taxAmount: {{steps.calculateTotals.taxAmount}}
  - total: {{steps.calculateTotals.total}}
```

#### 6. 保存並激活

```
點擊「Save」保存 Workflow
點擊「Activate」激活 Workflow
```

---

## ⏰ Workflow 2: 自動更新過期狀態

### **目的**
每天檢查報價單的有效期限，如果已過期且狀態不是 EXPIRED，則自動更新狀態為 EXPIRED。

### **配置步驟**

#### 1. 創建 Workflow

```
Settings → Workflows → + New Workflow
名稱：Auto Expire Quotes
描述：自動更新過期報價單狀態
狀態：Active
```

#### 2. 配置觸發器 (Trigger)

```yaml
觸發類型：Schedule Trigger
頻率：Daily
時間：00:00 (午夜)
時區：Asia/Taipei
```

#### 3. 添加查詢步驟 (Step 1: Find Expired Quotes)

```yaml
步驟名稱：Find Expired Quotes
動作類型：Find Records
對象：Quote (quote)
條件：
  - validUntil is before {{now}}
  - status not equals EXPIRED
輸出變量名：expiredQuotes
```

#### 4. 添加循環步驟 (Step 2: Loop Through Quotes)

```yaml
步驟名稱：Process Each Quote
動作類型：For Each Loop
輸入數組：{{steps.findExpiredQuotes.records}}
循環變量名：quote
```

#### 5. 在循環內添加更新步驟 (Loop Step 1: Update Status)

```yaml
步驟名稱：Update to Expired
動作類型：Update Record
對象：Quote (quote)
記錄 ID：{{loop.quote.id}}
更新字段：
  - status: EXPIRED
```

#### 6. 保存並激活

```
點擊「Save」保存 Workflow
點擊「Activate」激活 Workflow
```

---

## 📧 Workflow 3: 發送報價單郵件通知

### **目的**
當報價單狀態變更為 SENT 時，自動發送郵件通知給相關人員。

### **配置步驟**

#### 1. 創建 Workflow

```
Settings → Workflows → + New Workflow
名稱：Send Quote Notification Email
描述：報價單發送時通知相關人員
狀態：Active
```

#### 2. 配置觸發器 (Trigger)

```yaml
觸發類型：Database Event Trigger
對象：Quote (quote)
事件：Record Updated
條件：
  - status changed to SENT
```

#### 3. 添加條件檢查 (Step 1: Check Email Exists)

```yaml
步驟名稱：Check Contact Email
動作類型：Condition
條件：
  - {{trigger.record.contact.email}} is not empty
如果為真：繼續下一步
如果為假：結束 Workflow
```

#### 4. 添加郵件發送步驟 (Step 2: Send Email)

```yaml
步驟名稱：Send Quote Email
動作類型：Send Email
收件人：{{trigger.record.contact.email}}
主題：報價單 {{trigger.record.quoteNumber}} 已準備就緒
郵件內容（HTML）：
```

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2d3748;">您好，{{trigger.record.contact.name.firstName}}</h2>
  
  <p>感謝您的詢問。我們已準備好您的報價單。</p>
  
  <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">報價單資訊</h3>
    <p><strong>報價單編號：</strong>{{trigger.record.quoteNumber}}</p>
    <p><strong>標題：</strong>{{trigger.record.title}}</p>
    <p><strong>總金額：</strong>${{trigger.record.total.amountMicros / 1000000}}</p>
    <p><strong>有效期限：</strong>{{trigger.record.validUntil}}</p>
  </div>
  
  <p>如有任何問題，請隨時與我們聯繫。</p>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
  
  <p style="color: #718096; font-size: 12px;">
    此郵件由系統自動發送，請勿直接回覆。
  </p>
</div>
```

```yaml
抄送（可選）：內部銷售團隊郵箱
```

#### 5. 添加記錄通知步驟 (Step 3: Log Notification)

```yaml
步驟名稱：Create Activity Log
動作類型：Create Record
對象：Note (note) 或 Activity (activity)
字段：
  - title: Quote Sent Notification
  - body: Email sent to {{trigger.record.contact.email}}
  - relatedTo: {{trigger.record.id}}
  - createdAt: {{now}}
```

#### 6. 保存並激活

```
點擊「Save」保存 Workflow
點擊「Activate」激活 Workflow
```

---

## 🧪 測試 Workflow

### **測試 Workflow 1: 自動計算**

1. 創建一個新的 Quote
2. 添加幾個 QuoteLineItem
3. 檢查 Quote 的 subtotal、taxAmount 和 total 是否自動更新
4. 修改某個 LineItem 的數量或單價
5. 再次檢查 Quote 的金額是否正確更新

### **測試 Workflow 2: 自動過期**

1. 創建一個 Quote，設置 validUntil 為過去的日期
2. 等待 Workflow 執行（或手動觸發）
3. 檢查 Quote 的 status 是否變為 EXPIRED

### **測試 Workflow 3: 郵件通知**

1. 創建一個 Quote，確保有關聯的 Contact 且 Contact 有 email
2. 將 Quote 的 status 更新為 SENT
3. 檢查是否收到郵件通知
4. 確認郵件內容是否正確

---

## 📊 Workflow 執行監控

### **查看執行歷史**

```
Settings → Workflows → 選擇 Workflow → Runs 標籤
```

在這裡您可以看到：
- 執行時間
- 執行狀態（成功/失敗）
- 執行詳情
- 錯誤日誌（如果有）

### **常見問題排查**

**Workflow 沒有執行：**
- 檢查 Workflow 是否已激活（Active）
- 檢查觸發條件是否正確
- 查看執行日誌是否有錯誤

**計算結果不正確：**
- 檢查代碼步驟的輸入變量是否正確
- 檢查計算邏輯是否有誤
- 查看執行日誌的中間結果

**郵件沒有發送：**
- 檢查郵件服務是否已配置
- 檢查收件人郵箱是否有效
- 查看執行日誌是否有錯誤

---

## 🔍 進階配置

### **優化 Workflow 性能**

1. **批量處理**：對於大量記錄，使用批量更新而不是循環更新
2. **條件過濾**：在觸發器中添加更精確的條件，減少不必要的執行
3. **異步執行**：對於非緊急任務，使用異步模式

### **錯誤處理**

```yaml
在每個步驟中添加錯誤處理：
錯誤行為：Continue (繼續執行)
錯誤輸出：記錄到日誌
```

### **通知設置**

```yaml
Workflow 設置：
失敗時通知：管理員郵箱
通知頻率：立即通知
```

---

## 📝 Workflow 維護建議

1. **定期檢查**：每月檢查 Workflow 執行情況
2. **性能監控**：關注執行時間，優化慢速 Workflow
3. **日誌管理**：定期清理舊的執行日誌
4. **版本控制**：修改 Workflow 前先複製一個備份版本
5. **文檔更新**：記錄每次修改的原因和日期

---

## 🎯 下一步

完成 Workflow 配置後，您可以：

1. **擴展功能**：添加更多自動化流程（如自動審批、提醒等）
2. **整合系統**：連接其他系統（如 Slack、Teams 等）
3. **報表分析**：創建報價單分析 Dashboard
4. **模板系統**：創建報價單模板快速生成報價

---

**祝您使用順利！如有問題歡迎隨時詢問。** 🎉

