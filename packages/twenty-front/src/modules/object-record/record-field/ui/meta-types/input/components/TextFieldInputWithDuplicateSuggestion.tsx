import { useOpenRecordInCommandMenu } from '@/command-menu/hooks/useOpenRecordInCommandMenu';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useTextField } from '@/object-record/record-field/ui/meta-types/hooks/useTextField';
import { DuplicateNameSuggestionDropdown } from '@/object-record/record-field/ui/meta-types/input/components/DuplicateNameSuggestionDropdown';
import { useDuplicateNameSuggestion } from '@/object-record/record-field/ui/meta-types/input/hooks/useDuplicateNameSuggestion';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { FieldInputContainer } from '@/ui/field/input/components/FieldInputContainer';
import { TextAreaInput } from '@/ui/field/input/components/TextAreaInput';
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
import { turnIntoUndefinedIfWhitespacesOnly } from '~/utils/string/turnIntoUndefinedIfWhitespacesOnly';

const DUPLICATE_CONFIRMATION_MODAL_ID = 'duplicate-name-confirmation-modal';

const StyledInputWrapper = styled.div<{ hasWarning?: boolean }>`
  position: relative;
  width: 100%;

  ${({ hasWarning, theme }) =>
    hasWarning &&
    css`
      textarea {
        border-color: ${theme.color.orange} !important;
        background-color: ${theme.color.orange}10 !important;
      }
    `}
`;

export const TextFieldInputWithDuplicateSuggestion = () => {
  const { fieldDefinition, draftValue, setDraftValue, fieldValue } =
    useTextField();
  const { recordId, isLabelIdentifier } = useContext(FieldContext);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  const { onEnter, onEscape, onClickOutside, onTab, onShiftTab, onCancel } =
    useContext(FieldInputEventContext);

  const { openModal, closeModal } = useModal();
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

  const { suggestions, isOpen, closeSuggestions, hasSuggestions } =
    useDuplicateNameSuggestion({
      objectNameSingular,
      searchValue: draftValue ?? '',
      excludeRecordId: recordId,
      enabled: isLabelIdentifier && !!objectNameSingular,
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
      onEnter?.({ newValue: pendingValue.trim() });
      setPendingValue(null);
    }
  }, [pendingValue, closeSuggestions, onEnter]);

  // 取消建立
  const handleCancelCreate = useCallback(() => {
    setPendingValue(null);
  }, []);

  const handleEnter = (newText: string) => {
    // 如果有選中的建議項目，跳轉到該記錄
    if (isOpen && suggestions.length > 0 && selectedIndex >= 0) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      return;
    }

    // 如果有重複建議但沒選中，顯示確認對話框
    if (hasSuggestions) {
      setPendingValue(newText);
      openModal(DUPLICATE_CONFIRMATION_MODAL_ID);
      return;
    }

    // 沒有重複，直接儲存
    closeSuggestions();
    onEnter?.({ newValue: newText.trim() });
  };

  const handleEscape = (newText: string) => {
    closeSuggestions();
    onEscape?.({ newValue: newText.trim() });
  };

  const handleClickOutside = (
    event: MouseEvent | TouchEvent,
    newText: string,
  ) => {
    closeSuggestions();
    onClickOutside?.({
      newValue: newText.trim(),
      event,
    });
  };

  const handleTab = (newText: string) => {
    closeSuggestions();
    onTab?.({ newValue: newText.trim() });
  };

  const handleShiftTab = (newText: string) => {
    closeSuggestions();
    onShiftTab?.({ newValue: newText.trim() });
  };

  const handleChange = (newText: string) => {
    setDraftValue(turnIntoUndefinedIfWhitespacesOnly(newText));
    // 重置選中索引
    setSelectedIndex(0);
  };

  return (
    <FieldInputContainer>
      <StyledInputWrapper ref={inputWrapperRef} hasWarning={hasSuggestions}>
        <TextAreaInput
          instanceId={instanceId}
          placeholder={fieldDefinition.metadata.placeHolder}
          autoFocus
          value={draftValue ?? ''}
          onClickOutside={handleClickOutside}
          onEnter={handleEnter}
          onEscape={handleEscape}
          onShiftTab={handleShiftTab}
          onTab={handleTab}
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
      </StyledInputWrapper>
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
    </FieldInputContainer>
  );
};
