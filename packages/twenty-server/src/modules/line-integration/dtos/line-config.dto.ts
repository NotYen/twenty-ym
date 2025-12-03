import { Field, ObjectType, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * LINE Config Public DTO
 * 僅包含公開資訊，不包含敏感資料 (Secret, Access Token)
 */
@ObjectType()
export class LineConfigDTO {
  @Field({ nullable: true })
  channelId?: string;

  @Field()
  isConfigured: boolean;
}

/**
 * Update LINE Config Input
 * 用於更新 LINE Channel 設定
 */
@InputType()
export class UpdateLineConfigInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  channelSecret: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  channelAccessToken: string;
}

/**
 * LINE Connection Test Result DTO
 */
@ObjectType()
export class LineConnectionResultDTO {
  @Field()
  success: boolean;

  @Field(() => LineBotInfoDTO, { nullable: true })
  botInfo?: LineBotInfoDTO;

  @Field({ nullable: true })
  error?: string;
}

/**
 * LINE Bot Info DTO
 */
@ObjectType()
export class LineBotInfoDTO {
  @Field()
  displayName: string;

  @Field()
  userId: string;

  @Field({ nullable: true })
  pictureUrl?: string;
}

/**
 * Delete LINE Config Result DTO
 */
@ObjectType()
export class DeleteLineConfigResultDTO {
  @Field()
  success: boolean;
}

/**
 * Update LINE Config Result DTO
 */
@ObjectType()
export class UpdateLineConfigResultDTO {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;
}
