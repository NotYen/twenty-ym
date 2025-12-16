import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Command, CommandRunner, Option } from 'nest-commander';
import { Repository } from 'typeorm';

import { FeatureFlagKey } from 'src/engine/core-modules/feature-flag/enums/feature-flag-key.enum';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { DEFAULT_FEATURE_FLAGS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/default-feature-flags';

interface SyncFeatureFlagsCommandOptions {
  workspaceId?: string;
  dryRun?: boolean;
}

@Command({
  name: 'workspace:sync-feature-flags',
  description: 'Sync default feature flags to all workspaces or a specific workspace',
})
export class SyncFeatureFlagsCommand extends CommandRunner {
  private readonly logger = new Logger(SyncFeatureFlagsCommand.name);

  constructor(
    @InjectRepository(WorkspaceEntity, 'core')
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly featureFlagService: FeatureFlagService,
  ) {
    super();
  }

  @Option({
    flags: '-w, --workspace-id [workspaceId]',
    description: 'Specific workspace ID to sync (optional, syncs all if not provided)',
  })
  parseWorkspaceId(val: string): string {
    return val;
  }

  @Option({
    flags: '-d, --dry-run',
    description: 'Show what would be done without making changes',
  })
  parseDryRun(): boolean {
    return true;
  }

  async run(
    _passedParams: string[],
    options: SyncFeatureFlagsCommandOptions,
  ): Promise<void> {
    const { workspaceId, dryRun } = options;

    this.logger.log('='.repeat(60));
    this.logger.log('Sync Feature Flags Command');
    this.logger.log('='.repeat(60));
    this.logger.log(`Default feature flags to sync: ${DEFAULT_FEATURE_FLAGS.length}`);
    this.logger.log(`Feature flags: ${DEFAULT_FEATURE_FLAGS.join(', ')}`);
    this.logger.log(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
    this.logger.log('='.repeat(60));

    let workspaces: WorkspaceEntity[];

    if (workspaceId) {
      const workspace = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });

      if (!workspace) {
        this.logger.error(`Workspace not found: ${workspaceId}`);
        return;
      }

      workspaces = [workspace];
    } else {
      workspaces = await this.workspaceRepository.find();
    }

    this.logger.log(`Found ${workspaces.length} workspace(s) to process`);

    for (const workspace of workspaces) {
      this.logger.log(`\nProcessing workspace: ${workspace.id} (${workspace.displayName || 'No name'})`);

      // Get current feature flags
      const currentFlags = await this.featureFlagService.getWorkspaceFeatureFlagsMap(workspace.id);
      const currentFlagKeys = Object.keys(currentFlags);

      // Find missing flags
      const missingFlags = DEFAULT_FEATURE_FLAGS.filter(
        (flag) => !currentFlagKeys.includes(flag) || !currentFlags[flag as FeatureFlagKey],
      );

      if (missingFlags.length === 0) {
        this.logger.log(`  ✓ All default feature flags are already enabled`);
        continue;
      }

      this.logger.log(`  Missing/disabled flags: ${missingFlags.join(', ')}`);

      if (dryRun) {
        this.logger.log(`  [DRY RUN] Would enable ${missingFlags.length} feature flag(s)`);
      } else {
        await this.featureFlagService.enableFeatureFlags(
          missingFlags as FeatureFlagKey[],
          workspace.id,
        );
        this.logger.log(`  ✓ Enabled ${missingFlags.length} feature flag(s)`);
      }
    }

    this.logger.log('\n' + '='.repeat(60));
    this.logger.log('Sync complete!');
    this.logger.log('='.repeat(60));
  }
}
