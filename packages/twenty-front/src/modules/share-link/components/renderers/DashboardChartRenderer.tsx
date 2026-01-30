import type { ExtendedAggregateOperations } from '@/object-record/record-table/types/ExtendedAggregateOperations';
import { getGroupByQueryName } from '@/page-layout/utils/getGroupByQueryName';
import { GraphWidgetBarChart } from '@/page-layout/widgets/graph/graphWidgetBarChart/components/GraphWidgetBarChart';
import type { BarChartDataItem } from '@/page-layout/widgets/graph/graphWidgetBarChart/types/BarChartDataItem';
import { BarChartLayout } from '@/page-layout/widgets/graph/graphWidgetBarChart/types/BarChartLayout';
import { transformGroupByDataToBarChartData } from '@/page-layout/widgets/graph/graphWidgetBarChart/utils/transformGroupByDataToBarChartData';
import { GraphWidgetLineChart } from '@/page-layout/widgets/graph/graphWidgetLineChart/components/GraphWidgetLineChart';
import type { LineChartSeries } from '@/page-layout/widgets/graph/graphWidgetLineChart/types/LineChartSeries';
import { GraphWidgetPieChart } from '@/page-layout/widgets/graph/graphWidgetPieChart/components/GraphWidgetPieChart';
import type { PieChartDataItem } from '@/page-layout/widgets/graph/graphWidgetPieChart/types/PieChartDataItem';
import { GraphWidgetComponentInstanceContext } from '@/page-layout/widgets/graph/states/contexts/GraphWidgetComponentInstanceContext';
import { computeAggregateValueFromGroupByResult } from '@/page-layout/widgets/graph/utils/computeAggregateValueFromGroupByResult';
import { formatDimensionValue } from '@/page-layout/widgets/graph/utils/formatDimensionValue';
import { transformGroupByDataToLineChartData } from '@/page-layout/widgets/graph/utils/transformGroupByDataToLineChartData';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { BarChartGroupMode, GraphType } from '~/generated/graphql';

const StyledChartContainer = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(6)};
  min-height: 400px;
`;

const StyledChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const StyledNoData = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: ${({ theme }) => theme.font.color.tertiary};
  text-align: center;
`;

interface DashboardChartRendererProps {
  data: any;
}

type PieChartTransformedData = {
  type: 'pie';
  data: PieChartDataItem[];
};

type LineChartTransformedData = {
  type: 'line';
  series: LineChartSeries[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  showDataLabels: boolean;
};

type BarChartTransformedData = {
  type: 'bar';
  data: BarChartDataItem[];
  indexBy: string;
  keys: string[];
  series: any[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  showDataLabels: boolean;
  layout?: BarChartLayout;
};

type TransformedChartData =
  | PieChartTransformedData
  | LineChartTransformedData
  | BarChartTransformedData;

/**
 * 儀表板圖表渲染器
 * 外部分享環境專用版本
 *
 * 支援所有圖表類型：BAR, PIE, LINE
 */
export const DashboardChartRenderer = ({
  data,
}: DashboardChartRendererProps) => {
  console.log('[DashboardChartRenderer] Rendering chart:', {
    id: data.id,
    title: data.title,
    type: data.type,
    hasConfiguration: !!data.configuration,
    hasGroupByData: !!data.groupByData,
    hasObjectMetadata: !!data.objectMetadata,
    groupByDataKeys: data.groupByData ? Object.keys(data.groupByData) : [],
  });

  const chartTitle = data.title || t`Dashboard Chart`;
  const configuration = data.configuration;
  const graphType = configuration?.graphType || data.type || 'VERTICAL_BAR';

  const objectMetadataItem = useMemo(() => {
    if (!data.objectMetadata) {
      return null;
    }
    return data.objectMetadata;
  }, [data.objectMetadata]);

  const transformedData = useMemo((): TransformedChartData | null => {
    const hasGroupByData =
      data.groupByData &&
      typeof data.groupByData === 'object' &&
      Object.keys(data.groupByData).length > 0 &&
      Object.values(data.groupByData).some(
        (value) => Array.isArray(value) && value.length > 0,
      );

    if (!hasGroupByData || !objectMetadataItem) {
      return null;
    }

    try {
      switch (graphType) {
        case GraphType.PIE: {
          const queryResultKey = getGroupByQueryName(objectMetadataItem);
          const rawResults = data.groupByData[queryResultKey];

          if (!Array.isArray(rawResults)) {
            return null;
          }

          const aggregateField = objectMetadataItem.fields?.find(
            (f: any) => f.id === configuration.aggregateFieldMetadataId,
          );
          const groupByField = objectMetadataItem.fields?.find(
            (f: any) => f.id === configuration.groupByFieldMetadataId,
          );

          if (!aggregateField || !groupByField) {
            return null;
          }

          const pieData = rawResults.map((result: any, index: number) => {
            const dimensionValue = result.groupByDimensionValues?.[0];

            let label = 'Unknown';
            if (isDefined(dimensionValue)) {
              label = formatDimensionValue({
                value: dimensionValue,
                fieldMetadata: groupByField,
                dateGranularity: configuration.dateGranularity ?? undefined,
                subFieldName: configuration.groupBySubFieldName ?? undefined,
              });
            }

            const aggregateValue = computeAggregateValueFromGroupByResult({
              rawResult: result,
              aggregateField,
              aggregateOperation:
                configuration.aggregateOperation as unknown as ExtendedAggregateOperations,
              aggregateOperationFromRawResult:
                configuration.aggregateOperation as unknown as ExtendedAggregateOperations,
              objectMetadataItem,
            });

            return {
              id: `slice-${index}`,
              value: aggregateValue || 0,
              label: label || 'Unknown',
            };
          });

          return { type: 'pie', data: pieData };
        }

        case GraphType.LINE: {
          const lineData = transformGroupByDataToLineChartData({
            groupByData: data.groupByData,
            objectMetadataItem,
            configuration,
            aggregateOperation: configuration.aggregateOperation,
          });
          return {
            type: 'line',
            series: lineData.series,
            xAxisLabel: lineData.xAxisLabel,
            yAxisLabel: lineData.yAxisLabel,
            showDataLabels: lineData.showDataLabels,
          };
        }

        case GraphType.VERTICAL_BAR:
        case GraphType.HORIZONTAL_BAR:
        default: {
          const barData = transformGroupByDataToBarChartData({
            groupByData: data.groupByData,
            objectMetadataItem,
            configuration,
            aggregateOperation: configuration.aggregateOperation,
          });
          return {
            type: 'bar',
            data: barData.data,
            indexBy: barData.indexBy,
            keys: barData.keys,
            series: barData.series,
            xAxisLabel: barData.xAxisLabel,
            yAxisLabel: barData.yAxisLabel,
            showDataLabels: barData.showDataLabels,
            layout: barData.layout,
          };
        }
      }
    } catch {
      return null;
    }
  }, [data.groupByData, objectMetadataItem, configuration, graphType]);

  if (!transformedData) {
    return (
      <StyledChartContainer>
        <StyledChartTitle>{chartTitle}</StyledChartTitle>
        <StyledNoData>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>
            {!data.groupByData
              ? `⚠️ ${t`Invalid Chart Configuration`}`
              : `📊 ${t`No Data Available`}`}
          </div>
          <div>
            {!data.groupByData
              ? t`This chart is missing configuration data.`
              : t`This chart has no data to display.`}
          </div>
        </StyledNoData>
      </StyledChartContainer>
    );
  }

  const hasData =
    (transformedData.type === 'pie' && transformedData.data.length > 0) ||
    (transformedData.type === 'line' && transformedData.series.length > 0) ||
    (transformedData.type === 'bar' && transformedData.data.length > 0);

  if (!hasData) {
    return (
      <StyledChartContainer>
        <StyledChartTitle>{chartTitle}</StyledChartTitle>
        <StyledNoData>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>
            {`📊 ${t`No Data Available`}`}
          </div>
          <div>{t`This chart has no data to display.`}</div>
        </StyledNoData>
      </StyledChartContainer>
    );
  }

  const chartInstanceId = `external-chart-${data.id || 'default'}`;

  const renderChart = () => {
    if (transformedData.type === 'pie') {
      return (
        <GraphWidgetPieChart
          data={transformedData.data}
          id={chartInstanceId}
          displayType="shortNumber"
          showLegend={true}
        />
      );
    }

    if (transformedData.type === 'line') {
      return (
        <GraphWidgetLineChart
          data={transformedData.series}
          xAxisLabel={transformedData.xAxisLabel}
          yAxisLabel={transformedData.yAxisLabel}
          enablePointLabel={transformedData.showDataLabels}
          id={chartInstanceId}
          displayType="shortNumber"
          showLegend={true}
          showGrid={true}
          rangeMin={configuration.rangeMin ?? undefined}
          rangeMax={configuration.rangeMax ?? undefined}
          omitNullValues={configuration.omitNullValues ?? false}
        />
      );
    }

    const groupMode = getEffectiveGroupMode(
      configuration.groupMode,
      isDefined(configuration.secondaryAxisGroupByFieldMetadataId),
    );

    // 使用 BarChartLayout enum，如果沒有提供則使用 VERTICAL
    const chartLayout = transformedData.layout || BarChartLayout.VERTICAL;

    return (
      <GraphWidgetBarChart
        data={transformedData.data}
        indexBy={transformedData.indexBy}
        keys={transformedData.keys}
        series={transformedData.series}
        xAxisLabel={transformedData.xAxisLabel}
        yAxisLabel={transformedData.yAxisLabel}
        showValues={transformedData.showDataLabels}
        layout={chartLayout}
        groupMode={groupMode}
        id={chartInstanceId}
        displayType="shortNumber"
        rangeMin={configuration.rangeMin ?? undefined}
        rangeMax={configuration.rangeMax ?? undefined}
        omitNullValues={configuration.omitNullValues ?? false}
        showLegend={true}
        showGrid={true}
      />
    );
  };

  return (
    <GraphWidgetComponentInstanceContext.Provider
      value={{ instanceId: chartInstanceId }}
    >
      <StyledChartContainer>
        <StyledChartTitle>{chartTitle}</StyledChartTitle>
        {renderChart()}
      </StyledChartContainer>
    </GraphWidgetComponentInstanceContext.Provider>
  );
};

const getEffectiveGroupMode = (
  configuredGroupMode: string | undefined,
  hasSecondDimension: boolean,
): 'stacked' | 'grouped' => {
  if (!hasSecondDimension) {
    return 'grouped';
  }
  return configuredGroupMode === BarChartGroupMode.STACKED
    ? 'stacked'
    : 'grouped';
};
