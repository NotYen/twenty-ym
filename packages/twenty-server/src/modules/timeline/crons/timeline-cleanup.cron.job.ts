import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TIMELINE_CLEANUP_CRON_PATTERN } from 'src/modules/timeline/constants/timeline-cleanup-cron-pattern.constant';
import {
  TimelineCleanupJob,
  type TimelineCleanupJobData,
} from 'src/modules/timeline/jobs/timeline-cleanup.job';

@Injectable()
@Processor(MessageQueue.cronQueue)
export class TimelineCleanupCronJob {
  private readonly logger = new Logger(TimelineCleanupCronJob.name);

  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  @Process(TimelineCleanupCronJob.name)
  @SentryCronMonitor(TimelineCleanupCronJob.name, TIMELINE_CLEANUP_CRON_PATTERN)
  async handle(): Promise<void> {
    const retentionDays = this.twentyConfigService.get(
      'TIMELINE_RETENTION_DAYS',
    );
    const workspaces = await this.getActiveWorkspaces();

    if (workspaces.length === 0) {
      this.logger.log('No active workspaces found for timeline cleanup');

      return;
    }

    this.logger.log(
      `Enqueuing timeline cleanup jobs for ${workspaces.length} workspace(s)`,
    );

    for (const workspace of workspaces) {
      try {
        await this.messageQueueService.add<TimelineCleanupJobData>(
          TimelineCleanupJob.name,
          {
            workspaceId: workspace.id,
            retentionDays,
          },
        );
      } catch (error) {
        this.exceptionHandlerService.captureExceptions([error], {
          workspace: {
            id: workspace.id,
          },
        });
      }
    }

    this.logger.log(
      `Successfully enqueued ${workspaces.length} timeline cleanup job(s)`,
    );
  }

  private async getActiveWorkspaces(): Promise<Array<{ id: string }>> {
    const workspaces = await this.workspaceRepository.find({
      where: {
        activationStatus: WorkspaceActivationStatus.ACTIVE,
      },
      select: ['id'],
      order: { id: 'ASC' },
    });

    if (workspaces.length === 0) {
      return [];
    }

    return workspaces.map((workspace) => ({ id: workspace.id }));
  }
}
