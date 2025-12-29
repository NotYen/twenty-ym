import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class AddSuperAdminInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;
}
