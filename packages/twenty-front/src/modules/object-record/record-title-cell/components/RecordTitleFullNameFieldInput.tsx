import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useFullNameField } from '@/object-record/record-field/ui/meta-types/hooks/useFullNameField';
import { DuplicateNameSuggestionDropdown } from '@/object-record/record-field/ui/meta-types/input/components/DuplicateNameSuggestionDropdown';
import { FIRST_NAME_PLACEHOLDER_WITH_SPECIAL_CHARACTER_TO_AVOID_PASSWORD_MANAGERS } from '@/object-record/record-field/ui/meta-types/input/constants/FirstNamePlaceholder';
import { LAST_NAME_PLACEHOLDER_WITH_SPECIAL_CHARACTER_TO_AVOID_PASSWORD_MANAGERS } from '@/object-record/record-field/ui/meta-types/input/constants/LastNamePlaceholder';
import { useDuplicateNameSuggestion } from '@/object-record/record-field/ui/meta-types/input/hooks/useDuplicateNameSuggestion';
import { isDoubleTextFieldEmpty } from '@/object-record/record-field/ui/meta-types/input/utils/isDoubleTextFieldEmpty';
import { type FieldDoubleText } from '@/object-record/record-field/ui/types/FieldDoubleText';

import styled from '@emotion/styled';
import { useCallback, useContext, useRef, useState } from 'react';
import { RecordTitleDoubleTextInput } from './RecordTitleDoubleTextInput';

const StyledInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

type RecordTitleFullNameFieldInputProps = {
  sizeVariant?: 'xs' | 'sm' | 'md';
};

export const RecordTitleFullNameFieldInput = ({
  sizeVariant,
}: RecordTitleFullNameFieldInputProps) => {
  const { fieldDefinition, draftValue, setDraftValue, fieldValue } =
    useFullNameField();
  const { recordId, isLabelIdentifier } = useContext(FieldContext);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { onEnter, onEscape, onClickOutside, onTab, onShiftTab, onCancel } =
    useContext(FieldInputEventContext);

  const objectNameSingular =
    fieldDefinition.metadata.objectMetadataNameSingular ?? '';

  const searchValue = `${draftValue?.firstName ?? ''} ${draftValue?.lastName ?? ''}`.trim();

  const { suggestions, isOpen, closeSuggestions } = useDuplicateNameSuggestion({
    objectNameSingular,
    searchValue,
    excludeRecordId: recordId,
    enabled:
      isLabelIdentifier && !!objectNameSingular && searchValue.length > 0,
  });

  // 當用戶點擊提示跳轉時，取消輸入（不儲存）
  const handleNavigateToRecord = useCallback(() => {
    // 恢復原始值
    setDraftValue(fieldValue);
    // 觸發取消事件
    onCancel?.();
  }, [setDraftValue, fieldValue, onCancel]);

  const convertToFullName = (newDoubleText: FieldDoubleText) => {
    return {
      firstName: newDoubleText.firstValue.trim(),
      lastName: newDoubleText.secondValue.trim(),
    };
  };

  const getRequiredDraftValueFromDoubleText = (
    newDoubleText: FieldDoubleText,
  ) => {
    return isDoubleTextFieldEmpty(newDoubleText)
      ? undefined
      : convertToFullName(newDoubleText);
  };

  const handleEnter = (newDoubleText: FieldDoubleText) => {
    closeSuggestions();
    onEnter?.({ newValue: convertToFullName(newDoubleText) });
  };

  const handleEscape = (newDoubleText: FieldDoubleText) => {
    closeSuggestions();
    onEscape?.({ newValue: convertToFullName(newDoubleText) });
  };

  const handleClickOutside = (
    event: MouseEvent | TouchEvent,
    newDoubleText: FieldDoubleText,
  ) => {
    // 檢查是否點擊了 dropdown（有 data-globally-prevent-click-outside 屬性）
    const target = event.target as HTMLElement;
    if (target.closest('[data-globally-prevent-click-outside="true"]')) {
      return;
    }
    closeSuggestions();
    onClickOutside?.({ newValue: convertToFullName(newDoubleText), event });
  };

  const handleTab = (newDoubleText: FieldDoubleText) => {
    closeSuggestions();
    onTab?.({ newValue: convertToFullName(newDoubleText) });
  };

  const handleShiftTab = (newDoubleText: FieldDoubleText) => {
    closeSuggestions();
    onShiftTab?.({ newValue: convertToFullName(newDoubleText) });
  };

  const handleChange = (newDoubleText: FieldDoubleText) => {
    setDraftValue(getRequiredDraftValueFromDoubleText(newDoubleText));
  };

  const handlePaste = (newDoubleText: FieldDoubleText) => {
    setDraftValue(getRequiredDraftValueFromDoubleText(newDoubleText));
  };

  return (
    <StyledInputWrapper ref={inputWrapperRef}>
      <RecordTitleDoubleTextInput
        firstValue={draftValue?.firstName ?? ''}
        secondValue={draftValue?.lastName ?? ''}
        firstValuePlaceholder={
          FIRST_NAME_PLACEHOLDER_WITH_SPECIAL_CHARACTER_TO_AVOID_PASSWORD_MANAGERS
        }
        secondValuePlaceholder={
          LAST_NAME_PLACEHOLDER_WITH_SPECIAL_CHARACTER_TO_AVOID_PASSWORD_MANAGERS
        }
        onClickOutside={handleClickOutside}
        onEnter={handleEnter}
        onEscape={handleEscape}
        onShiftTab={handleShiftTab}
        onTab={handleTab}
        onPaste={handlePaste}
        onChange={handleChange}
        sizeVariant={sizeVariant}
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
