import { type WorkflowTriggerType } from '@/workflow/types/Workflow';
import { OtherTriggerDefaultLabel } from '@/workflow/workflow-trigger/constants/OtherTriggerDefaultLabel';

export const WEBHOOK_TRIGGER: {
  defaultLabel: OtherTriggerDefaultLabel;
  type: WorkflowTriggerType;
  icon: string;
} = {
  defaultLabel: OtherTriggerDefaultLabel.WEBHOOK,
  type: 'WEBHOOK',
  icon: 'IconWebhook',
};
