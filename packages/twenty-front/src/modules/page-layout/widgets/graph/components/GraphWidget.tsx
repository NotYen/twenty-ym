import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { PageLayoutWidgetNoDataDisplay } from '@/page-layout/widgets/components/PageLayoutWidgetNoDataDisplay';
import { GraphWidgetAggregateChartRenderer } from '@/page-layout/widgets/graph/graphWidgetAggregateChart/components/GraphWidgetAggregateChartRenderer';
import { GraphWidgetBarChartRenderer } from '@/page-layout/widgets/graph/graphWidgetBarChart/components/GraphWidgetBarChartRenderer';
import { GraphWidgetGaugeChartRenderer } from '@/page-layout/widgets/graph/graphWidgetGaugeChart/components/GraphWidgetGaugeChartRenderer';
import { GraphWidgetLineChartRenderer } from '@/page-layout/widgets/graph/graphWidgetLineChart/components/GraphWidgetLineChartRenderer';
import { GraphWidgetPieChartRenderer } from '@/page-layout/widgets/graph/graphWidgetPieChart/components/GraphWidgetPieChartRenderer';
import { areChartConfigurationFieldsValidForQuery } from '@/page-layout/widgets/graph/utils/areChartConfigurationFieldsValidForQuery';
import { GraphType, type PageLayoutWidget } from '~/generated/graphql';

export type GraphWidgetProps = {
  widget: PageLayoutWidget;
  objectMetadataId: string;
  graphType: GraphType;
};

export const GraphWidget = ({
  widget,
  objectMetadataId,
  graphType,
}: GraphWidgetProps) => {
  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataId,
  });

  const hasValidConfiguration = areChartConfigurationFieldsValidForQuery(
    widget.configuration,
    objectMetadataItem,
  );

  if (!hasValidConfiguration) {
    return <PageLayoutWidgetNoDataDisplay widgetId={widget.id} />;
  }

  switch (graphType) {
    case GraphType.AGGREGATE:
      return <GraphWidgetAggregateChartRenderer widget={widget} />;

    case GraphType.GAUGE:
      return <GraphWidgetGaugeChartRenderer widget={widget} />;

    case GraphType.PIE:
      return <GraphWidgetPieChartRenderer widget={widget} />;

    case GraphType.VERTICAL_BAR:
    case GraphType.HORIZONTAL_BAR:
      return <GraphWidgetBarChartRenderer widget={widget} />;

    case GraphType.LINE:
      return <GraphWidgetLineChartRenderer widget={widget} />;

    default:
      return null;
  }
};
