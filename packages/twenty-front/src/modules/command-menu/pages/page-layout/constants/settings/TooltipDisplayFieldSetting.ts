import { ChartTooltipDisplayFieldSelectionDropdownContent } from '@/command-menu/pages/page-layout/components/dropdown-content/ChartTooltipDisplayFieldSelectionDropdownContent';
import { CHART_CONFIGURATION_SETTING_LABELS } from '@/command-menu/pages/page-layout/constants/settings/ChartConfigurationSettingLabels';
import { CHART_CONFIGURATION_SETTING_IDS } from '@/command-menu/pages/page-layout/types/ChartConfigurationSettingIds';
import { type ChartSettingsItem } from '@/command-menu/pages/page-layout/types/ChartSettingsGroup';
import { IconList } from 'twenty-ui/display';

export const TOOLTIP_DISPLAY_FIELD_SETTING: ChartSettingsItem = {
  Icon: IconList,
  label: CHART_CONFIGURATION_SETTING_LABELS.TOOLTIP_DISPLAY_FIELD,
  id: CHART_CONFIGURATION_SETTING_IDS.TOOLTIP_DISPLAY_FIELD,
  isBoolean: false,
  DropdownContent: ChartTooltipDisplayFieldSelectionDropdownContent,
};
