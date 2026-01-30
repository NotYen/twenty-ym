import { type WorkflowTrigger } from '@/workflow/types/Workflow';
import { getTriggerDefaultLabel } from '@/workflow/workflow-trigger/utils/getTriggerDefaultLabel';
import { t } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

export const getTriggerHeaderType = (trigger: WorkflowTrigger) => {
  switch (trigger.type) {
    case 'CRON': {
      return t`Trigger · Cron`;
    }
    case 'WEBHOOK': {
      return t`Trigger · Webhook`;
    }
    case 'MANUAL': {
      return t`Trigger · Manual`;
    }
    case 'DATABASE_EVENT': {
      const defaultLabel = getTriggerDefaultLabel(trigger);

      return t`Trigger · ${defaultLabel}`;
    }
    default: {
      assertUnreachable(trigger, 'Unknown trigger type');
    }
  }
};
