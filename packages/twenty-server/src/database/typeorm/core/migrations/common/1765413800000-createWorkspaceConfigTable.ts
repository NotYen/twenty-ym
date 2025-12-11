import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceConfigTable1765413800000 implements MigrationInterface {
    name = 'CreateWorkspaceConfigTable1765413800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "core"."workspace_config" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "workspaceId" uuid NOT NULL,
                "key" text NOT NULL,
                "value" text NOT NULL,
                "valueType" text NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_workspace_config_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_workspace_config_workspaceId_key" UNIQUE ("workspaceId", "key")
            )`
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_workspace_config_workspaceId" ON "core"."workspace_config" ("workspaceId")`
        );

        await queryRunner.query(
            `ALTER TABLE "core"."workspace_config" ADD CONSTRAINT "FK_workspace_config_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "core"."workspace_config" DROP CONSTRAINT "FK_workspace_config_workspaceId"`
        );
        await queryRunner.query(`DROP INDEX "core"."IDX_workspace_config_workspaceId"`);
        await queryRunner.query(`DROP TABLE "core"."workspace_config"`);
    }
}
