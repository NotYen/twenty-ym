import { useOpenRecordInCommandMenu } from '@/command-menu/hooks/useOpenRecordInCommandMenu';
import { type DuplicateSuggestionRecord } from '@/object-record/record-field/ui/meta-types/input/hooks/useDuplicateNameSuggestion';
import styled from '@emotion/styled';
import {
    autoUpdate,
    flip,
    offset,
    shift,
    useFloating,
} from '@floating-ui/react';
import { t } from '@lingui/core/macro';
import { useCallback, useEffect, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { IconAlertTriangle } from 'twenty-ui/display';

const StyledDropdownContainer = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  box-shadow: ${({ theme }) => theme.boxShadow.strong};
  max-height: 200px;
  overflow-y: auto;
  z-index: 9999;
  min-width: 200px;
`;

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
`;

const StyledSuggestionItem = styled.div<{ isSelected?: boolean }>`
  padding: ${({ theme }) => theme.spacing(2)};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme, isSelected }) =>
    isSelected ? theme.background.transparent.light : 'transparent'};

  &:hover {
    background: ${({ theme }) => theme.background.transparent.light};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
  }
`;

const StyledLabel = styled.span`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledHint = styled.span`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  margin-left: auto;
  flex-shrink: 0;
`;

type DuplicateNameSuggestionDropdownProps = {
  suggestions: DuplicateSuggestionRecord[];
  onClose: () => void;
  onNavigateToRecord?: () => void;
  anchorRef: RefObject<HTMLElement>;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
};

export const DuplicateNameSuggestionDropdown = ({
  suggestions,
  onClose,
  onNavigateToRecord,
  anchorRef,
  selectedIndex,
  onSelectedIndexChange,
}: DuplicateNameSuggestionDropdownProps) => {
  const { openRecordInCommandMenu } = useOpenRecordInCommandMenu();

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset({ mainAxis: 4 }),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
    elements: {
      reference: anchorRef.current,
    },
  });

  const handleSuggestionClick = useCallback(
    (event: React.MouseEvent, suggestion: DuplicateSuggestionRecord) => {
      // 阻止事件冒泡，避免觸發 onClickOutside
      event.stopPropagation();
      event.preventDefault();

      // 先關閉 dropdown 和取消輸入（不儲存）
      onClose();
      onNavigateToRecord?.();

      // 然後跳轉到選擇的記錄
      openRecordInCommandMenu({
        recordId: suggestion.recordId,
        objectNameSingular: suggestion.objectNameSingular,
      });
    },
    [openRecordInCommandMenu, onClose, onNavigateToRecord],
  );

  // 鍵盤導航
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      // Skip when IME is composing
      if (isIMEComposing(event)) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          onSelectedIndexChange(
            selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : 0,
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          onSelectedIndexChange(
            selectedIndex > 0 ? selectedIndex - 1 : suggestions.length - 1,
          );
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [suggestions.length, selectedIndex, onSelectedIndexChange]);

  if (suggestions.length === 0) {
    return null;
  }

  return createPortal(
    <StyledDropdownContainer
      ref={refs.setFloating}
      style={floatingStyles}
      data-globally-prevent-click-outside="true"
    >
      <StyledHeader>
        <IconAlertTriangle size={14} />
        {t`Possible duplicate records`}
      </StyledHeader>
      {suggestions.map((suggestion, index) => (
        <StyledSuggestionItem
          key={suggestion.recordId}
          isSelected={index === selectedIndex}
          onClick={(event) => handleSuggestionClick(event, suggestion)}
          onMouseDown={(event) => {
            // 在 mousedown 階段就阻止事件，避免 useListenClickOutside 設置 isMouseDownInside = false
            event.stopPropagation();
          }}
          onMouseEnter={() => onSelectedIndexChange(index)}
          data-globally-prevent-click-outside="true"
        >
          <StyledLabel>{suggestion.label}</StyledLabel>
          <StyledHint>{t`Click to view`}</StyledHint>
        </StyledSuggestionItem>
      ))}
    </StyledDropdownContainer>,
    document.body,
  );
};
