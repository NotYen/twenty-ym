import { Injectable, Logger } from '@nestjs/common';
import { resolveInput } from 'twenty-shared/utils';

import { type WorkflowAction } from 'src/modules/workflow/workflow-executor/interfaces/workflow-action.interface';
import {
  WorkflowStepExecutorException,
  WorkflowStepExecutorExceptionCode,
} from 'src/modules/workflow/workflow-executor/exceptions/workflow-step-executor.exception';
import { type WorkflowActionInput } from 'src/modules/workflow/workflow-executor/types/workflow-action-input';
import { type WorkflowActionOutput } from 'src/modules/workflow/workflow-executor/types/workflow-action-output.type';
import { findStepOrThrow } from 'src/modules/workflow/workflow-executor/utils/find-step-or-throw.util';
import { isWorkflowSendLineMessageAction } from 'src/modules/workflow/workflow-executor/workflow-actions/line-message/guards/is-workflow-send-line-message-action.guard';
import { type WorkflowSendLineMessageActionInput } from 'src/modules/workflow/workflow-executor/workflow-actions/line-message/types/workflow-send-line-message-action-input.type';
import { LineApiService } from 'src/modules/line-integration/services/line-api.service';

/**
 * Send LINE Message Workflow Action
 *
 * 在工作流中發送 LINE 訊息給指定使用者
 *
 * 用途：
 * - 自動化客戶通知
 * - 訂單狀態更新
 * - 事件提醒
 * - 個人化行銷訊息
 *
 * 輸入參數：
 * - lineUserId: LINE User ID (從 Person 實體或手動輸入)
 * - message: 訊息內容 (支援動態變數)
 *
 * 輸出：
 * - success: 是否成功發送
 * - error: 錯誤訊息 (如果失敗)
 *
 * 錯誤處理：
 * - 驗證必填欄位
 * - 記錄詳細錯誤日誌
 * - 拋出 WorkflowStepExecutorException
 */
@Injectable()
export class SendLineMessageWorkflowAction implements WorkflowAction {
  private readonly logger = new Logger(SendLineMessageWorkflowAction.name);

  constructor(private readonly lineApiService: LineApiService) {}

  async execute({
    currentStepId,
    steps,
    runInfo,
    context,
  }: WorkflowActionInput): Promise<WorkflowActionOutput> {
    const step = findStepOrThrow({
      stepId: currentStepId,
      steps,
    });

    if (!isWorkflowSendLineMessageAction(step)) {
      throw new WorkflowStepExecutorException(
        'Step is not a send LINE message action',
        WorkflowStepExecutorExceptionCode.INVALID_STEP_TYPE,
      );
    }

    // 解析輸入參數 (支援動態變數)
    const workflowActionInput = resolveInput(
      step.settings.input,
      context,
    ) as WorkflowSendLineMessageActionInput;

    // 驗證必填欄位
    if (!workflowActionInput.lineUserId) {
      throw new WorkflowStepExecutorException(
        'LINE User ID is required',
        WorkflowStepExecutorExceptionCode.INVALID_STEP_TYPE,
      );
    }

    if (!workflowActionInput.message || workflowActionInput.message.trim() === '') {
      throw new WorkflowStepExecutorException(
        'Message content is required',
        WorkflowStepExecutorExceptionCode.INVALID_STEP_TYPE,
      );
    }

    this.logger.log(
      `Sending LINE message to user ${workflowActionInput.lineUserId} in workspace ${runInfo.workspaceId}`,
    );

    try {
      // 發送 LINE 訊息
      await this.lineApiService.pushTextMessage(
        runInfo.workspaceId,
        workflowActionInput.lineUserId,
        workflowActionInput.message,
      );

      this.logger.log(
        `Successfully sent LINE message to user ${workflowActionInput.lineUserId}`,
      );

      return {
        result: {
          success: true,
          lineUserId: workflowActionInput.lineUserId,
          messageSent: workflowActionInput.message.substring(0, 50), // 前 50 字元用於記錄
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to send LINE message to user ${workflowActionInput.lineUserId}: ${error.message}`,
      );

      throw new WorkflowStepExecutorException(
        `Failed to send LINE message: ${error.message}`,
        WorkflowStepExecutorExceptionCode.INVALID_STEP_TYPE,
      );
    }
  }
}
