import { RecordTableNoRecordGroupAddNew } from '@/object-record/record-table/components/RecordTableNoRecordGroupAddNew';
import { RecordTableRowVirtualizedContainer } from '@/object-record/record-table/virtualization/components/RecordTableRowVirtualizedContainer';
import { RecordTableVirtualizedBodyPlaceholder } from '@/object-record/record-table/virtualization/components/RecordTableVirtualizedBodyPlaceholder';
import { RecordTableVirtualizedDebugHelper } from '@/object-record/record-table/virtualization/components/RecordTableVirtualizedDebugHelper';
import { NUMBER_OF_VIRTUALIZED_ROWS } from '@/object-record/record-table/virtualization/constants/NumberOfVirtualizedRows';
import { lowDetailsActivatedComponentState } from '@/object-record/record-table/virtualization/states/lowDetailsActivatedComponentState';
import { totalNumberOfRecordsToVirtualizeComponentState } from '@/object-record/record-table/virtualization/states/totalNumberOfRecordsToVirtualizeComponentState';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { getContiguousIncrementalValues } from 'twenty-shared/utils';

export const RecordTableNoRecordGroupRows = () => {
  const totalNumberOfRecordsToVirtualize =
    useRecoilComponentValue(totalNumberOfRecordsToVirtualizeComponentState) ??
    0;

  const lowDetailsActivated = useRecoilComponentValue(
    lowDetailsActivatedComponentState,
  );

  const numberOfRows = Math.min(
    totalNumberOfRecordsToVirtualize,
    NUMBER_OF_VIRTUALIZED_ROWS,
  );

  const virtualRowIndices = getContiguousIncrementalValues(numberOfRows);

  return (
    <>
      <RecordTableVirtualizedBodyPlaceholder />
      {virtualRowIndices.map((virtualRowIndex) => {
        return (
          <RecordTableRowVirtualizedContainer
            key={virtualRowIndex}
            virtualIndex={virtualRowIndex}
            totalNumberOfRecordsToVirtualize={totalNumberOfRecordsToVirtualize}
            lowDetailsActivated={lowDetailsActivated}
          />
        );
      })}
      <RecordTableNoRecordGroupAddNew />
      <RecordTableVirtualizedDebugHelper />
    </>
  );
};
