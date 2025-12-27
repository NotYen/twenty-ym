import { useOpenRecordInCommandMenu } from '@/command-menu/hooks/useOpenRecordInCommandMenu';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useFullNameField } from '@/object-record/record-field/ui/meta-types/hooks/useFullNameField';
import { DuplicateNameSuggestionDropdown } from '@/object-record/record-field/ui/meta-types/input/components/DuplicateNameSuggestionDropdown';
import { FIRST_NAME_PLACEHOLDER_WITH_SPECIAL_CHARACTER_TO_AVOID_PASSWORD_MANAGERS } from '@/object-record/record-field/ui/meta-types/input/constants/FirstNamePlaceholder';
import { LAST_NAME_PLACEHOLDER_WITH_SPECIAL_CHARACTER_TO_AVOID_PASSWORD_MANAGERS } from '@/object-record/record-field/ui/meta-types/input/constants/LastNamePlaceholder';
import { useDuplicateNameSuggestion } from '@/object-record/record-field/ui/meta-types/input/hooks/useDuplicateNameSuggestion';
import { isDoubleTextFieldEmpty } from '@/object-record/record-field/ui/meta-types/input/utils/isDoubleTextFieldEmpty';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { type FieldDoubleText } from '@/object-record/record-field/ui/types/FieldDoubleText';
import { DoubleTextInput } from '@/ui/field/input/components/DoubleTextInput';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { isModalOpenedComponentState } from '@/ui/layout/modal/states/isModalOpenedComponentState';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DUPLICATE_CONFIRMATION_MODAL_ID =
  'duplicate-fullname-confirmation-modal';

const StyledInputWrapper = styled.div<{ hasWarning?: boolean }>`
  position: relative;
  width: 100%;

  ${({ hasWarning, theme }) =>
    hasWarning &&
    css`
      input {
        border-color: ${theme.color.orange} !important;
        background-color: ${theme.color.orange}10 !important;
      }
    `}
`;

export const FullNameFieldInputWithDuplicateSuggestion = () => {
  const { fieldDefinition, draftValue, setDraftValue, fieldValue } =
    useFullNameField();
  const { recordId, isLabelIdentifier } = useContext(FieldContext);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingValue, setPendingValue] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);

  const { onEnter, onEscape, onClickOutside, onTab, onShiftTab, onCancel } =
    useContext(FieldInputEventContext);

  const { openModal } = useModal();
  const { openRecordInCommandMenu } = useOpenRecordInCommandMenu();

  const isModalOpened = useRecoilComponentValue(
    isModalOpenedComponentState,
    DUPLICATE_CONFIRMATION_MODAL_ID,
  );

  const instanceId = useAvailableComponentInstanceIdOrThrow(
    RecordFieldComponentInstanceContext,
  );

  const objectNameSingular =
    fieldDefinition.metadata.objectMetadataNameSingular ?? '';

  const searchValue =
    `${draftValue?.firstName ?? ''} ${draftValue?.lastName ?? ''}`.trim();

  const { suggestions, isOpen, closeSuggestions, hasSuggestions } =
    useDuplicateNameSuggestion({
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

  // 選中項目後跳轉
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

    // 如果有選中的建議項目，跳轉到該記錄
    if (isOpen && suggestions.length > 0 && selectedIndex >= 0) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      return;
    }

    // 如果有重複建議但沒選中，顯示確認對話框
    if (hasSuggestions) {
      setPendingValue(fullName);
      openModal(DUPLICATE_CONFIRMATION_MODAL_ID);
      return;
    }

    // 沒有重複，直接儲存
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
    // 重置選中索引
    setSelectedIndex(0);
  };

  const handlePaste = (newDoubleText: FieldDoubleText) => {
    setDraftValue(getRequiredDraftValueFromDoubleText(newDoubleText));
  };

  return (
    <StyledInputWrapper ref={inputWrapperRef} hasWarning={hasSuggestions}>
      <DoubleTextInput
        instanceId={instanceId}
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
