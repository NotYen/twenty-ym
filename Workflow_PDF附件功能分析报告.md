# Workflow PDF 附件功能分析报告

**分析时间：** 2025-10-25
**需求：** 在 Workflow 3 中，发送邮件时自动附带报价单 PDF

---

## ✅ **结论：技术上完全可行！**

---

## 📊 **功能支持情况**

### **1. 前端 UI 支持 ✅**

**文件：** `WorkflowEditActionSendEmail.tsx`

**Line 54-60：**
```typescript
type WorkflowFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
};
```

**Line 62-68：**
```typescript
type SendEmailFormData = {
  connectedAccountId: string;
  email: string;
  subject: string;
  body: string;
  files: WorkflowFile[];  // ← 支持附件！
};
```

**Line 334-340：UI 组件**
```typescript
<WorkflowSendEmailAttachments
  label="Attachments"
  files={formData.files}
  onChange={(files) => {
    handleFieldChange('files', files);
  }}
/>
```

**结论：**
- ✅ UI 中有"Attachments"字段
- ✅ 可以上传多个文件
- ✅ 文件会存储在系统中（通过 createFile mutation）

---

### **2. 后端邮件发送支持 ✅**

**文件：** `messaging-send-message.service.ts`

**Line 19-29：SendMessageInput 接口**
```typescript
interface SendMessageInput {
  body: string;
  subject: string;
  to: string;
  html: string;
  attachments?: {        // ← 支持附件！
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
}
```

**Line 171-180：SMTP 发送附件**
```typescript
const mail = new MailComposer({
  from: handle,
  to: sendMessageInput.to,
  subject: sendMessageInput.subject,
  text: sendMessageInput.body,
  html: sendMessageInput.html,
  ...(sendMessageInput.attachments &&
  sendMessageInput.attachments.length > 0
    ? {
        attachments: sendMessageInput.attachments.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        })),
      }
    : {}),
});
```

**结论：**
- ✅ 后端完全支持附件
- ✅ 使用 nodemailer 的 MailComposer
- ✅ 支持 Gmail、SMTP 等多种发送方式

---

### **3. 文件上传机制 ✅**

**文件：** `useUploadWorkflowFile.ts`

**上传流程：**
```
1. 用户在 Workflow 配置界面点击"Upload file"
   ↓
2. 选择文件（如 Quote-Q001.pdf）
   ↓
3. useUploadWorkflowFile() 调用 createFile mutation
   ↓
4. 后端将文件存储到文件系统或云存储
   ↓
5. 返回文件元数据：{ id, name, size, type, createdAt }
   ↓
6. 文件元数据保存在 Workflow 配置中
   ↓
7. Workflow 执行时，根据文件 id 获取实际文件内容
   ↓
8. 将文件作为附件发送
```

**限制：**
```typescript
MAX_ATTACHMENT_SIZE：具体大小需要查看常量定义
```

---

## 🚧 **核心障碍：PDF 生成**

### **问题：当前的 PDF 导出是纯前端实现**

```
┌─────────────────────────────────────────────────────────────────┐
│ 当前 PDF 导出流程（前端）                                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. 用户点击"导出为 PDF"按钮                                        │
│ 2. 前端使用 @react-pdf/renderer 生成 PDF                         │
│ 3. 生成 Blob 对象                                                │
│ 4. 使用 file-saver 下载到用户电脑                                 │
│                                                                  │
│ 限制：                                                            │
│ ❌ 只能在浏览器环境运行                                            │
│ ❌ Workflow 在后端（Node.js）执行                                 │
│ ❌ 后端无法直接调用前端的 PDF 生成代码                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💡 **解决方案分析**

### **方案 A：在 Workflow 中使用 Code Step 生成 PDF（推荐）**

#### **可行性：⚠️ 需要适配**

**步骤：**
```
Workflow 3 改造：
├─ Trigger: SalesQuote 状态变为 SENT
├─ Step 0: Code - 生成 PDF
│  ├─ 输入：报价单数据、行项目数据
│  ├─ 逻辑：使用后端 PDF 库生成 PDF
│  └─ 输出：PDF Buffer 或文件 ID
├─ Step 1: 将 PDF 上传为文件（可能需要）
└─ Step 2: Send Email
   ├─ To: {{trigger.record.contact.email}}
   ├─ Subject: ...
   ├─ Body: ...
   └─ Attachments: [{ id: {{steps[0].fileId}}, ... }]
```

**需要解决的问题：**

**1. 后端 PDF 库选择**
```
@react-pdf/renderer 无法在 Node.js 后端直接使用（依赖浏览器 API）

替代方案：
• pdfkit（Node.js 原生 PDF 库）✅
• puppeteer（无头浏览器生成 PDF）⚠️（资源占用大）
• html-pdf-node（从 HTML 生成 PDF）✅
• pdf-lib（PDF 操作库）✅
```

**2. 中文字体支持**
```
后端生成 PDF 时：
• 需要加载 NotoSansSC-Regular.ttf 字体文件
• 文件路径：packages/twenty-front/public/fonts/NotoSansSC-Regular.ttf
• 需要在后端代码中引用正确的路径
```

**3. 公司 Logo**
```
• Logo 图片 URL 或文件路径
• 后端需要能访问到这个图片
```

**4. Code Step 的代码示例（PDFKit）：**
```typescript
export const main = async (params: {
  quote: {
    quotenumber: string;
    title: string;
    // ... 其他字段
  };
  lineItems: Array<{
    productname: string;
    quantity: number;
    unitprice: { amountMicros: number };
    // ...
  }>;
}): Promise<object> => {
  // ⚠️ 问题：Code Step 中无法直接 import 外部库（如 pdfkit）
  // ⚠️ Code Step 只支持内置的 Node.js 模块和 Twenty CRM 提供的工具

  // 可能的方案：
  // 1. 调用外部 API 生成 PDF
  // 2. 使用 HTTP_REQUEST Action 调用自建的 PDF 服务

  return {
    error: "Code Step 无法直接生成 PDF"
  };
};
```

---

### **方案 B：使用 HTTP Request Action 调用外部 PDF 服务（推荐）**

#### **可行性：✅ 完全可行**

**架构：**
```
┌─────────────────────────────────────────────────────────────────┐
│ Workflow 3 改造方案                                                │
├─────────────────────────────────────────────────────────────────┤
│ Trigger: SalesQuote 状态变为 SENT                                 │
│                                                                  │
│ Step 0: Search Records                                           │
│ ├─ Object: SalesQuoteLineItem                                    │
│ ├─ Filter: salesquoteId = {{trigger.record.id}}                  │
│ └─ 输出：{{steps[0].records}} (所有行项目)                         │
│                                                                  │
│ Step 1: Code - 准备 PDF 数据                                      │
│ ├─ 输入：quote, lineItems                                        │
│ ├─ 逻辑：格式化数据为 JSON                                         │
│ └─ 输出：{{steps[1].pdfData}}                                     │
│                                                                  │
│ Step 2: HTTP Request - 调用 PDF 生成 API                          │
│ ├─ URL: https://your-domain.com/api/generate-quote-pdf          │
│ ├─ Method: POST                                                  │
│ ├─ Body: {{steps[1].pdfData}}                                    │
│ └─ 输出：{{steps[2].fileId}} (生成的 PDF 文件 ID)                  │
│                                                                  │
│ Step 3: Send Email                                               │
│ ├─ To: {{trigger.record.contact.email}}                          │
│ ├─ Subject: 您的報價單已發送 - {{trigger.record.quotenumber}}      │
│ ├─ Body: (邮件正文)                                               │
│ └─ Attachments: [配置文件 ID 或直接选择已上传的文件]                 │
└─────────────────────────────────────────────────────────────────┘
```

**需要开发的部分：**

**1. 创建独立的 PDF 生成 API**
```typescript
// 新建：packages/twenty-server/src/modules/quote/quote-pdf.controller.ts

@Post('/api/generate-quote-pdf')
async generateQuotePdf(@Body() data: QuotePdfData) {
  // 使用 pdfkit 或其他后端 PDF 库
  // 生成 PDF
  // 上传到文件系统
  // 返回文件 ID

  return {
    fileId: 'xxx',
    downloadUrl: 'https://...',
  };
}
```

**2. 或者更简单：使用 Code Step 返回 base64**
```typescript
export const main = async (params: { ... }): Promise<object> => {
  // 调用外部 PDF 服务（如 自建的微服务）
  const response = await fetch('https://your-pdf-service.com/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  const pdfBase64 = await response.text();

  return {
    pdfBase64,
    filename: `Quote-${params.quote.quotenumber}.pdf`,
  };
};
```

---

### **方案 C：预先上传 PDF 模板文件（最简单，但不灵活）**

#### **可行性：✅ 立即可用，但数据不动态**

**步骤：**
```
1. 手动导出报价单 PDF（使用现有的前端功能）
2. 在 Workflow 3 配置时，点击"Upload file"
3. 上传刚才导出的 PDF
4. Send Email 的 Attachments 中选择这个文件

缺点：
❌ PDF 内容是固定的（不会根据不同报价单动态生成）
❌ 每次报价单更新都需要重新上传新的 PDF
❌ 不适合自动化场景
```

---

### **方案 D：混合方案（前端生成 + 后端存储）**

#### **可行性：🟡 需要前后端配合**

**架构：**
```
1. 创建一个后端 API：POST /api/quote/:id/generate-pdf
   ├─ 接收：quoteId
   ├─ 逻辑：
   │  ├─ 从数据库获取报价单数据
   │  ├─ 调用前端的 PDF 生成逻辑（通过无头浏览器）
   │  ├─ 或重新实现 PDF 模板（使用后端库）
   │  └─ 保存 PDF 到文件系统
   └─ 返回：fileId

2. Workflow 中：
   ├─ Step 0: HTTP Request
   │  ├─ URL: POST /api/quote/{{trigger.record.id}}/generate-pdf
   │  └─ 输出：{{steps[0].fileId}}
   │
   └─ Step 1: Send Email
      └─ Attachments: 使用 {{steps[0].fileId}}
```

---

## 🎯 **推荐方案对比**

| 方案 | 难度 | 开发时间 | 优点 | 缺点 | 推荐度 |
|------|------|---------|------|------|--------|
| **A: Code Step 生成** | 高 | 4-8 小时 | 完全自动化 | Code Step 无法 import 外部库 | 🟡 |
| **B: HTTP Request** | 中 | 2-4 小时 | 灵活，可维护 | 需要额外的 API 端点 | ✅ **推荐** |
| **C: 预先上传** | 低 | 5 分钟 | 立即可用 | 不动态，不自动化 | ❌ |
| **D: 混合方案** | 高 | 6-10 小时 | 最完整 | 复杂度高 | 🟡 |

---

## 🚀 **最佳实施方案：方案 B（HTTP Request）**

### **完整实施步骤：**

---

### **阶段 1：开发后端 PDF 生成 API（2-4 小时）**

#### **Step 1.1：安装后端 PDF 库**
```bash
cd packages/twenty-server
yarn add pdfkit
yarn add @types/pdfkit --dev
```

#### **Step 1.2：创建 PDF 生成服务**
```typescript
// 新建：packages/twenty-server/src/modules/quote/services/quote-pdf.service.ts

@Injectable()
export class QuotePdfService {
  async generateQuotePdf(quoteId: string, workspaceId: string): Promise<Buffer> {
    // 1. 查询报价单数据
    const quote = await this.getQuote(quoteId, workspaceId);
    const lineItems = await this.getQuoteLineItems(quoteId, workspaceId);

    // 2. 使用 PDFKit 生成 PDF
    const pdfBuffer = await this.createPdfBuffer(quote, lineItems);

    return pdfBuffer;
  }

  private async createPdfBuffer(quote, lineItems): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // PDF 内容生成（参考前端的 QuotePDFTemplate.tsx）
      doc.fontSize(20).text(`報價單: ${quote.quotenumber}`);
      doc.fontSize(12).text(`標題: ${quote.title}`);
      // ... 更多内容

      // 添加中文字体
      doc.font('path/to/NotoSansSC-Regular.ttf');

      doc.end();
    });
  }
}
```

#### **Step 1.3：创建 REST API 端点**
```typescript
// 新建：packages/twenty-server/src/modules/quote/quote-pdf.controller.ts

@Controller('api/quote')
export class QuotePdfController {
  constructor(private quotePdfService: QuotePdfService) {}

  @Post(':id/generate-pdf')
  async generatePdf(
    @Param('id') quoteId: string,
    @Headers('workspace-id') workspaceId: string,
  ) {
    // 1. 生成 PDF
    const pdfBuffer = await this.quotePdfService.generateQuotePdf(quoteId, workspaceId);

    // 2. 上传到文件系统（使用 Twenty CRM 的文件服务）
    const file = await this.fileService.upload({
      file: pdfBuffer,
      filename: `Quote-${quoteId}.pdf`,
      mimeType: 'application/pdf',
    });

    // 3. 返回文件 ID
    return {
      fileId: file.id,
      downloadUrl: file.url,
    };
  }
}
```

---

### **阶段 2：修改 Workflow 3 配置（15 分钟）**

#### **新的 Workflow 结构：**

```
Workflow 3: 自動發送報價單通知郵件（含 PDF）

├─ Trigger: Record is updated
│  ├─ Object: Salesquote
│  └─ Condition: status = SENT
│
├─ Step 0: HTTP Request - 生成 PDF
│  ├─ URL: http://localhost:8867/api/quote/{{trigger.record.id}}/generate-pdf
│  ├─ Method: POST
│  ├─ Headers:
│  │  └─ workspace-id: (当前 workspace ID)
│  └─ 输出：{{steps[0].fileId}}
│
└─ Step 1: Send Email
   ├─ To: {{trigger.record.contact.email}}
   ├─ Subject: 您的報價單已發送 - {{trigger.record.quotenumber}}
   ├─ Body: (邮件正文)
   └─ Attachments:
      • 方式 1：手动配置文件 ID（如果支持变量）
      • 方式 2：提前上传一个测试 PDF，然后替换
```

---

### **阶段 3：测试和验证（30 分钟）**

**测试步骤：**
```
1. 创建测试报价单
2. 将状态改为 SENT
3. 触发 Workflow 3
4. 验证：
   ✅ Step 0 成功生成 PDF
   ✅ Step 1 成功发送邮件
   ✅ 邮件包含 PDF 附件
   ✅ PDF 内容正确（中文显示正常，Logo 正常）
```

---

## ⚠️ **关键技术障碍**

### **障碍 1：Workflow Code Step 的限制**

```
Code Step 环境：
• 运行在隔离的 Serverless 环境中
• 无法直接 import npm 包（pdfkit, canvas, etc.）
• 只能使用内置模块和 Twenty CRM 提供的工具

解决方案：
❌ 不能在 Code Step 中直接生成 PDF
✅ 必须通过 HTTP Request 调用外部 API
```

---

### **障碍 2：文件 ID 的传递**

```
问题：
Send Email 的 Attachments 字段如何配置？
• 需要文件 ID（UUID）
• HTTP Request 的响应是 {{steps[0].fileId}}
• 但 Attachments UI 可能不支持动态变量

待验证：
• Attachments 字段是否支持 {{...}} 变量语法
• 或者只能选择预先上传的文件
```

---

### **障碍 3：PDF 模板的移植**

```
前端模板（QuotePDFTemplate.tsx）：
• 使用 @react-pdf/renderer 的 React 组件
• 约 500 行代码
• 包含复杂的样式和布局

后端重新实现（PDFKit）：
• 需要用 PDFKit API 重写所有布局逻辑
• 预计 4-6 小时工作量
• 需要仔细测试以确保样式一致

简化方案：
• 创建一个简化版的 PDF 模板
• 只包含关键信息（不需要完全一样）
```

---

## 📊 **完整可行性评估**

### **✅ 功能层面：完全可行**

```
证据：
1. ✅ 前端 UI 有 Attachments 配置（WorkflowSendEmailAttachments）
2. ✅ 后端 MessagingSendMessageService 支持附件
3. ✅ 文件上传机制完善（useUploadWorkflowFile）
4. ✅ SMTP/Gmail 都支持附件发送
```

---

### **⚠️ 技术层面：需要额外开发**

```
需要开发的部分：
1. 后端 PDF 生成 API（2-4 小时）
   • 选择 PDF 库（PDFKit 推荐）
   • 重新实现 PDF 模板
   • 处理中文字体
   • 处理公司 Logo

2. Workflow 配置（15 分钟）
   • 添加 HTTP Request Step
   • 配置 Attachments 字段

3. 测试和调试（1-2 小时）
   • 验证 PDF 生成正确
   • 验证邮件附件正常
   • 验证中文和 Logo
```

**总开发时间：4-7 小时**

---

## 💡 **临时替代方案（立即可用）**

### **方案：邮件中包含 PDF 下载链接**

**Workflow 3 当前配置：**
```
Send Email Body:
尊敬的 {{trigger.record.contact.name.firstName}} {{trigger.record.contact.name.lastName}}，

您好！

您的報價單已經成功發送。

📄 點擊下方鏈接查看並下載 PDF 報價單：
http://118.168.188.27.nip.io:8866/objects/salesquotes/{{trigger.record.id}}

（登入後點擊"導出為 PDF"按鈕即可下載）

...
```

**优点：**
- ✅ 立即可用（0 开发时间）
- ✅ 不需要后端开发
- ✅ 客户可以随时重新下载最新版本

**缺点：**
- ❌ 不是真正的附件
- ❌ 客户需要登录系统
- ❌ 体验不如直接附件

---

## 🎯 **最终建议**

### **短期（当前）：**
**使用临时方案 - 邮件包含下载链接**
- ✅ 0 开发成本
- ✅ 立即可用
- ✅ 已在 Workflow 3 中配置

### **中期（1-2 周后）：**
**开发方案 B - HTTP Request + 后端 PDF API**
- 需要 4-7 小时开发
- 完整的自动化体验
- 真正的 PDF 附件

### **长期（可选）：**
**优化 PDF 生成性能和质量**
- 缓存机制（避免重复生成）
- PDF 压缩（减小文件大小）
- 更精美的模板

---

## 📋 **如果要实现 PDF 附件，需要做什么？**

### **优先级 P0（必须）：**
1. ✅ 选择后端 PDF 库（PDFKit 推荐）
2. ✅ 创建 PDF 生成 API
3. ✅ 处理中文字体（复制 NotoSansSC-Regular.ttf 到后端）
4. ✅ 在 Workflow 中添加 HTTP Request Step
5. ✅ 配置 Send Email 的 Attachments

### **优先级 P1（重要）：**
6. ✅ 处理公司 Logo
7. ✅ 实现 PDF 模板（参考前端版本）
8. ✅ 测试和调试

### **优先级 P2（可选）：**
9. 🟡 PDF 缓存机制
10. 🟡 错误处理和重试
11. 🟡 PDF 质量优化

---

## 💬 **总结**

### **技术可行性：✅ 完全可行**

**证据：**
- ✅ Send Email Action 支持 Attachments 字段
- ✅ 后端邮件服务支持附件发送
- ✅ 文件上传和存储机制完善

### **实施复杂度：⚠️ 中等**

**需要：**
- ✅ 开发后端 PDF 生成 API（4-7 小时）
- ✅ 或使用外部 PDF 服务（2-3 小时）

### **当前状态：🟡 已有临时方案**

**临时方案：**
- ✅ 邮件中包含系统链接
- ✅ 客户登录后可以导出 PDF
- ✅ 0 开发成本，立即可用

---

**建议：先使用临时方案，等系统稳定后再开发真正的 PDF 附件功能！** 📧

