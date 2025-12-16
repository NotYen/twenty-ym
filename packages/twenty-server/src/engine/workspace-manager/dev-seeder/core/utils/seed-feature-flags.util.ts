import { type DataSource } from 'typeorm';

import { DEFAULT_FEATURE_FLAGS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/default-feature-flags';

const tableName = 'featureFlag';

/**
 * Seed feature flags for a workspace using the centralized DEFAULT_FEATURE_FLAGS
 * This ensures consistency between:
 * - Dev seeder (this function)
 * - activateWorkspace (workspace.service.ts)
 * - sync-feature-flags command
 */
export const seedFeatureFlags = async (
  dataSource: DataSource,
  schemaName: string,
  workspaceId: string,
) => {
  // Use the centralized DEFAULT_FEATURE_FLAGS to ensure consistency
  const featureFlagValues = DEFAULT_FEATURE_FLAGS.map((key) => ({
    key,
    workspaceId,
    value: true,
  }));

  await dataSource
    .createQueryBuilder()
    .insert()
    .into(`${schemaName}.${tableName}`, ['key', 'workspaceId', 'value'])
    .orIgnore()
    .values(featureFlagValues)
    .execute();
};

export const deleteFeatureFlags = async (
  dataSource: DataSource,
  schemaName: string,
  workspaceId: string,
) => {
  await dataSource
    .createQueryBuilder()
    .delete()
    .from(`${schemaName}.${tableName}`)
    .where(`"${tableName}"."workspaceId" = :workspaceId`, { workspaceId })
    .execute();
};
