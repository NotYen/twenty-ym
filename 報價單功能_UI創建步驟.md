# 報價單功能 - UI 創建步驟

## ⚡ 快速創建指南

### 步驟 1：創建 Quote（報價單）對象

**進入對象管理：**
Settings → Objects → + New Object

**基本信息：**
- Label (Singular): `Quote`
- Label (Plural): `Quotes`
- API Name (Singular): `quote` ⚠️ **必須是小寫 quote**
- API Name (Plural): `quotes`
- Icon: `IconFileInvoice`
- Description: `管理客戶報價單和提案`

**添加以下 14 個字段：**

| # | Field Name | Type | Label | Required | 配置說明 |
|---|-----------|------|-------|---------|---------|
| 1 | quoteNumber | Text | 報價單編號 | ✅ | - |
| 2 | title | Text | 標題 | ✅ | - |
| 3 | company | Relation | 客戶公司 | ✅ | Many to One → Company |
| 4 | contact | Relation | 聯絡人 | ❌ | Many to One → Person |
| 5 | opportunity | Relation | 關聯商機 | ❌ | Many to One → Opportunity |
| 6 | issueDate | Date | 開立日期 | ✅ | Default: Today |
| 7 | validUntil | Date | 有效期限 | ✅ | - |
| 8 | subtotal | Currency | 小計 | ✅ | Default: 0 |
| 9 | taxRate | Number | 稅率(%) | ❌ | Default: 5 |
| 10 | taxAmount | Currency | 稅金 | ❌ | Default: 0 |
| 11 | total | Currency | 總計 | ✅ | Default: 0 |
| 12 | status | Select | 狀態 | ✅ | 見下方選項 |
| 13 | terms | Text | 條款說明 | ❌ | - |
| 14 | notes | Text | 備註 | ❌ | - |

**Status 選項配置：**
```
DRAFT - 草稿 - 灰色
SENT - 已發送 - 藍色
ACCEPTED - 已接受 - 綠色
REJECTED - 已拒絕 - 紅色
EXPIRED - 已過期 - 橙色
```

---

### 步驟 2：創建 QuoteLineItem（報價項目）對象

**進入對象管理：**
Settings → Objects → + New Object

**基本信息：**
- Label (Singular): `Quote Line Item`
- Label (Plural): `Quote Line Items`
- API Name (Singular): `quoteLineItem` ⚠️ **必須是駝峰式 quoteLineItem**
- API Name (Plural): `quoteLineItems`
- Icon: `IconList`
- Description: `報價單的明細項目`

**添加以下 7 個字段：**

| # | Field Name | Type | Label | Required | 配置說明 |
|---|-----------|------|-------|---------|---------|
| 1 | quote | Relation | 所屬報價單 | ✅ | Many to One → Quote |
| 2 | productName | Text | 產品名稱 | ✅ | - |
| 3 | description | Text | 描述 | ❌ | - |
| 4 | quantity | Number | 數量 | ✅ | Default: 1 |
| 5 | unitPrice | Currency | 單價 | ✅ | Default: 0 |
| 6 | discount | Number | 折扣(%) | ❌ | Default: 0 |
| 7 | amount | Currency | 金額 | ✅ | Default: 0 |

---

## ✅ 創建完成檢查

創建完成後，請確認：

- [ ] Quote 對象已創建，API Name 是 `quote`
- [ ] Quote 有 14 個自定義字段
- [ ] QuoteLineItem 對象已創建，API Name 是 `quoteLineItem`
- [ ] QuoteLineItem 有 7 個自定義字段
- [ ] Quote 對象中自動生成了 `lineItems` 反向關聯字段（One to Many）

**完成後請告訴我，我會繼續執行代碼開發步驟！**

---

## 🔧 重要提醒

1. **對象名稱必須精確匹配**：`quote` 和 `quoteLineItem`（注意大小寫）
2. **字段名稱必須精確匹配**：使用駝峰式命名，如 `quoteNumber`、`productName`
3. **關聯字段會自動創建反向關聯**：創建 QuoteLineItem.quote 後，Quote 會自動有 lineItems 字段

如有任何問題，請隨時詢問！

