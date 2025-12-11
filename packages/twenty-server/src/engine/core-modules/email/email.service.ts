import { Injectable } from '@nestjs/common';

import { type SendMailOptions } from 'nodemailer';

import {
    EmailSenderJob,
    type EmailSenderJobData,
} from 'src/engine/core-modules/email/email-sender.job';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

@Injectable()
export class EmailService {
  constructor(
    @InjectMessageQueue(MessageQueue.emailQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async send(
    sendMailOptions: SendMailOptions,
    workspaceId?: string,
  ): Promise<void> {
    await this.messageQueueService.add<EmailSenderJobData>(
      EmailSenderJob.name,
      {
        mailOptions: sendMailOptions,
        workspaceId,
      },
      { retryLimit: 3 },
    );
  }
}
