# Twenty CRM Admin Panel 功能管理指南

## 📋 目录
1. [超级管理员账号](#超级管理员账号)
2. [访问Admin Panel](#访问admin-panel)
3. [管理Feature Flags](#管理feature-flags)
4. [SaaS场景使用流程](#saas场景使用流程)
5. [功能套餐建议](#功能套餐建议)

---

## 🔑 超级管理员账号

### 推荐使用的测试账号
```
邮箱: tim@apple.dev
密码: Applecar2025
权限: ✅ 完整管理面板 + ✅ 模拟用户
可访问: Apple, YCombinator, YM 三个workspace
```

### 您的管理员账号
```
邮箱: notyenyu@gmail.com
密码: YM168888
权限: ✅ 完整管理面板 + ✅ 模拟用户
可访问: YCombinator, YM 两个workspace
```

---

## 🚀 访问Admin Panel

### 方法一：通过UI导航

1. **登录系统**
   - 使用超级管理员账号登录
   - 访问：`http://apple.118.168.188.27.nip.io:8866`

2. **打开设置**
   - 点击右上角的 `⚙️ Settings` 图标

3. **进入Admin Panel**
   - 在左侧菜单滚动到底部
   - 找到 `Other` 部分
   - 点击 `Admin Panel`

### 方法二：直接访问

```
http://apple.118.168.188.27.nip.io:8866/settings/admin-panel
```

---

## 🎛️ 管理Feature Flags

### 在Admin Panel中的操作步骤

1. **查看所有Workspace**
   - 进入Admin Panel后，默认在 `General` 标签页
   - 页面会显示所有workspace的列表

2. **搜索Workspace**
   - 使用搜索框输入workspace名称或用户邮箱
   - 快速定位目标workspace

3. **管理功能开关**
   - 点击要管理的workspace
   - 向下滚动到 `Feature Flag` 部分
   - 可以看到一个表格，列出所有可用的功能开关

4. **开启/关闭功能**
   - 每个功能右侧有一个 `Toggle` 开关
   - 点击即可开启或关闭
   - **修改立即生效**，客户刷新页面即可看到变化

### 可管理的功能列表

| 功能Key | 功能说明 | 推荐套餐 |
|--------|---------|---------|
| `IS_PAGE_LAYOUT_ENABLED` | Dashboard仪表板 | 基础版+ |
| `IS_WORKFLOW_ENABLED` | 工作流自动化 | 专业版+ |
| `IS_AI_ENABLED` | AI功能 | 专业版+ |
| `IS_CALENDAR_ENABLED` | 日历功能 | 基础版+ |
| `IS_MESSAGING_ENABLED` | 消息功能 | 基础版+ |
| `IS_IMAP_SMTP_CALDAV_ENABLED` | 邮件集成 | 基础版+ |
| `IS_AIRTABLE_INTEGRATION_ENABLED` | Airtable集成 | 专业版+ |
| `IS_POSTGRESQL_INTEGRATION_ENABLED` | PostgreSQL集成 | 专业版+ |
| `IS_STRIPE_INTEGRATION_ENABLED` | Stripe支付集成 | 专业版+ |
| `IS_SSO_ENABLED` | 单点登录 | 企业版 |
| `IS_SAML_ENABLED` | SAML认证 | 企业版 |
| `IS_REMOTE_TABLE_ENABLED` | 远程表 | 企业版 |
| `IS_API_ENABLED` | API访问 | 专业版+ |
| `IS_COPILOT_ENABLED` | AI Copilot | 企业版 |
| `IS_AGENT_ENABLED` | AI Agent | 企业版 |
| `IS_CUSTOM_OBJECT_ENABLED` | 自定义对象 | 专业版+ |

---

## 💼 SaaS场景使用流程

### 客户购买服务后的标准流程

```
第1步：客户注册
  ↓
  客户访问您的Twenty CRM服务
  填写注册信息（邮箱、公司名等）
  系统自动创建新的Workspace
  ↓
第2步：管理员配置
  ↓
  超级管理员登录Admin Panel
  在workspace列表中找到新客户的workspace
  点击进入workspace详情页
  ↓
第3步：开通功能
  ↓
  根据客户购买的套餐等级
  在Feature Flags列表中开启对应功能
  点击Toggle开关即可
  ↓
第4步：通知客户
  ↓
  发送欢迎邮件给客户
  告知已开通的功能
  提供使用教程链接
  ↓
第5步：客户使用
  ↓
  客户刷新页面
  即可看到所有已开通的功能
  开始使用Twenty CRM
```

### 升级/降级套餐

```
客户请求升级
  ↓
超级管理员登录Admin Panel
  ↓
找到该客户的workspace
  ↓
开启新套餐包含的功能
  ↓
客户刷新后即可使用新功能
```

---

## 📦 功能套餐建议

### 基础版（$29/月）
**核心CRM功能**

✅ 启用的功能：
- `IS_PAGE_LAYOUT_ENABLED` - Dashboard
- `IS_CALENDAR_ENABLED` - 日历
- `IS_MESSAGING_ENABLED` - 消息
- `IS_IMAP_SMTP_CALDAV_ENABLED` - 邮件集成
- `IS_CALENDAR_VIEW_ENABLED` - 日历视图
- `IS_GROUP_BY_ENABLED` - 分组功能

**适合**：小型团队、初创公司

---

### 专业版（$99/月）
**基础版 + 自动化 + 集成**

✅ 基础版所有功能
✅ 额外功能：
- `IS_WORKFLOW_ENABLED` - 工作流自动化
- `IS_AI_ENABLED` - AI辅助功能
- `IS_AIRTABLE_INTEGRATION_ENABLED` - Airtable集成
- `IS_POSTGRESQL_INTEGRATION_ENABLED` - 数据库集成
- `IS_STRIPE_INTEGRATION_ENABLED` - 支付集成
- `IS_API_ENABLED` - API访问
- `IS_CUSTOM_OBJECT_ENABLED` - 自定义对象

**适合**：成长型企业、需要自动化的团队

---

### 企业版（$299/月）
**专业版 + 企业级安全 + 高级功能**

✅ 专业版所有功能
✅ 额外功能：
- `IS_SSO_ENABLED` - 单点登录
- `IS_SAML_ENABLED` - SAML认证
- `IS_REMOTE_TABLE_ENABLED` - 远程数据表
- `IS_COPILOT_ENABLED` - AI Copilot
- `IS_AGENT_ENABLED` - AI Agent
- `IS_MCP_INTEGRATION_ENABLED` - MCP集成
- `IS_ADVANCED_FEATURE_ENABLED` - 高级功能
- `IS_FUNCTION_SETTINGS_ENABLED` - 自定义函数

**适合**：大型企业、有严格安全要求的组织

---

## ⚠️ 重要注意事项

### 1. 功能级别
- Feature Flags是 **Workspace级别** 的设置
- 不是用户级别的设置
- 一个workspace的所有用户共享相同的功能开关

### 2. 立即生效
- Feature Flags修改后 **立即生效**
- 客户只需刷新页面即可看到变化
- 无需重启服务或等待

### 3. ObjectMetadata依赖
某些功能需要对应的数据对象存在：
- Dashboard功能 → 需要 `dashboard` object
- Workflow功能 → 需要 `workflow` object
- 如果数据库重置后新建workspace，这些对象会自动创建

### 4. 权限要求
只有以下权限的用户才能访问Admin Panel：
- `canAccessFullAdminPanel = true` （完整管理权限）
- `canImpersonate = true` （模拟用户权限）

### 5. 多租户环境
- 超级管理员可以看到 **所有workspace**
- 普通管理员只能看到 **自己的workspace**
- 这是设计上的安全隔离

---

## 🧪 测试步骤

### 推荐的测试流程

1. **登录Admin Panel**
   ```
   账号: tim@apple.dev
   密码: Applecar2025
   访问: http://apple.118.168.188.27.nip.io:8866/settings/admin-panel
   ```

2. **查看Workspace列表**
   - 确认可以看到：Apple, YCombinator, YM

3. **测试功能开关**
   - 点击 YM workspace
   - 找到 `IS_AI_ENABLED` 功能
   - 关闭它（点击Toggle）
   - 打开新标签页访问 YM workspace
   - 确认AI相关功能已消失
   - 再次开启该功能
   - 刷新页面，确认功能恢复

4. **测试搜索功能**
   - 在搜索框输入 "yc"
   - 确认可以快速找到 YCombinator workspace

---

## 📞 技术支持

如果遇到问题：
1. 确认使用的是超级管理员账号
2. 确认账号的 `canAccessFullAdminPanel` 权限已开启
3. 检查浏览器控制台是否有错误信息
4. 确认服务已正常启动

---

## 🎯 总结

Twenty CRM的Admin Panel提供了完善的SaaS多租户管理功能：

✅ **可视化管理** - 无需操作数据库
✅ **实时生效** - 修改立即反映给客户
✅ **灵活配置** - 可以为不同客户提供不同功能
✅ **权限隔离** - 客户之间完全隔离
✅ **易于扩展** - 可以根据套餐灵活调整功能

这个功能完全满足SaaS产品的需求！

