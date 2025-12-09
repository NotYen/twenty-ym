import { ChartSkeletonLoader } from '@/page-layout/widgets/graph/components/ChartSkeletonLoader';
import { useGraphPieChartWidgetData } from '@/page-layout/widgets/graph/graphWidgetPieChart/hooks/useGraphPieChartWidgetData';
import { lazy, Suspense } from 'react';
import {
    type PageLayoutWidget,
    type PieChartConfiguration,
} from '~/generated/graphql';

const GraphWidgetPieChart = lazy(() =>
  import(
    '@/page-layout/widgets/graph/graphWidgetPieChart/components/GraphWidgetPieChart'
  ).then((module) => ({
    default: module.GraphWidgetPieChart,
  })),
);

export const GraphWidgetPieChartRenderer = ({
  widget,
}: {
  widget: PageLayoutWidget;
}) => {
  const configuration = widget.configuration as PieChartConfiguration;

  // Check if configuration has required fields
  const hasValidConfiguration =
    configuration?.aggregateFieldMetadataId &&
    configuration?.groupByFieldMetadataId;

  const { data, loading } = useGraphPieChartWidgetData({
    objectMetadataItemId: widget.objectMetadataId,
    configuration,
  });

  if (loading) {
    return <ChartSkeletonLoader />;
  }

  // Show empty state if configuration is incomplete or no data
  if (!hasValidConfiguration || data.length === 0) {
    return <ChartSkeletonLoader />;
  }

  return (
    <Suspense fallback={<ChartSkeletonLoader />}>
      <GraphWidgetPieChart
        data={data}
        showLegend
        displayType="shortNumber"
        id={`pie-chart-${widget.id}`}
        color={configuration.color ?? undefined}
      />
    </Suspense>
  );
};
