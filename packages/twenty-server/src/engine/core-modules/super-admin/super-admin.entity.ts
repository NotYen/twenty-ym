import { Field, ObjectType } from '@nestjs/graphql';
import { IDField } from '@ptc-org/nestjs-query-graphql';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@Entity({ name: 'super_admin', schema: 'core' })
@ObjectType('SuperAdmin')
@Index('IDX_SUPER_ADMIN_USER_EMAIL', ['userEmail'], { unique: true })
export class SuperAdminEntity {
  @IDField(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'text' })
  userEmail: string;

  @Field()
  @Column({ type: 'text' })
  grantedBy: string;

  @Field()
  @Column({ type: 'timestamptz' })
  grantedAt: Date;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
