import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CreateLineChannelConfig Migration
 *
 * 建立 LINE Official Account 設定表 (lineChannelConfig)
 *
 * 此 migration 應該在所有 LINE 相關 migration 之前執行
 * 包含以下欄位：
 * - id: UUID 主鍵
 * - channelId: LINE Channel ID
 * - channelSecretEncrypted: 加密後的 Channel Secret
 * - channelAccessTokenEncrypted: 加密後的 Channel Access Token
 * - workspaceId: 工作區 ID (支援多租戶)
 * - createdAt: 建立時間
 * - updatedAt: 更新時間
 *
 * 索引：
 * - IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID: workspaceId 索引
 * - IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID_UNIQUE: workspaceId 唯一索引 (一個 workspace 只能有一個 LINE 設定)
 */
export class CreateLineChannelConfig1763373200000
  implements MigrationInterface
{
  name = 'CreateLineChannelConfig1763373200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 建立 lineChannelConfig 表
    await queryRunner.query(
      `CREATE TABLE "core"."lineChannelConfig" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "channelId" character varying NOT NULL,
        "channelSecretEncrypted" text NOT NULL,
        "channelAccessTokenEncrypted" text NOT NULL,
        "workspaceId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lineChannelConfig" PRIMARY KEY ("id")
      )`,
    );

    // 建立 workspaceId 索引 (用於快速查詢)
    await queryRunner.query(
      `CREATE INDEX "IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID" ON "core"."lineChannelConfig" ("workspaceId")`,
    );

    // 建立 workspaceId 唯一索引 (確保一個 workspace 只能有一個 LINE 設定)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID_UNIQUE" ON "core"."lineChannelConfig" ("workspaceId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 移除索引
    await queryRunner.query(
      `DROP INDEX "core"."IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID_UNIQUE"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID"`,
    );

    // 移除表
    await queryRunner.query(`DROP TABLE "core"."lineChannelConfig"`);
  }
}
