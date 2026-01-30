import { t } from '@lingui/core/macro';

export enum DatabaseTriggerDefaultLabel {
  RECORD_IS_CREATED = 'Record is created',
  RECORD_IS_UPDATED = 'Record is updated',
  RECORD_IS_DELETED = 'Record is deleted',
  RECORD_UPSERTED = 'Record is created or updated',
}

export const getDatabaseTriggerLabel = (
  label: DatabaseTriggerDefaultLabel,
): string => {
  switch (label) {
    case DatabaseTriggerDefaultLabel.RECORD_IS_CREATED:
      return t`Record is created`;
    case DatabaseTriggerDefaultLabel.RECORD_IS_UPDATED:
      return t`Record is updated`;
    case DatabaseTriggerDefaultLabel.RECORD_IS_DELETED:
      return t`Record is deleted`;
    case DatabaseTriggerDefaultLabel.RECORD_UPSERTED:
      return t`Record is created or updated`;
  }
};
