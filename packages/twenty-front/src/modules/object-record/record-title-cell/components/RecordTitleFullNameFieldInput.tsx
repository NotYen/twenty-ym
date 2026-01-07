import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useFullNameField } from '@/object-record/record-field/ui/meta-types/hooks/useFullNameField';
import { DuplicateNameSuggestionDropdown } from '@/object-record/record-field/ui/meta-types/input/components/DuplicateNameSuggestionDropdown';
import { FIRST_NAME_PLACEHOLDER_WITH_SPECIAL_CHARACTER_TO_AVOID_PASSWORD_MANAGERS } from '@/object-record/record-field/ui/meta-types/input/constants/FirstNamePlaceholder';
import { LAST_NAME_PLACEHOLDER_WITH_SPECIAL_CHARACTER_TO_AVOID_PASSWORD_MANAGERS } from '@/object-record/record-field/ui/meta-types/input/constants/LastNamePlaceholder';
import { useDuplicateNameSuggestion } from '@/object-record/record-field/ui/meta-types/input/hooks/useDuplicateNameSuggestion';
import { isDoubleTextFieldEmpty } from '@/object-record/record-field/ui/meta-types/input/utils/isDoubleTextFieldEmpty';
import { type FieldDoubleText } from '@/object-record/record-field/ui/types/FieldDoubleText';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { isModalOpenedComponentState } from '@/ui/layout/modal/states/isModalOpenedComponentState';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RecordTitleDoubleTextInput } from './RecordTitleDoubleTextInput';

const DUPLICATE_CONFIRMATION_MODAL_ID =
  'duplicate-title-fullname-confirmation-modal';

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
  const [pendingValue, setPendingValue] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);

  const { onEnter, onEscape, onClickOutside, onTab, onShiftTab, onCancel } =
    useContext(FieldInputEventContext);

  const { openModal } = useModal();

  const isModalOpened = useRecoilComponentValue(
    isModalOpenedComponentState,
    DUPLICATE_CONFIRMATION_MODAL_ID,
  );

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

  // 確認建立新記錄
  const handleConfirmCreate = useCallback(() => {
    if (pendingValue !== null) {
      closeSuggestions();
      onEnter?.({ newValue: pendingValue });
      setPendingValue(null);
    }
  }, [pendingValue, closeSuggestions, onEnter]);

  // 取消建立
  const handleCancelCreate = useCallback(() => {
    setPendingValue(null);
  }, []);

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
    const fullName = convertToFullName(newDoubleText);

    // 檢查是否有「完全相同」的記錄（忽略大小寫和前後空格）
    const trimmedFullName =
      `${fullName.firstName} ${fullName.lastName}`.trim().toLowerCase();
    const hasExactMatch = suggestions.some(
      (s) => s.label.trim().toLowerCase() === trimmedFullName,
    );

    // 只有完全相同才阻擋並顯示確認對話框
    if (hasExactMatch) {
      setPendingValue(fullName);
      openModal(DUPLICATE_CONFIRMATION_MODAL_ID);
      return;
    }

    // 沒有完全相同的記錄，直接儲存
    closeSuggestions();
    onEnter?.({ newValue: fullName });
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
