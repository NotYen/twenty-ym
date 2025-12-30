import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, timingSafeEqual } from 'crypto';

import { LineChannelConfigEntity } from 'src/engine/core-modules/line-integration/entities/line-channel-config.entity';
import { LineConfigService } from 'src/engine/core-modules/line-integration/services/line-config.service';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { type LineWebhookBody } from 'src/engine/core-modules/line-integration/types/line-webhook-event.type';

/**
 * LINE Signature Guard
 *
 * 驗證 LINE Webhook 請求的簽章，確保請求確實來自 LINE Platform
 *
 * 驗證流程：
 * 1. 從請求標頭取得 X-Line-Signature
 * 2. 讀取請求的原始 body (raw body)
 * 3. 使用 Channel Secret 進行 HMAC-SHA256 運算
 * 4. 比對計算結果與標頭中的簽章
 * 5. 檢查事件是否已處理 (冪等性)
 *
 * 安全性：
 * - 使用恆定時間比對 (constant-time comparison) 防止時序攻擊
 * - 實作冪等性檢查，防止重複處理
 * - 使用 Redis 儲存已處理的事件 ID，過期時間 60 秒
 *
 * ⚠️ 注意:
 * - 需要在 main.ts 中配置 raw body parser
 * - workspaceId 的取得方式需要根據實際部署調整
 */
@Injectable()
export class LineSignatureGuard implements CanActivate {
  private readonly logger = new Logger(LineSignatureGuard.name);
  private readonly IDEMPOTENCY_TTL = 60000; // 60 seconds in milliseconds

  constructor(
    @InjectRepository(LineChannelConfigEntity)
    private readonly lineChannelConfigRepository: Repository<LineChannelConfigEntity>,
    private readonly lineConfigService: LineConfigService,
    @Inject(CacheStorageNamespace.ModuleLine)
    private readonly cacheStorage: CacheStorageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const signature = request.headers['x-line-signature'];
      const rawBody = request.rawBody; // 需要在 main.ts 配置

    // 驗證簽章是否存在
    if (!signature) {
      this.logger.warn('Missing X-Line-Signature header');
      throw new BadRequestException('Missing signature');
    }

    // 驗證 body 是否存在
    if (!rawBody) {
      this.logger.error('Raw body not available. Check main.ts configuration.');
      throw new BadRequestException('Raw body required for signature verification');
    }

    // 解析 body 以取得 destination (bot user ID)
    // 將 raw body 轉換為字串（處理 Buffer 和 string 兩種情況）
    const rawBodyString = Buffer.isBuffer(rawBody)
      ? rawBody.toString('utf8')
      : typeof rawBody === 'string'
        ? rawBody
        : JSON.stringify(rawBody);

    let body: LineWebhookBody;
    try {
      body = JSON.parse(rawBodyString);
    } catch (error) {
      this.logger.warn('Invalid JSON body');
      throw new BadRequestException('Invalid JSON body');
    }

    // 取得 workspaceId
    // TODO: 實際部署時需要實作 workspaceId 取得邏輯
    // 方案 1: 從 body.destination (Bot User ID) 查詢資料庫
    // 方案 2: 使用不同的 Webhook URL (包含 workspaceId)
    // 方案 3: 從 Channel ID 反查 workspace
    const workspaceId = await this.getWorkspaceId(body.destination);

    if (!workspaceId) {
      this.logger.warn(`Cannot determine workspaceId for destination: ${body.destination}`);
      throw new ForbiddenException('Invalid destination');
    }

    // 取得 Channel Secret
    const config = await this.lineConfigService.getDecryptedConfig(workspaceId);
    if (!config) {
      this.logger.warn(`LINE config not found for workspace ${workspaceId}`);
      throw new ForbiddenException('LINE config not found');
    }

    // 驗證簽章
    this.logger.log(
      `[LINE Signature Verification] Workspace: ${workspaceId}`,
    );
    this.logger.log(`[LINE Signature Verification] rawBody type: ${typeof rawBody}, isBuffer: ${Buffer.isBuffer(rawBody)}`);
    this.logger.log(`[LINE Signature Verification] rawBodyString length: ${rawBodyString.length}`);
    this.logger.log(`[LINE Signature Verification] rawBodyString: ${rawBodyString}`);
    this.logger.log(`[LINE Signature Verification] LINE signature: ${signature}`);
    this.logger.log(`[LINE Signature Verification] Channel secret (first 8 chars): ${config.channelSecret.substring(0, 8)}...`);

    const isValidSignature = this.verifySignature(
      signature,
      rawBodyString,
      config.channelSecret,
    );

    if (!isValidSignature) {
      this.logger.warn(`[LINE Signature Verification] FAILED for workspace ${workspaceId}`);
      throw new ForbiddenException('Invalid signature');
    }

    this.logger.log(`[LINE Signature Verification] SUCCESS for workspace ${workspaceId}`);

    // 冪等性檢查
    this.logger.log(`[LINE Guard] Starting idempotency check, events count: ${body.events.length}`);
    const isNewEvent = await this.checkIdempotency(body.events);
    this.logger.log(`[LINE Guard] Idempotency check completed, isNewEvent: ${isNewEvent}`);

    if (!isNewEvent) {
      this.logger.log('Duplicate webhook event detected (idempotency check)');
      // 仍然返回 true，但事件會在 Service 層被忽略
      // 這樣可以確保 LINE Platform 收到 200 OK
    }

    this.logger.log(
      `LINE webhook signature verified for workspace ${workspaceId}, events: ${body.events.length}`,
    );

    // 將 workspaceId 設置到 request，供 TwentyORMManager 使用
    // TwentyORMManager 透過 ScopedWorkspaceContextFactory 從 request.workspaceId 提取
    request['workspaceId'] = workspaceId;
    this.logger.log(`[LINE Guard] Set request.workspaceId = ${workspaceId}`);

    // 將解析後的 body 附加到 request，供 Controller 使用
    // 因為 rawBody 已經被讀取，@Body() 裝飾器無法再次解析
    request.body = body;
    this.logger.log(`[LINE Guard] Set request.body, events count: ${body.events.length}`);

      this.logger.log(`[LINE Guard] Guard completed successfully, returning true`);
      return true;
    } catch (error) {
      this.logger.error(`[LINE Guard] Unexpected error in canActivate: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 驗證 LINE 簽章
   * @param signature - 請求標頭中的簽章
   * @param body - 請求的原始 body (string)
   * @param channelSecret - LINE Channel Secret
   */
  private verifySignature(
    signature: string,
    body: string,
    channelSecret: string,
  ): boolean {
    try {
      // 使用 Channel Secret 計算 HMAC-SHA256
      const hash = createHmac('sha256', channelSecret)
        .update(body)
        .digest('base64');

      // 使用恆定時間比對防止時序攻擊
      const signatureBuffer = Buffer.from(signature);
      const hashBuffer = Buffer.from(hash);

      // 確保長度相同
      if (signatureBuffer.length !== hashBuffer.length) {
        return false;
      }

      return timingSafeEqual(signatureBuffer, hashBuffer);
    } catch (error) {
      this.logger.error(`Signature verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * 檢查事件是否已處理 (冪等性)
   * @param events - Webhook 事件陣列
   * @returns true 表示是新事件，false 表示已處理過
   */
  private async checkIdempotency(events: any[]): Promise<boolean> {
    if (!events || events.length === 0) {
      return true; // 沒有事件，視為新請求
    }

    // 檢查所有事件的 webhookEventId
    const eventIds = events
      .map((event) => event.webhookEventId)
      .filter((id) => id); // 過濾空值

    if (eventIds.length === 0) {
      this.logger.warn('No webhookEventId found in events');
      return true; // 沒有事件 ID，無法檢查，視為新請求
    }

    // 使用 Promise.all 並行檢查所有事件
    const results = await Promise.all(
      eventIds.map(async (eventId) => {
        try {
          // 使用 Redis SETNX (透過 acquireLock)
          // 如果返回 true，表示 key 不存在（新事件）
          const isNewEvent = await this.cacheStorage.acquireLock(
            `webhook-event:${eventId}`,
            this.IDEMPOTENCY_TTL,
          );

          if (!isNewEvent) {
            this.logger.debug(`Duplicate event detected: ${eventId}`);
          }

          return isNewEvent;
        } catch (error) {
          this.logger.error(
            `Idempotency check failed for event ${eventId}: ${error.message}`,
          );
          // 錯誤情況下視為新事件，避免遺失訊息
          return true;
        }
      }),
    );

    // 只要有一個事件是新的，就處理整個 webhook
    return results.some((result) => result === true);
  }

  /**
   * 取得 WorkspaceId
   *
   * 從 LINE Bot User ID (destination) 查詢對應的 workspace
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
