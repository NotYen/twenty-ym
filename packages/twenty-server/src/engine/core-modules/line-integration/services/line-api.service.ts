import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * LINE API Service
 *
 * 負責與 LINE Messaging API 進行通訊的客戶端服務
 * 封裝所有對 LINE Platform 的 API 呼叫
 *
 * 功能：
 * - 發送訊息 (Push Message, Reply Message)
 * - 取得使用者資料 (Get Profile)
 * - 錯誤處理與重試機制
 * - Rate Limit 處理 (指數退避)
 *
 * 注意：此服務不依賴 LineConfigService，避免循環依賴
 * 所有方法都接受 channelAccessToken 作為參數
 */
@Injectable()
export class LineApiService {
  private readonly logger = new Logger(LineApiService.name);
  private readonly LINE_API_BASE_URL = 'https://api.line.me/v2/bot';
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor(
    private readonly httpService: HttpService,
  ) {}

  /**
   * 發送文字訊息給指定使用者
   * @param channelAccessToken - Channel Access Token
   * @param to - LINE User ID
   * @param text - 訊息內容
   */
  async pushTextMessage(
    channelAccessToken: string,
    to: string,
    text: string,
  ): Promise<void> {
    this.logger.log(
      `Sending LINE message to user ${to}`,
    );

    // 建構訊息格式
    const payload = {
      to,
      messages: [
        {
          type: 'text',
          text,
        },
      ],
    };

    // 執行 API 呼叫 (帶重試)
    await this.executeWithRetry(async () => {
      const url = `${this.LINE_API_BASE_URL}/message/push`;
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${channelAccessToken}`,
          },
        }),
      );

      this.logger.log(
        `Successfully sent LINE message. Request ID: ${response.headers['x-line-request-id']}`,
      );

      return response.data;
    });
  }

  /**
   * 取得 LINE 使用者資料
   * @param channelAccessToken - Channel Access Token
   * @param userId - LINE User ID
   */
  async getProfile(
    channelAccessToken: string,
    userId: string,
  ): Promise<{
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  }> {
    this.logger.log(
      `Getting LINE profile for user ${userId}`,
    );

    // 執行 API 呼叫
    const url = `${this.LINE_API_BASE_URL}/profile/${userId}`;
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          Authorization: `Bearer ${channelAccessToken}`,
        },
      }),
    );

    return {
      displayName: response.data.displayName,
      pictureUrl: response.data.pictureUrl,
      statusMessage: response.data.statusMessage,
    };
  }

  /**
   * 回覆訊息 (使用 Reply Token)
   * @param channelAccessToken - Channel Access Token
   * @param replyToken - Reply Token (來自 Webhook 事件)
   * @param text - 訊息內容
   */
  async replyTextMessage(
    channelAccessToken: string,
    replyToken: string,
    text: string,
  ): Promise<void> {
    this.logger.log(`Replying LINE message with token ${replyToken}`);

    // 建構訊息格式
    const payload = {
      replyToken,
      messages: [
        {
          type: 'text',
          text,
        },
      ],
    };

    // 執行 API 呼叫
    const url = `${this.LINE_API_BASE_URL}/message/reply`;
    await firstValueFrom(
      this.httpService.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${channelAccessToken}`,
        },
      }),
    );

    this.logger.log('Successfully replied LINE message');
  }

  /**
   * 執行帶重試的 API 呼叫
   * 處理 Rate Limit (429) 錯誤，使用指數退避策略
   */
  private async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    attempt: number = 1,
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      // 檢查是否為 Rate Limit 錯誤
      if (error.response?.status === 429 && attempt <= this.MAX_RETRIES) {
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Rate limit hit. Retrying in ${delay}ms (attempt ${attempt}/${this.MAX_RETRIES})`,
        );

        // 等待後重試
        await this.sleep(delay);
        return this.executeWithRetry(apiCall, attempt + 1);
      }

      // 記錄錯誤詳情
      this.logApiError(error);
      throw error;
    }
  }

  /**
   * 記錄 API 錯誤詳情
   */
  private logApiError(error: any): void {
    const requestId = error.response?.headers?.['x-line-request-id'];
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    this.logger.error(
      `LINE API error: Status=${status}, Message=${message}, RequestId=${requestId}`,
    );

    // 記錄完整錯誤以便除錯
    if (error.response?.data) {
      this.logger.debug(
        `LINE API error details: ${JSON.stringify(error.response.data)}`,
      );
    }
  }

  /**
   * 睡眠工具函式
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 測試 LINE 連線
   * 呼叫 Get Bot Info API 驗證設定是否正確
   * @param channelAccessToken - Channel Access Token
   */
  async testConnection(channelAccessToken: string): Promise<{
    success: boolean;
    botInfo?: {
      displayName: string;
      userId: string;
      pictureUrl?: string;
    };
    error?: string;
  }> {
    try {
      // 呼叫 Get Bot Info API
      const url = `${this.LINE_API_BASE_URL}/info`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${channelAccessToken}`,
          },
        }),
      );

      return {
        success: true,
        botInfo: {
          displayName: response.data.displayName,
          userId: response.data.userId,
          pictureUrl: response.data.pictureUrl,
        },
      };
    } catch (error) {
      this.logApiError(error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * 使用 Channel Access Token 取得 Bot User ID
   * 此方法不依賴 LineConfigService，避免循環依賴
   * @param channelAccessToken - Channel Access Token
   * @returns Bot User ID (33 字元的 Uxxxxxxx... 格式)
   */
  async getBotUserIdByToken(channelAccessToken: string): Promise<string> {
    this.logger.log('Fetching Bot User ID from LINE API');

    try {
      const url = `${this.LINE_API_BASE_URL}/info`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${channelAccessToken}`,
          },
        }),
      );

      const botUserId = response.data.userId;
      this.logger.log(`Successfully fetched Bot User ID: ${botUserId}`);

      return botUserId;
    } catch (error) {
      this.logger.error(
        `Failed to fetch Bot User ID: ${error.response?.data?.message || error.message}`,
      );
      throw new Error('Failed to fetch Bot User ID from LINE API');
    }
  }
}
