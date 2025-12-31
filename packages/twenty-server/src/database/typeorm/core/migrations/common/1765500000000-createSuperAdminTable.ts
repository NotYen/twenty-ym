import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuperAdminTable1765500000000 implements MigrationInterface {
    name = 'CreateSuperAdminTable1765500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "core"."super_admin" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userEmail" text NOT NULL,
                "grantedBy" text NOT NULL,
                "grantedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_super_admin_id" PRIMARY KEY ("id")
            )`
        );

        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_SUPER_ADMIN_USER_EMAIL" ON "core"."super_admin" ("userEmail")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "core"."IDX_SUPER_ADMIN_USER_EMAIL"`);
        await queryRunner.query(`DROP TABLE "core"."super_admin"`);
    }
}
