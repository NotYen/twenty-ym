import {
  type WorkflowAction,
  WorkflowActionType,
  type WorkflowSendLineMessageAction,
} from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action.type';

export const isWorkflowSendLineMessageAction = (
  action: WorkflowAction,
): action is WorkflowSendLineMessageAction => {
  return action.type === WorkflowActionType.SEND_LINE_MESSAGE;
};
