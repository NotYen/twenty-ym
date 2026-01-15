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
import { salesQuoteLineItemsAllView } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/sales-quote-line-items-all.view';
import { salesQuotesAllView } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/sales-quotes-all.view';

@Command({
  name: 'workspace:seed-sales-quote-views',
  description:
    'Seed Sales Quote and Sales Quote Line Item views for existing workspaces',
})
export class SeedSalesQuoteViewsCommand extends ActiveOrSuspendedWorkspacesMigrationCommandRunner {
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
    // 獲取 salesQuote 和 salesQuoteLineItem 的 object metadata
    const objectMetadataItems = await this.objectMetadataRepository.find({
      where: {
        workspaceId,
        standardId: In([
          STANDARD_OBJECT_IDS.salesQuote,
          STANDARD_OBJECT_IDS.salesQuoteLineItem,
        ]),
      },
      relations: ['fields'],
    });

    this.logger.log(
      `Found ${objectMetadataItems.length} sales quote related object metadata for workspace ${workspaceId}`,
    );

    if (objectMetadataItems.length === 0) {
      this.logger.warn(
        `⚠️ No salesQuote or salesQuoteLineItem object metadata found for workspace ${workspaceId}.`,
      );
      this.logger.warn(
        `This means the standard objects were not synced. Run 'yarn command:prod workspace:sync-metadata' first.`,
      );

      return;
    }

    // 列出找到的 metadata
    objectMetadataItems.forEach((om) => {
      this.logger.log(
        `  - ${om.nameSingular} (standardId: ${om.standardId}, id: ${om.id}, fields: ${om.fields.length})`,
      );
    });

    const viewsToCreate: Array<{
      viewDefinition: ReturnType<
        typeof salesQuotesAllView | typeof salesQuoteLineItemsAllView
      >;
      objectMetadataId: string;
      objectName: string;
    }> = [];

    // Sales Quote
    const salesQuoteMetadata = objectMetadataItems.find(
      (om) => om.standardId === STANDARD_OBJECT_IDS.salesQuote,
    );

    if (isDefined(salesQuoteMetadata)) {
      const existingViews = await this.viewRepository.find({
        where: {
          workspaceId,
          objectMetadataId: salesQuoteMetadata.id,
          key: ViewKey.INDEX,
        },
      });

      if (existingViews.length === 0) {
        viewsToCreate.push({
          viewDefinition: salesQuotesAllView(objectMetadataItems, true),
          objectMetadataId: salesQuoteMetadata.id,
          objectName: 'Sales Quotes',
        });
      } else {
        this.logger.log(
          `✓ Sales Quotes view already exists for workspace ${workspaceId}. Skipping...`,
        );
      }
    } else {
      this.logger.warn(
        `⚠️ salesQuote object metadata not found for workspace ${workspaceId}`,
      );
    }

    // Sales Quote Line Item
    const salesQuoteLineItemMetadata = objectMetadataItems.find(
      (om) => om.standardId === STANDARD_OBJECT_IDS.salesQuoteLineItem,
    );

    if (isDefined(salesQuoteLineItemMetadata)) {
      const existingViews = await this.viewRepository.find({
        where: {
          workspaceId,
          objectMetadataId: salesQuoteLineItemMetadata.id,
          key: ViewKey.INDEX,
        },
      });

      if (existingViews.length === 0) {
        viewsToCreate.push({
          viewDefinition: salesQuoteLineItemsAllView(objectMetadataItems, true),
          objectMetadataId: salesQuoteLineItemMetadata.id,
          objectName: 'Sales Quote Line Items',
        });
      } else {
        this.logger.log(
          `✓ Sales Quote Line Items view already exists for workspace ${workspaceId}. Skipping...`,
        );
      }
    } else {
      this.logger.warn(
        `⚠️ salesQuoteLineItem object metadata not found for workspace ${workspaceId}`,
      );
    }

    if (viewsToCreate.length === 0) {
      this.logger.log(
        `All sales quote views already exist for workspace ${workspaceId}. Nothing to create.`,
      );

      return;
    }

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Would create ${viewsToCreate.length} view(s) for workspace ${workspaceId}: ${viewsToCreate.map((v) => v.objectName).join(', ')}`,
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

      // 為 INDEX views 創建 favorites
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
        this.logger.log(
          `✓ Created ${viewsToFavorite.length} workspace favorite(s)`,
        );
      }

      this.logger.log(
        `✓ Successfully created ${createdViews.length} view(s) for workspace ${workspaceId}: ${createdViews.map((view) => view.name).join(', ')}`,
      );
    } catch (error) {
      this.logger.error(`Failed to create views: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
