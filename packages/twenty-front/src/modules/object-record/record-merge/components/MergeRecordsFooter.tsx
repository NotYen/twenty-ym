import { SIDE_PANEL_FOCUS_ID } from '@/command-menu/constants/SidePanelFocusId';
import { useMergeRecordsActions } from '@/object-record/record-merge/hooks/useMergeRecordsActions';
import { useMergeRecordsSelectedRecords } from '@/object-record/record-merge/hooks/useMergeRecordsSelectedRecords';
import { useValidatePersonMergeForLine } from '@/object-record/record-merge/hooks/useValidatePersonMergeForLine';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import styled from '@emotion/styled';
import { Key } from 'ts-key-enum';
import { IconAlertTriangle, IconArrowMerge } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

const StyledFooterContainer = styled.div`
  align-items: flex-end;
  background: ${({ theme }) => theme.background.primary};
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const StyledFooterActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
`;

const StyledErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.color.red};
  font-size: ${({ theme }) => theme.font.size.sm};
  width: 100%;
`;

type MergeRecordsFooterProps = {
  objectNameSingular: string;
};

export const MergeRecordsFooter = ({
  objectNameSingular,
}: MergeRecordsFooterProps) => {
  const { handleMergeRecords, isMerging } = useMergeRecordsActions({
    objectNameSingular,
  });

  const { selectedRecords } = useMergeRecordsSelectedRecords();

  const { isValid, error } = useValidatePersonMergeForLine(
    selectedRecords,
    objectNameSingular,
  );

  const isDisabled = isMerging || !isValid;

  useHotkeysOnFocusedElement({
    keys: [`${Key.Control}+${Key.Enter}`, `${Key.Meta}+${Key.Enter}`],
    callback: () => {
      if (!isDisabled) {
        handleMergeRecords();
      }
    },
    focusId: SIDE_PANEL_FOCUS_ID,
    dependencies: [handleMergeRecords, isDisabled],
  });

  return (
    <StyledFooterContainer>
      {error && (
        <StyledErrorMessage>
          <IconAlertTriangle size={16} />
          {error}
        </StyledErrorMessage>
      )}
      <StyledFooterActions>
        <Button
          title={isMerging ? 'Merging...' : 'Merge'}
          variant="primary"
          accent="blue"
          size="medium"
          Icon={IconArrowMerge}
          hotkeys={isDisabled ? undefined : ['⌘', '⏎']}
          onClick={handleMergeRecords}
          disabled={isDisabled}
        />
      </StyledFooterActions>
    </StyledFooterContainer>
  );
};
