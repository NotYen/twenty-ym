import { t } from '@lingui/core/macro';
import {
  type IconComponent,
  IconPinned,
  IconPinnedOff,
} from 'twenty-ui/display';

export const getManualTriggerIsPinnedOptions = (): Array<{
  label: string;
  value: boolean;
  Icon: IconComponent;
}> => [
  {
    label: t`Not Pinned`,
    value: false,
    Icon: IconPinnedOff,
  },
  {
    label: t`Pinned`,
    value: true,
    Icon: IconPinned,
  },
];
