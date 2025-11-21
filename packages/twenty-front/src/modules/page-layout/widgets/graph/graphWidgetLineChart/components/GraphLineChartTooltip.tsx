import { GraphWidgetFloatingTooltip } from '@/page-layout/widgets/graph/components/GraphWidgetFloatingTooltip';
import { type LineChartEnrichedSeries } from '@/page-layout/widgets/graph/graphWidgetLineChart/types/LineChartEnrichedSeries';
import { getLineChartTooltipData } from '@/page-layout/widgets/graph/graphWidgetLineChart/utils/getLineChartTooltipData';
import { getTooltipReferenceFromLineChartPointAnchor } from '@/page-layout/widgets/graph/utils/getTooltipReferenceFromLineChartPointAnchor';
import { type GraphValueFormatOptions } from '@/page-layout/widgets/graph/utils/graphFormatters';
import { graphWidgetLineTooltipComponentState } from '@/page-layout/widgets/graph/graphWidgetLineChart/states/graphWidgetLineTooltipComponentState';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { type LineSeries, type Point } from '@nivo/line';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';

type GraphLineChartTooltipProps = {
  containerId: string;
  enrichedSeries: LineChartEnrichedSeries[];
  formatOptions: GraphValueFormatOptions;
  onSliceClick?: (point: Point<LineSeries>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export const GraphLineChartTooltip = ({
  containerId,
  enrichedSeries,
  formatOptions,
  onSliceClick,
  onMouseEnter,
  onMouseLeave,
}: GraphLineChartTooltipProps) => {
  const tooltipState = useRecoilComponentValue(
    graphWidgetLineTooltipComponentState,
  );

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
    />
  );
};
