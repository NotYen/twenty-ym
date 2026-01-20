import { CHART_DATA_SOURCE_SETTING } from '@/command-menu/pages/page-layout/constants/settings/ChartDataSourceSetting';
import { DATA_DISPLAY_AGGREGATE_SETTING } from '@/command-menu/pages/page-layout/constants/settings/DataDisplayAggregateSetting';
import { DATA_LABELS_SETTING } from '@/command-menu/pages/page-layout/constants/settings/DataLabelsSetting';
import { FILTER_SETTING } from '@/command-menu/pages/page-layout/constants/settings/FilterSetting';
import { TOOLTIP_DISPLAY_FIELD_SETTING } from '@/command-menu/pages/page-layout/constants/settings/TooltipDisplayFieldSetting';
import { type ChartSettingsGroup } from '@/command-menu/pages/page-layout/types/ChartSettingsGroup';
import { t } from '@lingui/core/macro';

export const getGaugeChartSettings = (): ChartSettingsGroup[] => [
  {
    heading: t`Data`,
    items: [
      CHART_DATA_SOURCE_SETTING,
      FILTER_SETTING,
      DATA_DISPLAY_AGGREGATE_SETTING,
      TOOLTIP_DISPLAY_FIELD_SETTING,
    ],
  },
  {
    heading: t`Style`,
    items: [DATA_LABELS_SETTING],
  },
];
