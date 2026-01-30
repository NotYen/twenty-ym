import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateShareLinkTable1737600000000 implements MigrationInterface {
  name = 'CreateShareLinkTable1737600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "core"."shareLink_resourceType_enum" AS ENUM ('COMPANY', 'PERSON', 'SALES_QUOTE', 'DASHBOARD_CHART')`,
    );

    await queryRunner.query(
      `CREATE TYPE "core"."shareLink_accessMode_enum" AS ENUM ('PUBLIC', 'LOGIN_REQUIRED')`,
    );

    // Create shareLink table
    await queryRunner.query(
      `CREATE TABLE "core"."shareLink" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token" uuid NOT NULL,
        "workspaceId" uuid NOT NULL,
        "resourceType" "core"."shareLink_resourceType_enum" NOT NULL,
        "resourceId" uuid NOT NULL,
        "accessMode" "core"."shareLink_accessMode_enum" NOT NULL DEFAULT 'PUBLIC',
        "isActive" boolean NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP,
        "inactivityExpirationDays" integer,
        "accessCount" integer NOT NULL DEFAULT 0,
        "lastAccessedAt" TIMESTAMP,
        "createdById" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shareLink_id" PRIMARY KEY ("id")
      )`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_SHARE_LINK_TOKEN" ON "core"."shareLink" ("token")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_SHARE_LINK_WORKSPACE_ID" ON "core"."shareLink" ("workspaceId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_SHARE_LINK_RESOURCE" ON "core"."shareLink" ("workspaceId", "resourceType", "resourceId")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "core"."shareLink" ADD CONSTRAINT "FK_shareLink_workspace"
       FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "core"."shareLink" ADD CONSTRAINT "FK_shareLink_user"
       FOREIGN KEY ("createdById") REFERENCES "core"."user"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "core"."shareLink" DROP CONSTRAINT "FK_shareLink_user"`,
    );

    await queryRunner.query(
      `ALTER TABLE "core"."shareLink" DROP CONSTRAINT "FK_shareLink_workspace"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "core"."IDX_SHARE_LINK_RESOURCE"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_SHARE_LINK_WORKSPACE_ID"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_SHARE_LINK_TOKEN"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "core"."shareLink"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "core"."shareLink_accessMode_enum"`);
    await queryRunner.query(`DROP TYPE "core"."shareLink_resourceType_enum"`);
  }
}
