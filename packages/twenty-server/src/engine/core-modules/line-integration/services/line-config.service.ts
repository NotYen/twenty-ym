import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, IsNull } from 'typeorm';

import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { WorkspaceConfigEntity } from 'src/engine/core-modules/workspace-config/workspace-config.entity';
import { LineApiService } from 'src/engine/core-modules/line-integration/services/line-api.service';

/**
 * LINE Config Keys
 * 用於 workspace_config 表的 key 定義
 */
export const LINE_CONFIG_KEYS = {
  CHANNEL_ID: 'line_channel_id',
  CHANNEL_SECRET: 'line_channel_secret',
  CHANNEL_ACCESS_TOKEN: 'line_channel_access_token',
  BOT_USER_ID: 'line_bot_user_id',
} as const;

/**
 * LINE Config Service
 *
 * 負責管理 LINE Channel 的設定資訊，包括：
 * - Channel ID, Channel Secret, Channel Access Token
 * - Bot User ID (自動從 LINE API 取得)
 * - 金鑰的加密儲存與解密讀取
 * - 多租戶 (Workspace) 隔離
 *
 * 儲存方式：
 * - 使用 workspace_config 表 (key-value 結構)
 * - Channel Secret 和 Access Token 透過 WorkspaceConfigService 加密存儲
 * - Bot User ID 不加密存儲，以支援索引查詢 (用於 webhook 路由)
 *
 * 安全設計：
 * - 所有敏感資料 (Secret, Token) 在存入資料庫前透過 WorkspaceConfigService 加密
 * - 加密金鑰透過環境變數 APP_SECRET 提供
 * - 解密後的資料僅在記憶體中存在，不寫入日誌
 */
@Injectable()
export class LineConfigService {
  private readonly logger = new Logger(LineConfigService.name);

  constructor(
    private readonly workspaceConfigService: WorkspaceConfigService,
    @InjectRepository(WorkspaceConfigEntity)
    private readonly workspaceConfigRepository: Repository<WorkspaceConfigEntity>,
    private readonly lineApiService: LineApiService,
  ) {}

  /**
   * 建立或更新 LINE Channel 設定
   * @param workspaceId - 工作區 ID
   * @param configData - 設定資料 (明文)
   */
  async createOrUpdate(
    workspaceId: string,
    configData: {
      channelId: string;
      channelSecret: string;
      channelAccessToken: string;
    },
  ): Promise<void> {
    this.logger.log(
      `Creating or updating LINE config for workspace: ${workspaceId}`,
    );

    // 從 LINE API 取得 Bot User ID (用於 Webhook 路由)
    let botUserId: string | null = null;

    try {
      botUserId = await this.lineApiService.getBotUserIdByToken(
        configData.channelAccessToken,
      );
      this.logger.log(`Fetched Bot User ID: ${botUserId}`);
    } catch (error) {
      this.logger.error(
        `Failed to fetch Bot User ID: ${error.message}. Config will be saved without botUserId.`,
      );
      // 繼續儲存設定，但 botUserId 為 null
      // 這樣管理員可以稍後透過測試連線功能來補上
    }

    // 使用 WorkspaceConfigService 儲存加密資料
    await this.workspaceConfigService.set(
      workspaceId,
      LINE_CONFIG_KEYS.CHANNEL_ID,
      configData.channelId,
      'string',
    );

    await this.workspaceConfigService.set(
      workspaceId,
      LINE_CONFIG_KEYS.CHANNEL_SECRET,
      configData.channelSecret,
      'string',
    );

    await this.workspaceConfigService.set(
      workspaceId,
      LINE_CONFIG_KEYS.CHANNEL_ACCESS_TOKEN,
      configData.channelAccessToken,
      'string',
    );

    // Bot User ID 不加密存儲，直接操作 repository
    // 這樣可以支援索引查詢 (用於 webhook 路由)
    if (botUserId) {
      await this.setBotUserId(workspaceId, botUserId);
    }

    this.logger.log(
      `Successfully saved LINE config for workspace: ${workspaceId}`,
    );
  }

  /**
   * 設定 Bot User ID (不加密，直接操作 repository)
   * @param workspaceId - 工作區 ID
   * @param botUserId - LINE Bot User ID
   */
  private async setBotUserId(
    workspaceId: string,
    botUserId: string,
  ): Promise<void> {
    const existingConfig = await this.workspaceConfigRepository.findOne({
      where: {
        workspaceId,
        key: LINE_CONFIG_KEYS.BOT_USER_ID,
        deletedAt: IsNull(),
      },
    });

    if (existingConfig) {
      existingConfig.value = botUserId;
      await this.workspaceConfigRepository.save(existingConfig);
    } else {
      await this.workspaceConfigRepository.save({
        workspaceId,
        key: LINE_CONFIG_KEYS.BOT_USER_ID,
        value: botUserId,
        valueType: 'string',
      });
    }
  }

  /**
   * 取得解密後的設定 (僅供後端內部使用)
   * @param workspaceId - 工作區 ID
   * @returns 解密後的設定
   */
  async getDecryptedConfig(workspaceId: string): Promise<{
    channelId: string;
    channelSecret: string;
    channelAccessToken: string;
  } | null> {
    const channelId = await this.workspaceConfigService.get(
      workspaceId,
      LINE_CONFIG_KEYS.CHANNEL_ID,
    );

    if (!channelId) {
      return null;
    }

    const channelSecret = await this.workspaceConfigService.get(
      workspaceId,
      LINE_CONFIG_KEYS.CHANNEL_SECRET,
    );

    const channelAccessToken = await this.workspaceConfigService.get(
      workspaceId,
      LINE_CONFIG_KEYS.CHANNEL_ACCESS_TOKEN,
    );

    if (!channelSecret || !channelAccessToken) {
      this.logger.error(
        `Incomplete LINE config for workspace ${workspaceId}: missing secret or token`,
      );

      return null;
    }

    return {
      channelId,
      channelSecret,
      channelAccessToken,
    };
  }

  /**
   * 取得公開設定 (供前端使用，不包含敏感資訊)
   * @param workspaceId - 工作區 ID
   * @returns 僅包含 Channel ID 的公開資訊
   */
  async getPublicConfig(workspaceId: string): Promise<{
    channelId: string;
    isConfigured: boolean;
  } | null> {
    const channelId = await this.workspaceConfigService.get(
      workspaceId,
      LINE_CONFIG_KEYS.CHANNEL_ID,
    );

    if (!channelId) {
      return {
        channelId: '',
        isConfigured: false,
      };
    }

    return {
      channelId,
      isConfigured: true,
    };
  }

  /**
   * 刪除 LINE Channel 設定
   * @param workspaceId - 工作區 ID
   *
   * 使用硬刪除而非軟刪除，原因：
   * 1. 配置資料不需要審計追蹤
   * 2. 避免與 UQ_workspace_config_workspaceId_key 唯一約束衝突
   * 3. 不累積無用的已刪除記錄
   */
  async delete(workspaceId: string): Promise<void> {
    this.logger.log(`Deleting LINE config for workspace: ${workspaceId}`);

    // 刪除所有 LINE 相關的設定（硬刪除）
    const keysToDelete = [
      LINE_CONFIG_KEYS.CHANNEL_ID,
      LINE_CONFIG_KEYS.CHANNEL_SECRET,
      LINE_CONFIG_KEYS.CHANNEL_ACCESS_TOKEN,
      LINE_CONFIG_KEYS.BOT_USER_ID,
    ];

    for (const key of keysToDelete) {
      await this.workspaceConfigRepository.delete({
        workspaceId,
        key,
      });
    }

    this.logger.log(
      `Successfully deleted LINE config for workspace: ${workspaceId}`,
    );
  }

  /**
   * 從 Bot User ID 查詢 Workspace ID
   * 用於 Webhook 路由，從 LINE webhook 的 destination 查詢對應的 workspace
   *
   * @param botUserId - LINE Bot User ID (destination)
   * @returns workspaceId 或 null (如果找不到)
   */
  async getWorkspaceIdByBotUserId(botUserId: string): Promise<string | null> {
    try {
      this.logger.debug(
        `Querying workspaceId for LINE Bot User ID: ${botUserId}`,
      );

      const config = await this.workspaceConfigRepository.findOne({
        where: {
          key: LINE_CONFIG_KEYS.BOT_USER_ID,
          value: botUserId,
          deletedAt: IsNull(),
        },
        select: ['workspaceId'],
      });

      if (!config) {
        this.logger.warn(
          `No LINE channel config found for Bot User ID: ${botUserId}`,
        );

        return null;
      }

      this.logger.debug(
        `Found workspaceId: ${config.workspaceId} for Bot User ID: ${botUserId}`,
      );

      return config.workspaceId;
    } catch (error) {
      this.logger.error(
        `Failed to query workspaceId for Bot User ID ${botUserId}: ${error.message}`,
        error.stack,
      );

      return null;
    }
  }
}
