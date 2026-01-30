import { Injectable } from '@nestjs/common';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';

import { ShareLinkRepository } from '../repositories/share-link.repository';

import { ShareLinkData } from './share-link.service';

export interface ShareLinkValidationResult {
  isValid: boolean;
  shareLink?: ShareLinkData;
  errorCode?: ShareLinkErrorCode;
  errorMessage?: string;
}

export enum ShareLinkErrorCode {
  LINK_NOT_FOUND = 'LINK_NOT_FOUND',
  LINK_EXPIRED = 'LINK_EXPIRED',
  LINK_DISABLED = 'LINK_DISABLED',
  LINK_INACTIVE_EXPIRED = 'LINK_INACTIVE_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
}

// Redis 快取 TTL（5 分鐘）
const SHARE_LINK_CACHE_TTL = 5 * 60;

@Injectable()
export class ShareLinkValidationService {
  constructor(
    private readonly shareLinkRepository: ShareLinkRepository,
    @InjectCacheStorage(CacheStorageNamespace.EngineWorkspace)
    private readonly cacheStorage: CacheStorageService,
  ) {}

  /**
   * 生成快取鍵
   */
  private getCacheKey(token: string): string {
    return `share-link:${token}`;
  }

  /**
   * 從快取中獲取分享連結
   */
  private async getFromCache(token: string): Promise<ShareLinkData | null> {
    try {
      const cacheKey = this.getCacheKey(token);
      const cached = await this.cacheStorage.get<ShareLinkData>(cacheKey);

      return cached || null;
    } catch (error) {
      // 快取錯誤不應影響功能，記錄錯誤並繼續
      console.error('Cache get error:', error);

      return null;
    }
  }

  /**
   * 將分享連結存入快取
   */
  private async setToCache(
    token: string,
    shareLink: ShareLinkData,
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(token);

      await this.cacheStorage.set(cacheKey, shareLink, SHARE_LINK_CACHE_TTL);
    } catch (error) {
      // 快取錯誤不應影響功能，記錄錯誤並繼續
      console.error('Cache set error:', error);
    }
  }

  /**
   * 清除快取
   */
  async clearCache(token: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(token);

      await this.cacheStorage.del(cacheKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * 驗證分享連結的有效性（含快取）
   * 實現需求 5.5, 6.3, 2.2, 2.3
   * 實現需求 19.3 - Redis 快取整合
   */
  async validateShareLink(token: string): Promise<ShareLinkValidationResult> {
    // 檢查 token 格式
    if (!token || typeof token !== 'string' || token.length < 10) {
      return {
        isValid: false,
        errorCode: ShareLinkErrorCode.INVALID_TOKEN,
        errorMessage: 'Invalid token format',
      };
    }

    // 嘗試從快取獲取
    let shareLink = await this.getFromCache(token);

    // 如果快取中沒有，從資料庫查詢
    if (!shareLink) {
      const shareLinkEntity = await this.shareLinkRepository.findOne({
        where: { token },
      });

      if (!shareLinkEntity) {
        return {
          isValid: false,
          errorCode: ShareLinkErrorCode.LINK_NOT_FOUND,
          errorMessage: 'Share link not found',
        };
      }

      // 轉換為 ShareLinkData
      shareLink = {
        id: shareLinkEntity.id,
        token: shareLinkEntity.token,
        workspaceId: shareLinkEntity.workspaceId, // 包含 workspace 信息
        resourceType: shareLinkEntity.resourceType,
        resourceId: shareLinkEntity.resourceId,
        accessMode: shareLinkEntity.accessMode,
        isActive: shareLinkEntity.isActive,
        expiresAt: shareLinkEntity.expiresAt,
        inactivityExpirationDays: shareLinkEntity.inactivityExpirationDays,
        accessCount: shareLinkEntity.accessCount,
        lastAccessedAt: shareLinkEntity.lastAccessedAt,
        createdAt: shareLinkEntity.createdAt,
        updatedAt: shareLinkEntity.updatedAt,
        createdById: shareLinkEntity.createdById,
      };

      // 存入快取
      await this.setToCache(token, shareLink);
    }

    // 檢查連結是否啟用
    if (!shareLink.isActive) {
      return {
        isValid: false,
        shareLink,
        errorCode: ShareLinkErrorCode.LINK_DISABLED,
        errorMessage: 'Share link has been disabled',
      };
    }

    // 檢查時間過期
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return {
        isValid: false,
        shareLink,
        errorCode: ShareLinkErrorCode.LINK_EXPIRED,
        errorMessage: 'Share link has expired',
      };
    }

    // 檢查非活躍過期
    if (this.isInactivityExpired(shareLink)) {
      return {
        isValid: false,
        shareLink,
        errorCode: ShareLinkErrorCode.LINK_INACTIVE_EXPIRED,
        errorMessage: 'Share link expired due to inactivity',
      };
    }

    return {
      isValid: true,
      shareLink,
    };
  }

  /**
   * 檢查是否因非活躍而過期
   * 實現需求 8.2, 8.5
   */
  private isInactivityExpired(shareLink: ShareLinkData): boolean {
    if (!shareLink.inactivityExpirationDays) {
      return false;
    }

    const now = new Date();
    const lastActivity = shareLink.lastAccessedAt || shareLink.createdAt;
    const daysSinceLastActivity = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysSinceLastActivity >= shareLink.inactivityExpirationDays;
  }

  /**
   * 檢查訪問模式要求
   * 實現需求 2.2, 2.3, 2.5
   */
  isAuthenticationRequired(shareLink: ShareLinkData): boolean {
    return shareLink.accessMode === 'LOGIN_REQUIRED';
  }

  /**
   * 驗證工作區隔離
   * 實現需求 6.1, 6.2, 6.3, 6.4, 20.1-20.10, 21.1-21.7
   */
  async validateWorkspaceAccess(
    shareLink: ShareLinkData,
    requestedWorkspaceId?: string,
  ): Promise<boolean> {
    // 外部訪問（沒有指定 workspace）- 允許
    // 因為外部用戶通過 token 訪問，不需要 workspace 上下文
    if (!requestedWorkspaceId) {
      return true;
    }

    // 內部訪問 - 必須驗證 workspace 匹配
    // 確保用戶只能在自己的 workspace 中管理分享連結
    if (shareLink.workspaceId !== requestedWorkspaceId) {
      // eslint-disable-next-line no-console
      console.warn(
        `[ShareLink] Workspace mismatch: shareLink.workspaceId=${shareLink.workspaceId}, ` +
          `requestedWorkspaceId=${requestedWorkspaceId}`,
      );

      return false;
    }

    return true;
  }

  /**
   * 驗證資源所有權（基本完整性檢查）
   * 實現需求 21.1, 21.2, 21.3
   *
   * 注意：實際的資源存在性驗證由 ExternalContentService 執行
   * 因為它使用 TwentyORMGlobalManager 並傳入 workspaceId
   * 如果資源不存在於該 workspace，查詢會返回 null
   */
  validateResourceOwnership(shareLink: ShareLinkData): boolean {
    // 基本驗證：確保 shareLink 有必要的欄位
    if (!shareLink.workspaceId) {
      // eslint-disable-next-line no-console
      console.error('[ShareLink] Missing workspaceId:', shareLink.id);

      return false;
    }

    if (!shareLink.resourceId) {
      // eslint-disable-next-line no-console
      console.error('[ShareLink] Missing resourceId:', shareLink.id);

      return false;
    }

    if (!shareLink.resourceType) {
      // eslint-disable-next-line no-console
      console.error('[ShareLink] Missing resourceType:', shareLink.id);

      return false;
    }

    return true;
  }

  /**
   * 獲取用戶友好的錯誤消息
   */
  getErrorMessage(errorCode: ShareLinkErrorCode): string {
    switch (errorCode) {
      case ShareLinkErrorCode.LINK_NOT_FOUND:
        return 'The share link you are looking for does not exist or has been removed.';
      case ShareLinkErrorCode.LINK_EXPIRED:
        return 'This share link has expired. Please contact the person who shared it for a new link.';
      case ShareLinkErrorCode.LINK_DISABLED:
        return 'This share link has been disabled by the owner.';
      case ShareLinkErrorCode.LINK_INACTIVE_EXPIRED:
        return 'This share link has expired due to inactivity. Please contact the person who shared it for a new link.';
      case ShareLinkErrorCode.INVALID_TOKEN:
        return 'The share link format is invalid.';
      default:
        return 'Unable to access the shared content.';
    }
  }
}
