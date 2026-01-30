import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PageLayoutWidgetEntity } from 'src/engine/core-modules/page-layout/entities/page-layout-widget.entity';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';

import { ShareLinkCleanupCronJob } from './crons/share-link-cleanup.cron.job';
import { ShareLinkCleanupJob } from './crons/share-link-cleanup.job';
import { ShareLinkAccessLogEntity } from './entities/share-link-access-log.entity';
import { ShareLinkEntity } from './entities/share-link.entity';
import { ShareLinkRepository } from './repositories/share-link.repository';
import { ExternalShareResolver } from './resolvers/external-share.resolver';
import { ShareLinkResolver } from './resolvers/share-link.resolver';
import { ExternalContentService } from './services/external-content.service';
import { ShareLinkAccessLogService } from './services/share-link-access-log.service';
import { ShareLinkCleanupService } from './services/share-link-cleanup.service';
import { ShareLinkValidationService } from './services/share-link-validation.service';
import { ShareLinkService } from './services/share-link.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShareLinkEntity,
      ShareLinkAccessLogEntity,
      PageLayoutWidgetEntity,
      ObjectMetadataEntity,
      FieldMetadataEntity,
    ]),
    TwentyORMModule,
    ObjectMetadataModule,
  ],
  providers: [
    ShareLinkRepository,
    ShareLinkService,
    ShareLinkValidationService,
    ShareLinkCleanupService,
    ShareLinkAccessLogService,
    ExternalContentService,
    ShareLinkResolver,
    ExternalShareResolver,
    ShareLinkCleanupCronJob,
    ShareLinkCleanupJob,
  ],
  exports: [
    ShareLinkService,
    ShareLinkValidationService,
    ShareLinkCleanupService,
    ShareLinkAccessLogService,
    ExternalContentService,
  ],
})
export class ShareLinkModule {}
