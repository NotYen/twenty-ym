import { type WorkflowTriggerType } from '@/workflow/types/Workflow';
import { OtherTriggerDefaultLabel } from '@/workflow/workflow-trigger/constants/OtherTriggerDefaultLabel';

export const MANUAL_TRIGGER: {
  defaultLabel: OtherTriggerDefaultLabel;
  type: WorkflowTriggerType;
  icon: string;
} = {
  defaultLabel: OtherTriggerDefaultLabel.LAUNCH_MANUALLY,
  type: 'MANUAL',
  icon: 'IconHandMove',
};
