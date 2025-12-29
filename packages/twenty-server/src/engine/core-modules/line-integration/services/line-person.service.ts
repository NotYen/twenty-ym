import { Injectable, Logger } from '@nestjs/common';

import { WorkspaceDatasourceFactory } from 'src/engine/twenty-orm/factories/workspace-datasource.factory';

/**
 * LINE Person Service
 *
 * 管理 LINE 使用者與 Twenty CRM Person 實體的整合
 * 使用 WorkspaceDataSourceFactory 存取 Person 資料
 *
 * ⚠️ 重要：所有方法都需要明確傳入 workspaceId
 * 因為 Service 在異步處理中調用，REQUEST scope context 已丟失
 */
@Injectable()
export class LinePersonService {
  private readonly logger = new Logger(LinePersonService.name);

  constructor(
    private readonly workspaceDataSourceFactory: WorkspaceDatasourceFactory,
  ) {}

  /**
   * 根據 LINE User ID 查詢 Person
   *
   * @param workspaceId - Workspace ID
   * @param lineUserId - LINE User ID
   */
  async findByLineUserId(
    workspaceId: string,
    lineUserId: string,
  ): Promise<any | null> {
    try {
      const workspaceDataSource =
        await this.workspaceDataSourceFactory.create(workspaceId);
      const personRepository = workspaceDataSource.getRepository(
        'person',
        { shouldBypassPermissionChecks: true },
      );

      const person = await personRepository.findOne({
        where: { lineUserId },
      });

      return person;
    } catch (error) {
      this.logger.error(
        `Failed to find person by LINE User ID: ${lineUserId} in workspace ${workspaceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 從 LINE Profile 建立或更新 Person
   *
   * @param workspaceId - Workspace ID
   * @param lineProfile - LINE API 返回的使用者資料
   * @returns 建立或更新的 Person 實體
   */
  async createOrUpdateFromLineProfile(
    workspaceId: string,
    lineProfile: {
      userId: string;
      displayName: string;
      pictureUrl?: string;
      statusMessage?: string;
    },
  ): Promise<any> {
    try {
      const workspaceDataSource =
        await this.workspaceDataSourceFactory.create(workspaceId);
      const personRepository = workspaceDataSource.getRepository(
        'person',
        { shouldBypassPermissionChecks: true },
      );

      // 檢查是否已存在
      const existingPerson = await personRepository.findOne({
        where: { lineUserId: lineProfile.userId },
      });

      if (existingPerson) {
        // 更新現有 Person
        this.logger.log(
          `Updating existing person with LINE User ID: ${lineProfile.userId} in workspace ${workspaceId}`,
        );

        await personRepository.update(
          { lineUserId: lineProfile.userId },
          {
            lineDisplayName: lineProfile.displayName,
            lineProfilePictureUrl: lineProfile.pictureUrl || null,
            lineStatus: 'active',
            lastLineInteractionAt: new Date(),
          },
        );

        return personRepository.findOne({
          where: { lineUserId: lineProfile.userId },
        });
      } else {
        // 建立新 Person
        this.logger.log(
          `Creating new person from LINE profile: ${lineProfile.userId} in workspace ${workspaceId}`,
        );

        const newPerson = personRepository.create({
          lineUserId: lineProfile.userId,
          lineDisplayName: lineProfile.displayName,
          lineProfilePictureUrl: lineProfile.pictureUrl || null,
          lineStatus: 'active',
          lastLineInteractionAt: new Date(),
          // 使用 LINE Display Name 作為預設姓名
          name: {
            firstName: lineProfile.displayName,
            lastName: '',
          },
        });

        return personRepository.save(newPerson);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create/update person from LINE profile: ${lineProfile.userId} in workspace ${workspaceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 更新 Person 的 LINE 狀態
   *
   * @param workspaceId - Workspace ID
   * @param lineUserId - LINE User ID
   * @param status - 新狀態 (active, blocked, unlinked)
   * @returns true 表示成功更新，false 表示找不到對應的 person
   */
  async updateLineStatus(
    workspaceId: string,
    lineUserId: string,
    status: 'active' | 'blocked' | 'unlinked',
  ): Promise<boolean> {
    try {
      const workspaceDataSource =
        await this.workspaceDataSourceFactory.create(workspaceId);
      const personRepository = workspaceDataSource.getRepository(
        'person',
        { shouldBypassPermissionChecks: true },
      );

      const result = await personRepository.update(
        { lineUserId },
        {
          lineStatus: status,
          lastLineInteractionAt: new Date(),
        },
      );

      if (result.affected === 0) {
        this.logger.warn(
          `No person found with LINE User ID: ${lineUserId} in workspace ${workspaceId} to update status`,
        );
        return false;
      } else {
        this.logger.log(
          `Updated LINE status to "${status}" for user: ${lineUserId} in workspace ${workspaceId}`,
        );
        return true;
      }
    } catch (error) {
      this.logger.error(
        `Failed to update LINE status for user: ${lineUserId} in workspace ${workspaceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 建立最小資料的 Person（當無法取得 LINE Profile 時使用）
   *
   * 使用場景：unfollow 事件等無法取得完整用戶資料的情況
   * 因為 LINE API 在 unfollow 後會拒絕 getProfile 請求
   *
   * @param workspaceId - Workspace ID
   * @param lineUserId - LINE User ID
   * @param status - LINE 狀態 (blocked 或 unlinked)
   * @returns 建立的 Person 實體
   */
  async createMinimalPerson(
    workspaceId: string,
    lineUserId: string,
    status: 'blocked' | 'unlinked',
  ): Promise<any> {
    try {
      const workspaceDataSource =
        await this.workspaceDataSourceFactory.create(workspaceId);
      const personRepository = workspaceDataSource.getRepository(
        'person',
        { shouldBypassPermissionChecks: true },
      );

      // 使用 userId 的前8碼作為暫時的顯示名稱
      const tempName = `LINE User ${lineUserId.substring(0, 8)}`;

      const newPerson = personRepository.create({
        lineUserId: lineUserId,
        lineDisplayName: tempName,
        lineStatus: status,
        lastLineInteractionAt: new Date(),
        name: {
          firstName: tempName,
          lastName: '',
        },
      });

      this.logger.log(
        `Creating minimal person for LINE user ${lineUserId} with status "${status}" in workspace ${workspaceId}`,
      );

      return personRepository.save(newPerson);
    } catch (error) {
      this.logger.error(
        `Failed to create minimal person for LINE user: ${lineUserId} in workspace ${workspaceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 批次更新多個 Person 的最後互動時間
   *
   * @param workspaceId - Workspace ID
   * @param lineUserIds - LINE User ID 陣列
   */
  async updateLastInteractionTime(
    workspaceId: string,
    lineUserIds: string[],
  ): Promise<void> {
    if (lineUserIds.length === 0) return;

    try {
      const workspaceDataSource =
        await this.workspaceDataSourceFactory.create(workspaceId);
      const personRepository = workspaceDataSource.getRepository(
        'person',
        { shouldBypassPermissionChecks: true },
      );

      await personRepository
        .createQueryBuilder()
        .update()
        .set({ lastLineInteractionAt: new Date() })
        .where('lineUserId IN (:...ids)', { ids: lineUserIds })
        .execute();

      this.logger.log(
        `Updated last interaction time for ${lineUserIds.length} LINE users in workspace ${workspaceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to batch update last interaction time in workspace ${workspaceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 取得所有有 LINE 連結的 Person 數量
   *
   * @param workspaceId - Workspace ID
   */
  async getLineLinkedPersonCount(workspaceId: string): Promise<number> {
    try {
      const workspaceDataSource =
        await this.workspaceDataSourceFactory.create(workspaceId);
      const personRepository = workspaceDataSource.getRepository(
        'person',
        { shouldBypassPermissionChecks: true },
      );

      const count = await personRepository.count({
        where: {
          lineUserId: { $ne: null } as any,
        },
      });

      return count;
    } catch (error) {
      this.logger.error(
        `Failed to count LINE-linked persons in workspace ${workspaceId}`,
        error,
      );
      throw error;
    }
  }
}
