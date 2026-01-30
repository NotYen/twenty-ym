import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ShareLinkDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  token: string;

  @Field(() => String)
  resourceType: string;

  @Field(() => String)
  resourceId: string;

  @Field(() => String)
  accessMode: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date;

  @Field(() => Number, { nullable: true })
  inactivityExpirationDays?: number;

  @Field(() => Number)
  accessCount: number;

  @Field(() => Date, { nullable: true })
  lastAccessedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  createdById?: string;
}
