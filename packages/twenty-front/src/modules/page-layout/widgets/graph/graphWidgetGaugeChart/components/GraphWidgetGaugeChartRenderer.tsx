import { ChartSkeletonLoader } from '@/page-layout/widgets/graph/components/ChartSkeletonLoader';
import { useGraphWidgetAggregateQuery } from '@/page-layout/widgets/graph/hooks/useGraphWidgetAggregateQuery';
import { type GraphColor } from '@/page-layout/widgets/graph/types/GraphColor';
import { lazy, Suspense } from 'react';
import {
    type GaugeChartConfiguration,
    type PageLayoutWidget,
} from '~/generated/graphql';

const GraphWidgetGaugeChart = lazy(() =>
  import(
    '@/page-layout/widgets/graph/graphWidgetGaugeChart/components/GraphWidgetGaugeChart'
  ).then((module) => ({
    default: module.GraphWidgetGaugeChart,
  })),
);

export const GraphWidgetGaugeChartRenderer = ({
  widget,
}: {
  widget: PageLayoutWidget;
}) => {
  const configuration = widget.configuration as GaugeChartConfiguration;
  const { value, label, loading } = useGraphWidgetAggregateQuery({
    objectMetadataItemId: widget.objectMetadataId,
    configuration,
  });

  if (loading) {
    return <ChartSkeletonLoader />;
  }

  // Parse the value - it might be a formatted string, so we need to extract the number
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
        : 0;

  // If color is 'auto' or undefined, use default color (handled by useGaugeChartData)
  const chartColor =
    configuration.color && configuration.color !== 'auto'
      ? (configuration.color as GraphColor)
      : undefined;

  return (
    <Suspense fallback={<ChartSkeletonLoader />}>
      <GraphWidgetGaugeChart
        data={{
          value: numericValue,
          min: 0,
          max: 100,
          label: label,
          color: chartColor,
        }}
        displayType="shortNumber"
        showValue
        id={`gauge-chart-${widget.id}`}
      />
    </Suspense>
  );
};
