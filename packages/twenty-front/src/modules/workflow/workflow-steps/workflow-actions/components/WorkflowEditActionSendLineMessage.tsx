import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { Select } from '@/ui/input/components/Select';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { type WorkflowSendLineMessageAction } from '@/workflow/types/Workflow';
import { WorkflowStepBody } from '@/workflow/workflow-steps/components/WorkflowStepBody';
import { WorkflowStepFooter } from '@/workflow/workflow-steps/components/WorkflowStepFooter';
import { WorkflowVariablePicker } from '@/workflow/workflow-variables/components/WorkflowVariablePicker';
import { useTheme } from '@emotion/react';
import { useEffect, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { type SelectOption } from 'twenty-ui/input';
import { type JsonValue } from 'type-fest';
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
  const theme = useTheme();

  const [formData, setFormData] = useState<SendLineMessageFormData>({
    to: action.settings.input.to || '',
    message: action.settings.input.message || '',
  });

  // Query persons with LINE connection (lineUserId IS NOT NULL AND lineStatus = 'active')
  const { records: persons, loading } = useFindManyRecords({
    objectNameSingular: 'person',
    filter: {
      and: [
        {
          lineUserId: {
            is: 'NOT_NULL',
          },
        },
        {
          lineStatus: {
            eq: 'active',
          },
        },
      ],
    },
    recordGqlFields: {
      id: true,
      name: {
        firstName: true,
        lastName: true,
      },
      emailsPrimaryEmail: true,
      lineUserId: true,
      lineDisplayName: true,
      lineStatus: true,
    },
  });

  const saveAction = useDebouncedCallback(
    async (formData: SendLineMessageFormData) => {
      if (actionOptions.readonly === true) {
        return;
      }
      actionOptions.onActionUpdate({
        ...action,
        settings: {
          ...action.settings,
          input: {
            to: formData.to,
            message: formData.message,
          },
        },
      });
    },
    1_000,
  );

  useEffect(() => {
    return () => {
      saveAction.flush();
    };
  }, [saveAction]);

  const handleFieldChange = (
    fieldName: keyof SendLineMessageFormData,
    updatedValue: JsonValue,
  ) => {
    const newFormData: SendLineMessageFormData = {
      ...formData,
      [fieldName]: updatedValue,
    };

    setFormData(newFormData);

    saveAction(newFormData);
  };

  // Build person options for Select component
  const emptyOption: SelectOption<string | null> = {
    label: 'Select a person',
    value: null,
  };

  const personOptions: SelectOption<string | null>[] = persons.map(
    (person) => {
      // Build display name: firstName + lastName > lineDisplayName > email
      const displayName =
        [person.name.firstName, person.name.lastName].filter(Boolean).join(' ') ||
        person.lineDisplayName ||
        person.emailsPrimaryEmail ||
        'Unknown';

      return {
        label: displayName,
        value: person.lineUserId, // Store LINE User ID, not person.id
      };
    },
  );

  // Combine emptyOption with personOptions to prevent auto-disable when only 1 person exists
  const allOptions: SelectOption<string | null>[] = [
    emptyOption,
    ...personOptions,
  ];

  // Diagnostic logging
  console.log('[WorkflowEditActionSendLineMessage] Diagnostic Info:', {
    loading,
    personsCount: persons.length,
    personOptions,
    formDataTo: formData.to,
    emptyOption,
    actionOptions: actionOptions,
    actionOptionsReadonly: actionOptions.readonly,
    isReadonlyExplicitlyTrue: actionOptions.readonly === true,
  });

  return (
    !loading && (
      <>
        <WorkflowStepBody>
          <Select
            dropdownId="select-line-user-id"
            label="Person"
            fullWidth
            value={formData.to}
            options={allOptions}
            withSearchInput={true}
            onChange={(lineUserId) => {
              handleFieldChange('to', lineUserId);
            }}
            disabled={actionOptions.readonly}
            dropdownOffset={{ y: parseInt(theme.spacing(1), 10) }}
            dropdownWidth={GenericDropdownContentWidth.ExtraLarge}
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
    )
  );
};
