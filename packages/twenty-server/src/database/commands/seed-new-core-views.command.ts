import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { Command } from 'nest-commander';
import { STANDARD_OBJECT_IDS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { DataSource, In, Repository } from 'typeorm';

import {
  ActiveOrSuspendedWorkspacesMigrationCommandRunner,
  type RunOnWorkspaceArgs,
} from 'src/database/commands/command-runners/active-or-suspended-workspaces-migration.command-runner';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { DataSourceEntity } from 'src/engine/metadata-modules/data-source/data-source.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { ViewEntity } from 'src/engine/metadata-modules/view/entities/view.entity';
import { ViewKey } from 'src/engine/metadata-modules/view/enums/view-key.enum';
import { WorkspaceEntityManager } from 'src/engine/twenty-orm/entity-manager/workspace-entity-manager';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { shouldSeedWorkspaceFavorite } from 'src/engine/utils/should-seed-workspace-favorite';
import { createCoreViews } from 'src/engine/workspace-manager/standard-objects-prefill-data/prefill-core-views';
import { prefillWorkspaceFavorites } from 'src/engine/workspace-manager/standard-objects-prefill-data/prefill-workspace-favorites';
import { calendarEventsAllView } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/calendar-events-all.view';
import { messageThreadsAllView } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/message-threads-all.view';
import { messagesAllView } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/messages-all.view';
import { workspaceMembersAllView } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/workspace-members-all.view';

@Command({
  name: 'workspace:seed-new-core-views',
  description:
    'Seed new core views (Workspace Members, Messages, Message Threads, Calendar Events) for existing workspaces',
})
export class SeedNewCoreViewsCommand extends ActiveOrSuspendedWorkspacesMigrationCommandRunner {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    @InjectRepository(WorkspaceEntity)
    protected readonly workspaceRepository: Repository<WorkspaceEntity>,
    protected readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
    @InjectRepository(DataSourceEntity)
    private readonly dataSourceRepository: Repository<DataSourceEntity>,
    @InjectRepository(ViewEntity)
    private readonly viewRepository: Repository<ViewEntity>,
  ) {
    super(workspaceRepository, twentyORMGlobalManager);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    // 獲取需要的 object metadata
    const objectMetadataItems = await this.objectMetadataRepository.find({
      where: {
        workspaceId,
        standardId: In([
          STANDARD_OBJECT_IDS.workspaceMember,
          STANDARD_OBJECT_IDS.message,
          STANDARD_OBJECT_IDS.messageThread,
          STANDARD_OBJECT_IDS.calendarEvent,
        ]),
      },
      relations: ['fields'],
    });

    if (objectMetadataItems.length === 0) {
      this.logger.log(
        `No required object metadata found for workspace ${workspaceId}. Skipping...`,
      );

      return;
    }

    // 檢查每個 object 是否已有 INDEX view
    const viewsToCreate: Array<{
      viewDefinition: ReturnType<
        | typeof workspaceMembersAllView
        | typeof messagesAllView
        | typeof messageThreadsAllView
        | typeof calendarEventsAllView
      >;
      objectMetadataId: string;
      objectName: string;
    }> = [];

    // Workspace Members
    const workspaceMemberMetadata = objectMetadataItems.find(
      (om) => om.standardId === STANDARD_OBJECT_IDS.workspaceMember,
    );

    if (isDefined(workspaceMemberMetadata)) {
      const existingViews = await this.viewRepository.find({
        where: {
          workspaceId,
          objectMetadataId: workspaceMemberMetadata.id,
          key: ViewKey.INDEX,
        },
      });

      if (existingViews.length === 0) {
        viewsToCreate.push({
          viewDefinition: workspaceMembersAllView(
            [workspaceMemberMetadata],
            true,
          ),
          objectMetadataId: workspaceMemberMetadata.id,
          objectName: 'Workspace Members',
        });
      } else {
        this.logger.log(
          `Workspace Members view already exists for workspace ${workspaceId}. Skipping...`,
        );
      }
    }

    // Messages
    const messageMetadata = objectMetadataItems.find(
      (om) => om.standardId === STANDARD_OBJECT_IDS.message,
    );

    if (isDefined(messageMetadata)) {
      const existingViews = await this.viewRepository.find({
        where: {
          workspaceId,
          objectMetadataId: messageMetadata.id,
          key: ViewKey.INDEX,
        },
      });

      if (existingViews.length === 0) {
        viewsToCreate.push({
          viewDefinition: messagesAllView([messageMetadata], true),
          objectMetadataId: messageMetadata.id,
          objectName: 'Messages',
        });
      } else {
        this.logger.log(
          `Messages view already exists for workspace ${workspaceId}. Skipping...`,
        );
      }
    }

    // Message Threads
    const messageThreadMetadata = objectMetadataItems.find(
      (om) => om.standardId === STANDARD_OBJECT_IDS.messageThread,
    );

    if (isDefined(messageThreadMetadata)) {
      const existingViews = await this.viewRepository.find({
        where: {
          workspaceId,
          objectMetadataId: messageThreadMetadata.id,
          key: ViewKey.INDEX,
        },
      });

      if (existingViews.length === 0) {
        viewsToCreate.push({
          viewDefinition: messageThreadsAllView([messageThreadMetadata], true),
          objectMetadataId: messageThreadMetadata.id,
          objectName: 'Message Threads',
        });
      } else {
        this.logger.log(
          `Message Threads view already exists for workspace ${workspaceId}. Skipping...`,
        );
      }
    }

    // Calendar Events
    const calendarEventMetadata = objectMetadataItems.find(
      (om) => om.standardId === STANDARD_OBJECT_IDS.calendarEvent,
    );

    if (isDefined(calendarEventMetadata)) {
      const existingViews = await this.viewRepository.find({
        where: {
          workspaceId,
          objectMetadataId: calendarEventMetadata.id,
          key: ViewKey.INDEX,
        },
      });

      if (existingViews.length === 0) {
        viewsToCreate.push({
          viewDefinition: calendarEventsAllView([calendarEventMetadata], true),
          objectMetadataId: calendarEventMetadata.id,
          objectName: 'Calendar Events',
        });
      } else {
        this.logger.log(
          `Calendar Events view already exists for workspace ${workspaceId}. Skipping...`,
        );
      }
    }

    if (viewsToCreate.length === 0) {
      this.logger.log(
        `All views already exist for workspace ${workspaceId}. Nothing to create.`,
      );

      return;
    }

    if (options.dryRun) {
      this.logger.log(
        `Would have created ${viewsToCreate.length} view(s) for workspace ${workspaceId}: ${viewsToCreate.map((v) => v.objectName).join(', ')}`,
      );

      return;
    }

    const schema = await this.dataSourceRepository.findOne({
      where: {
        workspaceId,
      },
    });

    if (!isDefined(schema)) {
      throw new Error(`Schema not found for workspace ${workspaceId}`);
    }

    const queryRunner = this.coreDataSource.createQueryRunner();

    await queryRunner.connect();

    try {
      const viewDefinitions = viewsToCreate.map((v) => v.viewDefinition);
      const createdViews = await createCoreViews(
        queryRunner,
        workspaceId,
        viewDefinitions,
      );

      // 只為 INDEX views 且符合條件的創建 favorites
      const viewsToFavorite = createdViews.filter(
        (view) =>
          view.key === ViewKey.INDEX &&
          shouldSeedWorkspaceFavorite(
            view.objectMetadataId,
            objectMetadataItems,
          ),
      );

      if (viewsToFavorite.length > 0) {
        await prefillWorkspaceFavorites(
          viewsToFavorite.map((view) => view.id),
          queryRunner.manager as WorkspaceEntityManager,
          schema.schema,
        );
      }

      this.logger.log(
        `Successfully created ${createdViews.length} view(s) for workspace ${workspaceId}: ${createdViews.map((view) => view.name).join(', ')}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
