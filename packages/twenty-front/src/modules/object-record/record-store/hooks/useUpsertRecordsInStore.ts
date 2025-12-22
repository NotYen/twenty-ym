import { useRecoilCallback } from 'recoil';
import { fastDeepEqual } from 'twenty-shared/utils';

import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const useUpsertRecordsInStore = () => {
  const upsertRecordsInStore = useRecoilCallback(
    ({ set, snapshot }) =>
      (records: ObjectRecord[]) => {
        for (const record of records) {
          const currentRecord = snapshot
            .getLoadable(recordStoreFamilyState(record.id))
            .getValue();

          if (!fastDeepEqual(currentRecord, record)) {
            set(recordStoreFamilyState(record.id), {
              ...currentRecord,
              ...record,
            });
          }
        }
      },
    [],
  );

  return {
    upsertRecordsInStore,
  };
};
