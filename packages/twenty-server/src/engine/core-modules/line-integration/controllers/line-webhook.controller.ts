import { Controller, Post, Body, Headers, UseGuards, Logger } from '@nestjs/common';

import { LineWebhookService } from 'src/engine/core-modules/line-integration/services/line-webhook.service';
import { LineConfigService } from 'src/engine/core-modules/line-integration/services/line-config.service';
import { LineSignatureGuard } from 'src/engine/core-modules/line-integration/guards/line-signature.guard';
import { type LineWebhookBody } from 'src/engine/core-modules/line-integration/types/line-webhook-event.type';

/**
 * LINE Webhook Controller
 *
 * 接收來自 LINE Platform 的 Webhook 事件
 *
 * 端點: POST /api/v1/webhooks/line
 * 安全性: 使用 LineSignatureGuard 驗證請求簽章
 *
 * 重要：
 * - 此端點必須是公開的 (不需要身份驗證)
 * - 必須在 5 秒內返回 200 OK，否則 LINE 會重送
 * - 事件處理應該是非同步的
 *
 * WorkspaceId 查詢：
 * - 從 webhook body 的 destination (Bot User ID) 查詢 workspace_config 表
 * - 如果找不到對應的 workspace，仍返回 200 OK 避免 LINE 重送
 */
@Controller('api/v1/webhooks/line')
export class LineWebhookController {
  private readonly logger = new Logger(LineWebhookController.name);

  constructor(
    private readonly lineWebhookService: LineWebhookService,
    private readonly lineConfigService: LineConfigService,
  ) {}

  /**
   * 接收 LINE Webhook 事件
   *
   * LINE Platform 會驗證此端點：
   * 1. 發送 POST 請求測試連線
   * 2. 驗證簽章是否正確
   * 3. 確認在 5 秒內返回 200 OK
   */
  @Post()
  @UseGuards(LineSignatureGuard)
  async handleWebhook(
    @Body() body: LineWebhookBody,
    @Headers('x-line-signature') signature: string,
  ): Promise<{ status: string }> {
    this.logger.log(
      `Received LINE webhook: ${body.events.length} events, destination: ${body.destination}`,
    );

    // 從 destination (Bot User ID) 查詢對應的 workspaceId
    const workspaceId = await this.getWorkspaceId(body.destination);

    if (!workspaceId) {
      // CRITICAL ALERT: Webhook routing failure
      // 這表示收到了 LINE webhook，但無法找到對應的 workspace
      // 可能原因：
      // 1. botUserId 尚未儲存到資料庫
      // 2. LINE Channel 設定已被刪除
      // 3. Bot User ID 不匹配
      this.logger.error(
        `[WEBHOOK_ROUTING_FAILURE] Cannot determine workspaceId for Bot User ID: ${body.destination}. ` +
          `Events will be lost! Event count: ${body.events.length}, ` +
          `Event types: ${body.events.map((e) => e.type).join(', ')}`,
      );

      // 記錄事件詳情以便後續調查
      this.logger.debug(
        `[WEBHOOK_ROUTING_FAILURE] Full webhook body: ${JSON.stringify(body)}`,
      );

      // 仍然返回 200 OK 避免 LINE 重送
      return { status: 'ok' };
    }

    // 非同步處理事件，立即返回 200 OK
    // 使用 setImmediate 確保在下一個事件循環執行，不阻塞響應
    setImmediate(() => {
      this.lineWebhookService
        .handleEvents(workspaceId, body.events)
        .catch((error) => {
          // CRITICAL ALERT: Event processing failure
          this.logger.error(
            `[WEBHOOK_PROCESSING_FAILURE] Failed to process webhook events for workspace ${workspaceId}: ${error.message}. ` +
              `Bot User ID: ${body.destination}, Event count: ${body.events.length}`,
            error.stack,
          );

          // 記錄失敗的事件以便後續重試
          this.logger.debug(
            `[WEBHOOK_PROCESSING_FAILURE] Failed events: ${JSON.stringify(body.events)}`,
          );
        });
    });

    return { status: 'ok' };
  }

  /**
   * 從 LINE Bot User ID (destination) 取得對應的 WorkspaceId
   *
   * @param destination - LINE webhook body 中的 destination 欄位 (Bot User ID)
   * @returns workspaceId 或 null (如果找不到)
   */
  private async getWorkspaceId(destination: string): Promise<string | null> {
    return this.lineConfigService.getWorkspaceIdByBotUserId(destination);
  }
}
