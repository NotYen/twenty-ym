import { Injectable, Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { TimelineCleanupService } from 'src/modules/timeline/services/timeline-cleanup.service';

export type TimelineCleanupJobData = {
  workspaceId: string;
  retentionDays: number;
};

@Injectable()
@Processor(MessageQueue.workspaceQueue)
export class TimelineCleanupJob {
  private readonly logger = new Logger(TimelineCleanupJob.name);

  constructor(
    private readonly timelineCleanupService: TimelineCleanupService,
  ) {}

  @Process(TimelineCleanupJob.name)
  async handle({ workspaceId, retentionDays }: TimelineCleanupJobData) {
    try {
      await this.timelineCleanupService.cleanupWorkspaceTimeline({
        workspaceId,
        retentionDays,
      });
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `Timeline cleanup failed for workspace ${workspaceId}`,
        stack,
      );
      throw error;
    }
  }
}
