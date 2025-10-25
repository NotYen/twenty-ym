# Workflow 删除/新增问题深度分析

## 📊 **问题现象**

### **Bug 1：新增 Workflow**
- 点击"Add New"按钮后，UI 没有立即响应
- 需要点击 2 次才有反应
- 结果：创建了 2 个空白 Workflow

### **Bug 2：删除 Workflow**
- 点击删除按钮 → 确认删除
- 弹窗消失，但 UI 列表没有更新
- Console 显示大量 `onDbEvent` GraphQL 请求（无限循环）
- 刷新页面后，记录仍然存在

### **Bug 3：删除确认弹窗文案**
- 显示英文 "Delete Record"
- 而不是中文 "刪除記錄"

---

## 🔍 **时间线**

| 时间 | 事件 | Workflow 删除是否正常 |
|------|------|---------------------|
| 2025-10-08 | Workflow 对象创建 | ✅ 正常 |
| 2025-10-24 | 我们修改 `object-metadata-v2.service.ts` | ❓ 开始有问题？ |
| 2025-10-25 上午 | 测试 Workflow 删除 | ❌ 无限循环 |
| 2025-10-25 下午 | Merge main 分支 | ❌ 问题依然存在 |
| 2025-10-25 下午 | 清除空白 Workflow | ✅ 待测试 |

---

## 🔬 **技术分析**

### **1. 我们的修改范围**

```typescript
// 文件：object-metadata-v2.service.ts
// 修改：createDefaultFlatViewFields() 方法

// 修改前：
.map((field, index) => ({
  position: index,  // 0, 1, 2, 3...
  isVisible: true,
}))

// 修改后：
// name 字段固定在 position: 0
// 其他字段从 position: 1 开始
const nameField = filteredFields.find(field => field.name === 'name');
const otherFields = filteredFields.filter(field => field.name !== 'name');

[
  ...(nameField ? [{ position: 0, ... }] : []),
  ...otherFields.map((field, index) => ({ position: index + 1, ... }))
]
```

**影响范围：**
- ✅ 只影响**新创建的自定义对象**（SalesQuote, SalesQuoteLineItem, TestObject）
- ❌ 不影响**已存在的对象**（Workflow, Company, Person）

**验证：**
```sql
-- Workflow 视图创建时间：2025-10-08
-- 我们的修改时间：2025-10-24
-- 结论：Workflow 的视图配置不可能被我们修改影响
```

---

### **2. 空白 Workflow 的产生**

**原因：**
```typescript
// 点击 "Add New" 时
createNewIndexRecord({ position: 'last' })
  ↓
createOneRecord({
  id: uuid,
  position: 'last'  // ← 只传入 position
  // ← 没有传入 name！
})
  ↓
后端创建记录：
  name: ''  // 使用默认值（空字符串）
```

**Workflow.name 字段配置：**
```sql
defaultValue: "''"
isNullable: false
```

**这是正常的！** Twenty CRM 的设计就是：
1. 创建空白记录
2. 自动打开 `name` 字段编辑
3. 用户输入名称

---

### **3. 无限循环的触发机制**

**正常流程：**
```
创建记录 (name='')
  ↓
触发 onDbEvent (CREATED)
  ↓
ListenRecordUpdatesEffect 订阅 (UPDATED)
  ↓
自动打开 name 字段编辑
  ↓
用户输入名称
  ↓
保存 → 触发 onDbEvent (UPDATED)
  ↓
UI 更新 → 结束
```

**异常流程（无限循环）：**
```
创建记录 (name='')
  ↓
触发 onDbEvent (CREATED)
  ↓
ListenRecordUpdatesEffect 订阅 (UPDATED)
  ↓
自动打开 name 字段编辑
  ↓
⚠️ 用户没有输入，直接点击其他地方
  ↓
某个逻辑检测到 name = '' 并尝试"修复"或"验证"
  ↓
触发 UPDATE mutation
  ↓
触发 onDbEvent (UPDATED)
  ↓
ListenRecordUpdatesEffect 收到事件
  ↓
updateRecordFromCache()
  ↓
⚠️ 可能触发其他记录的 cache 更新（级联效应）
  ↓
其他 ListenRecordUpdatesEffect 收到事件
  ↓
回到循环开始
```

---

### **4. 删除时的无限循环**

**删除操作（软删除）：**
```
点击删除
  ↓
deleteOneRecord(recordId)
  ↓
GraphQL mutation: UPDATE workflow SET deletedAt = NOW()
  ↓
后端执行 UPDATE（不是 DELETE！）
  ↓
触发 onDbEvent (UPDATED)
  ↓
所有订阅该 recordId 的 ListenRecordUpdatesEffect 收到事件
  ↓
updateRecordFromCache({ ...record, deletedAt: xxx })
  ↓
triggerUpdateRecordOptimisticEffect()
  ↓
⚠️ 这里可能触发了某个逻辑，导致又发送 UPDATE mutation
  ↓
回到循环开始
```

---

## 🎯 **根本原因猜测**

### **假设 1：空 name 字段触发验证逻辑**
- 某个组件检测到 `name = ''`
- 尝试修复或重新验证
- 触发 UPDATE mutation
- 循环

### **假设 2：Apollo Cache 级联更新**
- 更新一条记录的 cache
- 触发其他记录的 refetch 或 re-render
- 这些操作又触发 UPDATE
- 循环

### **假设 3：onDbEvent Subscription 过多**
- 21 条 Workflow 记录
- 每条都有一个 ListenRecordUpdatesEffect
- 删除一条时，所有 21 个 subscription 都收到事件
- 处理逻辑中有 bug，导致循环

---

## 💡 **为什么之前不会这样？**

### **关键疑问：**
1. ❓ 之前创建空白 Workflow 时，也会有 `name = ''`，为什么不会无限循环？
2. ❓ 之前删除 Workflow 时，也会触发 `onDbEvent (UPDATED)`，为什么不会无限循环？
3. ❓ 我们的修改只影响新对象的视图配置，为什么会影响 Workflow？

### **可能的答案：**
1. ✅ **Merge 后的代码引入了新的 bug**（虽然官方说是修复）
2. ✅ **我们的修改间接触发了某个边界情况**
3. ✅ **空白 Workflow 的数量累积到一定程度后触发了性能问题**

---

## 🔧 **已采取的措施**

### **1. 清理死元组**
```sql
VACUUM ANALYZE workflow;
-- 结果：死元组从 50% → 0%
```

### **2. 删除空白 Workflow**
```sql
DELETE FROM workflow WHERE name = '' AND deletedAt IS NULL;
-- 结果：删除了 6 条
```

### **3. 添加调试日志**
```typescript
// useDeleteOneRecord.ts
console.log('=== useDeleteOneRecord Debug ===');
console.log('1. 开始删除记录, ID:', idToDelete);
...
console.log('12. 删除完成！');
```

---

## 📋 **待测试**

1. ✅ 启动服务后，测试删除功能是否恢复正常
2. ✅ 测试新增功能是否恢复正常
3. ✅ 如果问题解决，确认根本原因是"空白 Workflow 累积"
4. ✅ 如果问题仍在，继续深入分析

---

## 🎯 **下一步计划**

### **如果清除空白 Workflow 后问题解决：**
- ✅ 找到为什么空白 Workflow 会触发无限循环的代码
- ✅ 修复或规避这个问题
- ✅ 继续完成报价单 Workflow

### **如果问题仍然存在：**
- ✅ 回滚 `object-metadata-v2.service.ts` 的修改进行对比测试
- ✅ 或者暂时禁用 `ListenRecordUpdatesEffect` 对 Workflow 的订阅
- ✅ 或者等待官方进一步修复

---

## 📝 **相关代码位置**

### **删除确认弹窗文案：**
```
packages/twenty-front/src/modules/action-menu/actions/record-actions/single-record/components/DeleteSingleRecordAction.tsx

Line 42-45:
title="Delete Record"  // ← 硬编码，需要改为 t`Delete Record`
confirmButtonText="Delete Record"  // ← 硬编码，需要改为 t`Delete Record`
```

### **删除逻辑：**
```
packages/twenty-front/src/modules/object-record/hooks/useDeleteOneRecord.ts
```

### **onDbEvent 订阅：**
```
packages/twenty-front/src/modules/subscription/components/ListenRecordUpdatesEffect.tsx
```

### **新建记录逻辑：**
```
packages/twenty-front/src/modules/object-record/record-table/hooks/useCreateNewIndexRecord.ts
```

---

## 🚨 **重要发现**

### **官方最近的相关修复：**
1. **#14894**：`Fix exception handling on messaging + optimistic on object delete`
2. **#14991**：`Reduce relation loading overload on FE graphql queries`
3. **#15071**：`Optimistic follow up`

这些修复都与 optimistic update 和性能优化有关，说明官方也在解决类似的问题。

---

## 💬 **结论**

**目前判断：**
1. ✅ 我们的修改**不是直接原因**（不影响 Workflow 对象）
2. ✅ 问题可能是**空白 Workflow 累积** + **官方代码的某个 bug**
3. ✅ 清除空白 Workflow 后，问题可能会解决

**等待测试结果！** 🙏

