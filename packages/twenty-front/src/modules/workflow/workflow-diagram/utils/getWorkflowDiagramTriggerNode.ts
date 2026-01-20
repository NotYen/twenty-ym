import { type WorkflowTrigger } from '@/workflow/types/Workflow';
import { splitWorkflowTriggerEventName } from '@/workflow/utils/splitWorkflowTriggerEventName';
import { type WorkflowDiagramStepNodeData } from '@/workflow/workflow-diagram/types/WorkflowDiagram';
import { getDatabaseTriggerLabel } from '@/workflow/workflow-trigger/constants/DatabaseTriggerDefaultLabel';
import { DATABASE_TRIGGER_TYPES } from '@/workflow/workflow-trigger/constants/DatabaseTriggerTypes';
import { getOtherTriggerLabel, OtherTriggerDefaultLabel } from '@/workflow/workflow-trigger/constants/OtherTriggerDefaultLabel';
import { getTriggerIcon } from '@/workflow/workflow-trigger/utils/getTriggerIcon';
import { t } from '@lingui/core/macro';
import { type Node } from '@xyflow/react';
import { assertUnreachable, isDefined } from 'twenty-shared/utils';
import { TRIGGER_STEP_ID } from 'twenty-shared/workflow';

export const getWorkflowDiagramTriggerNode = ({
  trigger,
}: {
  trigger: WorkflowTrigger;
}): Node<WorkflowDiagramStepNodeData> => {
  let triggerDefaultLabel: string;
  let triggerIcon: string | undefined;

  switch (trigger.type) {
    case 'MANUAL': {
      triggerDefaultLabel = t`Manual trigger`;
      triggerIcon = getTriggerIcon(trigger);

      break;
    }
    case 'CRON': {
      triggerDefaultLabel = getOtherTriggerLabel(
        OtherTriggerDefaultLabel.ON_A_SCHEDULE,
      );
      triggerIcon = getTriggerIcon(trigger);

      break;
    }
    case 'WEBHOOK': {
      triggerDefaultLabel = getOtherTriggerLabel(
        OtherTriggerDefaultLabel.WEBHOOK,
      );
      triggerIcon = getTriggerIcon(trigger);

      break;
    }
    case 'DATABASE_EVENT': {
      const triggerEvent = splitWorkflowTriggerEventName(
        trigger.settings.eventName,
      );

      const matchedTrigger = DATABASE_TRIGGER_TYPES.find(
        (item) => item.event === triggerEvent.event,
      );
      triggerDefaultLabel = matchedTrigger
        ? getDatabaseTriggerLabel(matchedTrigger.defaultLabel)
        : '';

      triggerIcon = getTriggerIcon(trigger);

      break;
    }
    default: {
      return assertUnreachable(
        trigger,
        `Expected the trigger "${JSON.stringify(trigger)}" to be supported.`,
      );
    }
  }

  return {
    id: TRIGGER_STEP_ID,
    data: {
      nodeType: 'trigger',
      triggerType: trigger.type,
      name: isDefined(trigger.name) ? trigger.name : triggerDefaultLabel,
      icon: triggerIcon,
      stepId: 'trigger',
      hasNextStepIds:
        isDefined(trigger.nextStepIds) && trigger.nextStepIds.length > 0,
      position: trigger.position ?? {
        x: 0,
        y: 0,
      },
    } satisfies WorkflowDiagramStepNodeData,
    position: trigger.position ?? {
      x: 0,
      y: 0,
    },
  };
};
