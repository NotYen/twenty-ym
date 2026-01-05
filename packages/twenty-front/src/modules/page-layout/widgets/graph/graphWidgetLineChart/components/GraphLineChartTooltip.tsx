import { GraphWidgetFloatingTooltip } from '@/page-layout/widgets/graph/components/GraphWidgetFloatingTooltip';
import { type GraphWidgetTooltipRecord } from '@/page-layout/widgets/graph/components/GraphWidgetTooltip';
import { useLineChartRecords } from '@/page-layout/widgets/graph/graphWidgetLineChart/hooks/useLineChartRecords';
import { graphWidgetLineTooltipComponentState } from '@/page-layout/widgets/graph/graphWidgetLineChart/states/graphWidgetLineTooltipComponentState';
import { type LineChartEnrichedSeries } from '@/page-layout/widgets/graph/graphWidgetLineChart/types/LineChartEnrichedSeries';
import { type LineChartSeries } from '@/page-layout/widgets/graph/graphWidgetLineChart/types/LineChartSeries';
import { getLineChartTooltipData } from '@/page-layout/widgets/graph/graphWidgetLineChart/utils/getLineChartTooltipData';
import { getTooltipReferenceFromLineChartPointAnchor } from '@/page-layout/widgets/graph/utils/getTooltipReferenceFromLineChartPointAnchor';
import { type GraphValueFormatOptions } from '@/page-layout/widgets/graph/utils/graphFormatters';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { type LineSeries, type Point } from '@nivo/line';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { type LineChartConfiguration } from '~/generated/graphql';

type GraphLineChartTooltipProps = {
  containerId: string;
  enrichedSeries: LineChartEnrichedSeries[];
  formatOptions: GraphValueFormatOptions;
  onSliceClick?: (point: Point<LineSeries>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  objectMetadataItemId?: string;
  configuration?: LineChartConfiguration;
  series?: LineChartSeries[];
};

export const GraphLineChartTooltip = ({
  containerId,
  enrichedSeries,
  formatOptions,
  onSliceClick,
  onMouseEnter,
  onMouseLeave,
  objectMetadataItemId,
  configuration,
  series,
}: GraphLineChartTooltipProps) => {
  const tooltipState = useRecoilComponentValue(
    graphWidgetLineTooltipComponentState,
  );

  // Get the hovered point's dimension value for querying records
  const hoveredSlice = tooltipState?.slice;
  const hoveredPointX = hoveredSlice?.points?.[0]?.data?.x;

  // Find the raw dimension value from the original series data (like Pie Chart does)
  const hoveredRawDimensionValue = useMemo(() => {
    if (!isDefined(series) || !isDefined(hoveredPointX)) {
      return undefined;
    }
    // Search through all series to find the data point with matching x value
    for (const s of series) {
      const dataPoint = s.data.find((d) => d.x === hoveredPointX);
      if (isDefined(dataPoint?.rawDimensionValue)) {
        return dataPoint.rawDimensionValue;
      }
    }
    return undefined;
  }, [series, hoveredPointX]);

  // Query records for the hovered point
  const { records, totalCount } = useLineChartRecords({
    objectMetadataItemId: objectMetadataItemId ?? '',
    configuration: configuration ?? ({} as LineChartConfiguration),
    pointDimensionValue: hoveredRawDimensionValue,
    enabled:
      isDefined(objectMetadataItemId) &&
      isDefined(configuration) &&
      isDefined(hoveredSlice) &&
      isDefined(hoveredRawDimensionValue),
  });

  const handleTooltipClick: (() => void) | undefined = isDefined(onSliceClick)
    ? () => {
        if (!isDefined(tooltipState)) return;

        const highlightedPoint = tooltipState.slice.points.find(
          (point) =>
            String(point.seriesId) === tooltipState.highlightedSeriesId,
        );

        if (!isDefined(highlightedPoint)) return;

        onSliceClick(highlightedPoint);
      }
    : undefined;

  const tooltipData = !isDefined(tooltipState)
    ? null
    : getLineChartTooltipData({
        slice: tooltipState.slice,
        enrichedSeries,
        formatOptions,
      });

  const { reference, boundary } = useMemo(() => {
    if (!isDefined(tooltipState)) {
      return { reference: null, boundary: null };
    }
    try {
      return getTooltipReferenceFromLineChartPointAnchor(
        containerId,
        tooltipState.offsetLeft,
        tooltipState.offsetTop,
      );
    } catch {
      return { reference: null, boundary: null };
    }
  }, [containerId, tooltipState?.offsetLeft, tooltipState?.offsetTop]);

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
      items={tooltipData.items}
      indexLabel={tooltipData.indexLabel}
      highlightedKey={tooltipState.highlightedSeriesId}
      onGraphWidgetTooltipClick={handleTooltipClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      records={records as GraphWidgetTooltipRecord[] | undefined}
      totalRecordCount={totalCount}
    />
  );
};
