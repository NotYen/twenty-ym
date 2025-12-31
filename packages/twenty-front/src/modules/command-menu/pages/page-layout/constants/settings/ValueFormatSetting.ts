import { ChartValueFormatSelectionDropdownContent } from '@/command-menu/pages/page-layout/components/dropdown-content/ChartValueFormatSelectionDropdownContent';
import { CHART_CONFIGURATION_SETTING_LABELS } from '@/command-menu/pages/page-layout/constants/settings/ChartConfigurationSettingLabels';
import { CHART_CONFIGURATION_SETTING_IDS } from '@/command-menu/pages/page-layout/types/ChartConfigurationSettingIds';
import { type ChartSettingsItem } from '@/command-menu/pages/page-layout/types/ChartSettingsGroup';
import { IconNumbers } from 'twenty-ui/display';

export const VALUE_FORMAT_SETTING: ChartSettingsItem = {
  Icon: IconNumbers,
  label: CHART_CONFIGURATION_SETTING_LABELS.VALUE_FORMAT,
  id: CHART_CONFIGURATION_SETTING_IDS.VALUE_FORMAT,
  isBoolean: false,
  DropdownContent: ChartValueFormatSelectionDropdownContent,
};
