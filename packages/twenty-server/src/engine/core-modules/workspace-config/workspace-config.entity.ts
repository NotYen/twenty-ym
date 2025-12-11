import { Field, ObjectType } from '@nestjs/graphql';

import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';

import { IDField } from '@ptc-org/nestjs-query-graphql';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('WorkspaceConfig')
@Entity({ name: 'workspace_config', schema: 'core' })
@Unique(['workspaceId', 'key'])
export class WorkspaceConfigEntity {
  @IDField(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'uuid' })
  @Index()
  workspaceId: string;

  @Field()
  @Column({ type: 'text' })
  key: string;

  @Field()
  @Column({ type: 'text' })
  value: string;

  @Field()
  @Column({ type: 'text' })
  valueType: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
