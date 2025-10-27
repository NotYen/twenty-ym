# Workflow 3 - 邮件金额格式化修复指南

**修复目标：** 将邮件中的 `999900000 微單位` 改为 `NT$ 999.90`
**预计时间：** 15-20 分钟
**难度：** ⭐⭐☆☆☆（简单）

---

## 📋 **修复前后对比**

### **修复前（错误）：**
```
• 小計：49995000 微單位          ❌
• 稅率：0.05
• 稅額：49995000微單位           ❌
• 總計：1049895000 微單位        ❌
```

### **修复后（正确）：**
```
• 小計：NT$ 999.90               ✅
• 稅率：5%                       ✅
• 稅額：NT$ 50.00                ✅
• 總計：NT$ 1,049.90             ✅
```

---

## 🚀 **Step by Step 修复步骤**

---

### **Step 1：打开 Workflow 3**

1. 登录系统：`http://118.168.188.27.nip.io:8866`

2. 点击左侧菜单：**Objects** → **Workflow**

3. 找到并点击：**發送報價單通知郵件**
   - 如果看不到，检查是否选择了正确的视图（All Workflows）

4. 你会看到当前的 Workflow 结构：
   ```
   Trigger: Record is updated (SalesQuote, status = SENT)
     ↓
   Filter: status IS SENT
     ↓
   Send Email
   ```

---

### **Step 2：在 Filter 和 Send Email 之间添加 Code 步骤**

1. 在 **Filter** 步骤的右下角，找到 **连接点（小圆点）**

2. 点击 **Filter** 步骤下方的 **"+"** 按钮
   - 或者：点击 Filter 步骤，然后点击 **Add Step**

3. 在弹出的菜单中，选择：**Code**

4. 新的步骤会自动插入到 Filter 和 Send Email 之间：
   ```
   Trigger
     ↓
   Filter
     ↓
   Code ← 新增的步骤
     ↓
   Send Email
   ```

---

### **Step 3：配置 Code 步骤的输入参数**

#### **3.1 设置步骤名称**

1. 点击 **Code** 步骤（如果还没点击）

2. 在右侧面板顶部，将名称改为：**格式化金額**
   - 或者保持 "Code" 也可以

#### **3.2 切换到 Settings 标签**

1. 在右侧面板中，点击 **Settings** 标签
   - 你会看到 "Input" 区域

#### **3.3 添加第 1 个输入参数：subtotalMicros**

1. 点击 **Add Input** 按钮

2. 在弹出的字段中：
   - **Key（参数名）：** `subtotalMicros`
   - **Type（类型）：** 选择 `Number`
   - **Value（值）：** 点击输入框，会弹出变量选择器

3. 在变量选择器中：
   - 找到：**Trigger** → **Properties** → **After** → **Subtotal** → **Amount Micros**
   - 或者直接输入：`{{trigger.properties.after.subtotal.amountMicros}}`

4. 点击 **确认** 或直接点击外部区域

#### **3.4 添加第 2 个输入参数：taxAmountMicros**

1. 再次点击 **Add Input**

2. 配置：
   - **Key：** `taxAmountMicros`
   - **Type：** `Number`
   - **Value：** `{{trigger.properties.after.taxamount.amountMicros}}`

#### **3.5 添加第 3 个输入参数：totalMicros**

1. 点击 **Add Input**

2. 配置：
   - **Key：** `totalMicros`
   - **Type：** `Number`
   - **Value：** `{{trigger.properties.after.total.amountMicros}}`

#### **3.6 添加第 4 个输入参数：taxRate**

1. 点击 **Add Input**

2. 配置：
   - **Key：** `taxRate`
   - **Type：** `Number`
   - **Value：** `{{trigger.properties.after.taxrate}}`

#### **3.7 添加第 5 个输入参数：currencyCode**

1. 点击 **Add Input**

2. 配置：
   - **Key：** `currencyCode`
   - **Type：** `Text`（注意：这个是 Text，不是 Number）
   - **Value：** `{{trigger.properties.after.subtotal.currencyCode}}`

#### **3.8 检查配置**

你的 Settings 标签应该显示 5 个输入参数：
```
Input:
✓ subtotalMicros (Number): {{trigger.properties.after.subtotal.amountMicros}}
✓ taxAmountMicros (Number): {{trigger.properties.after.taxamount.amountMicros}}
✓ totalMicros (Number): {{trigger.properties.after.total.amountMicros}}
✓ taxRate (Number): {{trigger.properties.after.taxrate}}
✓ currencyCode (Text): {{trigger.properties.after.subtotal.currencyCode}}
```

---

### **Step 4：添加 Code 步骤的代码**

#### **4.1 切换到 Code 标签**

1. 在右侧面板中，点击 **Code** 标签

2. 你会看到一个代码编辑器

#### **4.2 删除默认代码**

1. 全选（Ctrl+A 或 Cmd+A）
2. 删除所有内容

#### **4.3 粘贴以下代码**

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
    'JPY': '¥',
  };
  const symbol = currencySymbols[params.currencyCode] || params.currencyCode;

  // 格式化函数（添加千分位）
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('zh-TW', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 格式化税率为百分比
  const formatTaxRate = (rate: number): string => {
    return `${(rate * 100).toFixed(0)}%`;
  };

  // 返回格式化后的值
  return {
    subtotalFormatted: `${symbol} ${formatCurrency(subtotal)}`,
    taxAmountFormatted: `${symbol} ${formatCurrency(taxAmount)}`,
    totalFormatted: `${symbol} ${formatCurrency(total)}`,
    taxRateFormatted: formatTaxRate(params.taxRate),
  };
};
```

#### **4.4 保存代码**

1. 点击代码编辑器外部的任意位置
   - 或者按 Ctrl+S / Cmd+S

2. 如果有语法错误，会显示红色提示
   - 确保代码完全一致，包括所有标点符号

---

### **Step 5：修改 Send Email 步骤**

#### **5.1 打开 Send Email 步骤**

1. 点击 **Send Email** 步骤

2. 在右侧面板中，点击 **Settings** 标签

#### **5.2 编辑邮件 Body**

1. 找到 **Body** 字段（这是一个富文本编辑器）

2. 你会看到当前的邮件内容

#### **5.3 修改"小計"行**

**查找：**
```
• 小計：{{trigger.properties.after.taxamount.amountMicros}} 微單位
```

**改为：**
```
• 小計：{{steps[1].subtotalFormatted}}
```

**操作步骤：**
1. 找到 "• 小計：" 这一行
2. 删除后面的所有内容（包括变量标签和 " 微單位"）
3. 光标停在 "小計：" 后面
4. 点击工具栏的 **插入变量** 按钮（通常是 `{{}}` 图标）
5. 在变量选择器中：
   - 选择：**Step 1（格式化金額）** → **subtotalFormatted**
   - 或直接输入：`{{steps[1].subtotalFormatted}}`

#### **5.4 修改"稅率"行**

**查找：**
```
• 稅率：{{trigger.properties.after.taxrate}}
```

**改为：**
```
• 稅率：{{steps[1].taxRateFormatted}}
```

#### **5.5 修改"稅額"行**

**查找：**
```
• 稅額：{{trigger.properties.after.taxamount.amountMicros}}微單位
```

**改为：**
```
• 稅額：{{steps[1].taxAmountFormatted}}
```

#### **5.6 修改"總計"行**

**查找：**
```
• 總計：{{trigger.properties.after.total.amountMicros}} 微單位
```

**改为：**
```
• 總計：{{steps[1].totalFormatted}}
```

#### **5.7 检查修改后的邮件内容**

确保 "金額明細" 部分看起来像这样：
```
────────────────────────────────

金額明細

────────────────────────────────

• 小計：{{steps[1].subtotalFormatted}}
• 稅率：{{steps[1].taxRateFormatted}}
• 稅額：{{steps[1].taxAmountFormatted}}
• 總計：{{steps[1].totalFormatted}}

────────────────────────────────
```

---

### **Step 6：保存 Workflow**

1. 点击右上角的 **Save** 按钮
   - 或者按 Ctrl+S / Cmd+S

2. 等待保存成功提示

3. 确认 Workflow 3 的状态是 **ACTIVE**
   - 如果不是，点击 **Activate** 按钮

---

### **Step 7：测试修复**

#### **7.1 创建测试报价单**

1. 进入：**Objects** → **報價單（Salesquotes）**

2. 找到一个现有的报价单，或创建一个新的
   - 确保有以下数据：
     - ✓ 报价单编号（quoteNumber）
     - ✓ 标题（title）
     - ✓ 联系人（contact）- 必须有 email
     - ✓ 小计、税额、总计（已通过 Workflow 1 自动计算）

#### **7.2 触发 Workflow**

1. 打开这个报价单

2. 将 **Status** 字段改为：**SENT（已發送）**

3. 保存

#### **7.3 检查邮件**

1. 打开你的邮箱（邮件会发送到 Contact 的 email）

2. 查找主题为：`您的報價單xxx已發送 - Q-2025-001` 的邮件

3. 检查 "金額明細" 部分，应该显示：
   ```
   • 小計：NT$ 999.90          ✅
   • 稅率：5%                  ✅
   • 稅額：NT$ 50.00           ✅
   • 總計：NT$ 1,049.90        ✅
   ```

---

## 🎯 **检查清单（Checklist）**

在开始修改前，打印或保存这个清单：

- [ ] **Step 1：** 打开 Workflow 3（發送報價單通知郵件）
- [ ] **Step 2：** 在 Filter 和 Send Email 之间添加 Code 步骤
- [ ] **Step 3.1：** 添加输入参数：subtotalMicros
- [ ] **Step 3.2：** 添加输入参数：taxAmountMicros
- [ ] **Step 3.3：** 添加输入参数：totalMicros
- [ ] **Step 3.4：** 添加输入参数：taxRate
- [ ] **Step 3.5：** 添加输入参数：currencyCode
- [ ] **Step 4：** 粘贴 Code 步骤的代码
- [ ] **Step 5.1：** 修改邮件 Body - 小計行
- [ ] **Step 5.2：** 修改邮件 Body - 稅率行
- [ ] **Step 5.3：** 修改邮件 Body - 稅額行
- [ ] **Step 5.4：** 修改邮件 Body - 總計行
- [ ] **Step 6：** 保存 Workflow
- [ ] **Step 7：** 测试并验证邮件格式

---

## 🚨 **常见问题与解决方案**

### **问题 1：找不到 "Add Input" 按钮**

**解决方案：**
1. 确保你已经点击了 Code 步骤
2. 确保在右侧面板的 **Settings** 标签中
3. 如果还是找不到，尝试刷新页面

---

### **问题 2：变量选择器中找不到字段**

**解决方案：**
1. 直接手动输入变量路径，例如：
   ```
   {{trigger.properties.after.subtotal.amountMicros}}
   ```
2. 注意大小写和拼写
3. 确保 Trigger 步骤配置正确

---

### **问题 3：Code 步骤显示错误**

**解决方案：**
1. 检查代码是否完全复制粘贴（包括所有标点）
2. 确保参数名称与 Settings 中的一致：
   - `subtotalMicros`（不是 `subtotal`）
   - `taxAmountMicros`（不是 `taxAmount`）
   - `totalMicros`（不是 `total`）
3. 检查是否有多余的空格或字符

---

### **问题 4：邮件中显示 "{{steps[1].subtotalFormatted}}"（原始文本）**

**解决方案：**
1. 确保使用的是 **变量标签**，不是纯文本
2. 使用工具栏的 "插入变量" 按钮（`{{}}` 图标）
3. 不要直接打字输入 `{{...}}`

---

### **问题 5：邮件中金额仍然是微单位**

**解决方案：**
1. 检查 Code 步骤是否正确连接：
   ```
   Filter → Code → Send Email
   ```
2. 检查 Code 步骤的输入参数是否正确配置
3. 检查 Send Email 是否使用了 `{{steps[1]...}}` 而不是 `{{trigger...}}`
4. 确认 Workflow 已保存

---

### **问题 6：Code 步骤的索引不是 [1]**

**解决方案：**
1. 如果你的 Code 步骤不是第 1 个步骤（0-based 索引）
2. 检查步骤顺序：
   - Trigger（不计入索引）
   - Step 0：Filter
   - Step 1：Code ← 应该是这个
   - Step 2：Send Email
3. 如果 Code 在 Step 2，则使用 `{{steps[2]...}}`

---

## 📝 **快速参考**

### **需要粘贴的代码**

```typescript
export const main = async (params: {
  subtotalMicros: number;
  taxAmountMicros: number;
  totalMicros: number;
  taxRate: number;
  currencyCode: string;
}): Promise<object> => {
  const subtotal = params.subtotalMicros / 1000000;
  const taxAmount = params.taxAmountMicros / 1000000;
  const total = params.totalMicros / 1000000;

  const currencySymbols: { [key: string]: string } = {
    'TWD': 'NT$',
    'USD': '$',
    'CNY': '¥',
    'EUR': '€',
    'JPY': '¥',
  };
  const symbol = currencySymbols[params.currencyCode] || params.currencyCode;

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('zh-TW', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return {
    subtotalFormatted: `${symbol} ${formatCurrency(subtotal)}`,
    taxAmountFormatted: `${symbol} ${formatCurrency(taxAmount)}`,
    totalFormatted: `${symbol} ${formatCurrency(total)}`,
    taxRateFormatted: `${(params.taxRate * 100).toFixed(0)}%`,
  };
};
```

### **输入参数配置**

| 参数名 | 类型 | 变量路径 |
|--------|------|---------|
| subtotalMicros | Number | `{{trigger.properties.after.subtotal.amountMicros}}` |
| taxAmountMicros | Number | `{{trigger.properties.after.taxamount.amountMicros}}` |
| totalMicros | Number | `{{trigger.properties.after.total.amountMicros}}` |
| taxRate | Number | `{{trigger.properties.after.taxrate}}` |
| currencyCode | Text | `{{trigger.properties.after.subtotal.currencyCode}}` |

### **邮件模板修改**

| 字段 | 修改前 | 修改后 |
|------|--------|--------|
| 小計 | `{{trigger.properties.after.taxamount.amountMicros}} 微單位` | `{{steps[1].subtotalFormatted}}` |
| 稅率 | `{{trigger.properties.after.taxrate}}` | `{{steps[1].taxRateFormatted}}` |
| 稅額 | `{{trigger.properties.after.taxamount.amountMicros}}微單位` | `{{steps[1].taxAmountFormatted}}` |
| 總計 | `{{trigger.properties.after.total.amountMicros}} 微單位` | `{{steps[1].totalFormatted}}` |

---

## 📸 **界面截图参考（描述）**

由于无法显示实际截图，以下是关键界面的文字描述：

### **Code 步骤的 Settings 标签**
```
┌─────────────────────────────────────┐
│ Settings                            │
├─────────────────────────────────────┤
│ Input                               │
│                                     │
│ [Add Input]                         │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ subtotalMicros        Number  │   │
│ │ {{trigger.properties.after... │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ taxAmountMicros       Number  │   │
│ │ {{trigger.properties.after... │   │
│ └───────────────────────────────┘   │
│                                     │
│ ... (其他 3 个参数)                 │
└─────────────────────────────────────┘
```

### **Code 标签**
```
┌─────────────────────────────────────┐
│ Code                                │
├─────────────────────────────────────┤
│  1 | export const main = async ... │
│  2 | ...                           │
│  3 | ...                           │
│    | (代码编辑器)                  │
└─────────────────────────────────────┘
```

---

## 🎉 **完成后的效果**

修复完成后，当报价单状态改为 **SENT** 时：

1. ✅ Workflow 3 自动触发
2. ✅ Filter 检查 status = SENT
3. ✅ Code 步骤将微单位转换为格式化的货币
4. ✅ Send Email 发送包含正确格式金额的邮件
5. ✅ 客户收到的邮件显示：`NT$ 999.90`

---

## 💡 **小贴士**

1. **修改前备份：** 虽然 Twenty CRM 有版本控制，但建议截图当前配置
2. **分步骤保存：** 完成 Code 步骤后先保存一次，再修改邮件
3. **使用测试数据：** 不要用真实客户的报价单测试
4. **检查邮箱：** 确保 Contact 的 email 是你能访问的邮箱
5. **周一进行：** 避免在生产环境中周末修改，有问题可以及时处理

---

**祝你周一修复顺利！** 🚀

如有任何问题，可以参考：
- `Workflow3_邮件金额显示问题分析.md`（问题分析）
- 这个文件（修复指南）

