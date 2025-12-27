import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useTextField } from '@/object-record/record-field/ui/meta-types/hooks/useTextField';
import { DuplicateNameSuggestionDropdown } from '@/object-record/record-field/ui/meta-types/input/components/DuplicateNameSuggestionDropdown';
import { useDuplicateNameSuggestion } from '@/object-record/record-field/ui/meta-types/input/hooks/useDuplicateNameSuggestion';
import { useRegisterInputEvents } from '@/object-record/record-field/ui/meta-types/input/hooks/useRegisterInputEvents';

import { TextInput } from '@/ui/input/components/TextInput';
import styled from '@emotion/styled';
import { useCallback, useContext, useRef } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { turnIntoUndefinedIfWhitespacesOnly } from '~/utils/string/turnIntoUndefinedIfWhitespacesOnly';

const StyledInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

type RecordTitleCellTextFieldInputProps = {
  instanceId: string;
  sizeVariant?: 'xs' | 'sm' | 'md';
};

export const RecordTitleCellTextFieldInput = ({
  instanceId,
  sizeVariant,
}: RecordTitleCellTextFieldInputProps) => {
  const { fieldDefinition, draftValue, setDraftValue, fieldValue } =
    useTextField();
  const { recordId, isLabelIdentifier } = useContext(FieldContext);

  const wrapperRef = useRef<HTMLInputElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const objectNameSingular =
    fieldDefinition.metadata.objectMetadataNameSingular ?? '';

  const { suggestions, isOpen, closeSuggestions } = useDuplicateNameSuggestion({
    objectNameSingular,
    searchValue: draftValue ?? '',
    excludeRecordId: recordId,
    enabled: isLabelIdentifier && !!objectNameSingular,
  });

  const handleChange = (newText: string) => {
    setDraftValue(turnIntoUndefinedIfWhitespacesOnly(newText));
  };

  const { onEnter, onEscape, onClickOutside, onTab, onShiftTab, onCancel } =
    useContext(FieldInputEventContext);

  // 當用戶點擊提示跳轉時，取消輸入（不儲存）
  const handleNavigateToRecord = useCallback(() => {
    // 恢復原始值
    setDraftValue(fieldValue);
    // 觸發取消事件
    onCancel?.();
  }, [setDraftValue, fieldValue, onCancel]);

  useRegisterInputEvents<string>({
    focusId: instanceId,
    inputRef: wrapperRef,
    inputValue: draftValue ?? '',
    onEnter: (inputValue) => {
      closeSuggestions();
      onEnter?.({ newValue: inputValue });
    },
    onEscape: (inputValue) => {
      closeSuggestions();
      onEscape?.({ newValue: inputValue });
    },
    onClickOutside: (event, inputValue) => {
      closeSuggestions();
      onClickOutside?.({ newValue: inputValue, event });
    },
    onTab: (inputValue) => {
      closeSuggestions();
      onTab?.({ newValue: inputValue });
    },
    onShiftTab: (inputValue) => {
      closeSuggestions();
      onShiftTab?.({ newValue: inputValue });
    },
  });

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (isDefined(draftValue)) {
      event.target.select();
    }
  };

  return (
    <StyledInputWrapper ref={inputWrapperRef}>
      <TextInput
        ref={wrapperRef}
        autoGrow
        sizeVariant={sizeVariant}
        inheritFontStyles
        value={draftValue ?? ''}
        onChange={handleChange}
        placeholder={fieldDefinition.label}
        onFocus={handleFocus}
        autoFocus
      />
      {isOpen && (
        <DuplicateNameSuggestionDropdown
          suggestions={suggestions}
          onClose={closeSuggestions}
          onNavigateToRecord={handleNavigateToRecord}
          anchorRef={inputWrapperRef}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
        />
      )}
    </StyledInputWrapper>
  );
};
