import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { type WorkflowSendLineMessageAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { WorkflowStepFooter } from '@/workflow/workflow-steps/components/WorkflowStepFooter';
import { WorkflowVariablePicker } from '@/workflow/workflow-variables/components/WorkflowVariablePicker';
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

  return (
    <>
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

