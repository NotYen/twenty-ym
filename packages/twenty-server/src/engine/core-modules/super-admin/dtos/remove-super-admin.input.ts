import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class RemoveSuperAdminInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;
}
