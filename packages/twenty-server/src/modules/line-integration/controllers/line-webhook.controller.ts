import { Controller, Post, Body, Headers, UseGuards, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LineWebhookService } from 'src/modules/line-integration/services/line-webhook.service';
import { LineSignatureGuard } from 'src/modules/line-integration/guards/line-signature.guard';
import { type LineWebhookBody } from 'src/modules/line-integration/types/line-webhook-event.type';
import { LineChannelConfigEntity } from 'src/modules/line-integration/entities/line-channel-config.entity';

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
 * - 從 webhook body 的 destination (Bot User ID) 查詢 LineChannelConfig
 * - 如果找不到對應的 workspace，仍返回 200 OK 避免 LINE 重送
 */
@Controller('api/v1/webhooks/line')
export class LineWebhookController {
  private readonly logger = new Logger(LineWebhookController.name);

  constructor(
    private readonly lineWebhookService: LineWebhookService,
    @InjectRepository(LineChannelConfigEntity)
    private readonly lineChannelConfigRepository: Repository<LineChannelConfigEntity>,
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
      this.logger.warn(
        `Cannot determine workspaceId for destination: ${body.destination}`,
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
          this.logger.error(
            `Failed to process webhook events: ${error.message}`,
            error.stack,
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
    try {
      this.logger.debug(
        `Querying workspaceId for LINE Bot User ID: ${destination}`,
      );

      const config = await this.lineChannelConfigRepository.findOne({
        where: { botUserId: destination },
        select: ['workspaceId'],
      });

      if (!config) {
        this.logger.warn(
          `No LINE channel config found for Bot User ID: ${destination}`,
        );
        return null;
      }

      this.logger.debug(
        `Found workspaceId: ${config.workspaceId} for Bot User ID: ${destination}`,
      );
      return config.workspaceId;
    } catch (error) {
      this.logger.error(
        `Failed to query workspaceId for destination ${destination}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}

