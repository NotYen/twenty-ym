import { Field, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IDField } from '@ptc-org/nestjs-query-graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

/**
 * LINE Channel Config Entity
 *
 * 儲存 LINE Official Account 的設定資訊
 *
 * 安全性考量：
 * - channelSecret 和 channelAccessToken 在儲存前必須加密
 * - 加密/解密操作在 Service 層進行，而非 Entity 層
 * - 使用 workspace 級別隔離，支援多租戶
 */
@Index('IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID', ['workspaceId'])
@Entity({ name: 'lineChannelConfig', schema: 'core' })
@ObjectType('LineChannelConfig')
export class LineChannelConfigEntity {
  @IDField(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: false })
  channelId: string;

  /**
   * 加密後的 Channel Secret
   * 此欄位在資料庫中是加密狀態，需透過 Service 解密
   */
  @Column({ type: 'text' })
  channelSecretEncrypted: string;

  /**
   * 加密後的 Channel Access Token
   * 此欄位在資料庫中是加密狀態，需透過 Service 解密
   */
  @Column({ type: 'text' })
  channelAccessTokenEncrypted: string;

  /**
   * LINE Bot User ID (destination)
   * 用於從 Webhook 的 destination 欄位查詢對應的 workspace
   */
  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  @Index('IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID', { unique: true })
  botUserId: string | null;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid', unique: true })
  @Index('IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID_UNIQUE', { unique: true })
  workspaceId: string;

  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
