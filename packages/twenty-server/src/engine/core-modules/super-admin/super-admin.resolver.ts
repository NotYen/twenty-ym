import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AddSuperAdminInput } from 'src/engine/core-modules/super-admin/dtos/add-super-admin.input';
import { RemoveSuperAdminInput } from 'src/engine/core-modules/super-admin/dtos/remove-super-admin.input';
import { SuperAdminDTO } from 'src/engine/core-modules/super-admin/dtos/super-admin.dto';
import { SuperAdminService } from 'src/engine/core-modules/super-admin/super-admin.service';

@UseGuards(WorkspaceAuthGuard, UserAuthGuard, NoPermissionGuard)
@Resolver()
export class SuperAdminResolver {
  constructor(private readonly superAdminService: SuperAdminService) {}

  /**
   * Get all Super Admins including the Primary
   */
  @Query(() => [SuperAdminDTO])
  async getSuperAdmins(
    @AuthUser() currentUser: UserEntity,
  ): Promise<SuperAdminDTO[]> {
    // Only Super Admins can view the list
    const isSuperAdmin = await this.superAdminService.isSuperAdmin(
      currentUser.email,
    );

    if (!isSuperAdmin) {
      return [];
    }

    return this.superAdminService.getSuperAdmins();
  }

  /**
   * Check if the current user is a Super Admin
   */
  @Query(() => Boolean)
  async checkIsSuperAdmin(
    @AuthUser() currentUser: UserEntity,
  ): Promise<boolean> {
    return this.superAdminService.isSuperAdmin(currentUser.email);
  }

  /**
   * Check if the current user is the Primary Super Admin
   */
  @Query(() => Boolean)
  async checkIsPrimarySuperAdmin(
    @AuthUser() currentUser: UserEntity,
  ): Promise<boolean> {
    return this.superAdminService.isPrimarySuperAdmin(currentUser.email);
  }

  /**
   * Add a new Super Admin
   * Only Primary Super Admin can perform this action
   */
  @Mutation(() => SuperAdminDTO)
  async addSuperAdmin(
    @Args('input') input: AddSuperAdminInput,
    @AuthUser() currentUser: UserEntity,
  ): Promise<SuperAdminDTO> {
    return this.superAdminService.addSuperAdmin(
      input.userEmail,
      currentUser.email,
    );
  }

  /**
   * Remove a Super Admin
   * Only Primary Super Admin can perform this action
   */
  @Mutation(() => Boolean)
  async removeSuperAdmin(
    @Args('input') input: RemoveSuperAdminInput,
    @AuthUser() currentUser: UserEntity,
  ): Promise<boolean> {
    return this.superAdminService.removeSuperAdmin(
      input.userEmail,
      currentUser.email,
    );
  }
}
