import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * MigrateLineConfigToWorkspaceConfig Migration
 *
 * 將 LINE 頻道設定從 lineChannelConfig 表遷移到 workspace_config 表
 *
 * 變更內容：
 * 1. 在 workspace_config 表建立 line_bot_user_id 的唯一索引（用於 webhook 路由查詢）
 * 2. 刪除 lineChannelConfig 表及其相關索引和約束
 *
 * 注意：
 * - 此 migration 不會遷移現有資料，需要手動重新設定 LINE 頻道
 * - line_bot_user_id 不加密存儲，以支援索引查詢
 */
export class MigrateLineConfigToWorkspaceConfig1767000000000
  implements MigrationInterface
{
  name = 'MigrateLineConfigToWorkspaceConfig1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 在 workspace_config 表建立 line_bot_user_id 的唯一索引
    // 這個索引用於從 LINE webhook 的 destination (Bot User ID) 查詢對應的 workspaceId
    // 使用 partial index，僅針對 key = 'line_bot_user_id' 且未刪除的記錄
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_workspace_config_line_bot_user_id"
      ON "core"."workspace_config" ("value")
      WHERE "key" = 'line_bot_user_id' AND "deletedAt" IS NULL
    `);

    console.log(
      'Created unique index for line_bot_user_id on workspace_config',
    );

    // 2. 刪除 lineChannelConfig 表的外鍵約束
    await queryRunner.query(`
      ALTER TABLE "core"."lineChannelConfig"
      DROP CONSTRAINT IF EXISTS "FK_LINE_CHANNEL_CONFIG_WORKSPACE_ID"
    `);

    // 3. 刪除 lineChannelConfig 表的索引
    await queryRunner.query(
      `DROP INDEX IF EXISTS "core"."IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "core"."IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID_UNIQUE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "core"."IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID"`,
    );

    // 4. 刪除 botUserId 的唯一約束
    await queryRunner.query(`
      ALTER TABLE "core"."lineChannelConfig"
      DROP CONSTRAINT IF EXISTS "UQ_LINE_CHANNEL_CONFIG_BOT_USER_ID"
    `);

    // 5. 刪除 lineChannelConfig 表
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."lineChannelConfig"`);

    console.log('Successfully dropped lineChannelConfig table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. 重新建立 lineChannelConfig 表
    await queryRunner.query(`
      CREATE TABLE "core"."lineChannelConfig" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "channelId" character varying NOT NULL,
        "channelSecretEncrypted" text NOT NULL,
        "channelAccessTokenEncrypted" text NOT NULL,
        "botUserId" character varying,
        "workspaceId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lineChannelConfig" PRIMARY KEY ("id")
      )
    `);

    // 2. 重新建立索引
    await queryRunner.query(
      `CREATE INDEX "IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID" ON "core"."lineChannelConfig" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID_UNIQUE" ON "core"."lineChannelConfig" ("workspaceId")`,
    );

    // 3. 重新建立 botUserId 的唯一約束和索引
    await queryRunner.query(`
      ALTER TABLE "core"."lineChannelConfig"
      ADD CONSTRAINT "UQ_LINE_CHANNEL_CONFIG_BOT_USER_ID" UNIQUE ("botUserId")
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_LINE_CHANNEL_CONFIG_BOT_USER_ID" ON "core"."lineChannelConfig" ("botUserId")`,
    );

    // 4. 重新建立外鍵約束
    await queryRunner.query(`
      ALTER TABLE "core"."lineChannelConfig"
      ADD CONSTRAINT "FK_LINE_CHANNEL_CONFIG_WORKSPACE_ID"
      FOREIGN KEY ("workspaceId")
      REFERENCES "core"."workspace"("id")
      ON DELETE CASCADE
    `);

    // 5. 刪除 workspace_config 上的 line_bot_user_id 索引
    await queryRunner.query(
      `DROP INDEX IF EXISTS "core"."IDX_workspace_config_line_bot_user_id"`,
    );

    console.log('Successfully restored lineChannelConfig table');
  }
}
