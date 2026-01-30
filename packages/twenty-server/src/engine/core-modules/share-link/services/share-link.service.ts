import { Injectable } from '@nestjs/common';

import { randomBytes } from 'crypto';

import {
    ShareLinkAccessMode,
    ShareLinkEntity,
} from 'src/engine/core-modules/share-link/entities/share-link.entity';
import { ShareLinkRepository } from 'src/engine/core-modules/share-link/repositories/share-link.repository';

export interface CreateShareLinkInput {
  resourceType: string; // 支援所有標準對象和自定義對象
  resourceId: string;
  accessMode: 'PUBLIC' | 'LOGIN_REQUIRED';
  expiresAt?: Date;
  inactivityExpirationDays?: number;
  workspaceId: string;
  createdById: string;
}

export interface ShareLinkData {
  id: string;
  token: string;
  workspaceId: string;
  resourceType: string;
  resourceId: string;
  accessMode: string;
  isActive: boolean;
  expiresAt: Date | null;
  inactivityExpirationDays: number | null;
  accessCount: number;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
}

export interface FindShareLinksByUserInput {
  workspaceId: string;
  userId: string;
}

export interface UpdateShareLinkInput {
  token: string;
  isActive?: boolean;
  expiresAt?: Date;
  inactivityExpirationDays?: number;
  workspaceId: string;
  userId: string;
}

export interface DeleteShareLinkInput {
  token: string;
  workspaceId: string;
  userId: string;
}

@Injectable()
export class ShareLinkService {
  constructor(private readonly shareLinkRepository: ShareLinkRepository) {}

  /**
   * 生成加密安全的唯一 token
   * 使用 256-bit 熵確保安全性
   */
  private generateSecureToken(): string {
    // 生成 32 bytes (256 bits) 的隨機數據
    const randomBuffer = randomBytes(32);

    // 轉換為 base64url 格式（URL 安全）
    return randomBuffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * 驗證 token 唯一性
   */
  private async ensureTokenUniqueness(
    token: string,
    workspaceId: string,
  ): Promise<string> {
    const existingLink = await this.shareLinkRepository.findOne({
      where: { token },
    });

    if (existingLink) {
      // 如果 token 已存在，遞歸生成新的
      const newToken = this.generateSecureToken();

      return this.ensureTokenUniqueness(newToken, workspaceId);
    }

    return token;
  }

  /**
   * 查找現有的啟用中分享連結
   * 實現智能重用邏輯 + 嚴格 workspace 隔離
   */
  async findActiveShareLink(
    resourceType: string,
    resourceId: string,
    workspaceId: string,
    userId: string,
  ): Promise<ShareLinkData | null> {
    const now = new Date();

    const shareLink = await this.shareLinkRepository.findOne({
      where: {
        workspaceId, // 嚴格 workspace 隔離
        resourceType: resourceType as any,
        resourceId,
        createdById: userId,
        isActive: true,
      },
    });

    if (!shareLink) {
      return null;
    }

    // 檢查是否已過期
    if (shareLink.expiresAt && shareLink.expiresAt < now) {
      return null;
    }

    // 檢查閒置過期
    if (shareLink.inactivityExpirationDays && shareLink.lastAccessedAt) {
      const daysSinceLastAccess = Math.floor(
        (now.getTime() - shareLink.lastAccessedAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastAccess > shareLink.inactivityExpirationDays) {
        return null;
      }
    }

    return this.mapToShareLinkData(shareLink);
  }

  /**
   * 創建分享連結或更新現有連結（智能重用 + 更新設定）
   * 實現需求 1.5, 1.6, 6.1
   */
  async createShareLink(input: CreateShareLinkInput): Promise<ShareLinkData> {
    // 先檢查是否已有啟用中的連結
    const existingLink = await this.findActiveShareLink(
      input.resourceType,
      input.resourceId,
      input.workspaceId,
      input.createdById,
    );

    if (existingLink) {
      // 如果有啟用中的連結，更新其設定並返回
      const updatedLink = await this.shareLinkRepository.update(
        existingLink.id,
        {
          accessMode:
            (input.accessMode === 'PUBLIC'
              ? ShareLinkAccessMode.PUBLIC
              : ShareLinkAccessMode.LOGIN_REQUIRED) as any,
          expiresAt: input.expiresAt || null,
          inactivityExpirationDays: input.inactivityExpirationDays || null,
        },
      );

      return this.mapToShareLinkData(updatedLink);
    }

    // 沒有啟用中的連結，生成新的
    const initialToken = this.generateSecureToken();
    const uniqueToken = await this.ensureTokenUniqueness(
      initialToken,
      input.workspaceId,
    );

    // 創建分享連結記錄
    const shareLink = await this.shareLinkRepository.create({
      token: uniqueToken,
      workspaceId: input.workspaceId, // 確保 workspace 隔離
      resourceType: input.resourceType as any,
      resourceId: input.resourceId,
      accessMode:
        (input.accessMode === 'PUBLIC'
          ? ShareLinkAccessMode.PUBLIC
          : ShareLinkAccessMode.LOGIN_REQUIRED) as any,
      isActive: true,
      expiresAt: input.expiresAt || null,
      inactivityExpirationDays: input.inactivityExpirationDays || null,
      accessCount: 0,
      lastAccessedAt: null,
      createdById: input.createdById,
    });

    return this.mapToShareLinkData(shareLink);
  }

  /**
   * 根據用戶查找分享連結
   * 實現需求 4.1, 4.2 + 嚴格 workspace 隔離
   */
  async findShareLinksByUser(
    input: FindShareLinksByUserInput,
  ): Promise<ShareLinkData[]> {
    const shareLinks = await this.shareLinkRepository.find({
      where: {
        workspaceId: input.workspaceId, // 嚴格 workspace 隔離
        createdById: input.userId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return shareLinks.map((link) => this.mapToShareLinkData(link));
  }

  /**
   * 更新分享連結
   * 實現需求 4.3, 4.4, 4.5 + 嚴格 workspace 隔離
   */
  async updateShareLink(input: UpdateShareLinkInput): Promise<ShareLinkData> {
    // 驗證用戶權限 - 只能更新自己創建的連結 + workspace 隔離
    const existingLink = await this.shareLinkRepository.findOne({
      where: {
        token: input.token,
        workspaceId: input.workspaceId, // 嚴格 workspace 隔離
        createdById: input.userId,
      },
    });

    if (!existingLink) {
      throw new Error('Share link not found or access denied');
    }

    // 更新連結
    const updatedLink = await this.shareLinkRepository.update(existingLink.id, {
      isActive: input.isActive ?? existingLink.isActive,
      expiresAt: input.expiresAt ?? existingLink.expiresAt,
      inactivityExpirationDays:
        input.inactivityExpirationDays ?? existingLink.inactivityExpirationDays,
    });

    // 注意：cache 清除由 ShareLinkValidationService 自己管理
    // 這裡不直接調用，避免循環依賴

    return this.mapToShareLinkData(updatedLink);
  }

  /**
   * 刪除分享連結
   * 實現需求 4.5 + 嚴格 workspace 隔離
   */
  async deleteShareLink(input: DeleteShareLinkInput): Promise<void> {
    // 驗證用戶權限 - 只能刪除自己創建的連結 + workspace 隔離
    const existingLink = await this.shareLinkRepository.findOne({
      where: {
        token: input.token,
        workspaceId: input.workspaceId, // 嚴格 workspace 隔離
        createdById: input.userId,
      },
    });

    if (!existingLink) {
      throw new Error('Share link not found or access denied');
    }

    await this.shareLinkRepository.delete(existingLink.id);

    // 注意：cache 清除由 ShareLinkValidationService 自己管理
    // 這裡不直接調用，避免循環依賴
  }

  /**
   * 根據 token 查找分享連結（用於外部訪問）
   */
  async findByToken(token: string): Promise<ShareLinkData | null> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { token },
    });

    if (!shareLink) {
      return null;
    }

    return this.mapToShareLinkData(shareLink);
  }

  /**
   * 記錄訪問（更新訪問計數和最後訪問時間）
   */
  async trackAccess(token: string): Promise<void> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { token },
    });

    if (shareLink) {
      await this.shareLinkRepository.update(shareLink.id, {
        accessCount: shareLink.accessCount + 1,
        lastAccessedAt: new Date(),
      });
    }
  }

  /**
   * 將實體映射為數據傳輸對象
   */
  private mapToShareLinkData(shareLink: ShareLinkEntity): ShareLinkData {
    return {
      id: shareLink.id,
      token: shareLink.token,
      workspaceId: shareLink.workspaceId, // 包含 workspace 信息
      resourceType: shareLink.resourceType,
      resourceId: shareLink.resourceId,
      accessMode: shareLink.accessMode,
      isActive: shareLink.isActive,
      expiresAt: shareLink.expiresAt,
      inactivityExpirationDays: shareLink.inactivityExpirationDays,
      accessCount: shareLink.accessCount,
      lastAccessedAt: shareLink.lastAccessedAt,
      createdAt: shareLink.createdAt,
      updatedAt: shareLink.updatedAt,
      createdById: shareLink.createdById,
    };
  }
}
