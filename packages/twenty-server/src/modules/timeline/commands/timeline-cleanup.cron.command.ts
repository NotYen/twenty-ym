import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { TIMELINE_CLEANUP_CRON_PATTERN } from 'src/modules/timeline/constants/timeline-cleanup-cron-pattern.constant';
import { TimelineCleanupCronJob } from 'src/modules/timeline/crons/timeline-cleanup.cron.job';

@Command({
  name: 'cron:timeline-cleanup',
  description: 'Starts a cron job to clean up old timeline activities',
})
export class TimelineCleanupCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: TimelineCleanupCronJob.name,
      data: undefined,
      options: {
        repeat: {
          pattern: TIMELINE_CLEANUP_CRON_PATTERN,
        },
      },
    });
  }
}
