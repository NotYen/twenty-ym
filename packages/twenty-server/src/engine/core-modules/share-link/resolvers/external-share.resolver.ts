import {
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    UseGuards,
    UsePipes,
} from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';

import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

import { ExternalAuthInput } from '../dto/external-auth.input';
import { AuthTokenDTO, SharedContentDTO } from '../dto/shared-content.dto';
import { ExternalContentService } from '../services/external-content.service';
import {
    ShareLinkErrorCode,
    ShareLinkValidationService,
} from '../services/share-link-validation.service';
import { ShareLinkService } from '../services/share-link.service';

/**
 * 外部分享連結解析器 - 不需要工作區認證
 * 實現需求 3.1, 2.2, 2.3
 *
 * 安全考量：
 * - 限制請求頻率防止暴力破解
 * - 不暴露內部系統資訊
 * - 嚴格驗證分享連結有效性
 * - 過濾敏感資料欄位
 */
@UsePipes(ResolverValidationPipe)
@Resolver()
export class ExternalShareResolver {
  constructor(
    private readonly shareLinkService: ShareLinkService,
    private readonly shareLinkValidationService: ShareLinkValidationService,
    private readonly externalContentService: ExternalContentService,
  ) {}

  /**
   * 獲取分享內容
   * 實現需求 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 20.1-20.10, 21.1-21.7
   *
   * 安全措施：
   * - 限制每小時 100 次請求
   * - 驗證分享連結有效性
   * - 驗證資源所有權（雙重檢查）
   * - 檢查認證要求
   * - 記錄訪問日誌
   * - 確保 workspace 隔離
   */
  @Query(() => SharedContentDTO, { nullable: true })
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  @Throttle({ default: { limit: 100, ttl: 3600000 } }) // 每小時 100 次請求
  async getSharedContent(
    @Args('token') token: string,
    @Args('authToken', { nullable: true }) authToken?: string,
  ): Promise<SharedContentDTO | null> {
    console.log('[ExternalShareResolver] 🔍 getSharedContent called with token:', token?.substring(0, 10) + '...');

    try {
      // 1. 驗證分享連結
      console.log('[ExternalShareResolver] Step 1: Validating share link...');
      const validationResult =
        await this.shareLinkValidationService.validateShareLink(token);

      console.log('[ExternalShareResolver] Validation result:', {
        isValid: validationResult.isValid,
        errorCode: validationResult.errorCode,
        hasShareLink: !!validationResult.shareLink,
      });

      if (!validationResult.isValid) {
        // 根據錯誤類型返回適當的錯誤
        switch (validationResult.errorCode) {
          case ShareLinkErrorCode.LINK_NOT_FOUND:
            throw new NotFoundException('Share link not found');
          case ShareLinkErrorCode.LINK_EXPIRED:
            throw new ForbiddenException('Share link has expired');
          case ShareLinkErrorCode.LINK_DISABLED:
            throw new ForbiddenException('Share link has been disabled');
          case ShareLinkErrorCode.LINK_INACTIVE_EXPIRED:
            throw new ForbiddenException(
              'Share link expired due to inactivity',
            );
          default:
            throw new ForbiddenException('Invalid share link');
        }
      }

      const shareLink = validationResult.shareLink!;

      // 2. 驗證資源所有權（雙重檢查 - 基本完整性）
      const isValidOwnership =
        this.shareLinkValidationService.validateResourceOwnership(shareLink);

      if (!isValidOwnership) {
        // 不洩露具體原因，統一錯誤訊息
        throw new ForbiddenException('Unable to access shared content');
      }

      // 3. 檢查認證要求
      if (this.shareLinkValidationService.isAuthenticationRequired(shareLink)) {
        if (!authToken) {
          throw new UnauthorizedException(
            'Authentication required for this share link',
          );
        }

        // 驗證認證 token（這裡需要實現外部認證邏輯）
        const isValidAuth = await this.validateExternalAuthToken(authToken);

        if (!isValidAuth) {
          throw new UnauthorizedException('Invalid authentication token');
        }
      }

      // 4. 記錄訪問（異步執行，不影響回應速度）
      console.log('[ExternalShareResolver] Step 4: Tracking access...');
      this.shareLinkService.trackAccess(token).catch((error) => {
        // 記錄錯誤但不影響主要流程
        console.error('Failed to track share link access:', error);
      });

      // 5. 獲取並返回內容
      // ExternalContentService 會使用 shareLink.workspaceId 確保 workspace 隔離
      // 如果資源不存在於該 workspace，會拋出 NotFoundException
      console.log('[ExternalShareResolver] Step 5: Getting content for resourceType:', shareLink.resourceType);
      const content = await this.externalContentService.getContentByShareLink(shareLink);

      console.log('[ExternalShareResolver] ✅ Content retrieved successfully:', {
        resourceType: content.resourceType,
        resourceId: content.resourceId,
        title: content.title,
        hasData: !!content.data,
        dataLength: content.data?.length,
      });

      return content;
    } catch (error) {
      // 確保不洩露內部錯誤資訊
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // 其他錯誤統一處理，不洩露具體資訊
      console.error('Error in getSharedContent:', error);
      throw new ForbiddenException('Unable to access shared content');
    }
  }

  /**
   * 外部用戶認證
   * 實現需求 2.3
   *
   * 安全措施：
   * - 限制登入嘗試次數
   * - 不暴露用戶是否存在
   */
  @Mutation(() => AuthTokenDTO, { nullable: true })
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  @Throttle({ default: { limit: 10, ttl: 900000 } }) // 每 15 分鐘 10 次嘗試
  async authenticateForSharedContent(
    @Args('input') authInput: ExternalAuthInput,
  ): Promise<AuthTokenDTO | null> {
    try {
      // 這裡需要實現外部用戶認證邏輯
      // 暫時返回 null，後續會在完整實現中處理
      return null;
    } catch (error) {
      // 統一錯誤回應，不暴露具體原因
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * 驗證外部認證 token
   * 私有方法，用於驗證外部用戶的認證狀態
   */
  private async validateExternalAuthToken(authToken: string): Promise<boolean> {
    // 這裡需要實現 JWT token 驗證邏輯
    // 暫時返回 false，後續會在完整實現中處理
    return false;
  }
}
