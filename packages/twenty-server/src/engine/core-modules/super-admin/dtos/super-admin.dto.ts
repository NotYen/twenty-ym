import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('SuperAdminDTO')
export class SuperAdminDTO {
  @Field()
  id: string;

  @Field()
  userEmail: string;

  @Field()
  grantedBy: string;

  @Field()
  grantedAt: Date;

  @Field()
  isPrimary: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
