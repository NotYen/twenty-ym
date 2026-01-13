import {
  GraphWidgetTooltip,
  type GraphWidgetTooltipRecord,
} from '@/page-layout/widgets/graph/components/GraphWidgetTooltip';
import { usePieChartSliceRecords } from '@/page-layout/widgets/graph/graphWidgetPieChart/hooks/usePieChartSliceRecords';
import { graphWidgetPieTooltipComponentState } from '@/page-layout/widgets/graph/graphWidgetPieChart/states/graphWidgetPieTooltipComponentState';
import { type PieChartDataItem } from '@/page-layout/widgets/graph/graphWidgetPieChart/types/PieChartDataItem';
import { type PieChartEnrichedData } from '@/page-layout/widgets/graph/graphWidgetPieChart/types/PieChartEnrichedData';
import { useGraphWidgetTooltipFloating } from '@/page-layout/widgets/graph/hooks/useGraphWidgetTooltipFloating';
import {
  formatGraphValue,
  type GraphValueFormatOptions,
} from '@/page-layout/widgets/graph/utils/graphFormatters';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { useTheme } from '@emotion/react';
import { FloatingPortal } from '@floating-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { isDefined } from 'twenty-shared/utils';
import { type PieChartConfiguration } from '~/generated/graphql';

type GraphPieChartTooltipProps = {
  containerId: string;
  enrichedData: PieChartEnrichedData[];
  data: PieChartDataItem[];
  formatOptions: GraphValueFormatOptions;
  displayType?: string;
  objectMetadataItemId?: string;
  configuration?: PieChartConfiguration;
  onSliceClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export const GraphPieChartTooltip = ({
  containerId,
  enrichedData,
  data,
  formatOptions,
  displayType,
  objectMetadataItemId,
  configuration,
  onSliceClick,
  onMouseEnter,
  onMouseLeave,
}: GraphPieChartTooltipProps) => {
  const theme = useTheme();
  const tooltipState = useRecoilComponentValue(
    graphWidgetPieTooltipComponentState,
  );

  // Get the hovered slice data
  const hoveredDatum = tooltipState?.datum;
  const hoveredDataItem = data?.find((d) => d.id === hoveredDatum?.id);
  const hoveredRawDimensionValue = hoveredDataItem?.rawDimensionValue;

  // Query records for the hovered slice
  const { records, totalCount } = usePieChartSliceRecords({
    objectMetadataItemId: objectMetadataItemId ?? '',
    configuration: configuration ?? ({} as PieChartConfiguration),
    sliceDimensionValue: hoveredRawDimensionValue,
    enabled:
      isDefined(objectMetadataItemId) &&
      isDefined(configuration) &&
      isDefined(hoveredDatum),
  });

  // Get container element for positioning
  const containerElement = document.getElementById(containerId);

  // Get reference element (the hovered arc)
  const reference = tooltipState?.anchorElement ?? null;
  const boundary = containerElement ?? null;

  const { refs, floatingStyles } = useGraphWidgetTooltipFloating(
    reference as Element | null,
    boundary as Element | null,
  );

  if (!isDefined(tooltipState) || !isDefined(hoveredDatum)) {
    return null;
  }

  // Verify hovered item exists in enrichedData
  const hoveredItemExists = enrichedData.some((d) => d.id === hoveredDatum.id);
  if (!hoveredItemExists) {
    return null;
  }

  // Build tooltip items for all slices (like bar chart), with hovered item highlighted
  const tooltipItems = enrichedData.map((d) => {
    const formattedValue =
      displayType === 'percentage'
        ? formatGraphValue(d.percentage / 100, formatOptions)
        : `${formatGraphValue(d.value, formatOptions)} (${d.percentage.toFixed(1)}%)`;

    return {
      key: d.id,
      label: d.label || d.id,
      formattedValue,
      value: d.value,
      dotColor: d.colorScheme.solid,
    };
  });

  const handleTooltipClick = isDefined(hoveredDataItem?.to)
    ? () => {
        window.location.href = hoveredDataItem.to!;
      }
    : onSliceClick;

  if (!isDefined(boundary) || !(boundary instanceof HTMLElement)) {
    return null;
  }

  return (
    <FloatingPortal root={boundary}>
      <div
        ref={refs.setFloating}
        style={{ ...floatingStyles, zIndex: theme.lastLayerZIndex }}
        role="tooltip"
        aria-live="polite"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: theme.animation.duration.fast,
              ease: 'easeInOut',
            }}
          >
            <GraphWidgetTooltip
              items={tooltipItems}
              highlightedKey={hoveredDatum.id}
              onGraphWidgetTooltipClick={handleTooltipClick}
              records={records as GraphWidgetTooltipRecord[] | undefined}
              totalRecordCount={totalCount}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </FloatingPortal>
  );
};
