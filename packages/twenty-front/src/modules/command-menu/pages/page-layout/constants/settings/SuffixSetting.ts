import { ChartConfigurationSettingId } from '@/command-menu/pages/page-layout/types/ChartConfigurationSettingIds';
import { type ChartSettingItem } from '@/command-menu/pages/page-layout/types/ChartSettingItem';
import { ChartSettingType } from '@/command-menu/pages/page-layout/types/ChartSettingType';
import { IconCurrencyDollar } from 'twenty-ui';

export const SUFFIX_SETTING: ChartSettingItem = {
  id: ChartConfigurationSettingId.SUFFIX,
  label: 'Suffix',
  icon: IconCurrencyDollar,
  type: ChartSettingType.TEXT_INPUT,
};
