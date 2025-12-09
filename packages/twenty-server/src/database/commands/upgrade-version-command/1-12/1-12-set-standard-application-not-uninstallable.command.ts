import { InjectRepository } from '@nestjs/typeorm';

import { Command } from 'nest-commander';
import { Repository } from 'typeorm';

import {
  ActiveOrSuspendedWorkspacesMigrationCommandRunner,
  RunOnWorkspaceArgs,
} from 'src/database/commands/command-runners/active-or-suspended-workspaces-migration.command-runner';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';

// 標準應用的 universalIdentifier
const TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER =
  '20202020-0000-0000-0000-000000000001';

@Command({
  name: 'upgrade:1-12:set-standard-application-not-uninstallable',
  description: 'Set canBeUninstalled flag to false for standard applications',
})
export class SetStandardApplicationNotUninstallableCommand extends ActiveOrSuspendedWorkspacesMigrationCommandRunner {
  constructor(
    @InjectRepository(WorkspaceEntity)
    protected readonly workspaceRepository: Repository<WorkspaceEntity>,
    protected readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
  ) {
    super(workspaceRepository, twentyORMGlobalManager);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    try {
      this.logger.log(
        `Checking standard applications for workspace ${workspaceId}`,
      );

      const existingApplications = await this.applicationRepository.find({
        where: [
          {
            workspaceId,
            universalIdentifier:
              TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          },
          {
            workspaceId,
            description: 'Workspace custom application',
            sourcePath: 'workspace-custom',
          },
        ],
      });

      if (options.dryRun) {
        return;
      }

      for (const existingApplication of existingApplications) {
        await this.applicationRepository.update(
          { id: existingApplication.id },
          { canBeUninstalled: false },
        );
      }
      this.logger.log(`Successfully updated standard applications`);
    } catch (e) {
      this.logger.error(`Failed to update standard applications`, e);
    }
  }
}
