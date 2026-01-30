import { Injectable } from '@nestjs/common';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';

import { ShareLinkRepository } from '../repositories/share-link.repository';

@Injectable()
export class ShareLinkCleanupService {
  constructor(
    private readonly shareLinkRepository: ShareLinkRepository,
    @InjectCacheStorage(CacheStorageNamespace.EngineWorkspace)
    private readonly cacheStorage: CacheStorageService,
  ) {}

  /**
   * 清理已過期的分享連結
   * 實現需求 5.2, 5.3
   */
  async cleanupExpiredLinks(): Promise<number> {
    const expiredLinks = await this.shareLinkRepository.findExpiredLinks();

    let cleanedCount = 0;

    for (const link of expiredLinks) {
      // 停用過期連結
      await this.shareLinkRepository.update(link.id, {
        isActive: false,
      });

      // 清除快取
      await this.clearLinkCache(link.token);

      cleanedCount++;
    }

    if (cleanedCount > 0) {
      console.log(`[ShareLinkCleanup] Cleaned up ${cleanedCount} expired share links`);
    }

    return cleanedCount;
  }

  /**
   * 清理因非活躍而過期的分享連結
   * 實現需求 8.2, 8.5
   */
  async cleanupInactiveLinks(): Promise<number> {
    // 檢查不同的非活躍期間設定
    const inactivityPeriods = [1, 7, 14, 30, 60, 90]; // 天數
    let totalCleanedCount = 0;

    for (const days of inactivityPeriods) {
      const inactiveLinks =
        await this.shareLinkRepository.findInactiveExpiredLinks(days);

      for (const link of inactiveLinks) {
        // 停用非活躍連結
        await this.shareLinkRepository.update(link.id, {
          isActive: false,
        });

        // 清除快取
        await this.clearLinkCache(link.token);

        totalCleanedCount++;
      }
    }

    if (totalCleanedCount > 0) {
      console.log(`[ShareLinkCleanup] Cleaned up ${totalCleanedCount} inactive share links`);
    }

    return totalCleanedCount;
  }

  /**
   * 清除分享連結快取
   */
  private async clearLinkCache(token: string): Promise<void> {
    try {
      const cacheKey = `share-link:${token}`;

      await this.cacheStorage.del(cacheKey);
    } catch (error) {
      console.error('Failed to clear share link cache:', error);
    }
  }

  /**
   * 獲取清理統計資訊
   */
  async getCleanupStats(): Promise<{
    totalActiveLinks: number;
    expiredLinks: number;
    inactiveLinks: number;
  }> {
    const activeLinks = await this.shareLinkRepository.findActiveLinks();
    const expiredLinks = await this.shareLinkRepository.findExpiredLinks();

    // 計算所有非活躍連結
    let totalInactiveLinks = 0;
    const inactivityPeriods = [1, 7, 14, 30, 60, 90];

    for (const days of inactivityPeriods) {
      const inactiveLinks =
        await this.shareLinkRepository.findInactiveExpiredLinks(days);

      totalInactiveLinks += inactiveLinks.length;
    }

    return {
      totalActiveLinks: activeLinks.length,
      expiredLinks: expiredLinks.length,
      inactiveLinks: totalInactiveLinks,
    };
  }
}
