import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UpdateWorkspaceConfigInput } from 'src/engine/core-modules/workspace-config/dtos/update-workspace-config.input';
import { WorkspaceConfigDTO } from 'src/engine/core-modules/workspace-config/dtos/workspace-config.dto';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { PermissionFlagType } from 'src/engine/metadata-modules/permissions/constants/permission-flag-type.constants';

@UseGuards(
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.WORKSPACE),
)
@Resolver()
export class WorkspaceConfigResolver {
  constructor(
    private readonly workspaceConfigService: WorkspaceConfigService,
  ) {}

  @Mutation(() => Boolean)
  async updateWorkspaceConfig(
    @Args('input') { key, value, valueType }: UpdateWorkspaceConfigInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<boolean> {
    await this.workspaceConfigService.set(
      currentWorkspace.id,
      key,
      value,
      valueType || 'string',
    );
    return true;
  }

  @Query(() => [WorkspaceConfigDTO])
  async getWorkspaceConfigs(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<WorkspaceConfigDTO[]> {
    // We need to implement a findAll method in service or use repository directly?
    // Service only has get(key).
    // I need to update the service to support listing configs.
    // For now, I will add getKeys or direct repository access logic to service.

    // Wait, the service encapsulates encryption.
    // If I list all, I need to decrypt all.
    // I should check if WorkspaceConfigService has a findAll method.
    // In previous steps I viewed the service and it didn't seem to have findAll.
    // I will write this resolver assuming I will add getAll to service.

    return this.workspaceConfigService.getAll(currentWorkspace.id);
  }
}
