import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeShareLinkTokenToVarchar1737710000000
  implements MigrationInterface
{
  name = 'ChangeShareLinkTokenToVarchar1737710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 修改 token 欄位從 uuid 改為 varchar(255)
    await queryRunner.query(`
      ALTER TABLE "core"."shareLink"
      ALTER COLUMN "token" TYPE varchar(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滾：改回 uuid（注意：如果有非 UUID 格式的資料會失敗）
    await queryRunner.query(`
      ALTER TABLE "core"."shareLink"
      ALTER COLUMN "token" TYPE uuid USING "token"::uuid
    `);
  }
}
