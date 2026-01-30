import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

import { ShareLinkCleanupService } from '../services/share-link-cleanup.service';

export type ShareLinkCleanupJobData = Record<string, never>;

@Processor(MessageQueue.cronQueue)
export class ShareLinkCleanupJob {
  constructor(
    private readonly shareLinkCleanupService: ShareLinkCleanupService,
  ) {}

  @Process(ShareLinkCleanupJob.name)
  async handle(_data: ShareLinkCleanupJobData): Promise<void> {
    await this.shareLinkCleanupService.cleanupExpiredLinks();
    await this.shareLinkCleanupService.cleanupInactiveLinks();
  }
}
