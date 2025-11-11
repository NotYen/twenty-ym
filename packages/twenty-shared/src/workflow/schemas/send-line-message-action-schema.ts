import { z } from 'zod';

import { baseWorkflowActionSchema } from './base-workflow-action-schema';
import { workflowSendLineMessageActionSettingsSchema } from './send-line-message-action-settings-schema';

export const workflowSendLineMessageActionSchema =
  baseWorkflowActionSchema.extend({
    type: z.literal('SEND_LINE_MESSAGE'),
    settings: workflowSendLineMessageActionSettingsSchema,
  });

