import { useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';

import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

type PersonRecord = ObjectRecord & {
  lineUserId?: string | null;
};

type ValidationResult = {
  isValid: boolean;
  error: string | null;
  warning: string | null;
};

export const useValidatePersonMergeForLine = (
  selectedRecords: ObjectRecord[],
  objectNameSingular: string,
): ValidationResult => {
  const { t } = useLingui();

  return useMemo(() => {
    // Only validate for Person objects
    if (objectNameSingular !== 'person') {
      return { isValid: true, error: null, warning: null };
    }

    const personRecords = selectedRecords as PersonRecord[];

    // Filter records that have a non-empty lineUserId
    const recordsWithLineUserId = personRecords.filter(
      (record) =>
        record.lineUserId &&
        typeof record.lineUserId === 'string' &&
        record.lineUserId.trim() !== '',
    );

    // No records have LINE data - allow merge (general merge)
    if (recordsWithLineUserId.length === 0) {
      return { isValid: true, error: null, warning: null };
    }

    // Only one record has LINE data - perfect case
    if (recordsWithLineUserId.length === 1) {
      return { isValid: true, error: null, warning: null };
    }

    // Multiple records have LINE data - check if they're the same
    const uniqueLineUserIds = new Set(
      recordsWithLineUserId.map((r) => r.lineUserId as string),
    );

    if (uniqueLineUserIds.size > 1) {
      const lineUserIdsStr = [...uniqueLineUserIds].join(', ');

      return {
        isValid: false,
        error: t`Cannot merge: Selected records have different LINE User IDs (${lineUserIdsStr}). These may represent different people.`,
        warning: null,
      };
    }

    // All LINE User IDs are the same
    return {
      isValid: true,
      error: null,
      warning: t`Note: Multiple records have the same LINE data.`,
    };
  }, [selectedRecords, objectNameSingular, t]);
};
