import { Field, ID, ObjectType } from '@nestjs/graphql';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

import { ShareLinkEntity } from './share-link.entity';

@Entity({ name: 'shareLinkAccessLog', schema: 'core' })
@ObjectType('ShareLinkAccessLog')
@Index('IDX_SHARE_LINK_ACCESS_LOG_SHARE_LINK_ID', ['shareLinkId'])
@Index('IDX_SHARE_LINK_ACCESS_LOG_ACCESSED_AT', ['accessedAt'])
@Index('IDX_SHARE_LINK_ACCESS_LOG_IP_ADDRESS', ['ipAddress'])
export class ShareLinkAccessLogEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  @Field(() => UUIDScalarType)
  shareLinkId: string;

  @ManyToOne(() => ShareLinkEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shareLinkId' })
  shareLink: ShareLinkEntity;

  @Column({ type: 'inet' })
  @Field(() => String)
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Field(() => String, { nullable: true })
  deviceType: string | null; // 'desktop', 'mobile', 'tablet', 'bot'

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Field(() => String, { nullable: true })
  browserName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Field(() => String, { nullable: true })
  operatingSystem: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @Field(() => String, { nullable: true })
  countryCode: string | null; // ISO 3166-1 alpha-2

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Field(() => String, { nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  referrer: string | null;

  @Column({
    type: 'enum',
    enum: ['PUBLIC', 'LOGIN_REQUIRED'],
    default: 'PUBLIC',
  })
  @Field(() => String)
  accessMethod: 'PUBLIC' | 'LOGIN_REQUIRED';

  @Column({ type: 'uuid', nullable: true })
  @Field(() => UUIDScalarType, { nullable: true })
  authenticatedUserId: string | null;

  @Column({ type: 'int', default: 0 })
  @Field(() => Number)
  sessionDurationSeconds: number;

  @Column({ type: 'boolean', default: false })
  @Field(() => Boolean)
  isBot: boolean;

  @CreateDateColumn()
  @Field(() => Date)
  accessedAt: Date;
}
