import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateWorkspaceConfigInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  key: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  value: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  valueType?: string;
}
