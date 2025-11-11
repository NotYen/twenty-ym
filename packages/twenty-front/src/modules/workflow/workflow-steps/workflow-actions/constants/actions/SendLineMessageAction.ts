import { type WorkflowActionType } from '@/workflow/types/Workflow';

export const SEND_LINE_MESSAGE_ACTION: {
  defaultLabel: string;
  type: Extract<WorkflowActionType, 'SEND_LINE_MESSAGE'>;
  icon: string;
} = {
  defaultLabel: 'Send LINE Message',
  type: 'SEND_LINE_MESSAGE',
  icon: 'IconMessage',
};

