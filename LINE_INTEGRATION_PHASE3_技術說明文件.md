# LINE OA 整合 - Phase 3 技術說明文件

## 📋 概述

**Phase 3: 工作流整合** 已完成後端實作，實作了 LINE 訊息發送的 Workflow Action，可在自動化工作流程中發送 LINE 訊息。

**完成日期**: 2025-11-17
**狀態**: ✅ 後端完成 (Phase 3.1)，⏳ 前端 UI 待實作 (Phase 3.2)

---

## 🎯 Phase 3 完成項目

### 3.1 ✅ SendLineMessageAction - LINE 訊息 Workflow Action

**功能描述**:
在 Twenty CRM 的工作流系統中整合 LINE 訊息發送功能，讓用戶可以在自動化流程中發送 LINE 通知。

#### 檔案結構

```
packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/line-message/
├── types/
│   ├── workflow-send-line-message-action-input.type.ts
│   └── workflow-send-line-message-action-settings.type.ts
├── guards/
│   └── is-workflow-send-line-message-action.guard.ts
├── send-line-message.workflow-action.ts
└── line-message-action.module.ts
```

#### 核心類型定義

**WorkflowSendLineMessageActionInput**:
```typescript
export type WorkflowSendLineMessageActionInput = {
  lineUserId: string;  // LINE User ID
  message: string;     // 訊息內容 (支援動態變數)
};
```

**WorkflowActionType** (已更新):
```typescript
export enum WorkflowActionType {
  // ... 其他類型
  SEND_LINE_MESSAGE = 'SEND_LINE_MESSAGE',  // 新增
}
```

#### SendLineMessageWorkflowAction 實作

**主要功能**:
1. ✅ 驗證輸入參數 (lineUserId, message)
2. ✅ 支援動態變數替換 (使用 `resolveInput`)
3. ✅ 呼叫 LineApiService 發送訊息
4. ✅ 完整錯誤處理與日誌記錄
5. ✅ 返回執行結果 (success, lineUserId, messageSent)

**程式碼範例**:
```typescript
@Injectable()
export class SendLineMessageWorkflowAction implements WorkflowAction {
  constructor(private readonly lineApiService: LineApiService) {}

  async execute({ currentStepId, steps, runInfo, context }: WorkflowActionInput): Promise<WorkflowActionOutput> {
    // 1. 驗證步驟類型
    const step = findStepOrThrow({ stepId: currentStepId, steps });
    if (!isWorkflowSendLineMessageAction(step)) {
      throw new WorkflowStepExecutorException(...);
    }

    // 2. 解析輸入 (支援動態變數)
    const workflowActionInput = resolveInput(step.settings.input, context) as WorkflowSendLineMessageActionInput;

    // 3. 驗證必填欄位
    if (!workflowActionInput.lineUserId || !workflowActionInput.message) {
      throw new WorkflowStepExecutorException(...);
    }

    // 4. 發送 LINE 訊息
    await this.lineApiService.pushTextMessage(
      runInfo.workspaceId,
      workflowActionInput.lineUserId,
      workflowActionInput.message,
    );

    // 5. 返回結果
    return {
      result: {
        success: true,
        lineUserId: workflowActionInput.lineUserId,
        messageSent: workflowActionInput.message.substring(0, 50),
      },
    };
  }
}
```

#### 註冊到工作流系統

**WorkflowActionFactory** (已更新):
```typescript
@Injectable()
export class WorkflowActionFactory {
  constructor(
    // ... 其他 actions
    private readonly sendLineMessageWorkflowAction: SendLineMessageWorkflowAction,
  ) {}

  get(stepType: WorkflowActionType): WorkflowAction {
    switch (stepType) {
      // ... 其他 cases
      case WorkflowActionType.SEND_LINE_MESSAGE:
        return this.sendLineMessageWorkflowAction;
      // ...
    }
  }
}
```

**WorkflowExecutorModule** (已更新):
```typescript
@Module({
  imports: [
    // ... 其他模組
    LineMessageActionModule,  // 新增
  ],
  // ...
})
export class WorkflowExecutorModule {}
```

---

## 📊 使用範例

### Workflow 設定 JSON

```json
{
  "id": "step-1",
  "name": "發送 LINE 通知",
  "type": "SEND_LINE_MESSAGE",
  "settings": {
    "input": {
      "lineUserId": "{{trigger.person.lineUserId}}",
      "message": "您好 {{trigger.person.name.firstName}}，您的訂單 {{trigger.order.id}} 已出貨！"
    },
    "outputSchema": {},
    "errorHandlingOptions": {
      "retryOnFailure": { "value": true },
      "continueOnFailure": { "value": false }
    }
  }
}
```

### 使用場景

#### 1. 訂單狀態通知
**觸發條件**: 訂單狀態更新為 "已出貨"
**Action**: 發送 LINE 訊息通知客戶

```json
{
  "trigger": {
    "type": "RECORD_UPDATED",
    "object": "order",
    "field": "status",
    "value": "shipped"
  },
  "actions": [
    {
      "type": "SEND_LINE_MESSAGE",
      "input": {
        "lineUserId": "{{trigger.order.person.lineUserId}}",
        "message": "您的訂單 {{trigger.order.id}} 已經出貨，預計 {{trigger.order.estimatedDeliveryDate}} 送達。"
      }
    }
  ]
}
```

#### 2. 跟進提醒
**觸發條件**: Deal 3 天未更新
**Action**: 發送 LINE 提醒給負責人

```json
{
  "trigger": {
    "type": "SCHEDULED",
    "condition": "deal.lastUpdatedAt < NOW() - 3 DAYS"
  },
  "actions": [
    {
      "type": "SEND_LINE_MESSAGE",
      "input": {
        "lineUserId": "{{trigger.deal.owner.lineUserId}}",
        "message": "提醒：交易 {{trigger.deal.name}} 已 3 天未更新，請盡快跟進。"
      }
    }
  ]
}
```

#### 3. 歡迎訊息 (Webhook 觸發)
**觸發條件**: LINE follow 事件
**Action**: 發送個人化歡迎訊息

```json
{
  "trigger": {
    "type": "WEBHOOK",
    "source": "LINE_FOLLOW"
  },
  "actions": [
    {
      "type": "FIND_RECORDS",
      "objectName": "person",
      "filter": { "lineUserId": "{{trigger.userId}}" }
    },
    {
      "type": "SEND_LINE_MESSAGE",
      "input": {
        "lineUserId": "{{trigger.userId}}",
        "message": "歡迎 {{step.findRecords.result[0].name.firstName}}！感謝您加入我們的 LINE 官方帳號。"
      }
    }
  ]
}
```

---

## 🔧 整合要點

### 依賴項
- **LineIntegrationModule**: 提供 LineApiService
- **WorkflowExecutorModule**: 工作流執行引擎
- **TwentyORM**: 存取 Person.lineUserId (待整合)

### 必要設定
1. LINE Channel 設定完成 (Phase 2)
2. Person 實體需包含 `lineUserId` 欄位 (Phase 1.3 待完成)
3. Workspace 有效的 LINE Config

### 錯誤處理
- ✅ 輸入驗證失敗 → WorkflowStepExecutorException
- ✅ LINE API 呼叫失敗 → 記錄錯誤並重新拋出
- ✅ Rate Limit 處理 → LineApiService 自動重試

---

## ⏳ Phase 3.2 (待實作): Workflow UI 元件

### 前端工作項目

1. **Workflow Action Picker**
   - 在 Action 列表中顯示 "Send LINE Message"
   - Icon: IconBrandLine

2. **LINE Message Action Form**
   - LINE User ID 輸入 (支援變數選擇器)
   - 訊息內容編輯器 (支援動態變數)
   - 預覽功能

3. **變數選擇器**
   - 從 Trigger 選擇 lineUserId
   - 從 Person 實體選擇欄位
   - 顯示可用變數列表

4. **測試功能**
   - 測試發送到指定 LINE User
   - 顯示發送結果

---

## 📚 相關文件

- [Phase 1 技術說明文件](./LINE_INTEGRATION_PHASE1_技術說明文件.md) - 基礎建設
- [Phase 2 技術說明文件](./LINE_INTEGRATION_PHASE2_技術說明文件.md) - 雙向通訊
- [Workflow Action 開發指南](https://docs.twenty.com/developers/workflows)

---

## ✅ Phase 3 完成檢查清單

### 後端實作
- [x] WorkflowSendLineMessageActionInput 類型定義
- [x] WorkflowSendLineMessageActionSettings 類型定義
- [x] isWorkflowSendLineMessageAction Guard
- [x] SendLineMessageWorkflowAction 實作
- [x] LineMessageActionModule 建立
- [x] 更新 WorkflowActionType 枚舉
- [x] 更新 WorkflowActionSettings 聯合類型
- [x] 更新 WorkflowActionFactory
- [x] 註冊到 WorkflowExecutorModule
- [x] 完整錯誤處理與日誌

### 待完成工作
- [ ] Workflow UI 元件 (Phase 3.2)
- [ ] Action Picker 整合
- [ ] 變數選擇器實作
- [ ] Person.lineUserId 整合 (依賴 Phase 1.3)

---

**文件版本**: 1.0
**最後更新**: 2025-11-17
**作者**: Claude Code
**狀態**: Phase 3.1 完成，Phase 3.2 待實作
