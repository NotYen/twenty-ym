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

  const groupByFieldXId = isPieChart
    ? (chartConfiguration as any).groupByFieldMetadataId
    : chartConfiguration.primaryAxisGroupByFieldMetadataId;

  const groupByFieldYId = isPieChart
    ? undefined
    : chartConfiguration.secondaryAxisGroupByFieldMetadataId;

  const groupBySubFieldNameX = isPieChart
    ? ((chartConfiguration as any).groupBySubFieldName ?? undefined)
    : (chartConfiguration.primaryAxisGroupBySubFieldName ?? undefined);

  const groupBySubFieldNameY = isPieChart
    ? undefined
    : (chartConfiguration.secondaryAxisGroupBySubFieldName ?? undefined);

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
    : (chartConfiguration.primaryAxisDateGranularity ?? undefined);

  groupBy.push(
    buildGroupByFieldObject({
      field: groupByFieldX,
      subFieldName: groupBySubFieldNameX,
      dateGranularity: dateGranularityX,
    }),
  );

  if (isDefined(groupByFieldY)) {
    groupBy.push(
      buildGroupByFieldObject({
        field: groupByFieldY,
        subFieldName: groupBySubFieldNameY,
        dateGranularity:
          chartConfiguration.secondaryAxisGroupByDateGranularity ?? undefined,
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
    : chartConfiguration.primaryAxisOrderBy;

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
  if (
    isDefined(groupByFieldY) &&
    isDefined(chartConfiguration.secondaryAxisOrderBy)
  ) {
    orderBy.push(
      getGroupByOrderBy({
        graphOrderBy: chartConfiguration.secondaryAxisOrderBy,
        groupByField: groupByFieldY,
        groupBySubFieldName:
          chartConfiguration.secondaryAxisGroupBySubFieldName,
        aggregateOperation,
        dateGranularity:
          chartConfiguration.secondaryAxisGroupByDateGranularity ?? undefined,
      }),
    );
  }

  return {
    groupBy,
    ...(orderBy.length > 0 && { orderBy }),
    ...(isDefined(limit) && { limit }),
  };
};

