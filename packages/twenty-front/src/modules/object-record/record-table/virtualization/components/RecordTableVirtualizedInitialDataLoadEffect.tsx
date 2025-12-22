import { useRecoilValue } from 'recoil';

import { useRecordIndexTableFetchMore } from '@/object-record/record-index/hooks/useRecordIndexTableFetchMore';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';

import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { useTriggerInitialRecordTableDataLoad } from '@/object-record/record-table/virtualization/hooks/useTriggerInitialRecordTableDataLoad';
import { isInitializingVirtualTableDataLoadingComponentState } from '@/object-record/record-table/virtualization/states/isInitializingVirtualTableDataLoadingComponentState';
import { lastContextStoreVirtualizedViewIdComponentState } from '@/object-record/record-table/virtualization/states/lastContextStoreVirtualizedViewIdComponentState';
import { lastContextStoreVirtualizedVisibleRecordFieldsComponentState } from '@/object-record/record-table/virtualization/states/lastContextStoreVirtualizedVisibleRecordFieldsComponentState';
import { lastRecordTableQueryIdentifierComponentState } from '@/object-record/record-table/virtualization/states/lastRecordTableQueryIdentifierComponentState';
import { isFetchingMoreRecordsFamilyState } from '@/object-record/states/isFetchingMoreRecordsFamilyState';
import { useRecoilComponentState } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentState';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import isEmpty from 'lodash.isempty';
import { useEffect } from 'react';
import { logDebug } from '~/utils/logDebug';

// TODO: see if we can merge the initial and load more processes, to have only one load at scroll index effect
export const RecordTableVirtualizedInitialDataLoadEffect = () => {
  const { recordTableId, objectNameSingular } = useRecordTableContextOrThrow();

  const { queryIdentifier } = useRecordIndexTableFetchMore(objectNameSingular);

  const [lastRecordTableQueryIdentifier, setLastRecordTableQueryIdentifier] =
    useRecoilComponentState(lastRecordTableQueryIdentifierComponentState);

  const visibleRecordFields = useRecoilComponentValue(
    visibleRecordFieldsComponentSelector,
  );
  const [isInitializingVirtualTableDataLoading] = useRecoilComponentState(
    isInitializingVirtualTableDataLoadingComponentState,
  );

  const isFetchingMoreRecords = useRecoilValue(
    isFetchingMoreRecordsFamilyState(recordTableId),
  );

  const { triggerInitialRecordTableDataLoad } =
    useTriggerInitialRecordTableDataLoad();

  const [
    lastContextStoreVirtualizedViewId,
    setLastContextStoreVirtualizedViewId,
  ] = useRecoilComponentState(lastContextStoreVirtualizedViewIdComponentState);

  const [
    lastContextStoreVisibleRecordFields,
    setLastContextStoreVisibleRecordFields,
  ] = useRecoilComponentState(
    lastContextStoreVirtualizedVisibleRecordFieldsComponentState,
  );

  const { currentView } = useGetCurrentViewOnly();

  useEffect(() => {
    if (isInitializingVirtualTableDataLoading) {
      logDebug(`[📊 InitialDataLoadEffect] ⏭️ 跳過：已在初始化中`);
      return;
    }

    (async () => {
      if ((currentView?.id ?? null) !== lastContextStoreVirtualizedViewId) {
        logDebug(`[📊 InitialDataLoadEffect] 🔄 觸發原因: View 變更`, {
          currentViewId: currentView?.id ?? null,
          lastViewId: lastContextStoreVirtualizedViewId,
        });
        setLastContextStoreVirtualizedViewId(currentView?.id ?? null);

        await triggerInitialRecordTableDataLoad();
      } else if (
        queryIdentifier !== lastRecordTableQueryIdentifier &&
        !isFetchingMoreRecords
      ) {
        logDebug(`[📊 InitialDataLoadEffect] 🔄 觸發原因: Query 變更`, {
          currentQuery: queryIdentifier,
          lastQuery: lastRecordTableQueryIdentifier,
        });
        setLastRecordTableQueryIdentifier(queryIdentifier);

        await triggerInitialRecordTableDataLoad();
      } else if (
        JSON.stringify(lastContextStoreVisibleRecordFields) !==
        JSON.stringify(visibleRecordFields)
      ) {
        setLastContextStoreVisibleRecordFields(visibleRecordFields);

        const lastFields = lastContextStoreVisibleRecordFields || [];
        const currentFields = visibleRecordFields || [];

        const shouldRefetchData = currentFields.length > lastFields.length;

        logDebug(`[📊 InitialDataLoadEffect] 🔄 觸發原因: 可見欄位變更`, {
          lastFieldsCount: lastFields.length,
          currentFieldsCount: currentFields.length,
          shouldRefetchData,
        });

        if (shouldRefetchData) {
          await triggerInitialRecordTableDataLoad({
            shouldScrollToStart: isEmpty(lastFields),
          });
        }
      }
    })();
  }, [
    queryIdentifier,
    lastRecordTableQueryIdentifier,
    triggerInitialRecordTableDataLoad,
    setLastRecordTableQueryIdentifier,
    isFetchingMoreRecords,
    isInitializingVirtualTableDataLoading,
    currentView,
    lastContextStoreVirtualizedViewId,
    setLastContextStoreVirtualizedViewId,
    lastContextStoreVisibleRecordFields,
    setLastContextStoreVisibleRecordFields,
    visibleRecordFields,
  ]);

  return <></>;
};
