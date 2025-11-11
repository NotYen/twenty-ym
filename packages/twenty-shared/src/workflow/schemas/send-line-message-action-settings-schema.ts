import { z } from 'zod';

import { baseWorkflowActionSettingsSchema } from './base-workflow-action-settings-schema';

export const workflowSendLineMessageActionSettingsSchema =
  baseWorkflowActionSettingsSchema.extend({
    input: z.object({
      to: z.string(),
      message: z.string(),
    }),
  });

