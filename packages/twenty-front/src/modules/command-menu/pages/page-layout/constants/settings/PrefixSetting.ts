import { CHART_CONFIGURATION_SETTING_LABELS } from '@/command-menu/pages/page-layout/constants/settings/ChartConfigurationSettingLabels';
import { CHART_CONFIGURATION_SETTING_IDS } from '@/command-menu/pages/page-layout/types/ChartConfigurationSettingIds';
import { type ChartSettingsItem } from '@/command-menu/pages/page-layout/types/ChartSettingsGroup';
import { IconCurrencyDollar } from 'twenty-ui/display';

export const PREFIX_SETTING: ChartSettingsItem = {
  isBoolean: false,
  isInput: true,
  Icon: IconCurrencyDollar,
  label: CHART_CONFIGURATION_SETTING_LABELS.PREFIX,
  id: CHART_CONFIGURATION_SETTING_IDS.PREFIX,
};
