import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context as GqlContext,
} from '@nestjs/graphql';
import { UseFilters, UseGuards, UsePipes, Logger } from '@nestjs/common';

import { LineConfigService } from 'src/modules/line-integration/services/line-config.service';
import { LineApiService } from 'src/modules/line-integration/services/line-api.service';
import {
  LineConfigDTO,
  UpdateLineConfigInput,
  LineConnectionResultDTO,
  DeleteLineConfigResultDTO,
  UpdateLineConfigResultDTO,
  LineBotInfoDTO,
} from 'src/modules/line-integration/dtos/line-config.dto';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

/**
 * LINE Config GraphQL Resolver
 *
 * 提供 GraphQL API 供前端管理 LINE Channel 設定
 *
 * 安全性：
 * - 使用 WorkspaceAuthGuard 驗證使用者權限
 * - 僅返回公開資訊給前端 (不包含 Secret 和 Token)
 * - 所有敏感資料在後端加密儲存
 *
 * Queries:
 * - lineConfig: 取得公開設定 (不包含敏感資訊)
 *
 * Mutations:
 * - updateLineConfig: 更新 LINE Channel 設定
 * - testLineConnection: 測試 LINE 連線
 * - deleteLineConfig: 刪除 LINE Channel 設定
 */
@Resolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(AuthGraphqlApiExceptionFilter)
@UseGuards(WorkspaceAuthGuard)
export class LineConfigResolver {
  private readonly logger = new Logger(LineConfigResolver.name);

  constructor(
    private readonly lineConfigService: LineConfigService,
    private readonly lineApiService: LineApiService,
  ) {}

  /**
   * 取得 LINE 設定 (僅公開資訊)
   *
   * 返回值不包含敏感資料 (Channel Secret, Access Token)
   */
  @Query(() => LineConfigDTO, {
    name: 'lineConfig',
    description: 'Get LINE channel configuration (public info only)',
  })
  async getLineConfig(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<LineConfigDTO> {
    this.logger.log(`Getting LINE config for workspace ${workspace.id}`);

    try {
      const config = await this.lineConfigService.getPublicConfig(workspace.id);

      return {
        channelId: config?.channelId,
        isConfigured: config?.isConfigured || false,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get LINE config for workspace ${workspace.id}: ${error.message}`,
      );
      // 返回未設定狀態，不拋出錯誤
      return {
        channelId: undefined,
        isConfigured: false,
      };
    }
  }

  /**
   * 更新 LINE 設定
   *
   * 接收完整的 Channel 設定並加密儲存
   */
  @Mutation(() => UpdateLineConfigResultDTO, {
    name: 'updateLineConfig',
    description: 'Update LINE channel configuration',
  })
  async updateLineConfig(
    @Args('input', { type: () => UpdateLineConfigInput })
    input: UpdateLineConfigInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<UpdateLineConfigResultDTO> {
    this.logger.log(`Updating LINE config for workspace ${workspace.id}`);

    try {
      await this.lineConfigService.createOrUpdate(workspace.id, {
        channelId: input.channelId,
        channelSecret: input.channelSecret,
        channelAccessToken: input.channelAccessToken,
      });

      this.logger.log(
        `Successfully updated LINE config for workspace ${workspace.id}`,
      );

      return {
        success: true,
        message: 'LINE configuration updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to update LINE config for workspace ${workspace.id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 測試 LINE 連線
   *
   * 呼叫 LINE Bot Info API 驗證設定是否正確
   */
  @Mutation(() => LineConnectionResultDTO, {
    name: 'testLineConnection',
    description: 'Test LINE channel connection and retrieve bot info',
  })
  async testLineConnection(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<LineConnectionResultDTO> {
    this.logger.log(`Testing LINE connection for workspace ${workspace.id}`);

    try {
      const result = await this.lineApiService.testConnection(workspace.id);

      if (result.success && result.botInfo) {
        this.logger.log(
          `LINE connection test successful for workspace ${workspace.id}, bot: ${result.botInfo.displayName}`,
        );

        return {
          success: true,
          botInfo: {
            displayName: result.botInfo.displayName,
            userId: result.botInfo.userId,
            pictureUrl: result.botInfo.pictureUrl,
          },
        };
      } else {
        this.logger.warn(
          `LINE connection test failed for workspace ${workspace.id}: ${result.error}`,
        );

        return {
          success: false,
          error: result.error || 'Unknown error',
        };
      }
    } catch (error) {
      this.logger.error(
        `LINE connection test error for workspace ${workspace.id}: ${error.message}`,
      );

      return {
        success: false,
        error: error.message || 'Connection test failed',
      };
    }
  }

  /**
   * 刪除 LINE 設定
   *
   * 移除所有儲存的 LINE Channel 設定
   */
  @Mutation(() => DeleteLineConfigResultDTO, {
    name: 'deleteLineConfig',
    description: 'Delete LINE channel configuration',
  })
  async deleteLineConfig(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DeleteLineConfigResultDTO> {
    this.logger.log(`Deleting LINE config for workspace ${workspace.id}`);

    try {
      await this.lineConfigService.delete(workspace.id);

      this.logger.log(
        `Successfully deleted LINE config for workspace ${workspace.id}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete LINE config for workspace ${workspace.id}: ${error.message}`,
      );
      throw error;
    }
  }
}
