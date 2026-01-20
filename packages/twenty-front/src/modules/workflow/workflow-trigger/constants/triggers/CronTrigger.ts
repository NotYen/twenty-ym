import { type WorkflowTriggerType } from '@/workflow/types/Workflow';
import { OtherTriggerDefaultLabel } from '@/workflow/workflow-trigger/constants/OtherTriggerDefaultLabel';

export const CRON_TRIGGER: {
  defaultLabel: OtherTriggerDefaultLabel;
  type: WorkflowTriggerType;
  icon: string;
} = {
  defaultLabel: OtherTriggerDefaultLabel.ON_A_SCHEDULE,
  type: 'CRON',
  icon: 'IconClock',
};
