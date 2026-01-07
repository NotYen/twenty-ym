import { GraphWidgetFloatingTooltip } from '@/page-layout/widgets/graph/components/GraphWidgetFloatingTooltip';
import { type GraphWidgetTooltipRecord } from '@/page-layout/widgets/graph/components/GraphWidgetTooltip';
import { useBarChartRecords } from '@/page-layout/widgets/graph/graphWidgetBarChart/hooks/useBarChartRecords';
import { graphWidgetBarTooltipComponentState } from '@/page-layout/widgets/graph/graphWidgetBarChart/states/graphWidgetBarTooltipComponentState';
import { type BarChartDataItem } from '@/page-layout/widgets/graph/graphWidgetBarChart/types/BarChartDataItem';
import { type BarChartEnrichedKey } from '@/page-layout/widgets/graph/graphWidgetBarChart/types/BarChartEnrichedKey';
import { getBarChartTooltipData } from '@/page-layout/widgets/graph/graphWidgetBarChart/utils/getBarChartTooltipData';
import { getTooltipReferenceFromBarChartElementAnchor } from '@/page-layout/widgets/graph/utils/getTooltipReferenceFromBarChartElementAnchor';
import { type GraphValueFormatOptions } from '@/page-layout/widgets/graph/utils/graphFormatters';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { type ComputedDatum } from '@nivo/bar';
import { isDefined } from 'twenty-shared/utils';
import { type BarChartConfiguration } from '~/generated/graphql';

type GraphBarChartTooltipProps = {
  containerId: string;
  enrichedKeys: BarChartEnrichedKey[];
  formatOptions: GraphValueFormatOptions;
  enableGroupTooltip?: boolean;
  layout?: 'vertical' | 'horizontal';
  onBarClick?: (datum: ComputedDatum<BarChartDataItem>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  objectMetadataItemId?: string;
  configuration?: BarChartConfiguration;
  data?: BarChartDataItem[];
};

export const GraphBarChartTooltip = ({
  containerId,
  enrichedKeys,
  formatOptions,
  enableGroupTooltip = true,
  layout = 'vertical',
  onBarClick,
  onMouseEnter,
  onMouseLeave,
  objectMetadataItemId,
  configuration,
  data,
}: GraphBarChartTooltipProps) => {
  const tooltipState = useRecoilComponentValue(
    graphWidgetBarTooltipComponentState,
  );

  // Get the hovered bar's data item to access rawDimensionValue
  // Use the same pattern as Pie Chart: find from data prop using indexValue
  const hoveredDatum = tooltipState?.datum;
  // Find the matching data item by checking if any value in the item matches indexValue
  // This works because indexValue is the formatted dimension value stored in data[indexBy]
  const hoveredDataItem = data?.find((d) =>
    Object.values(d).some((val) => val === hoveredDatum?.indexValue),
  );
  const hoveredRawDimensionValue = hoveredDataItem?.rawDimensionValue;

  // Query records for the hovered bar
  // Note: For stacked charts, this will show all records for the X-axis group
  // because we don't have the raw Y-axis value stored.
  const { records, totalCount } = useBarChartRecords({
    objectMetadataItemId: objectMetadataItemId ?? '',
    configuration: configuration ?? ({} as BarChartConfiguration),
    barDimensionValue: hoveredRawDimensionValue,
    enabled:
      isDefined(objectMetadataItemId) &&
      isDefined(configuration) &&
      isDefined(hoveredDatum) &&
      isDefined(hoveredRawDimensionValue),
  });

  const handleTooltipClick: (() => void) | undefined = isDefined(onBarClick)
    ? () => {
        if (isDefined(tooltipState)) {
          onBarClick(tooltipState.datum);
        }
      }
    : undefined;

  const tooltipData = !isDefined(tooltipState)
    ? null
    : getBarChartTooltipData({
        datum: tooltipState.datum,
        enrichedKeys,
        formatOptions,
        enableGroupTooltip,
        layout,
      });

  let reference = null;
  let boundary = null;

  if (isDefined(tooltipState)) {
    try {
      const positioning = getTooltipReferenceFromBarChartElementAnchor(
        tooltipState.anchorElement,
        containerId,
      );
      reference = positioning.reference;
      boundary = positioning.boundary;
    } catch {
      reference = null;
      boundary = null;
    }
  }

  if (
    !isDefined(tooltipData) ||
    !isDefined(reference) ||
    !isDefined(boundary)
  ) {
    return null;
  }

  return (
    <GraphWidgetFloatingTooltip
      reference={reference}
      boundary={boundary}
      items={tooltipData.tooltipItems}
      indexLabel={tooltipData.indexLabel}
      highlightedKey={tooltipData.hoveredKey}
      onGraphWidgetTooltipClick={handleTooltipClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      records={records as GraphWidgetTooltipRecord[] | undefined}
      totalRecordCount={totalCount}
    />
  );
};
