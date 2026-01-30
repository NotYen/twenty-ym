import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ShareLinkAccessLogEntity } from '../entities/share-link-access-log.entity';

export interface AccessLogData {
  shareLinkId: string;
  ipAddress: string;
  userAgent?: string;
  referrer?: string;
  accessMethod: 'PUBLIC' | 'LOGIN_REQUIRED';
  authenticatedUserId?: string;
}

export interface AccessAnalytics {
  totalAccesses: number;
  uniqueVisitors: number;
  averageSessionDuration: number;
  topCountries: Array<{ country: string; count: number }>;
  topDeviceTypes: Array<{ deviceType: string; count: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  accessTrends: Array<{ date: string; count: number }>;
  botTraffic: number;
}

@Injectable()
export class ShareLinkAccessLogService {
  constructor(
    @InjectRepository(ShareLinkAccessLogEntity)
    private readonly accessLogRepository: Repository<ShareLinkAccessLogEntity>,
  ) {}

  /**
   * 記錄分享連結存取
   * 實現需求 7.1, 9.1, 9.2
   */
  async logAccess(data: AccessLogData): Promise<ShareLinkAccessLogEntity> {
    const deviceInfo = this.parseUserAgent(data.userAgent);
    const locationInfo = await this.getLocationFromIP(data.ipAddress);

    const accessLog = this.accessLogRepository.create({
      shareLinkId: data.shareLinkId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceType: deviceInfo.deviceType,
      browserName: deviceInfo.browserName,
      operatingSystem: deviceInfo.operatingSystem,
      countryCode: locationInfo.countryCode,
      city: locationInfo.city,
      referrer: data.referrer,
      accessMethod: data.accessMethod,
      authenticatedUserId: data.authenticatedUserId,
      sessionDurationSeconds: 0, // 初始為 0，後續更新
      isBot: deviceInfo.isBot,
      accessedAt: new Date(),
    });

    return this.accessLogRepository.save(accessLog);
  }

  /**
   * 更新會話持續時間
   * 實現需求 9.2, 9.3
   */
  async updateSessionDuration(
    accessLogId: string,
    durationSeconds: number,
  ): Promise<void> {
    await this.accessLogRepository.update(accessLogId, {
      sessionDurationSeconds: durationSeconds,
    });
  }

  /**
   * 獲取分享連結的存取分析
   * 實現需求 7.3, 9.4, 9.5
   */
  async getAccessAnalytics(
    shareLinkId: string,
    days: number = 30,
  ): Promise<AccessAnalytics> {
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - days);

    const logs = await this.accessLogRepository
      .createQueryBuilder('log')
      .where('log.shareLinkId = :shareLinkId', { shareLinkId })
      .andWhere('log.accessedAt >= :startDate', { startDate })
      .getMany();

    // 計算基本統計
    const totalAccesses = logs.length;
    const uniqueVisitors = new Set(logs.map((log) => log.ipAddress)).size;
    const averageSessionDuration =
      logs.length > 0
        ? logs.reduce((sum, log) => sum + log.sessionDurationSeconds, 0) /
          logs.length
        : 0;

    // 統計國家分布
    const countryStats = this.groupAndCount(logs, 'countryCode');
    const topCountries = Object.entries(countryStats)
      .map(([country, count]) => ({ country: country || 'Unknown', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 統計設備類型
    const deviceStats = this.groupAndCount(logs, 'deviceType');
    const topDeviceTypes = Object.entries(deviceStats)
      .map(([deviceType, count]) => ({
        deviceType: deviceType || 'Unknown',
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // 統計瀏覽器
    const browserStats = this.groupAndCount(logs, 'browserName');
    const topBrowsers = Object.entries(browserStats)
      .map(([browser, count]) => ({ browser: browser || 'Unknown', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 存取趨勢（按日期）
    const accessTrends = this.calculateAccessTrends(logs, days);

    // Bot 流量統計
    const botTraffic = logs.filter((log) => log.isBot).length;

    return {
      totalAccesses,
      uniqueVisitors,
      averageSessionDuration,
      topCountries,
      topDeviceTypes,
      topBrowsers,
      accessTrends,
      botTraffic,
    };
  }

  /**
   * 獲取用戶的所有分享連結存取記錄
   * 實現需求 7.3, 9.6
   */
  async getUserAccessLogs(
    shareLinkIds: string[],
    limit: number = 100,
  ): Promise<ShareLinkAccessLogEntity[]> {
    return this.accessLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.shareLink', 'shareLink')
      .where('log.shareLinkId IN (:...shareLinkIds)', { shareLinkIds })
      .orderBy('log.accessedAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * 清理過期的存取記錄
   * 實現需求 16.7 - GDPR 合規
   */
  async cleanupOldAccessLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();

    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.accessLogRepository
      .createQueryBuilder()
      .delete()
      .where('accessedAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * 解析 User Agent 字串
   */
  private parseUserAgent(userAgent?: string): {
    deviceType: string;
    browserName: string;
    operatingSystem: string;
    isBot: boolean;
  } {
    if (!userAgent) {
      return {
        deviceType: 'unknown',
        browserName: 'unknown',
        operatingSystem: 'unknown',
        isBot: false,
      };
    }

    const ua = userAgent.toLowerCase();

    // 檢測 Bot
    const isBot = /bot|crawler|spider|scraper|facebook|twitter|linkedin/i.test(
      userAgent,
    );

    // 檢測設備類型
    let deviceType = 'desktop';

    if (/mobile|android|iphone/i.test(ua)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      deviceType = 'tablet';
    }

    // 檢測瀏覽器
    let browserName = 'unknown';

    if (ua.includes('chrome')) browserName = 'Chrome';
    else if (ua.includes('firefox')) browserName = 'Firefox';
    else if (ua.includes('safari')) browserName = 'Safari';
    else if (ua.includes('edge')) browserName = 'Edge';
    else if (ua.includes('opera')) browserName = 'Opera';

    // 檢測作業系統
    let operatingSystem = 'unknown';

    if (ua.includes('windows')) operatingSystem = 'Windows';
    else if (ua.includes('mac')) operatingSystem = 'macOS';
    else if (ua.includes('linux')) operatingSystem = 'Linux';
    else if (ua.includes('android')) operatingSystem = 'Android';
    else if (ua.includes('ios')) operatingSystem = 'iOS';

    return {
      deviceType,
      browserName,
      operatingSystem,
      isBot,
    };
  }

  /**
   * 從 IP 地址獲取地理位置資訊
   */
  private async getLocationFromIP(ipAddress: string): Promise<{
    countryCode: string | null;
    city: string | null;
  }> {
    // 簡化實現，實際可以整合 GeoIP 服務
    // 這裡返回基本資訊，避免外部依賴
    if (
      ipAddress.startsWith('127.') ||
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.')
    ) {
      return { countryCode: null, city: null };
    }

    // 實際實現可以使用 MaxMind GeoIP2 或其他服務
    return { countryCode: null, city: null };
  }

  /**
   * 分組並計數
   */
  private groupAndCount<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce(
      (acc, item) => {
        const value = String(item[key] || 'unknown');

        acc[value] = (acc[value] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * 計算存取趨勢
   */
  private calculateAccessTrends(
    logs: ShareLinkAccessLogEntity[],
    days: number,
  ): Array<{ date: string; count: number }> {
    const trends: Record<string, number> = {};

    // 初始化所有日期為 0
    for (let i = 0; i < days; i++) {
      const date = new Date();

      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      trends[dateStr] = 0;
    }

    // 統計每日存取次數
    logs.forEach((log) => {
      const dateStr = log.accessedAt.toISOString().split('T')[0];

      if (trends.hasOwnProperty(dateStr)) {
        trends[dateStr]++;
      }
    });

    return Object.entries(trends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
