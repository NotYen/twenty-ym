import deepEqual from 'deep-equal';
import { STANDARD_OBJECT_IDS } from 'twenty-shared/metadata';
import { FieldMetadataType, type ObjectRecord } from 'twenty-shared/types';
import { fastDeepEqual } from 'twenty-shared/utils';

import { type ObjectMetadataItemWithFieldMaps } from 'src/engine/metadata-modules/types/object-metadata-item-with-field-maps';

const LARGE_JSON_FIELDS: Record<string, Set<string>> = {
  [STANDARD_OBJECT_IDS.workflowVersion]: new Set(['steps', 'trigger']),
  [STANDARD_OBJECT_IDS.workflowAutomatedTrigger]: new Set(['settings']),
  [STANDARD_OBJECT_IDS.workflowRun]: new Set(['state']),
};

const isLargeJsonField = (
  objectMetadataItem: Pick<ObjectMetadataItemWithFieldMaps, 'standardId'>,
  key: string,
): boolean => {
  const standardId = objectMetadataItem.standardId;

  if (!standardId) {
    return false;
  }

  return LARGE_JSON_FIELDS[standardId]?.has(key) ?? false;
};

export const objectRecordChangedValues = (
  oldRecord: Partial<ObjectRecord>,
  newRecord: Partial<ObjectRecord>,
  objectMetadataItem: ObjectMetadataItemWithFieldMaps,
) => {
  return Object.keys(newRecord).reduce(
    (acc, key) => {
      const field =
        objectMetadataItem.fieldsById[objectMetadataItem.fieldIdByName[key]];

      const oldRecordValue = oldRecord[key];
      const newRecordValue = newRecord[key];

      if (
        key === 'updatedAt' ||
        key === 'searchVector' ||
        field?.type === FieldMetadataType.RELATION
      ) {
        return acc;
      }

      if (isLargeJsonField(objectMetadataItem, key)) {
        if (fastDeepEqual(oldRecordValue, newRecordValue)) {
          return acc;
        }
      } else if (deepEqual(oldRecordValue, newRecordValue)) {
        return acc;
      }

      acc[key] = { before: oldRecordValue, after: newRecordValue };

      return acc;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<string, { before: any; after: any }>,
  );
};
