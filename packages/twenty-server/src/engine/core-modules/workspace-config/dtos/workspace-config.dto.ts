import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('WorkspaceConfigDTO')
export class WorkspaceConfigDTO {
  @Field()
  key: string;

  @Field()
  value: string;

  @Field()
  valueType: string;
}
