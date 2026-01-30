import { type WorkflowTrigger } from '@/workflow/types/Workflow';
import { splitWorkflowTriggerEventName } from '@/workflow/utils/splitWorkflowTriggerEventName';
import { getDatabaseTriggerLabel } from '@/workflow/workflow-trigger/constants/DatabaseTriggerDefaultLabel';
import { DATABASE_TRIGGER_TYPES } from '@/workflow/workflow-trigger/constants/DatabaseTriggerTypes';
import { getOtherTriggerLabel } from '@/workflow/workflow-trigger/constants/OtherTriggerDefaultLabel';
import { OTHER_TRIGGER_TYPES } from '@/workflow/workflow-trigger/constants/OtherTriggerTypes';
import { isDefined } from 'twenty-shared/utils';

export const getTriggerDefaultLabel = (trigger: WorkflowTrigger): string => {
  if (trigger.type === 'DATABASE_EVENT') {
    const triggerEvent = splitWorkflowTriggerEventName(
      trigger.settings.eventName,
    );

    const matchedTrigger = DATABASE_TRIGGER_TYPES.find(
      (type) => type.event === triggerEvent.event,
    );

    if (!isDefined(matchedTrigger)) {
      throw new Error('Unknown trigger event');
    }

    return getDatabaseTriggerLabel(matchedTrigger.defaultLabel);
  }

  const matchedTrigger = OTHER_TRIGGER_TYPES.find(
    (item) => item.type === trigger.type,
  );

  if (!isDefined(matchedTrigger)) {
    throw new Error('Unknown trigger type');
  }

  return getOtherTriggerLabel(matchedTrigger.defaultLabel);
};
