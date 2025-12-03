import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LineChannelConfigEntity } from 'src/modules/line-integration/entities/line-channel-config.entity';
import { LineEncryptionService } from 'src/modules/line-integration/services/line-encryption.service';

/**
 * LINE Config Service
 *
 * 負責管理 LINE Channel 的設定資訊，包括：
 * - Channel ID, Channel Secret, Channel Access Token
 * - 金鑰的加密儲存與解密讀取
 * - 多租戶 (Workspace) 隔離
 *
 * 安全設計：
 * - 所有敏感資料 (Secret, Token) 在存入資料庫前必須加密
 * - 加密金鑰透過環境變數 LINE_CONFIG_ENCRYPTION_KEY 提供
 * - 解密後的資料僅在記憶體中存在，不寫入日誌
 */
@Injectable()
export class LineConfigService {
  private readonly logger = new Logger(LineConfigService.name);

  constructor(
    @InjectRepository(LineChannelConfigEntity)
    private readonly lineChannelConfigRepository: Repository<LineChannelConfigEntity>,
    private readonly lineEncryptionService: LineEncryptionService,
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

    // 加密敏感資料
    const channelSecretEncrypted = this.lineEncryptionService.encrypt(
      configData.channelSecret,
    );
    const channelAccessTokenEncrypted = this.lineEncryptionService.encrypt(
      configData.channelAccessToken,
    );

    // 查詢是否已存在設定
    const existingConfig = await this.lineChannelConfigRepository.findOne({
      where: { workspaceId },
    });

    if (existingConfig) {
      // 更新現有設定
      existingConfig.channelId = configData.channelId;
      existingConfig.channelSecretEncrypted = channelSecretEncrypted;
      existingConfig.channelAccessTokenEncrypted = channelAccessTokenEncrypted;
      await this.lineChannelConfigRepository.save(existingConfig);
      this.logger.log(`Updated LINE config for workspace: ${workspaceId}`);
    } else {
      // 建立新設定
      const newConfig = this.lineChannelConfigRepository.create({
        workspaceId,
        channelId: configData.channelId,
        channelSecretEncrypted,
        channelAccessTokenEncrypted,
      });
      await this.lineChannelConfigRepository.save(newConfig);
      this.logger.log(`Created LINE config for workspace: ${workspaceId}`);
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
    const config = await this.lineChannelConfigRepository.findOne({
      where: { workspaceId },
    });

    if (!config) {
      return null;
    }

    try {
      // 解密敏感資料
      const channelSecret = this.lineEncryptionService.decrypt(
        config.channelSecretEncrypted,
      );
      const channelAccessToken = this.lineEncryptionService.decrypt(
        config.channelAccessTokenEncrypted,
      );

      return {
        channelId: config.channelId,
        channelSecret,
        channelAccessToken,
      };
    } catch (error) {
      this.logger.error(
        `Failed to decrypt LINE config for workspace ${workspaceId}: ${error.message}`,
      );
      throw new Error('Failed to decrypt LINE configuration');
    }
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
    const config = await this.lineChannelConfigRepository.findOne({
      where: { workspaceId },
    });

    if (!config) {
      return {
        channelId: '',
        isConfigured: false,
      };
    }

    return {
      channelId: config.channelId,
      isConfigured: true,
    };
  }

  /**
   * 刪除 LINE Channel 設定
   * @param workspaceId - 工作區 ID
   */
  async delete(workspaceId: string): Promise<void> {
    const result = await this.lineChannelConfigRepository.delete({
      workspaceId,
    });

    if (result.affected && result.affected > 0) {
      this.logger.log(`Deleted LINE config for workspace: ${workspaceId}`);
    } else {
      this.logger.warn(
        `No LINE config found to delete for workspace: ${workspaceId}`,
      );
    }
  }
}
