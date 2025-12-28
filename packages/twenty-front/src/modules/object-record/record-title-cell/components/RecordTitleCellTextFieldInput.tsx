import { useOpenRecordInCommandMenu } from '@/command-menu/hooks/useOpenRecordInCommandMenu';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useTextField } from '@/object-record/record-field/ui/meta-types/hooks/useTextField';
import { DuplicateNameSuggestionDropdown } from '@/object-record/record-field/ui/meta-types/input/components/DuplicateNameSuggestionDropdown';
import { useDuplicateNameSuggestion } from '@/object-record/record-field/ui/meta-types/input/hooks/useDuplicateNameSuggestion';
import { useRegisterInputEvents } from '@/object-record/record-field/ui/meta-types/input/hooks/useRegisterInputEvents';

import { TextInput } from '@/ui/input/components/TextInput';
import styled from '@emotion/styled';
import { useCallback, useContext, useRef, useState } from 'react';
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

  const { openRecordInCommandMenu } = useOpenRecordInCommandMenu();

  const handleChange = (newText: string) => {
    setDraftValue(turnIntoUndefinedIfWhitespacesOnly(newText));
    // 重置選中索引
    setSelectedIndex(0);
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

  // 選中項目後跳轉（和 TextFieldInputWithDuplicateSuggestion 行為一致）
  const handleSelectSuggestion = useCallback(
    (suggestion: (typeof suggestions)[0]) => {
      closeSuggestions();
      handleNavigateToRecord();
      openRecordInCommandMenu({
        recordId: suggestion.recordId,
        objectNameSingular: suggestion.objectNameSingular,
      });
    },
    [closeSuggestions, handleNavigateToRecord, openRecordInCommandMenu],
  );

  useRegisterInputEvents<string>({
    focusId: instanceId,
    inputRef: wrapperRef,
    inputValue: draftValue ?? '',
    onEnter: (inputValue) => {
      // 如果有選中的建議項目，跳轉到該記錄（和資料表中的行為一致）
      if (isOpen && suggestions.length > 0 && selectedIndex >= 0) {
        handleSelectSuggestion(suggestions[selectedIndex]);
        return;
      }
      // 沒有選中項目，直接儲存
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
