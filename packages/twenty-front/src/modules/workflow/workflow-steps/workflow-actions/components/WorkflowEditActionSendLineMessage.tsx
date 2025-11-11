import { SidePanelHeader } from '@/command-menu/components/SidePanelHeader';
import { WorkflowVariablePicker } from '@/workflow/workflow-variables/components/WorkflowVariablePicker';
import { type WorkflowSendLineMessageAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { WorkflowStepFooter } from '@/workflow/workflow-steps/components/WorkflowStepFooter';
import { SEND_LINE_MESSAGE_ACTION } from '@/workflow/workflow-steps/workflow-actions/constants/actions/SendLineMessageAction';
import { useWorkflowActionHeader } from '@/workflow/workflow-steps/workflow-actions/hooks/useWorkflowActionHeader';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { useIcons } from 'twenty-ui/display';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

type WorkflowEditActionSendLineMessageProps = {
  action: WorkflowSendLineMessageAction;
  actionOptions:
    | {
        readonly: true;
      }
    | {
        readonly?: false;
        onActionUpdate: (action: WorkflowSendLineMessageAction) => void;
      };
};

type SendLineMessageFormData = {
  to: string;
  message: string;
};

export const WorkflowEditActionSendLineMessage = ({
  action,
  actionOptions,
}: WorkflowEditActionSendLineMessageProps) => {
  const { getIcon } = useIcons();
  const [formData, setFormData] = useState<SendLineMessageFormData>({
    to: action.settings.input.to,
    message: action.settings.input.message,
  });

  const saveAction = useDebouncedCallback(
    (data: SendLineMessageFormData) => {
      if (actionOptions.readonly === true) {
        return;
      }

      actionOptions.onActionUpdate({
        ...action,
        settings: {
          ...action.settings,
          input: {
            to: data.to,
            message: data.message,
          },
        },
      });
    },
    500,
  );

  useEffect(() => {
    return () => {
      saveAction.flush();
    };
  }, [saveAction]);

  const handleFieldChange = <T extends keyof SendLineMessageFormData>(
    field: T,
    value: string,
  ) => {
    const updatedData: SendLineMessageFormData = {
      ...formData,
      [field]: value,
    };

    setFormData(updatedData);
    saveAction(updatedData);
  };

  const { headerTitle, headerIcon, headerIconColor, headerType } =
    useWorkflowActionHeader({
      action,
      defaultTitle: SEND_LINE_MESSAGE_ACTION.defaultLabel,
    });

  return (
    <>
      <SidePanelHeader
        onTitleChange={(newTitle: string) => {
          if (actionOptions.readonly === true) {
            return;
          }

          actionOptions.onActionUpdate({
            ...action,
            name: newTitle,
          });
        }}
        Icon={getIcon(headerIcon)}
        iconColor={headerIconColor}
        initialTitle={headerTitle}
        headerType={headerType}
        disabled={actionOptions.readonly}
        iconTooltip={SEND_LINE_MESSAGE_ACTION.defaultLabel}
      />

      <WorkflowStepBody>
        <FormTextFieldInput
          label="LINE User ID"
          placeholder="Enter LINE user ID"
          readonly={actionOptions.readonly}
          defaultValue={formData.to}
          onChange={(value) => {
            handleFieldChange('to', value);
          }}
          VariablePicker={WorkflowVariablePicker}
        />
        <FormTextFieldInput
          label="Message"
          placeholder="Enter message content"
          readonly={actionOptions.readonly}
          defaultValue={formData.message}
          onChange={(value) => {
            handleFieldChange('message', value);
          }}
          VariablePicker={WorkflowVariablePicker}
          multiline
        />
      </WorkflowStepBody>

      {!actionOptions.readonly && <WorkflowStepFooter stepId={action.id} />}
    </>
  );
};

