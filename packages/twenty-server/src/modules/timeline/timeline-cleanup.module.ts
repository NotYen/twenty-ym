import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TimelineCleanupCronJob } from 'src/modules/timeline/crons/timeline-cleanup.cron.job';
import { TimelineCleanupJob } from 'src/modules/timeline/jobs/timeline-cleanup.job';
import { TimelineCleanupService } from 'src/modules/timeline/services/timeline-cleanup.service';
import { TimelineCleanupCronCommand } from 'src/modules/timeline/commands/timeline-cleanup.cron.command';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity])],
  providers: [
    TimelineCleanupService,
    TimelineCleanupJob,
    TimelineCleanupCronJob,
    TimelineCleanupCronCommand,
  ],
  exports: [TimelineCleanupCronCommand],
})
export class TimelineCleanupModule {}
