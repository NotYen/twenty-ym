import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { getAggregateOperationLabel } from '@/object-record/record-board/record-board-column/utils/getAggregateOperationLabel';
import { type ExtendedAggregateOperations } from '@/object-record/record-table/types/ExtendedAggregateOperations';
import { getGroupByQueryResultGqlFieldName } from '@/page-layout/utils/getGroupByQueryResultGqlFieldName';
import { GRAPH_DEFAULT_COLOR } from '@/page-layout/widgets/graph/constants/GraphDefaultColor.constant';
import { LINE_CHART_MAXIMUM_NUMBER_OF_DATA_POINTS } from '@/page-layout/widgets/graph/graphWidgetLineChart/constants/LineChartMaximumNumberOfDataPoints.constant';
import { type LineChartDataPoint } from '@/page-layout/widgets/graph/graphWidgetLineChart/types/LineChartDataPoint';
import { type LineChartSeries } from '@/page-layout/widgets/graph/graphWidgetLineChart/types/LineChartSeries';
import { type GraphColor } from '@/page-layout/widgets/graph/types/GraphColor';
import { type GroupByRawResult } from '@/page-layout/widgets/graph/types/GroupByRawResult';
import { applyCumulativeTransformToLineChartData } from '@/page-layout/widgets/graph/utils/applyCumulativeTransformToLineChartData';
import { computeAggregateValueFromGroupByResult } from '@/page-layout/widgets/graph/utils/computeAggregateValueFromGroupByResult';
import { filterGroupByResults } from '@/page-layout/widgets/graph/utils/filterGroupByResults';
import { formatDimensionValue } from '@/page-layout/widgets/graph/utils/formatDimensionValue';
import { isDefined } from 'twenty-shared/utils';
import {
    AxisNameDisplay,
    type LineChartConfiguration,
} from '~/generated/graphql';

type TransformGroupByDataToLineChartDataParams = {
  groupByData: Record<string, GroupByRawResult[]> | null | undefined;
  objectMetadataItem: ObjectMetadataItem;
  configuration: LineChartConfiguration;
  aggregateOperation: string;
};

type TransformGroupByDataToLineChartDataResult = {
  series: LineChartSeries[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  showDataLabels: boolean;
  hasTooManyGroups: boolean;
};

const EMPTY_LINE_CHART_RESULT: TransformGroupByDataToLineChartDataResult = {
  series: [],
  xAxisLabel: undefined,
  yAxisLabel: undefined,
  showDataLabels: false,
  hasTooManyGroups: false,
};

export const transformGroupByDataToLineChartData = ({
  groupByData,
  objectMetadataItem,
  configuration,
  aggregateOperation,
}: TransformGroupByDataToLineChartDataParams): TransformGroupByDataToLineChartDataResult => {
  if (!isDefined(groupByData)) {
    return EMPTY_LINE_CHART_RESULT;
  }

  const groupByFieldX = objectMetadataItem.fields.find(
    (field: FieldMetadataItem) =>
      field.id === configuration.primaryAxisGroupByFieldMetadataId,
  );

  const aggregateField = objectMetadataItem.fields.find(
    (field: FieldMetadataItem) =>
      field.id === configuration.aggregateFieldMetadataId,
  );

  if (!isDefined(groupByFieldX) || !isDefined(aggregateField)) {
    return EMPTY_LINE_CHART_RESULT;
  }

  const primaryAxisSubFieldName =
    configuration.primaryAxisGroupBySubFieldName ?? undefined;

  const queryResultGqlFieldName =
    getGroupByQueryResultGqlFieldName(objectMetadataItem);
  const rawResults = groupByData[queryResultGqlFieldName];

  if (!isDefined(rawResults) || !Array.isArray(rawResults)) {
    return EMPTY_LINE_CHART_RESULT;
  }

  const filteredResults = filterGroupByResults({
    rawResults,
    filterOptions: {
      rangeMin: configuration.isCumulative
        ? undefined
        : (configuration.rangeMin ?? undefined),
      rangeMax: configuration.isCumulative
        ? undefined
        : (configuration.rangeMax ?? undefined),
      omitNullValues: configuration.omitNullValues ?? false,
    },
    aggregateField,
    aggregateOperation:
      configuration.aggregateOperation as unknown as ExtendedAggregateOperations,
    aggregateOperationFromRawResult: aggregateOperation,
    objectMetadataItem,
  });

  const showXAxis =
    configuration.axisNameDisplay === AxisNameDisplay.X ||
    configuration.axisNameDisplay === AxisNameDisplay.BOTH;

  const showYAxis =
    configuration.axisNameDisplay === AxisNameDisplay.Y ||
    configuration.axisNameDisplay === AxisNameDisplay.BOTH;

  const xAxisLabel = showXAxis ? groupByFieldX.label : undefined;

  const yAxisLabel = showYAxis
    ? `${getAggregateOperationLabel(configuration.aggregateOperation)} of ${aggregateField.label}`
    : undefined;

  const showDataLabels = configuration.displayDataLabel ?? false;

  // TODO: Add a limit to the query instead of slicing here
  const limitedResults = filteredResults.slice(
    0,
    LINE_CHART_MAXIMUM_NUMBER_OF_DATA_POINTS,
  );

  const data: LineChartDataPoint[] = limitedResults
    .map((result) => {
      const dimensionValues = result.groupByDimensionValues;

      const xValue = isDefined(dimensionValues?.[0])
        ? formatDimensionValue({
            value: dimensionValues[0],
            fieldMetadata: groupByFieldX,
            dateGranularity:
              configuration.primaryAxisDateGranularity ?? undefined,
            subFieldName: primaryAxisSubFieldName,
          })
        : '';

      const aggregateValue = computeAggregateValueFromGroupByResult({
        rawResult: result,
        aggregateField,
        aggregateOperation:
          configuration.aggregateOperation as unknown as ExtendedAggregateOperations,
        aggregateOperationFromRawResult: aggregateOperation,
        objectMetadataItem,
      });

      return {
        x: xValue,
        y: aggregateValue,
      };
    })
    .filter((point): point is LineChartDataPoint => isDefined(point));

  const transformedData = configuration.isCumulative
    ? applyCumulativeTransformToLineChartData({
        data,
        rangeMin: configuration.rangeMin ?? undefined,
        rangeMax: configuration.rangeMax ?? undefined,
      })
    : data;

  // If color is 'auto' or undefined, use default color
  const chartColor =
    configuration.color && configuration.color !== 'auto'
      ? (configuration.color as GraphColor)
      : GRAPH_DEFAULT_COLOR;

  const series: LineChartSeries[] = [
    {
      id: aggregateField.name,
      label: aggregateField.label,
      color: chartColor,
      data: transformedData,
    },
  ];

  return {
    series,
    xAxisLabel,
    yAxisLabel,
    showDataLabels,
    hasTooManyGroups:
      rawResults.length > LINE_CHART_MAXIMUM_NUMBER_OF_DATA_POINTS,
  };
};
