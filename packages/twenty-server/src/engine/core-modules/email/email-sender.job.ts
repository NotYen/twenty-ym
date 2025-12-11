import { SendMailOptions } from 'nodemailer';

import { EmailSenderService } from 'src/engine/core-modules/email/email-sender.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

export interface EmailSenderJobData {
  mailOptions: SendMailOptions;
  workspaceId?: string;
}

@Processor(MessageQueue.emailQueue)
export class EmailSenderJob {
  constructor(private readonly emailSenderService: EmailSenderService) {}

  @Process(EmailSenderJob.name)
  async handle(data: EmailSenderJobData): Promise<void> {
    const { mailOptions, workspaceId } = data;
    await this.emailSenderService.send(mailOptions, workspaceId);
  }
}
