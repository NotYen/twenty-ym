import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

export enum ShareLinkResourceType {
  COMPANY = 'COMPANY',
  PERSON = 'PERSON',
  SALES_QUOTE = 'SALES_QUOTE',
  DASHBOARD_CHART = 'DASHBOARD_CHART',
}

export enum ShareLinkAccessMode {
  PUBLIC = 'PUBLIC',
  LOGIN_REQUIRED = 'LOGIN_REQUIRED',
}

registerEnumType(ShareLinkResourceType, {
  name: 'ShareLinkResourceType',
});

registerEnumType(ShareLinkAccessMode, {
  name: 'ShareLinkAccessMode',
});

@Entity({ name: 'shareLink', schema: 'core' })
@ObjectType('ShareLink')
@Index('IDX_SHARE_LINK_TOKEN', ['token'], { unique: true })
@Index('IDX_SHARE_LINK_WORKSPACE_ID', ['workspaceId'])
@Index('IDX_SHARE_LINK_RESOURCE', ['workspaceId', 'resourceType', 'resourceId'])
export class ShareLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Field(() => String)
  token: string;

  @Column({ type: 'uuid' })
  @Field(() => UUIDScalarType)
  workspaceId: string;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: WorkspaceEntity;

  @Column({
    type: 'enum',
    enum: ShareLinkResourceType,
  })
  @Field(() => ShareLinkResourceType)
  resourceType: ShareLinkResourceType;

  @Column({ type: 'uuid' })
  @Field(() => UUIDScalarType)
  resourceId: string;

  @Column({
    type: 'enum',
    enum: ShareLinkAccessMode,
    default: ShareLinkAccessMode.PUBLIC,
  })
  @Field(() => ShareLinkAccessMode)
  accessMode: ShareLinkAccessMode;

  @Column({ type: 'boolean', default: true })
  @Field(() => Boolean)
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => Date, { nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'int', nullable: true })
  @Field(() => Number, { nullable: true })
  inactivityExpirationDays: number | null;

  @Column({ type: 'int', default: 0 })
  @Field(() => Number)
  accessCount: number;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => Date, { nullable: true })
  lastAccessedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  @Field(() => UUIDScalarType, { nullable: true })
  createdById: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  @Field(() => UserEntity, { nullable: true })
  createdBy: UserEntity | null;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;
}
