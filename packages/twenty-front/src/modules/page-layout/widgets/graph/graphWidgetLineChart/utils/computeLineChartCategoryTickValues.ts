import { type LineChartSeries } from '@/page-layout/widgets/graph/graphWidgetLineChart/types/LineChartSeries';
import { computeChartCategoryTickValues } from '@/page-layout/widgets/graph/utils/computeChartCategoryTickValues';
import { LINE_CHART_MARGIN_LEFT } from '@/page-layout/widgets/graph/graphWidgetLineChart/constants/LineChartMarginLeft';
import { LINE_CHART_MARGIN_RIGHT } from '@/page-layout/widgets/graph/graphWidgetLineChart/constants/LineChartMarginRight';

const LINE_CHART_MINIMUM_WIDTH_PER_TICK = 100;

export const computeLineChartCategoryTickValues = ({
  width,
  data,
}: {
  width: number;
  data: LineChartSeries[];
}): (string | number)[] => {
  if (data.length === 0 || data[0].data.length === 0) {
    return [];
  }

  const values = data[0].data.map((point) => {
    const value = point.x;
    return typeof value === 'number' || typeof value === 'string'
      ? value
      : String(value);
  });

  const availableWidth =
    width - (LINE_CHART_MARGIN_LEFT + LINE_CHART_MARGIN_RIGHT);

  return computeChartCategoryTickValues({
    availableSize: availableWidth,
    minimumSizePerTick: LINE_CHART_MINIMUM_WIDTH_PER_TICK,
    values,
  });
};
