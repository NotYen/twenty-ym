import { type WorkflowTriggerType } from '@/workflow/types/Workflow';
import { type OtherTriggerDefaultLabel } from '@/workflow/workflow-trigger/constants/OtherTriggerDefaultLabel';
import { CRON_TRIGGER } from '@/workflow/workflow-trigger/constants/triggers/CronTrigger';
import { MANUAL_TRIGGER } from '@/workflow/workflow-trigger/constants/triggers/ManualTrigger';
import { WEBHOOK_TRIGGER } from '@/workflow/workflow-trigger/constants/triggers/WebhookTrigger';

export const OTHER_TRIGGER_TYPES: Array<{
  defaultLabel: OtherTriggerDefaultLabel;
  type: WorkflowTriggerType;
  icon: string;
}> = [MANUAL_TRIGGER, CRON_TRIGGER, WEBHOOK_TRIGGER];
