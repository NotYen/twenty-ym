# 報價單功能 - UI 創建步驟（使用 salesQuote 名稱）

## ⚡ 快速創建指南

⚠️ **重要說明**：由於之前的 `quote` 對象有殘留數據，我們改用 `salesQuote` 作為對象名稱。代碼已經同步修改完成。

---

## 步驟 1：創建 SalesQuote（報價單）對象

**進入對象管理：**
Settings → Objects → + New Object

**基本信息：**
```
單數 (Singular): salesQuote
複數形 (Plural): salesQuotes
描述: 管理客戶報價單和提案
圖標: IconFileInvoice 或 IconFileText
```

⚠️ **確認 API Name**：
- API Name (Singular): `salesQuote` （駝峰式，首字母小寫）
- API Name (Plural): `salesQuotes`

點擊「Create」創建對象。

---

## 步驟 2：添加 SalesQuote 的 14 個字段

創建完成後,點擊「+ Add Field」添加以下字段：

### 📋 快速參考表

| # | Field Name | Type | Unique | Default | 說明 |
|---|-----------|------|--------|---------|------|
| 1 | quoteNumber | Text | ✅ | - | 唯一編號 |
| 2 | title | Text | ❌ | - | 標題 |
| 3 | issueDate | Date | ❌ | ⚠️留空 | 開立日期 |
| 4 | validUntil | Date | ❌ | ⚠️留空 | 有效期限 |
| 5 | company | Relation | ❌ | - | Belongs to one → Company |
| 6 | contact | Relation | ❌ | - | Belongs to one → Person |
| 7 | opportunity | Relation | ❌ | - | Belongs to one → Opportunity |
| 8 | subtotal | Currency | ❌ | 0 | 小計 |
| 9 | taxRate | Number | ❌ | 5 | 稅率(%) |
| 10 | taxAmount | Currency | ❌ | 0 | 稅金 |
| 11 | total | Currency | ❌ | 0 | 總計 |
| 12 | status | Select | ❌ | DRAFT | 5個選項 |
| 13 | terms | Text | ❌ | - | 條款說明 |
| 14 | notes | Text | ❌ | - | 備註 |

### ⚠️ 重要說明

**關於 Twenty CRM 的界面用語：**
- **Label**：在 Twenty CRM 中，Field Name 就是顯示的標籤
- **Required**：可能需要在字段創建後進入編輯模式設置
- **關聯類型用語**：
  - `Belongs to one` = `Many to One`（多對一）
  - `Has many` = `One to Many`（一對多）

**關於 Date 字段：**
- ⚠️ 創建 Date 類型字段時，**不要設置 Default value**，留空即可
- 如設置 "Today" 可能會出現 "Invalid time value" 錯誤

**關於 Field on（關聯字段專用）：**
- **Field on** 表示「這個字段要創建在哪個對象上」
- 創建 SalesQuote 的關聯字段時，**Field on 選擇 `SalesQuote`**
- 創建 SalesQuoteLineItem 的關聯字段時，**Field on 選擇 `SalesQuoteLineItem`**
- 簡單記憶：**Field on 選擇當前正在編輯的對象**

### 2.1 基本信息字段

**字段 1：報價單編號**
```
類型: Text
Field name: quoteNumber
Label: 報價單編號
Description: 唯一識別編號，例如：Q-2025-001
Icon: IconHash
Required: ✅ 勾選
```

**字段 2：報價單標題**
```
類型: Text
Field name: title
Label: 標題
Description: 報價單主題或專案名稱
Icon: IconFileText
Required: ✅ 勾選
```

### 2.2 日期字段

**字段 3：開立日期**
```
類型: Date
Field name: issueDate
Label: 開立日期
Icon: IconCalendar
Required: ✅ 勾選（需在創建後編輯設置）
Default value: ⚠️ 不要設置！留空！
```

**字段 4：有效期限**
```
類型: Date
Field name: validUntil
Label: 有效期限
Icon: IconCalendarEvent
Required: ✅ 勾選（需在創建後編輯設置）
Default value: ⚠️ 不要設置！留空！
```

### 2.3 關聯字段

⚠️ **重要**：關聯字段的配置說明
- **關係類型 (Relationship Type)**：選擇 `Belongs to one`（這就是 Many to One）
- **對象目標 (Object Target)**：選擇要關聯的對象
- **Field on**：選擇 `SalesQuote`（表示字段創建在 SalesQuote 對象上）

**字段 5：客戶公司**
```
類型: Relation
Field name: company
Label: 客戶公司
Icon: IconBuildingSkyscraper
關係類型 (Relationship Type): Belongs to one
對象目標 (Object Target): Company (公司)
Field on: SalesQuote
Description: 客戶公司
Required: ✅ 勾選（需在創建後編輯設置）
```

**字段 6：聯絡人**
```
類型: Relation
Field name: contact
Label: 聯絡人
Icon: IconUser
關係類型 (Relationship Type): Belongs to one
對象目標 (Object Target): Person (人員)
Field on: SalesQuote
Description: 聯絡人
Required: ❌ 不勾選
```

**字段 7：關聯商機**
```
類型: Relation
Field name: opportunity
Label: 關聯商機
Icon: IconTargetArrow
關係類型 (Relationship Type): Belongs to one
對象目標 (Object Target): Opportunity (商機)
Field on: SalesQuote
Description: 關聯的銷售商機
Required: ❌ 不勾選
```

### 2.4 金額字段

**字段 8：小計**
```
類型: Currency
Field name: subtotal
Label: 小計
Icon: IconCurrencyDollar
Required: ✅ 勾選
Default currency: USD 或 TWD
Default value: 0
```

**字段 9：稅率**
```
類型: Number
Field name: taxRate
Label: 稅率(%)
Icon: IconPercentage
Required: ❌ 不勾選
Default value: 5
```

**字段 10：稅金**
```
類型: Currency
Field name: taxAmount
Label: 稅金
Icon: IconCurrencyDollar
Required: ❌ 不勾選
Default value: 0
```

**字段 11：總計**
```
類型: Currency
Field name: total
Label: 總計
Icon: IconCurrencyDollar
Required: ✅ 勾選
Default value: 0
```

### 2.5 狀態和備註字段

**字段 12：狀態**
```
類型: Select
Field name: status
Label: 狀態
Icon: IconProgressCheck
Required: ✅ 勾選

選項配置：
1. Value: DRAFT    | Label: 草稿      | Color: 灰色
2. Value: SENT     | Label: 已發送    | Color: 藍色
3. Value: ACCEPTED | Label: 已接受    | Color: 綠色
4. Value: REJECTED | Label: 已拒絕    | Color: 紅色
5. Value: EXPIRED  | Label: 已過期    | Color: 橙色

Default value: DRAFT
```

**字段 13：條款說明**
```
類型: Text
Field name: terms
Label: 條款說明
Icon: IconFileText
Required: ❌ 不勾選
```

**字段 14：備註**
```
類型: Text
Field name: notes
Label: 備註
Icon: IconNotes
Required: ❌ 不勾選
```

---

## 步驟 3：創建 SalesQuoteLineItem（報價項目）對象

**進入對象管理：**
Settings → Objects → + New Object

**基本信息：**
```
單數 (Singular): salesQuoteLineItem
複數形 (Plural): salesQuoteLineItems
描述: 報價單的明細項目
圖標: IconList 或 IconListDetails
```

⚠️ **確認 API Name**：
- API Name (Singular): `salesQuoteLineItem` （駝峰式）
- API Name (Plural): `salesQuoteLineItems`

點擊「Create」創建對象。

---

## 步驟 4：添加 SalesQuoteLineItem 的 7 個字段

⚠️ **重要**：關聯字段的配置說明
- **關係類型 (Relationship Type)**：選擇 `Belongs to one`（這就是 Many to One）
- **對象目標 (Object Target)**：選擇 `SalesQuote`
- **Field on**：選擇 `SalesQuoteLineItem`（表示字段創建在 SalesQuoteLineItem 對象上）

**字段 1：所屬報價單（關聯）**
```
類型: Relation
Field name: salesQuote
Label: 所屬報價單
Icon: IconFileInvoice
關係類型 (Relationship Type): Belongs to one
對象目標 (Object Target): SalesQuote (報價單)
Field on: SalesQuoteLineItem
Description: 所屬的報價單
Required: ✅ 勾選（需在創建後編輯設置）
```

**字段 2：產品名稱**
```
類型: Text
Field name: productName
Label: 產品名稱
Icon: IconBox
Required: ✅ 勾選
```

**字段 3：描述**
```
類型: Text
Field name: description
Label: 描述
Icon: IconFileText
Required: ❌ 不勾選
```

**字段 4：數量**
```
類型: Number
Field name: quantity
Label: 數量
Icon: IconNumbers
Required: ✅ 勾選
Default value: 1
```

**字段 5：單價**
```
類型: Currency
Field name: unitPrice
Label: 單價
Icon: IconCurrencyDollar
Required: ✅ 勾選
Default value: 0
```

**字段 6：折扣**
```
類型: Number
Field name: discount
Label: 折扣(%)
Icon: IconPercentage
Required: ❌ 不勾選
Default value: 0
```

**字段 7：金額**
```
類型: Currency
Field name: amount
Label: 金額
Icon: IconCurrencyDollar
Required: ✅ 勾選
Default value: 0
```

---

## ✅ 創建完成檢查

創建完成後，請確認：

- [ ] SalesQuote 對象已創建，API Name 是 `salesQuote`
- [ ] SalesQuote 有 14 個自定義字段
- [ ] SalesQuoteLineItem 對象已創建，API Name 是 `salesQuoteLineItem`
- [ ] SalesQuoteLineItem 有 7 個自定義字段
- [ ] SalesQuote 對象中自動生成了 `lineItems` 反向關聯字段

---

## 📝 重要提醒

1. **對象名稱已改變**：
   - 原計劃：`quote` / `quoteLineItem`
   - 實際使用：`salesQuote` / `salesQuoteLineItem`
   - 代碼已同步修改，無需擔心

2. **字段名稱保持不變**：
   - 所有字段名稱（quoteNumber, productName 等）保持不變
   - 只是對象名稱改變了

3. **關聯字段自動生成**：
   - 創建 SalesQuoteLineItem.salesQuote 關聯後
   - SalesQuote 會自動有 `lineItems` 反向關聯字段

---

## 🚀 下一步

完成對象創建後：

1. **編譯前端代碼**
   ```bash
   cd /Users/ym/twenty-ym
   npx nx build twenty-front
   ```

2. **測試功能**
   - 刷新瀏覽器（Ctrl+Shift+R）
   - 左側菜單會出現「Sales Quotes」
   - 創建測試報價單
   - 測試 PDF 導出功能

---

**有任何問題請隨時詢問！** 🎉

