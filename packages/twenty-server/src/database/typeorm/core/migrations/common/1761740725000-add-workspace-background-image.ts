import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddWorkspaceBackgroundImage1761740725000
  implements MigrationInterface
{
  name = 'AddWorkspaceBackgroundImage1761740725000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ADD "backgroundImage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ADD "backgroundImageSettings" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" DROP COLUMN "backgroundImageSettings"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" DROP COLUMN "backgroundImage"`,
    );
  }
}
