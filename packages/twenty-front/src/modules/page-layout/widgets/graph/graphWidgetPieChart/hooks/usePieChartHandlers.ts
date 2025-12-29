import { graphWidgetPieTooltipComponentState } from '@/page-layout/widgets/graph/graphWidgetPieChart/states/graphWidgetPieTooltipComponentState';
import { type PieChartDataItem } from '@/page-layout/widgets/graph/graphWidgetPieChart/types/PieChartDataItem';
import { useSetRecoilComponentState } from '@/ui/utilities/state/component-state/hooks/useSetRecoilComponentState';
import { type ComputedDatum, type DatumId } from '@nivo/pie';
import { useCallback, useState, type MouseEvent } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useDebouncedCallback } from 'use-debounce';

type UsePieChartHandlersProps = {
  data: PieChartDataItem[];
};

export const usePieChartHandlers = ({ data }: UsePieChartHandlersProps) => {
  const [hoveredSliceId, setHoveredSliceId] = useState<DatumId | null>(null);

  const setActiveTooltip = useSetRecoilComponentState(
    graphWidgetPieTooltipComponentState,
  );

  const hideTooltip = useCallback(() => {
    setActiveTooltip(null);
    setHoveredSliceId(null);
  }, [setActiveTooltip]);

  const debouncedHideTooltip = useDebouncedCallback(hideTooltip, 300);

  const handleTooltipMouseEnter = useCallback(() => {
    debouncedHideTooltip.cancel();
  }, [debouncedHideTooltip]);

  const handleTooltipMouseLeave = useCallback(() => {
    debouncedHideTooltip();
  }, [debouncedHideTooltip]);

  const handleMouseEnter = useCallback(
    (
      datum: ComputedDatum<PieChartDataItem>,
      event: MouseEvent<SVGPathElement>,
    ) => {
      debouncedHideTooltip.cancel();
      setHoveredSliceId((prev) => (prev === datum.id ? prev : datum.id));
      setActiveTooltip({
        datum,
        anchorElement: event.currentTarget,
      });
    },
    [debouncedHideTooltip, setActiveTooltip],
  );

  const handleMouseLeave = useCallback(() => {
    debouncedHideTooltip();
  }, [debouncedHideTooltip]);

  const handleSliceClick = useCallback(
    (datum: ComputedDatum<{ id: string; value: number; label?: string }>) => {
      const clickedItem = data.find((d) => d.id === datum.id);
      if (isDefined(clickedItem?.to)) {
        window.location.href = clickedItem.to;
      }
    },
    [data],
  );

  const hasClickableItems = data.some((item) => isDefined(item.to));

  return {
    hoveredSliceId,
    handleMouseEnter,
    handleMouseLeave,
    handleSliceClick,
    hasClickableItems,
    handleTooltipMouseEnter,
    handleTooltipMouseLeave,
  };
};
