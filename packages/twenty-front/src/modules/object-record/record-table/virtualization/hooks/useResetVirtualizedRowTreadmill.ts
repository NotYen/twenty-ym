import { NUMBER_OF_VIRTUALIZED_ROWS } from '@/object-record/record-table/virtualization/constants/NumberOfVirtualizedRows';
import { realIndexByVirtualIndexComponentFamilyState } from '@/object-record/record-table/virtualization/states/realIndexByVirtualIndexComponentFamilyState';
import { useRecoilComponentCallbackState } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentCallbackState';
import { getSnapshotValue } from '@/ui/utilities/state/utils/getSnapshotValue';
import { useRecoilCallback } from 'recoil';
import { getContiguousIncrementalValues } from 'twenty-shared/utils';

export const useResetVirtualizedRowTreadmill = () => {
  const realIndexByVirtualIndexCallbackState = useRecoilComponentCallbackState(
    realIndexByVirtualIndexComponentFamilyState,
  );

  const resetVirtualizedRowTreadmill = useRecoilCallback(
    ({ set, snapshot }) =>
      (numberOfRowsToReset?: number) => {
        // 只重置實際需要的行數，而不是全部 200 行
        const rowsToReset = Math.min(
          numberOfRowsToReset ?? NUMBER_OF_VIRTUALIZED_ROWS,
          NUMBER_OF_VIRTUALIZED_ROWS,
        );

        const virtualIndices = getContiguousIncrementalValues(rowsToReset);

        for (const virtualIndex of virtualIndices) {
          const realIndex = virtualIndex;

          // 只有當值不同時才設置，避免不必要的 state 更新
          const currentRealIndex = getSnapshotValue(
            snapshot,
            realIndexByVirtualIndexCallbackState({ virtualIndex }),
          );

          if (currentRealIndex !== realIndex) {
            set(
              realIndexByVirtualIndexCallbackState({
                virtualIndex: virtualIndex,
              }),
              realIndex,
            );
          }
        }
      },
    [realIndexByVirtualIndexCallbackState],
  );

  return { resetVirtualizedRowTreadmill };
};
