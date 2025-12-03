import { Module } from '@nestjs/common';

import { SendLineMessageWorkflowAction } from 'src/modules/workflow/workflow-executor/workflow-actions/line-message/send-line-message.workflow-action';
import { LineIntegrationModule } from 'src/modules/line-integration/line-integration.module';

/**
 * LINE Message Action Module
 *
 * 提供 LINE 訊息發送的 Workflow Action
 *
 * 依賴：
 * - LineIntegrationModule: 使用 LineApiService 發送訊息
 */
@Module({
  imports: [LineIntegrationModule],
  providers: [SendLineMessageWorkflowAction],
  exports: [SendLineMessageWorkflowAction],
})
export class LineMessageActionModule {}
