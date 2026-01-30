import { t } from '@lingui/core/macro';
import {
  IconCheckbox,
  type IconComponent,
  IconId,
  IconListDetails,
} from 'twenty-ui/display';

export const getManualTriggerAvailabilityTypeOptions = (): Array<{
  label: string;
  value: 'GLOBAL' | 'SINGLE_RECORD' | 'BULK_RECORDS';
  Icon: IconComponent;
}> => [
  {
    label: t`Global`,
    value: 'GLOBAL',
    Icon: IconCheckbox,
  },
  {
    label: t`Single`,
    value: 'SINGLE_RECORD',
    Icon: IconId,
  },
  {
    label: t`Bulk`,
    value: 'BULK_RECORDS',
    Icon: IconListDetails,
  },
];
