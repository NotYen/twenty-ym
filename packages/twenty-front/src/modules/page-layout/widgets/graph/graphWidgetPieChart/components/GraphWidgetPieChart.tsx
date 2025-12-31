import { GraphWidgetChartContainer } from '@/page-layout/widgets/graph/components/GraphWidgetChartContainer';
import { GraphWidgetLegend } from '@/page-layout/widgets/graph/components/GraphWidgetLegend';
import { GraphPieChartTooltip } from '@/page-layout/widgets/graph/graphWidgetPieChart/components/GraphPieChartTooltip';
import { PieChartEndLines } from '@/page-layout/widgets/graph/graphWidgetPieChart/components/PieChartEndLines';
import { usePieChartData } from '@/page-layout/widgets/graph/graphWidgetPieChart/hooks/usePieChartData';
import { usePieChartHandlers } from '@/page-layout/widgets/graph/graphWidgetPieChart/hooks/usePieChartHandlers';
import { type PieChartDataItem } from '@/page-layout/widgets/graph/graphWidgetPieChart/types/PieChartDataItem';
import { createGraphColorRegistry } from '@/page-layout/widgets/graph/utils/createGraphColorRegistry';
import { type GraphValueFormatOptions } from '@/page-layout/widgets/graph/utils/graphFormatters';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ResponsivePie, type PieCustomLayerProps } from '@nivo/pie';
import { isDefined } from 'twenty-shared/utils';

import { type GraphColor } from '@/page-layout/widgets/graph/types/GraphColor';
import { type PieChartConfiguration } from '~/generated/graphql';

type GraphWidgetPieChartProps = {
  data: PieChartDataItem[];
  showLegend?: boolean;
  id: string;
  color?: GraphColor;
  // New props for record list in tooltip
  objectMetadataItemId?: string;
  configuration?: PieChartConfiguration;
} & GraphValueFormatOptions;

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

export const GraphWidgetPieChart = ({
  data,
  showLegend = true,
  id,
  color,
  displayType,
  decimals,
  prefix,
  suffix,
  customFormatter,
  objectMetadataItemId,
  configuration,
}: GraphWidgetPieChartProps) => {
  const theme = useTheme();
  const colorRegistry = createGraphColorRegistry(theme);

  // If a specific color is selected (not 'auto'), apply it to all data items
  // 'auto' means use the default palette with different colors for each slice
  const coloredData =
    isDefined(color) && color !== 'auto'
      ? data.map((item) => ({ ...item, color }))
      : data;

  const formatOptions: GraphValueFormatOptions = {
    displayType,
    decimals,
    prefix,
    suffix,
    customFormatter,
  };

  const {
    hoveredSliceId,
    handleMouseEnter,
    handleMouseLeave,
    handleSliceClick,
    hasClickableItems,
    handleTooltipMouseEnter,
    handleTooltipMouseLeave,
  } = usePieChartHandlers({ data: coloredData });

  const { enrichedData, enrichedDataMap, defs, fill } = usePieChartData({
    data: coloredData,
    colorRegistry,
    id,
    hoveredSliceId,
  });

  const renderSliceEndLines = (
    layerProps: PieCustomLayerProps<PieChartDataItem>,
  ) => (
    <PieChartEndLines
      dataWithArc={layerProps.dataWithArc}
      centerX={layerProps.centerX}
      centerY={layerProps.centerY}
      innerRadius={layerProps.innerRadius}
      radius={layerProps.radius}
      enrichedDataMap={enrichedDataMap}
    />
  );

  return (
    <StyledContainer id={id}>
      <GraphWidgetChartContainer
        $isClickable={hasClickableItems}
        $cursorSelector='svg g path[fill^="url(#"]'
      >
        <ResponsivePie
          data={coloredData}
          innerRadius={0.8}
          colors={enrichedData.map((item) => `url(#${item.gradientId})`)}
          borderWidth={0}
          enableArcLinkLabels={false}
          enableArcLabels={false}
          tooltip={() => null}
          onClick={handleSliceClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          defs={defs}
          fill={fill}
          layers={['arcs', renderSliceEndLines]}
        />
      </GraphWidgetChartContainer>
      <GraphPieChartTooltip
        containerId={id}
        enrichedData={enrichedData}
        data={coloredData}
        formatOptions={formatOptions}
        displayType={displayType}
        objectMetadataItemId={objectMetadataItemId}
        configuration={configuration}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
      />
      <GraphWidgetLegend
        show={showLegend}
        items={enrichedData.map((item) => ({
          id: item.id,
          label: item.label || item.id,
          color: item.colorScheme.solid,
        }))}
      />
    </StyledContainer>
  );
};
