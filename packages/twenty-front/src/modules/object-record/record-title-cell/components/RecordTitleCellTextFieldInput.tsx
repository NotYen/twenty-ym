import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useTextField } from '@/object-record/record-field/ui/meta-types/hooks/useTextField';
import { DuplicateNameSuggestionDropdown } from '@/object-record/record-field/ui/meta-types/input/components/DuplicateNameSuggestionDropdown';
import { useDuplicateNameSuggestion } from '@/object-record/record-field/ui/meta-types/input/hooks/useDuplicateNameSuggestion';
import { useRegisterInputEvents } from '@/object-record/record-field/ui/meta-types/input/hooks/useRegisterInputEvents';
import { TextInput } from '@/ui/input/components/TextInput';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { isModalOpenedComponentState } from '@/ui/layout/modal/states/isModalOpenedComponentState';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isDefined } from 'twenty-shared/utils';
import { turnIntoUndefinedIfWhitespacesOnly } from '~/utils/string/turnIntoUndefinedIfWhitespacesOnly';

const DUPLICATE_CONFIRMATION_MODAL_ID =
  'duplicate-title-text-confirmation-modal';

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
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  const { openModal } = useModal();

  const isModalOpened = useRecoilComponentValue(
    isModalOpenedComponentState,
    DUPLICATE_CONFIRMATION_MODAL_ID,
  );

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

  // 確認建立新記錄
  const handleConfirmCreate = useCallback(() => {
    if (pendingValue !== null) {
      closeSuggestions();
      onEnter?.({ newValue: pendingValue.trim() });
      setPendingValue(null);
    }
  }, [pendingValue, closeSuggestions, onEnter]);

  // 取消建立
  const handleCancelCreate = useCallback(() => {
    setPendingValue(null);
  }, []);

  useRegisterInputEvents<string>({
    focusId: instanceId,
    inputRef: wrapperRef,
    inputValue: draftValue ?? '',
    onEnter: (inputValue) => {
      // 檢查是否有「完全相同」的記錄（忽略大小寫和前後空格）
      const trimmedInputValue = inputValue.trim().toLowerCase();
      const hasExactMatch = suggestions.some(
        (s) => s.label.trim().toLowerCase() === trimmedInputValue,
      );

      // 只有完全相同才阻擋並顯示確認對話框
      if (hasExactMatch) {
        setPendingValue(inputValue);
        openModal(DUPLICATE_CONFIRMATION_MODAL_ID);
        return;
      }

      // 沒有完全相同的記錄，直接儲存
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
        />
      )}
      {isModalOpened &&
        createPortal(
          <ConfirmationModal
            modalId={DUPLICATE_CONFIRMATION_MODAL_ID}
            title={t`Possible duplicate detected`}
            subtitle={t`Similar records were found. Are you sure you want to create a new record?`}
            onConfirmClick={handleConfirmCreate}
            onClose={handleCancelCreate}
            confirmButtonText={t`Create anyway`}
            confirmButtonAccent="blue"
          />,
          document.body,
        )}
    </StyledInputWrapper>
  );
};
