import { type WorkflowActionType } from '@/workflow/types/Workflow';
import { CODE_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/CodeAction';
import { HTTP_REQUEST_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/HttpRequestAction';
import { SEND_EMAIL_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/SendEmailAction';
import { SEND_LINE_MESSAGE_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/SendLineMessageAction';

export const CORE_ACTIONS: Array<{
  defaultLabel: string;
  type: Extract<
    WorkflowActionType,
    'CODE' | 'SEND_EMAIL' | 'SEND_LINE_MESSAGE' | 'HTTP_REQUEST'
  >;
  icon: string;
}> = [
  SEND_EMAIL_ACTION,
  SEND_LINE_MESSAGE_ACTION,
  CODE_ACTION,
  HTTP_REQUEST_ACTION,
];
