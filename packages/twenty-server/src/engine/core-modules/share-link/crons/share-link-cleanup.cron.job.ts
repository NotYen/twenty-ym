import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

import { ShareLinkCleanupJob } from './share-link-cleanup.job';

@Injectable()
export class ShareLinkCleanupCronJob {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'share-link-cleanup',
    timeZone: 'UTC',
  })
  async handleShareLinkCleanup() {
    await this.messageQueueService.add(ShareLinkCleanupJob.name, {});
  }
}
