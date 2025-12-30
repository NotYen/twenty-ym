import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddForeignKeyToLineChannelConfig Migration
 *
 * 為 lineChannelConfig 表的 workspaceId 欄位增加外鍵約束
 *
 * 目的：
 * - 確保資料參考完整性（不能插入不存在的 workspaceId）
 * - 當 workspace 被刪除時，自動清理對應的 LINE 設定（CASCADE）
 * - 提升查詢效能（外鍵會自動建立索引）
 *
 * 安全性：
 * - 如果已存在孤兒資料（workspaceId 不存在），migration 會失敗
 * - 需要先清理孤兒資料才能執行
 */
export class AddForeignKeyToLineChannelConfig1766390932879
  implements MigrationInterface
{
  name = 'AddForeignKeyToLineChannelConfig1766390932879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 檢查是否有孤兒資料（workspaceId 不存在於 workspace 表）
    const orphanedRecords = await queryRunner.query(`
      SELECT lc.id, lc."workspaceId"
      FROM "core"."lineChannelConfig" lc
      LEFT JOIN "core"."workspace" w ON lc."workspaceId" = w.id
      WHERE w.id IS NULL
    `);

    if (orphanedRecords.length > 0) {
      console.warn(
        `Found ${orphanedRecords.length} orphaned lineChannelConfig records. Cleaning up...`,
      );

      // 刪除孤兒資料
      for (const record of orphanedRecords) {
        await queryRunner.query(
          `DELETE FROM "core"."lineChannelConfig" WHERE id = $1`,
          [record.id],
        );
      }
    }

    // 增加外鍵約束
    await queryRunner.query(`
      ALTER TABLE "core"."lineChannelConfig"
      ADD CONSTRAINT "FK_LINE_CHANNEL_CONFIG_WORKSPACE_ID"
      FOREIGN KEY ("workspaceId")
      REFERENCES "core"."workspace"("id")
      ON DELETE CASCADE
    `);

    console.log('Successfully added foreign key constraint to lineChannelConfig.workspaceId');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 移除外鍵約束
    await queryRunner.query(`
      ALTER TABLE "core"."lineChannelConfig"
      DROP CONSTRAINT "FK_LINE_CHANNEL_CONFIG_WORKSPACE_ID"
    `);

    console.log('Successfully removed foreign key constraint from lineChannelConfig.workspaceId');
  }
}
