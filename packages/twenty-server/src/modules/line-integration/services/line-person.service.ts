import { Injectable, Logger } from '@nestjs/common';

import { TwentyORMManager } from 'src/engine/twenty-orm/twenty-orm.manager';

/**
 * LINE Person Service
 *
 * 管理 LINE 使用者與 Twenty CRM Person 實體的整合
 * 使用 TwentyORMManager 存取 Person 資料
 */
@Injectable()
export class LinePersonService {
  private readonly logger = new Logger(LinePersonService.name);

  constructor(private readonly twentyORMManager: TwentyORMManager) {}

  /**
   * 根據 LINE User ID 查詢 Person
   */
  async findByLineUserId(lineUserId: string): Promise<any | null> {
    try {
      const personRepository =
        await this.twentyORMManager.getRepository('person');

      const person = await personRepository.findOne({
        where: { lineUserId },
      });

      return person;
    } catch (error) {
      this.logger.error(
        `Failed to find person by LINE User ID: ${lineUserId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 從 LINE Profile 建立或更新 Person
   *
   * @param lineProfile - LINE API 返回的使用者資料
   * @returns 建立或更新的 Person 實體
   */
  async createOrUpdateFromLineProfile(lineProfile: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  }): Promise<any> {
    try {
      const personRepository =
        await this.twentyORMManager.getRepository('person');

      // 檢查是否已存在
      const existingPerson = await personRepository.findOne({
        where: { lineUserId: lineProfile.userId },
      });

      if (existingPerson) {
        // 更新現有 Person
        this.logger.log(
          `Updating existing person with LINE User ID: ${lineProfile.userId}`,
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
          `Creating new person from LINE profile: ${lineProfile.userId}`,
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
        `Failed to create/update person from LINE profile: ${lineProfile.userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 更新 Person 的 LINE 狀態
   *
   * @param lineUserId - LINE User ID
   * @param status - 新狀態 (active, blocked, unlinked)
   */
  async updateLineStatus(
    lineUserId: string,
    status: 'active' | 'blocked' | 'unlinked',
  ): Promise<void> {
    try {
      const personRepository =
        await this.twentyORMManager.getRepository('person');

      const result = await personRepository.update(
        { lineUserId },
        {
          lineStatus: status,
          lastLineInteractionAt: new Date(),
        },
      );

      if (result.affected === 0) {
        this.logger.warn(
          `No person found with LINE User ID: ${lineUserId} to update status`,
        );
      } else {
        this.logger.log(
          `Updated LINE status to "${status}" for user: ${lineUserId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update LINE status for user: ${lineUserId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 批次更新多個 Person 的最後互動時間
   *
   * @param lineUserIds - LINE User ID 陣列
   */
  async updateLastInteractionTime(lineUserIds: string[]): Promise<void> {
    if (lineUserIds.length === 0) return;

    try {
      const personRepository =
        await this.twentyORMManager.getRepository('person');

      await personRepository
        .createQueryBuilder()
        .update()
        .set({ lastLineInteractionAt: new Date() })
        .where('lineUserId IN (:...ids)', { ids: lineUserIds })
        .execute();

      this.logger.log(
        `Updated last interaction time for ${lineUserIds.length} LINE users`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to batch update last interaction time`,
        error,
      );
      throw error;
    }
  }

  /**
   * 取得所有有 LINE 連結的 Person 數量
   */
  async getLineLinkedPersonCount(): Promise<number> {
    try {
      const personRepository =
        await this.twentyORMManager.getRepository('person');

      const count = await personRepository.count({
        where: {
          lineUserId: { $ne: null } as any,
        },
      });

      return count;
    } catch (error) {
      this.logger.error(`Failed to count LINE-linked persons`, error);
      throw error;
    }
  }
}
