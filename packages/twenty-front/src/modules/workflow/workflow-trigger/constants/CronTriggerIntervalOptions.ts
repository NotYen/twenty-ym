import { t } from '@lingui/core/macro';
import {
  IconBrandDaysCounter,
  IconClockPlay,
  type IconComponent,
  IconHours24,
  IconTimeDuration60,
} from 'twenty-ui/display';
export type CronTriggerInterval = 'DAYS' | 'HOURS' | 'MINUTES' | 'CUSTOM';

export const getCronTriggerIntervalOptions = (): Array<{
  label: string;
  value: CronTriggerInterval;
  Icon: IconComponent;
}> => [
  {
    label: t`Days`,
    value: 'DAYS',
    Icon: IconBrandDaysCounter,
  },
  {
    label: t`Hours`,
    value: 'HOURS',
    Icon: IconHours24,
  },
  {
    label: t`Minutes`,
    value: 'MINUTES',
    Icon: IconTimeDuration60,
  },
  {
    label: t`Cron (Custom)`,
    value: 'CUSTOM',
    Icon: IconClockPlay,
  },
];
