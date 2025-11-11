import { z } from 'zod';

export const LineMessagingToolParametersZodSchema = z.object({
  to: z.string().min(1, 'LINE user ID is required'),
  message: z.string().min(1, 'Message is required'),
});

