import { Field, ObjectType } from '@nestjs/graphql';

export interface SharedContentMetadata {
  workspaceName: string;
  workspaceLogo?: string;
  sharedAt: Date;
  expiresAt?: Date | null;
}

@ObjectType('SharedContent')
export class SharedContentDTO {
  @Field(() => String)
  resourceType: string;

  @Field(() => String)
  resourceId: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  data: string;

  @Field(() => String)
  metadata: string;
}

@ObjectType('ShareLinkAuthToken')
export class AuthTokenDTO {
  @Field(() => String)
  token: string;

  @Field(() => Date)
  expiresAt: Date;
}
