import { type WorkflowSendLineMessageActionInput } from 'src/modules/workflow/workflow-executor/workflow-actions/line-message/types/workflow-send-line-message-action-input.type';
import { type BaseWorkflowActionSettings } from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action-settings.type';

export type WorkflowSendLineMessageActionSettings =
  BaseWorkflowActionSettings & {
    input: WorkflowSendLineMessageActionInput;
  };
