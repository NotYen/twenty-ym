import { z } from 'zod';

import { baseWorkflowActionSettingsSchema } from './base-workflow-action-settings-schema';

export const workflowSendLineMessageActionSettingsSchema =
  baseWorkflowActionSettingsSchema.extend({
    input: z.object({
      to: z.string(),  // LINE User ID or variable (e.g., {{trigger.person.lineUserId}})
      message: z.string(),   // Message content, supports variables (e.g., {{person.firstName}}, {{person.lastName}})
    }),
  });

