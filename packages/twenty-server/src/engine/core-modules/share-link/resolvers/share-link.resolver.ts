import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

import { CreateShareLinkInput } from '../dto/create-share-link.input';
import { ShareLinkDTO } from '../dto/share-link.dto';
import { UpdateShareLinkInput } from '../dto/update-share-link.input';
import { ShareLinkValidationService } from '../services/share-link-validation.service';
import { ShareLinkService } from '../services/share-link.service';

@UseGuards(WorkspaceAuthGuard, UserAuthGuard)
@UsePipes(ResolverValidationPipe)
@Resolver()
export class ShareLinkResolver {
  constructor(
    private readonly shareLinkService: ShareLinkService,
    private readonly shareLinkValidationService: ShareLinkValidationService,
  ) {}

  @Mutation(() => ShareLinkDTO)
  async createShareLink(
    @Args('input') input: CreateShareLinkInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: UserEntity,
  ): Promise<ShareLinkDTO> {
    const shareLink = await this.shareLinkService.createShareLink({
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      accessMode: input.accessMode,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      inactivityExpirationDays: input.inactivityExpirationDays,
      workspaceId: workspace.id,
      createdById: user.id,
    });

    return this.mapToDTO(shareLink);
  }

  @Query(() => [ShareLinkDTO])
  async getMyShareLinks(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: UserEntity,
  ): Promise<ShareLinkDTO[]> {
    const shareLinks = await this.shareLinkService.findShareLinksByUser({
      workspaceId: workspace.id,
      userId: user.id,
    });

    return shareLinks.map((link) => this.mapToDTO(link));
  }

  @Query(() => ShareLinkDTO, { nullable: true })
  async getActiveShareLink(
    @Args('resourceType') resourceType: string,
    @Args('resourceId') resourceId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: UserEntity,
  ): Promise<ShareLinkDTO | null> {
    const shareLink = await this.shareLinkService.findActiveShareLink(
      resourceType,
      resourceId,
      workspace.id,
      user.id,
    );

    return shareLink ? this.mapToDTO(shareLink) : null;
  }

  @Mutation(() => ShareLinkDTO)
  async updateShareLink(
    @Args('input') input: UpdateShareLinkInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: UserEntity,
  ): Promise<ShareLinkDTO> {
    const shareLink = await this.shareLinkService.updateShareLink({
      token: input.token,
      isActive: input.isActive,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      inactivityExpirationDays: input.inactivityExpirationDays,
      workspaceId: workspace.id,
      userId: user.id,
    });

    // 清除快取
    await this.shareLinkValidationService.clearCache(input.token);

    return this.mapToDTO(shareLink);
  }

  @Mutation(() => Boolean)
  async deleteShareLink(
    @Args('token') token: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: UserEntity,
  ): Promise<boolean> {
    await this.shareLinkService.deleteShareLink({
      token,
      workspaceId: workspace.id,
      userId: user.id,
    });

    // 清除快取
    await this.shareLinkValidationService.clearCache(token);

    return true;
  }

  private mapToDTO(shareLink: any): ShareLinkDTO {
    return {
      id: shareLink.id,
      token: shareLink.token,
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
