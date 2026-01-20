import { getAggregateChartSettings } from '@/command-menu/pages/page-layout/constants/AggregateChartSettings';
import { getGaugeChartSettings } from '@/command-menu/pages/page-layout/constants/GaugeChartSettings';
import { getLineChartSettings } from '@/command-menu/pages/page-layout/constants/LineChartSettings';
import { getPieChartSettings } from '@/command-menu/pages/page-layout/constants/PieChartSettings';
import { type ChartSettingsGroup } from '@/command-menu/pages/page-layout/types/ChartSettingsGroup';
import { getBarChartSettings } from '@/command-menu/pages/page-layout/utils/getBarChartSettings';
import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import {
  IconChartBar,
  IconChartBarHorizontal,
  IconChartLine,
  IconChartPie,
  type IconComponent,
  IconGauge,
  IconSum,
} from 'twenty-ui/display';
import { GraphType } from '~/generated-metadata/graphql';

export const GRAPH_TYPE_INFORMATION: Record<
  GraphType,
  {
    label: MessageDescriptor;
    icon: IconComponent;
    settings: ChartSettingsGroup[];
  }
> = {
  [GraphType.VERTICAL_BAR]: {
    label: msg`Vertical`,
    icon: IconChartBar,
    settings: getBarChartSettings(GraphType.VERTICAL_BAR),
  },
  [GraphType.HORIZONTAL_BAR]: {
    label: msg`Horizontal`,
    icon: IconChartBarHorizontal,
    settings: getBarChartSettings(GraphType.HORIZONTAL_BAR),
  },
  [GraphType.PIE]: {
    label: msg`Pie`,
    icon: IconChartPie,
    settings: getPieChartSettings(),
  },
  [GraphType.LINE]: {
    label: msg`Line`,
    icon: IconChartLine,
    settings: getLineChartSettings(),
  },
  [GraphType.AGGREGATE]: {
    label: msg`Aggregate`,
    icon: IconSum,
    settings: getAggregateChartSettings(),
  },
  [GraphType.GAUGE]: {
    label: msg`Gauge`,
    icon: IconGauge,
    settings: getGaugeChartSettings(),
  },
};
