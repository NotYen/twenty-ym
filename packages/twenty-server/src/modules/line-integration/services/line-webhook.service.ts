import { Injectable, Logger } from '@nestjs/common';

import { LineApiService } from 'src/modules/line-integration/services/line-api.service';
import { LinePersonService } from 'src/modules/line-integration/services/line-person.service';
import {
  type LineWebhookEvent,
  type LineFollowEvent,
  type LineUnfollowEvent,
} from 'src/modules/line-integration/types/line-webhook-event.type';

/**
 * LINE Webhook Service
 *
 * 負責處理從 LINE Platform 接收到的 Webhook 事件
 *
 * 支援的事件類型：
 * - follow: 使用者加入好友
 * - unfollow: 使用者封鎖或刪除好友
 * - message: 使用者發送訊息 (未來擴充)
 *
 * 設計原則：
 * - 所有事件處理都是非同步的
 * - Controller 應立即返回 200 OK，不等待處理完成
 * - 使用 Person 實體儲存 LINE 使用者資料
 * - 透過 LinePersonService 管理 Person 與 LINE 的整合
 */
@Injectable()
export class LineWebhookService {
  private readonly logger = new Logger(LineWebhookService.name);

  constructor(
    private readonly lineApiService: LineApiService,
    private readonly linePersonService: LinePersonService,
  ) {}

  /**
   * 處理 Webhook 事件陣列
   * @param workspaceId - 工作區 ID
   * @param events - LINE Webhook 事件陣列
   */
  async handleEvents(
    workspaceId: string,
    events: LineWebhookEvent[],
  ): Promise<void> {
    this.logger.log(
      `Processing ${events.length} LINE webhook events for workspace ${workspaceId}`,
    );

    // 使用 Promise.allSettled 處理多個事件，避免單一失敗影響其他
    const results = await Promise.allSettled(
      events.map((event) => this.handleSingleEvent(workspaceId, event)),
    );

    // 記錄失敗的事件
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      this.logger.error(
        `Failed to process ${failures.length} out of ${events.length} events`,
      );
    } else {
      this.logger.log(
        `Successfully processed all ${events.length} LINE webhook events`,
      );
    }
  }

  /**
   * 處理單一事件
   */
  private async handleSingleEvent(
    workspaceId: string,
    event: LineWebhookEvent,
  ): Promise<void> {
    this.logger.debug(
      `Processing LINE event: type=${event.type}, webhookEventId=${event.webhookEventId}`,
    );

    switch (event.type) {
      case 'follow':
        await this.handleFollowEvent(workspaceId, event);
        break;
      case 'unfollow':
        await this.handleUnfollowEvent(workspaceId, event);
        break;
      case 'message':
        this.logger.debug('Message event received (not yet handled)');
        break;
      default:
        this.logger.debug(`Unsupported event type: ${event.type}`);
        break;
    }
  }

  /**
   * 處理 follow 事件 (使用者加入好友)
   */
  private async handleFollowEvent(
    workspaceId: string,
    event: LineFollowEvent,
  ): Promise<void> {
    const userId = event.source.userId;
    if (!userId) {
      this.logger.warn('Follow event missing userId');
      return;
    }

    this.logger.log(`User ${userId} followed the LINE OA`);

    try {
      // 1. 取得 LINE Profile
      const profile = await this.lineApiService.getProfile(workspaceId, userId);

      // 2. 建立或更新 Person
      const person = await this.linePersonService.createOrUpdateFromLineProfile(
        {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          statusMessage: profile.statusMessage,
        },
      );

      this.logger.log(
        `Successfully created/updated person for LINE user ${userId}: ${person.id}`,
      );

      // 可選: 發送歡迎訊息
      // await this.lineApiService.replyTextMessage(
      //   workspaceId,
      //   event.replyToken,
      //   '感謝您加入我們的 LINE 官方帳號！',
      // );
    } catch (error) {
      this.logger.error(
        `Failed to handle follow event for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 處理 unfollow 事件 (使用者封鎖或刪除)
   */
  private async handleUnfollowEvent(
    workspaceId: string,
    event: LineUnfollowEvent,
  ): Promise<void> {
    const userId = event.source.userId;
    if (!userId) {
      this.logger.warn('Unfollow event missing userId');
      return;
    }

    this.logger.log(`User ${userId} unfollowed the LINE OA`);

    try {
      // 更新 Person 的 LINE 狀態為 blocked
      await this.linePersonService.updateLineStatus(userId, 'blocked');

      this.logger.log(`Successfully marked LINE user ${userId} as blocked`);
    } catch (error) {
      this.logger.error(
        `Failed to handle unfollow event for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 處理 message 事件 (使用者發送訊息)
   * TODO: Phase 2 或 Phase 3 實作
   */
  private async handleMessageEvent(
    workspaceId: string,
    event: any,
  ): Promise<void> {
    const userId = event.source.userId;
    const messageText = event.message?.text;

    this.logger.log(
      `User ${userId} sent message: ${messageText?.substring(0, 50)}`,
    );

    // TODO: 實作訊息處理邏輯
    // - 更新 lastLineInteractionAt
    // - 觸發工作流 (如果有設定)
    // - 自動回覆 (如果有設定)
  }
}
