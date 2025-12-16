# Twenty CRM 性能问题与最佳实践

## 📋 **问题案例：Workflow 无限循环事件**

### **问题现象**

#### **症状 1：新增 Workflow 需要点击 2 次**
- 点击"Add New"按钮后，UI 没有立即响应
- 用户以为没点到，再点一次
- 结果：创建了 2 个空白 Workflow（name = ''）

#### **症状 2：删除 Workflow 失败 + 无限循环**
- 点击删除 → 确认删除
- 弹窗消失，但记录仍在列表中
- 浏览器 Console 出现大量 `onDbEvent` GraphQL 请求（数百次）
- 整个 UI 变得非常卡顿

#### **症状 3：数据库性能下降**
- PostgreSQL 死元组比例高达 50%
- 查询变慢
- 后续所有操作都受影响

---

## 🔍 **根本原因分析**

### **核心问题：空 name 字段触发的级联效应**

```
┌─────────────────────────────────────────────────────────────────┐
│ 第 1 步：空白 Workflow 的产生                                      │
├─────────────────────────────────────────────────────────────────┤
│ • 用户点击"Add New"创建新 Workflow                                │
│ • 系统创建记录时，name 字段使用默认值：'' (空字符串)                 │
│ • 这是正常的！Twenty CRM 的设计就是先创建空白记录，让用户填写      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 第 2 步：空白记录的累积                                            │
├─────────────────────────────────────────────────────────────────┤
│ • 用户没有立即填写 name，直接点击其他地方                          │
│ • 或者因为 UI 响应慢，多次点击，创建了多个空白记录                  │
│ • 累积到 6 个空白 Workflow (name = '')                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 第 3 步：onDbEvent Subscription 订阅                               │
├─────────────────────────────────────────────────────────────────┤
│ • 每条 Workflow 记录都在表格中渲染为一行                           │
│ • 每一行都创建一个 ListenRecordUpdatesEffect                      │
│ • 每个 Effect 都订阅该记录的 onDbEvent (UPDATED)                  │
│ • 总共 21 个 Workflow = 21 个 active subscriptions                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 第 4 步：删除操作触发无限循环                                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. 用户点击删除某个 Workflow                                      │
│ 2. 后端执行软删除：UPDATE workflow SET deletedAt = NOW()         │
│ 3. ⚠️ 这是 UPDATE 操作（不是 DELETE）                            │
│ 4. 触发 onDbEvent (action: UPDATED, recordId: xxx)               │
│ 5. 该 recordId 对应的 ListenRecordUpdatesEffect 收到事件         │
│ 6. 调用 updateRecordFromCache() 更新 Apollo Client cache        │
│ 7. 调用 triggerUpdateRecordOptimisticEffect()                   │
│ 8. ⚠️ 这些操作可能触发了其他记录的 cache 更新（级联效应）          │
│ 9. ⚠️ 特别是空 name 字段的记录，可能触发了某个验证或修复逻辑       │
│ 10. 验证/修复逻辑发送了新的 UPDATE mutation                       │
│ 11. 回到步骤 2 → 无限循环开始！                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 第 5 步：性能急剧下降                                              │
├─────────────────────────────────────────────────────────────────┤
│ • 每秒数百次 GraphQL 请求                                         │
│ • PostgreSQL 死元组快速累积（50%）                                │
│ • CPU 占用 100%                                                  │
│ • UI 完全卡住                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **解决方案**

### **立即措施（治标）**

#### **1. 删除空白记录**
```sql
-- 查询空白记录
SELECT id, name, "deletedAt", "updatedAt"
FROM workspace_xxx.workflow
WHERE name IS NULL OR name = ''
ORDER BY "updatedAt" DESC;

-- 删除未软删除的空白记录
DELETE FROM workspace_xxx.workflow
WHERE (name IS NULL OR name = '') 
  AND "deletedAt" IS NULL;
```

**效果：**
- ✅ 移除了触发无限循环的"毒数据"
- ✅ 减少了 active subscriptions 的数量
- ✅ 避免了边界情况 bug

---

#### **2. 清理死元组**
```sql
-- 查询死元组比例
SELECT 
  relname as table_name,
  n_live_tup as live,
  n_dead_tup as dead,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_pct
FROM pg_stat_user_tables
WHERE schemaname = 'workspace_xxx'
  AND relname LIKE '%workflow%'
ORDER BY n_dead_tup DESC;

-- 清理死元组
VACUUM ANALYZE workspace_xxx.workflow;
VACUUM ANALYZE workspace_xxx.workflowVersion;
VACUUM ANALYZE workspace_xxx.workflowAutomatedTrigger;
VACUUM ANALYZE workspace_xxx.workflowRun;
```

**效果：**
- ✅ 查询性能提升
- ✅ 减少数据库负担
- ✅ 避免进一步的性能下降

---

### **长期预防（治本）**

#### **1. 避免创建空白记录**

**操作规范：**
```
❌ 错误做法：
• 点击"Add New" → 没反应 → 再点一次 → 又没反应 → 再点...
  结果：创建了多个空白记录

✅ 正确做法：
• 点击"Add New" → 等待 1-2 秒（前端正在处理）
• 看到新记录出现后，立即填写 name 字段
• 如果不小心创建了空白记录，立即删除或填写
```

**技术原因：**
```
Twenty CRM 的设计：
1. 点击"Add New" → 创建空白记录（name = ''）
2. 自动打开 name 字段编辑
3. 用户输入名称 → 保存

如果步骤 3 没有完成：
→ 记录保持 name = ''
→ 可能触发边界情况的 bug
```

---

#### **2. 定期数据库维护**

**每周执行一次（建议）：**

```bash
#!/bin/bash
# 数据库维护脚本

WORKSPACE_SCHEMA="workspace_1wgvd1injqtife6y4rvfbu3h5"

echo "🧹 开始数据库维护..."

# 1. 检查死元组
echo "1️⃣ 检查死元组比例..."
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c "
SELECT 
  relname as table_name,
  n_live_tup as live,
  n_dead_tup as dead,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_pct
FROM pg_stat_user_tables
WHERE schemaname = '$WORKSPACE_SCHEMA'
  AND n_dead_tup > 0
ORDER BY dead_pct DESC
LIMIT 10;
"

# 2. 清理高死元组比例的表（> 10%）
echo ""
echo "2️⃣ 清理死元组..."
for table in workflow workflowVersion workflowRun workflowAutomatedTrigger; do
    echo "   清理 $table..."
    PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c \
        "VACUUM ANALYZE $WORKSPACE_SCHEMA.\"$table\";" > /dev/null 2>&1
done

# 3. 检查异常数据
echo ""
echo "3️⃣ 检查异常数据..."
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c "
SELECT 'workflow' as table_name, COUNT(*) as count
FROM $WORKSPACE_SCHEMA.workflow
WHERE name IS NULL OR name = '';
"

echo ""
echo "✅ 维护完成！"
```

---

#### **3. 性能监控指标**

**关键指标：**

| 指标 | 健康范围 | 警告范围 | 危险范围 |
|------|---------|---------|---------|
| 死元组比例 | < 10% | 10-30% | > 30% |
| 空白记录数 | 0-2 | 3-5 | > 5 |
| GraphQL 请求/秒 | < 10 | 10-50 | > 50 |
| 查询响应时间 | < 100ms | 100-500ms | > 500ms |

**检查命令：**
```bash
# 1. 死元组检查
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c "
SELECT relname, n_dead_tup, 
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_pct
FROM pg_stat_user_tables
WHERE schemaname = 'workspace_xxx' AND n_dead_tup > 0
ORDER BY dead_pct DESC LIMIT 5;
"

# 2. 空白记录检查
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c "
SELECT COUNT(*) FROM workspace_xxx.workflow WHERE name = '';
"

# 3. 最近更新检查（检测异常频繁更新）
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c "
SELECT id, name, \"updatedAt\"
FROM workspace_xxx.workflow
WHERE \"updatedAt\" > NOW() - INTERVAL '1 minute'
ORDER BY \"updatedAt\" DESC;
"
```

---

## 🚨 **特别警告：空 name 字段的风险**

### **为什么 name = '' 特别危险？**

**1. 触发边界情况 Bug**
```javascript
// Twenty CRM 的某些验证逻辑可能这样写：
if (!record.name) {
  // 尝试修复或重新验证
  updateRecord({ name: generateDefaultName() });
}

// 问题：name = '' 时，!record.name 为 true
// → 触发修复逻辑
// → 发送 UPDATE mutation
// → 触发 onDbEvent
// → 循环开始
```

**2. UI 渲染异常**
```javascript
// 表格渲染时：
<TableCell>{record.name}</TableCell>

// name = '' 时显示为空白
// 某些组件可能尝试"填充"这个空白
// → 触发更新
```

**3. GraphQL Cache 不一致**
```javascript
// Apollo Client cache 更新时：
cache.writeFragment({
  id: 'Workflow:xxx',
  fragment: WorkflowFragment,
  data: { ...record, name: '' }
});

// name = '' 可能被认为是"无效数据"
// Apollo Client 尝试重新 fetch
// → 触发更新
```

---

## 📊 **数据库死元组问题**

### **什么是死元组？**

PostgreSQL 使用 MVCC (多版本并发控制)：
- 每次 UPDATE 操作不会直接修改旧数据
- 而是创建新版本，旧版本标记为"死元组"
- 死元组占用磁盘空间，影响查询性能

### **死元组的累积原因**

**在我们的案例中：**
```
无限循环导致的频繁 UPDATE：
• 每次循环 = 1 次 UPDATE
• 1 秒内可能有 100+ 次 UPDATE
• 每次 UPDATE = 1 个新的死元组
• 10 秒 = 1000+ 个死元组
• 死元组比例快速上升到 50%
```

### **死元组的影响**

| 死元组比例 | 性能影响 | 磁盘占用 | 建议 |
|-----------|---------|---------|------|
| 0-10% | 几乎无影响 | 正常 | 无需处理 |
| 10-30% | 查询稍慢 | 增加 10-30% | 定期 VACUUM |
| 30-50% | 查询明显变慢 | 增加 30-50% | 立即 VACUUM |
| > 50% | 严重卡顿 | 增加 > 50% | 紧急处理 + 调查原因 |

### **清理方法**

```sql
-- 1. 手动清理（立即生效）
VACUUM ANALYZE workspace_xxx.workflow;

-- 2. 完全清理（回收磁盘空间，需要锁表）
VACUUM FULL workspace_xxx.workflow;

-- 3. 自动清理配置（长期）
-- PostgreSQL 有 autovacuum 机制，但默认配置可能不够激进
-- 可以调整 postgresql.conf：
autovacuum_vacuum_scale_factor = 0.1  # 默认 0.2
autovacuum_analyze_scale_factor = 0.05  # 默认 0.1
```

---

## 🛡️ **最佳实践**

### **1. 操作习惯**

#### **创建新记录时：**
```
✅ DO（正确做法）：
• 点击"Add New"后，等待 1-2 秒
• 看到新记录出现
• 立即填写必填字段（尤其是 name）
• 保存或点击其他地方

❌ DON'T（错误做法）：
• 点击后立即再点（以为没点到）
• 创建后不填写 name，直接离开
• 批量创建多个空白记录
```

#### **删除记录时：**
```
✅ DO：
• 点击删除 → 确认 → 等待 UI 更新（1-2 秒）
• 如果 UI 没有更新，检查 Console 是否有错误

❌ DON'T：
• 点击删除后立即刷新页面
• 删除后看 UI 没更新就再点一次
• 在 UI 卡顿时继续操作
```

---

### **2. 定期维护**

#### **每日检查（可选）**
```bash
# 检查是否有异常数据
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c "
SELECT 
  'workflow' as object,
  COUNT(*) FILTER (WHERE name = '') as empty_name_count,
  COUNT(*) FILTER (WHERE \"deletedAt\" IS NOT NULL) as soft_deleted_count,
  COUNT(*) as total
FROM workspace_xxx.workflow;
"
```

#### **每周维护（推荐）**
```bash
# 1. 清理死元组
VACUUM ANALYZE workspace_xxx.workflow;
VACUUM ANALYZE workspace_xxx.workflowVersion;
VACUUM ANALYZE workspace_xxx.workflowRun;

# 2. 清理空白记录（如果有）
DELETE FROM workspace_xxx.workflow
WHERE name = '' 
  AND "deletedAt" IS NULL
  AND "createdAt" < NOW() - INTERVAL '1 day';  -- 只删除 1 天前的
```

#### **每月深度清理（可选）**
```bash
# 完全 VACUUM（需要停机维护）
./stop-twenty-local.sh

VACUUM FULL workspace_xxx.workflow;
VACUUM FULL workspace_xxx.workflowVersion;
VACUUM FULL workspace_xxx.workflowRun;

./start_all_service_start.sh
```

---

### **3. 性能监控**

#### **监控脚本示例**

创建 `monitor-performance.sh`：

```bash
#!/bin/bash

WORKSPACE_SCHEMA="workspace_1wgvd1injqtife6y4rvfbu3h5"

echo "📊 Twenty CRM 性能监控报告"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 1. 死元组检查
echo ""
echo "1️⃣ 死元组统计："
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -t -c "
SELECT 
  relname || ': ' || 
  n_live_tup || ' 活记录, ' || 
  n_dead_tup || ' 死元组, ' || 
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) || '%'
FROM pg_stat_user_tables
WHERE schemaname = '$WORKSPACE_SCHEMA'
  AND relname IN ('workflow', 'workflowVersion', 'workflowRun')
ORDER BY n_dead_tup DESC;
" | sed 's/^/   /'

# 2. 异常数据检查
echo ""
echo "2️⃣ 异常数据统计："
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -t -c "
SELECT 
  'workflow (空 name): ' || COUNT(*)
FROM $WORKSPACE_SCHEMA.workflow
WHERE name = '' AND \"deletedAt\" IS NULL;
" | sed 's/^/   /'

# 3. 最近频繁更新的记录
echo ""
echo "3️⃣ 最近 1 分钟内更新的记录："
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -t -c "
SELECT 
  id || ' (name: ' || COALESCE(name, '[空]') || ', 更新: ' || \"updatedAt\" || ')'
FROM $WORKSPACE_SCHEMA.workflow
WHERE \"updatedAt\" > NOW() - INTERVAL '1 minute'
ORDER BY \"updatedAt\" DESC
LIMIT 5;
" | sed 's/^/   /'

# 4. 软删除记录统计
echo ""
echo "4️⃣ 软删除记录："
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -t -c "
SELECT 
  'workflow: ' || COUNT(*) || ' 条已软删除'
FROM $WORKSPACE_SCHEMA.workflow
WHERE \"deletedAt\" IS NOT NULL;
" | sed 's/^/   /'

echo ""
echo "=========================================="
```

**使用方法：**
```bash
chmod +x monitor-performance.sh
./monitor-performance.sh
```

**定期运行：**
```bash
# 每小时运行一次（crontab）
0 * * * * cd /path/to/twenty && ./monitor-performance.sh >> monitor.log 2>&1
```

---

## 🔔 **告警阈值**

### **需要立即处理的情况：**

```
🔴 紧急（立即处理）：
• 死元组比例 > 30%
• 空白记录 > 5 个
• 1 分钟内同一记录被更新 > 10 次
• GraphQL 请求响应时间 > 1 秒

🟡 警告（24 小时内处理）：
• 死元组比例 10-30%
• 空白记录 3-5 个
• 软删除记录 > 100 条且 > 7 天

🟢 正常：
• 死元组比例 < 10%
• 无空白记录
• 查询响应 < 100ms
```

---

## 💡 **经验教训**

### **1. 空 name 字段是高风险数据**

**原因：**
- Twenty CRM 的很多逻辑假设 name 字段有值
- 空 name 可能触发验证、修复、重新渲染等逻辑
- 这些逻辑可能导致级联更新 → 无限循环

**预防：**
- ✅ 创建记录后立即填写 name
- ✅ 定期检查并清理空 name 记录
- ✅ 考虑在后端添加验证：不允许 name 为空字符串

---

### **2. 软删除 + MVCC = 死元组累积**

**理解：**
- Twenty CRM 使用软删除（设置 deletedAt）
- 软删除是 UPDATE 操作，会产生死元组
- 如果频繁删除/恢复，死元组会快速累积

**预防：**
- ✅ 定期运行 VACUUM
- ✅ 考虑定期硬删除很久以前的软删除记录
- ✅ 监控死元组比例

---

### **3. onDbEvent Subscription 的性能影响**

**理解：**
- 每个表格行都创建一个 subscription
- 100 行 = 100 个 active subscriptions
- 一个 UPDATE 事件可能触发多个 subscription 处理

**预防：**
- ✅ 避免在列表页长时间停留（自动关闭标签页）
- ✅ 使用分页，减少单页记录数
- ✅ 定期刷新页面，清理 subscriptions

---

## 🎯 **应急处理流程**

### **当遇到 UI 卡顿/无限循环时：**

**步骤 1：立即止损**
```bash
# 停止所有服务
./stop-twenty-local.sh
```

**步骤 2：诊断问题**
```bash
# 启动数据库
brew services start postgresql@16

# 检查死元组
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c "
SELECT relname, n_dead_tup, 
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as pct
FROM pg_stat_user_tables
WHERE schemaname = 'workspace_xxx' AND n_dead_tup > 0
ORDER BY pct DESC LIMIT 10;
"

# 检查异常数据
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c "
SELECT id, name, \"updatedAt\"
FROM workspace_xxx.workflow
WHERE name = '' OR \"updatedAt\" > NOW() - INTERVAL '5 minutes'
ORDER BY \"updatedAt\" DESC;
"
```

**步骤 3：清理数据**
```bash
# 清理死元组
VACUUM ANALYZE workspace_xxx.workflow;

# 删除空白记录（谨慎！）
DELETE FROM workspace_xxx.workflow
WHERE name = '' AND \"deletedAt\" IS NULL;
```

**步骤 4：重启服务**
```bash
./start_all_service_start.sh
```

---

## 📝 **相关技术文档**

### **PostgreSQL VACUUM**
- [官方文档](https://www.postgresql.org/docs/current/sql-vacuum.html)
- 死元组清理机制
- autovacuum 配置优化

### **Apollo Client Optimistic UI**
- [官方文档](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- optimistic response 的陷阱
- cache 更新最佳实践

### **Twenty CRM 软删除机制**
- 使用 `deletedAt` 字段
- 可以通过 Command Menu 恢复
- 定期清理策略

---

## 🎓 **开发建议**

### **1. 测试环境操作规范**
```
✅ 创建测试数据时，务必填写完整
✅ 测试完成后，及时清理测试数据
✅ 避免快速重复点击（等待 UI 反馈）
```

### **2. 代码审查重点**
```
✅ 检查是否有空字符串验证逻辑
✅ 检查 UPDATE mutation 是否可能触发级联
✅ 检查 optimistic update 是否处理了边界情况
```

### **3. 部署前检查**
```bash
# 运行性能检查
./monitor-performance.sh

# 确保无异常数据
# 确保死元组比例 < 10%
```

---

## 📌 **快速参考**

### **常用诊断命令**

```bash
# 检查服务状态
ps aux | grep -E "twenty|postgres|redis" | grep -v grep

# 检查端口
lsof -Pi :8866,8867,5432,6379 -sTCP:LISTEN

# 检查死元组
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c \
  "SELECT * FROM pg_stat_user_tables WHERE n_dead_tup > 0;"

# 清理死元组
VACUUM ANALYZE workspace_xxx.workflow;

# 检查空白记录
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c \
  "SELECT COUNT(*) FROM workspace_xxx.workflow WHERE name = '';"

# 清理空白记录
DELETE FROM workspace_xxx.workflow WHERE name = '' AND \"deletedAt\" IS NULL;
```

---

## 🎯 **总结**

### **这次问题的教训：**

1. ✅ **空 name 字段是高风险数据** - 务必立即填写或删除
2. ✅ **死元组会严重影响性能** - 定期 VACUUM 是必须的
3. ✅ **onDbEvent 的无限循环很难调试** - 预防胜于治疗
4. ✅ **操作习惯很重要** - 避免快速重复点击

### **预防措施：**

1. ✅ 创建记录后立即填写 name
2. ✅ 定期运行 `monitor-performance.sh`
3. ✅ 死元组 > 10% 时运行 VACUUM
4. ✅ 避免创建空白记录累积

### **应急处理：**

1. ✅ 停止服务
2. ✅ 清理死元组
3. ✅ 删除空白记录
4. ✅ 重启服务

---

**日期：2025-10-25**  
**问题：Workflow 删除/新增无限循环**  
**状态：✅ 已解决**  
**方法：删除空白记录 + 清理死元组**

