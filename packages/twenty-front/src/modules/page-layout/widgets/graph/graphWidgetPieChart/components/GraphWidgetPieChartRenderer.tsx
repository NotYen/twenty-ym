import { ChartSkeletonLoader } from '@/page-layout/widgets/graph/components/ChartSkeletonLoader';
import { useGraphPieChartWidgetData } from '@/page-layout/widgets/graph/graphWidgetPieChart/hooks/useGraphPieChartWidgetData';
import { type GraphColor } from '@/page-layout/widgets/graph/types/GraphColor';
import { type GraphValueFormatOptions } from '@/page-layout/widgets/graph/utils/graphFormatters';
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
        displayType={
          (configuration.valueDisplayType as GraphValueFormatOptions['displayType']) ??
          'shortNumber'
        }
        id={`pie-chart-${widget.id}`}
        color={(configuration.color as GraphColor) ?? undefined}
        objectMetadataItemId={widget.objectMetadataId}
        configuration={configuration}
      />
    </Suspense>
  );
};
