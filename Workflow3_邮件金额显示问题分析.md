# Workflow 3 邮件金额显示问题分析报告

**问题报告时间：** 2025-10-25
**问题描述：** 发送的邮件中，金额显示为"微单位"（amountMicros），而不是正常的货币格式

---

## 📊 **问题现象**

### **邮件中显示：**
```
• 小計：49995000 微單位          ❌ 错误
• 稅率：0.05                     ✅ 正确
• 稅額：49995000微單位           ❌ 错误
• 總計：1049895000 微單位        ❌ 错误
```

### **应该显示：**
```
• 小計：NT$ 999.90               ✅ 正确
• 稅率：5%                       ✅ 正确
• 稅額：NT$ 49.995               ✅ 正确
• 總計：NT$ 1,049.90             ✅ 正确
```

---

## 🔍 **根本原因分析**

### **1. 数据库中的实际值（正确）**

```sql
quotenumber: Q-2025-001
subtotalAmountMicros:  999,900,000  (999.90 元)
taxamountAmountMicros:  49,995,000  (49.995 元)
totalAmountMicros:   1,049,895,000  (1049.895 元)
currencyCode: TWD
taxrate: 0.05
```

**换算关系：**
```
1 元 = 1,000,000 微单位（amountMicros）
999,900,000 微单位 ÷ 1,000,000 = 999.90 元
49,995,000 微单位 ÷ 1,000,000 = 49.995 元
1,049,895,000 微单位 ÷ 1,000,000 = 1,049.895 元
```

---

### **2. Workflow 3 邮件模板中的错误配置**

**当前配置（错误）：**
```json
{
  "type": "paragraph",
  "content": [
    {"type": "text", "text": "• 小計："},
    {"type": "variableTag", "attrs": {"variable": "{{trigger.properties.after.taxamount.amountMicros}}"}},  // ❌ 错误：使用了 taxamount
    {"type": "text", "text": " 微單位"}
  ]
}
```

**问题 1：变量映射错误**
```
• 小計 → 应该用 subtotal.amountMicros
       → 实际用了 taxamount.amountMicros  ❌
```

**问题 2：直接显示 amountMicros**
```
• 所有金额字段都直接使用了 .amountMicros
• 没有进行 ÷ 1,000,000 的转换
• 没有格式化为货币格式（千分位、货币符号）
```

---

## 📋 **完整的错误列表**

| 邮件字段 | 当前使用的变量 | 正确的变量 | 状态 |
|---------|--------------|-----------|------|
| 小計 | `{{trigger.properties.after.taxamount.amountMicros}}` | `{{trigger.properties.after.subtotal.amountMicros}}` | ❌ 变量错误 |
| 稅率 | `{{trigger.properties.after.taxrate}}` | `{{trigger.properties.after.taxrate}}` | ✅ 正确 |
| 稅額 | `{{trigger.properties.after.taxamount.amountMicros}}` | `{{trigger.properties.after.taxamount.amountMicros}}` | ✅ 变量正确，但格式错误 |
| 總計 | `{{trigger.properties.after.total.amountMicros}}` | `{{trigger.properties.after.total.amountMicros}}` | ✅ 变量正确，但格式错误 |

---

## 💡 **为什么会这样？**

### **原因 1：Twenty CRM 的货币存储机制**

Twenty CRM 使用 **微单位（Micro Units）** 存储货币金额：
```
目的：避免浮点数精度问题
存储方式：1 元 = 1,000,000 微单位
例子：999.90 元 → 999,900,000 amountMicros
```

### **原因 2：Workflow 变量不会自动格式化**

Workflow 中的 `{{...}}` 变量是**原始值**：
```
{{trigger.properties.after.subtotal.amountMicros}}
→ 返回：999900000（数字）
→ 不会自动转换为 999.90 元
```

### **原因 3：邮件模板配置时的疏忽**

在配置 Workflow 3 的邮件模板时：
1. ✅ 正确选择了 Currency 类型的字段
2. ❌ 但选择了 `.amountMicros` 子字段（原始值）
3. ❌ 没有进行格式化处理

---

## 🛠️ **解决方案分析**

### **方案 A：前端格式化（不可行）**

**原因：**
- Workflow 邮件是后端发送的
- 没有前端的货币格式化函数
- `{{...}}` 变量只能访问原始数据

---

### **方案 B：使用 Code Step 格式化（推荐）✅**

**架构：**
```
Workflow 3 改造：
├─ Trigger: SalesQuote 状态变为 SENT
├─ Step 0: Filter (status = SENT)
├─ Step 1: Code - 格式化金额 ✅ 新增
│  ├─ 输入：
│  │  ├─ subtotalMicros: {{trigger.properties.after.subtotal.amountMicros}}
│  │  ├─ taxAmountMicros: {{trigger.properties.after.taxamount.amountMicros}}
│  │  ├─ totalMicros: {{trigger.properties.after.total.amountMicros}}
│  │  ├─ taxRate: {{trigger.properties.after.taxrate}}
│  │  └─ currencyCode: {{trigger.properties.after.subtotal.currencyCode}}
│  └─ 输出：
│     ├─ subtotalFormatted: "NT$ 999.90"
│     ├─ taxAmountFormatted: "NT$ 49.995"
│     ├─ totalFormatted: "NT$ 1,049.90"
│     └─ taxRateFormatted: "5%"
└─ Step 2: Send Email（使用格式化后的值）
   ├─ • 小計：{{steps[1].subtotalFormatted}}
   ├─ • 稅率：{{steps[1].taxRateFormatted}}
   ├─ • 稅額：{{steps[1].taxAmountFormatted}}
   └─ • 總計：{{steps[1].totalFormatted}}
```

**Code Step 示例代码：**
```typescript
export const main = async (params: {
  subtotalMicros: number;
  taxAmountMicros: number;
  totalMicros: number;
  taxRate: number;
  currencyCode: string;
}): Promise<object> => {
  // 微单位转换为元（1 元 = 1,000,000 微单位）
  const subtotal = params.subtotalMicros / 1000000;
  const taxAmount = params.taxAmountMicros / 1000000;
  const total = params.totalMicros / 1000000;

  // 货币符号映射
  const currencySymbols: { [key: string]: string } = {
    'TWD': 'NT$',
    'USD': '$',
    'CNY': '¥',
    'EUR': '€',
  };
  const symbol = currencySymbols[params.currencyCode] || params.currencyCode;

  // 格式化函数（添加千分位）
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('zh-TW', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 返回格式化后的值
  return {
    subtotalFormatted: `${symbol} ${formatCurrency(subtotal)}`,
    taxAmountFormatted: `${symbol} ${formatCurrency(taxAmount)}`,
    totalFormatted: `${symbol} ${formatCurrency(total)}`,
    taxRateFormatted: `${(params.taxRate * 100).toFixed(0)}%`,
  };
};
```

**预期输出：**
```json
{
  "subtotalFormatted": "NT$ 999.90",
  "taxAmountFormatted": "NT$ 49.995",
  "totalFormatted": "NT$ 1,049.90",
  "taxRateFormatted": "5%"
}
```

---

### **方案 C：直接在邮件模板中计算（不推荐）**

**原因：**
- Workflow 的 `{{...}}` 变量不支持复杂的表达式
- 不能写 `{{trigger.properties.after.subtotal.amountMicros / 1000000}}`
- 只能访问原始值

---

## 🎯 **推荐修复步骤**

### **Step 1：修改 Workflow 3 结构**

**当前结构：**
```
Trigger → Filter → Send Email
```

**修改后：**
```
Trigger → Filter → Code (格式化) → Send Email
```

---

### **Step 2：添加 Code Step**

**配置：**
```
步骤名称：格式化金额
类型：Code

输入参数（Settings 标签）：
• subtotalMicros: {{trigger.properties.after.subtotal.amountMicros}}
• taxAmountMicros: {{trigger.properties.after.taxamount.amountMicros}}
• totalMicros: {{trigger.properties.after.total.amountMicros}}
• taxRate: {{trigger.properties.after.taxrate}}
• currencyCode: {{trigger.properties.after.subtotal.currencyCode}}

代码：
（使用上面提供的示例代码）
```

---

### **Step 3：修改邮件模板**

**修改前（错误）：**
```
• 小計：{{trigger.properties.after.taxamount.amountMicros}} 微單位
• 稅率：{{trigger.properties.after.taxrate}}
• 稅額：{{trigger.properties.after.taxamount.amountMicros}}微單位
• 總計：{{trigger.properties.after.total.amountMicros}} 微單位
```

**修改后（正确）：**
```
• 小計：{{steps[1].subtotalFormatted}}
• 稅率：{{steps[1].taxRateFormatted}}
• 稅額：{{steps[1].taxAmountFormatted}}
• 總計：{{steps[1].totalFormatted}}
```

**注意：**
- `steps[1]` 是指 Code Step（Step 1）的输出
- 如果 Code Step 的位置不同，需要调整索引

---

## 📊 **测试结果预期**

**修复后，邮件应该显示：**
```
尊敬的 YenYU，

您好！

您的報價單已經成功發送，詳細信息如下：

────────────────────────────────

報價單信息

────────────────────────────────

• 報價單編號：Q-2025-001
• 標題：测试报价单-001
• 公司：邦達人力集團
• 發出日期：2025-10-25
• 有效期至：2025-11-24

────────────────────────────────

金額明細

────────────────────────────────

• 小計：NT$ 999.90          ✅
• 稅率：5%                  ✅
• 稅額：NT$ 49.995          ✅ (或 NT$ 50.00)
• 總計：NT$ 1,049.90        ✅

────────────────────────────────

如有任何問題，請隨時與我們聯繫。

謝謝！
```

---

## 🔧 **快速修复指南**

### **1. 打开 Workflow 3**
```
路径：Objects → Workflow → 發送報價單通知郵件
```

### **2. 在 Filter 步骤后添加 Code 步骤**
```
点击 "+" 按钮 → 选择 "Code"
```

### **3. 配置 Code Step**
```
名称：格式化金额

Settings 标签：
• 添加输入参数（点击 "Add Input"）：
  - subtotalMicros (Number)
  - taxAmountMicros (Number)
  - totalMicros (Number)
  - taxRate (Number)
  - currencyCode (Text)

• 为每个参数配置值（点击输入框，从下拉菜单选择）：
  - subtotalMicros: {{trigger.properties.after.subtotal.amountMicros}}
  - taxAmountMicros: {{trigger.properties.after.taxamount.amountMicros}}
  - totalMicros: {{trigger.properties.after.total.amountMicros}}
  - taxRate: {{trigger.properties.after.taxrate}}
  - currencyCode: {{trigger.properties.after.subtotal.currencyCode}}

Code 标签：
• 粘贴上面提供的代码
```

### **4. 修改邮件模板**
```
找到 "Send Email" 步骤
编辑邮件 Body：
• 将所有 {{trigger.properties.after.xxx.amountMicros}}
  替换为 {{steps[1].xxxFormatted}}

  例如：
  • 小計：{{trigger.properties.after.taxamount.amountMicros}} 微單位
    ↓ 改为
  • 小計：{{steps[1].subtotalFormatted}}
```

### **5. 保存并测试**
```
1. 点击 "Save"
2. 确保 Workflow 3 是 ACTIVE 状态
3. 创建一个测试报价单
4. 将状态改为 SENT
5. 检查收到的邮件
```

---

## 💬 **总结**

### **问题根源：**
1. ❌ 邮件模板直接使用了 `amountMicros`（微单位）
2. ❌ "小計" 字段错误地使用了 `taxamount` 的值
3. ❌ 没有进行货币格式化（千分位、符号）

### **解决方案：**
✅ 添加 Code Step 进行金额格式化
✅ 修改邮件模板使用格式化后的值
✅ 修正 "小計" 字段的变量映射

### **预期效果：**
✅ 邮件显示 `NT$ 999.90` 而不是 `999900000 微單位`
✅ 自动添加千分位分隔符
✅ 自动添加正确的货币符号

---

**修复完成后，邮件将正确显示货币格式！** 💰

