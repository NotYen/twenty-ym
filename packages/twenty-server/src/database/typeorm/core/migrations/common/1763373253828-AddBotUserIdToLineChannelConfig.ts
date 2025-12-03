import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBotUserIdToLineChannelConfig1763373253828
  implements MigrationInterface
{
  name = 'AddBotUserIdToLineChannelConfig1763373253828';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."lineChannelConfig" ADD "botUserId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."lineChannelConfig" ADD CONSTRAINT "UQ_LINE_CHANNEL_CONFIG_BOT_USER_ID" UNIQUE ("botUserId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID" ON "core"."lineChannelConfig" ("botUserId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "core"."IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."lineChannelConfig" DROP CONSTRAINT "UQ_LINE_CHANNEL_CONFIG_BOT_USER_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."lineChannelConfig" DROP COLUMN "botUserId"`,
    );
  }
}
