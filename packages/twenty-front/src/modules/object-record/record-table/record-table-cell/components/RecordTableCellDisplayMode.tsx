import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { useIsFieldInputOnly } from '@/object-record/record-field/ui/hooks/useIsFieldInputOnly';
import { useOpenRecordFromIndexView } from '@/object-record/record-index/hooks/useOpenRecordFromIndexView';
import { useRecordTableBodyContextOrThrow } from '@/object-record/record-table/contexts/RecordTableBodyContext';
import { useOpenRecordTableCellFromCell } from '@/object-record/record-table/record-table-cell/hooks/useOpenRecordTableCellFromCell';
import { useContext, type ReactNode } from 'react';
import { RecordTableCellDisplayContainer } from './RecordTableCellDisplayContainer';

export const RecordTableCellDisplayMode = ({
  children,
}: {
  children: ReactNode;
}) => {
  const {
    recordId,
    isRecordFieldReadOnly: isReadOnly,
    fieldDefinition,
  } = useContext(FieldContext);

  const { onActionMenuDropdownOpened } = useRecordTableBodyContextOrThrow();

  const { openTableCell } = useOpenRecordTableCellFromCell();
  const { openRecordFromIndexView } = useOpenRecordFromIndexView();

  const isFieldInputOnly = useIsFieldInputOnly();

  const handleActionMenuDropdown = (event: React.MouseEvent) => {
    onActionMenuDropdownOpened(event, recordId);
  };

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    // 點擊 noteTargets 欄位時，打開 slide panel
    const fieldName = fieldDefinition?.metadata?.fieldName;
    if (fieldName === 'noteTargets') {
      openRecordFromIndexView({ recordId });
      return;
    }

    // 其他欄位維持原本行為
    if (!isFieldInputOnly && !isReadOnly) {
      openTableCell();
    }
  };

  return (
    <RecordTableCellDisplayContainer
      onContextMenu={handleActionMenuDropdown}
      onClick={handleClick}
    >
      {children}
    </RecordTableCellDisplayContainer>
  );
};
