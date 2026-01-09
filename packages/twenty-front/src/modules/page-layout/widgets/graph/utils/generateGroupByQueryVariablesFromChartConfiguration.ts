import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { type GroupByChartConfiguration } from '@/page-layout/widgets/graph/types/GroupByChartConfiguration';
import { getGroupByOrderBy } from '@/page-layout/widgets/graph/utils/getGroupByOrderBy';
import {
  type AggregateOrderByWithGroupByField,
  type ObjectRecordOrderByForCompositeField,
  type ObjectRecordOrderByForScalarField,
  type ObjectRecordOrderByWithGroupByDateField,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { buildGroupByFieldObject } from './buildGroupByFieldObject';
import {
  type BarChartConfiguration,
  type LineChartConfiguration,
} from '~/generated-metadata/graphql';

type AxisChartConfiguration = BarChartConfiguration | LineChartConfiguration;

export const generateGroupByQueryVariablesFromChartConfiguration = ({
  objectMetadataItem,
  chartConfiguration,
  aggregateOperation,
  limit,
}: {
  objectMetadataItem: ObjectMetadataItem;
  chartConfiguration: GroupByChartConfiguration;
  aggregateOperation?: string;
  limit?: number;
}) => {
  // Handle PieChartConfiguration which uses different field names
  const isPieChart = chartConfiguration.__typename === 'PieChartConfiguration';

  const axisConfig = isPieChart
    ? undefined
    : (chartConfiguration as AxisChartConfiguration);

  const groupByFieldXId = isPieChart
    ? (chartConfiguration as any).groupByFieldMetadataId
    : axisConfig!.primaryAxisGroupByFieldMetadataId;

  const groupByFieldYId = isPieChart
    ? undefined
    : axisConfig!.secondaryAxisGroupByFieldMetadataId;

  const groupBySubFieldNameX = isPieChart
    ? ((chartConfiguration as any).groupBySubFieldName ?? undefined)
    : (axisConfig!.primaryAxisGroupBySubFieldName ?? undefined);

  const groupBySubFieldNameY = isPieChart
    ? undefined
    : (axisConfig!.secondaryAxisGroupBySubFieldName ?? undefined);

  const groupByFieldX = objectMetadataItem.fields.find(
    (field) => field.id === groupByFieldXId,
  );

  const groupByFieldY = isDefined(groupByFieldYId)
    ? objectMetadataItem.fields.find((field) => field.id === groupByFieldYId)
    : undefined;

  if (!isDefined(groupByFieldX) || !isDefined(groupByFieldXId)) {
    throw new Error(
      `Field with id ${groupByFieldXId} not found in object metadata`,
    );
  }

  const groupBy: Array<
    Record<string, boolean | Record<string, boolean | string>>
  > = [];

  // Get date granularity based on chart type
  const dateGranularityX = isPieChart
    ? ((chartConfiguration as any).dateGranularity ?? undefined)
    : (axisConfig!.primaryAxisDateGranularity ?? undefined);

  groupBy.push(
    buildGroupByFieldObject({
      field: groupByFieldX,
      subFieldName: groupBySubFieldNameX,
      dateGranularity: dateGranularityX,
    }),
  );

  if (isDefined(groupByFieldY) && !isPieChart) {
    const axisConfig = chartConfiguration as AxisChartConfiguration;
    groupBy.push(
      buildGroupByFieldObject({
        field: groupByFieldY,
        subFieldName: groupBySubFieldNameY,
        dateGranularity:
          axisConfig.secondaryAxisGroupByDateGranularity ?? undefined,
      }),
    );
  }

  const orderBy: Array<
    | AggregateOrderByWithGroupByField
    | ObjectRecordOrderByForScalarField
    | ObjectRecordOrderByWithGroupByDateField
    | ObjectRecordOrderByForCompositeField
  > = [];

  // Handle orderBy for Pie Chart (uses 'orderBy' instead of 'primaryAxisOrderBy')
  const primaryOrderBy = isPieChart
    ? (chartConfiguration as any).orderBy
    : (chartConfiguration as AxisChartConfiguration).primaryAxisOrderBy;

  if (isDefined(primaryOrderBy)) {
    orderBy.push(
      getGroupByOrderBy({
        graphOrderBy: primaryOrderBy,
        groupByField: groupByFieldX,
        groupBySubFieldName: groupBySubFieldNameX,
        aggregateOperation,
        dateGranularity: dateGranularityX,
      }),
    );
  }
  if (isDefined(groupByFieldY) && !isPieChart) {
    const axisConfig = chartConfiguration as AxisChartConfiguration;
    if (isDefined(axisConfig.secondaryAxisOrderBy)) {
      orderBy.push(
        getGroupByOrderBy({
          graphOrderBy: axisConfig.secondaryAxisOrderBy,
          groupByField: groupByFieldY,
          groupBySubFieldName: axisConfig.secondaryAxisGroupBySubFieldName,
          aggregateOperation,
          dateGranularity:
            axisConfig.secondaryAxisGroupByDateGranularity ?? undefined,
        }),
      );
    }
  }

  return {
    groupBy,
    ...(orderBy.length > 0 && { orderBy }),
    ...(isDefined(limit) && { limit }),
  };
};
