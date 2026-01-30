import { Field, InputType } from '@nestjs/graphql';

import {
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

@InputType()
export class CreateShareLinkInput {
  @Field(() => String)
  @IsString()
  resourceType: string; // 支援所有標準對象和自定義對象

  @Field(() => String)
  @IsString()
  resourceId: string;

  @Field(() => String)
  @IsEnum(['PUBLIC', 'LOGIN_REQUIRED'])
  accessMode: 'PUBLIC' | 'LOGIN_REQUIRED';

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  inactivityExpirationDays?: number;
}
