import { useRecoilCallback } from 'recoil';

import { recordIndexAllRecordIdsComponentSelector } from '@/object-record/record-index/states/selectors/recordIndexAllRecordIdsComponentSelector';
import { hasUserSelectedAllRowsComponentState } from '@/object-record/record-table/record-table-row/states/hasUserSelectedAllRowsFamilyState';
import { isRowSelectedComponentFamilyState } from '@/object-record/record-table/record-table-row/states/isRowSelectedComponentFamilyState';
import { dataLoadingStatusByRealIndexComponentFamilyState } from '@/object-record/record-table/virtualization/states/dataLoadingStatusByRealIndexComponentFamilyState';
import { recordIdByRealIndexComponentFamilyState } from '@/object-record/record-table/virtualization/states/recordIdByRealIndexComponentFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useRecoilComponentCallbackState } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentCallbackState';
import { useRecoilComponentFamilyCallbackState } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentFamilyCallbackState';
import { getSnapshotValue } from '@/ui/utilities/state/utils/getSnapshotValue';

export const useLoadRecordsToVirtualRows = () => {
  const recordIdByRealIndexCallbackState =
    useRecoilComponentFamilyCallbackState(
      recordIdByRealIndexComponentFamilyState,
    );

  const dataLoadingStatusByRealIndexCallbackState =
    useRecoilComponentCallbackState(
      dataLoadingStatusByRealIndexComponentFamilyState,
    );

  const recordIndexAllRecordIdsSelector = useRecoilComponentCallbackState(
    recordIndexAllRecordIdsComponentSelector,
  );

  const hasUserSelectedAllRowsCallbackState = useRecoilComponentCallbackState(
    hasUserSelectedAllRowsComponentState,
  );

  const isRowSelectedCallbackState = useRecoilComponentCallbackState(
    isRowSelectedComponentFamilyState,
  );

  const loadRecordsToVirtualRows = useRecoilCallback(
    ({ set, snapshot }) =>
      ({
        records,
        startingRealIndex,
      }: {
        records: ObjectRecord[];
        startingRealIndex: number;
      }) => {
        const hasUserSelectedAllRows = getSnapshotValue(
          snapshot,
          hasUserSelectedAllRowsCallbackState,
        );

        for (const [recordIndex, record] of records.entries()) {
          const realIndex = startingRealIndex + recordIndex;

          const currentRecordIdAtRealIndex = getSnapshotValue(
            snapshot,
            recordIdByRealIndexCallbackState({ realIndex }),
          );

          if (record.id !== currentRecordIdAtRealIndex) {
            set(recordIdByRealIndexCallbackState({ realIndex }), record.id);
          }

          set(
            dataLoadingStatusByRealIndexCallbackState({ realIndex }),
            'loaded',
          );
        }

        const currentAllRecordIds = getSnapshotValue(
          snapshot,
          recordIndexAllRecordIdsSelector,
        );

        const recordIds = records.map((record) => record.id);

        // When loading from the beginning (startingRealIndex === 0), we need to
        // reset the array to only contain the new records. This prevents stale
        // record IDs from remaining at the end of the array after deletions.
        // For pagination (startingRealIndex > 0), we extend the existing array.
        let newAllRecordIds: string[];
        if (startingRealIndex === 0) {
          // Initial load or reset: use only the new record IDs
          newAllRecordIds = recordIds;
        } else {
          // Pagination: extend the existing array
          newAllRecordIds = currentAllRecordIds.concat();
          for (let i = 0; i < records.length; i++) {
            newAllRecordIds[i + startingRealIndex] = recordIds[i];
          }
        }

        if (hasUserSelectedAllRows) {
          for (const recordId of recordIds) {
            set(isRowSelectedCallbackState(recordId), true);
          }
        }

        set(recordIndexAllRecordIdsSelector, newAllRecordIds);
      },
    [
      recordIdByRealIndexCallbackState,
      dataLoadingStatusByRealIndexCallbackState,
      recordIndexAllRecordIdsSelector,
      isRowSelectedCallbackState,
      hasUserSelectedAllRowsCallbackState,
    ],
  );

  return {
    loadRecordsToVirtualRows,
  };
};
