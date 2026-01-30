import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateShareLinkAccessLogTable1737600001000
  implements MigrationInterface
{
  name = 'CreateShareLinkAccessLogTable1737600001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."shareLinkAccessLog" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "shareLinkId" uuid NOT NULL,
        "ipAddress" inet NOT NULL,
        "userAgent" text,
        "deviceType" character varying(50),
        "browserName" character varying(100),
        "operatingSystem" character varying(50),
        "countryCode" character varying(10),
        "city" character varying(100),
        "referrer" character varying(255),
        "accessMethod" character varying NOT NULL DEFAULT 'PUBLIC',
        "authenticatedUserId" uuid,
        "sessionDurationSeconds" integer NOT NULL DEFAULT 0,
        "isBot" boolean NOT NULL DEFAULT false,
        "accessedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shareLinkAccessLog" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_SHARE_LINK_ACCESS_LOG_SHARE_LINK_ID" ON "core"."shareLinkAccessLog" ("shareLinkId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_SHARE_LINK_ACCESS_LOG_ACCESSED_AT" ON "core"."shareLinkAccessLog" ("accessedAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_SHARE_LINK_ACCESS_LOG_IP_ADDRESS" ON "core"."shareLinkAccessLog" ("ipAddress")
    `);

    await queryRunner.query(`
      ALTER TABLE "core"."shareLinkAccessLog"
      ADD CONSTRAINT "FK_shareLinkAccessLog_shareLink"
      FOREIGN KEY ("shareLinkId")
      REFERENCES "core"."shareLink"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "core"."shareLinkAccessLog"
      DROP CONSTRAINT "FK_shareLinkAccessLog_shareLink"
    `);

    await queryRunner.query(`
      DROP INDEX "core"."IDX_SHARE_LINK_ACCESS_LOG_IP_ADDRESS"
    `);

    await queryRunner.query(`
      DROP INDEX "core"."IDX_SHARE_LINK_ACCESS_LOG_ACCESSED_AT"
    `);

    await queryRunner.query(`
      DROP INDEX "core"."IDX_SHARE_LINK_ACCESS_LOG_SHARE_LINK_ID"
    `);

    await queryRunner.query(`
      DROP TABLE "core"."shareLinkAccessLog"
    `);
  }
}
