import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { type ExtendedAggregateOperations } from '@/object-record/record-table/types/ExtendedAggregateOperations';
import { getGroupByQueryName } from '@/page-layout/utils/getGroupByQueryName';
import { type PieChartDataItem } from '@/page-layout/widgets/graph/graphWidgetPieChart/types/PieChartDataItem';
import { useGraphWidgetGroupByQuery } from '@/page-layout/widgets/graph/hooks/useGraphWidgetGroupByQuery';
import { computeAggregateValueFromGroupByResult } from '@/page-layout/widgets/graph/utils/computeAggregateValueFromGroupByResult';
import { formatDimensionValue } from '@/page-layout/widgets/graph/utils/formatDimensionValue';
import { useMemo } from 'react';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { type PieChartConfiguration } from '~/generated/graphql';

const PIE_CHART_MAXIMUM_SLICES = 10;

type UseGraphPieChartWidgetDataProps = {
  objectMetadataItemId: string;
  configuration: PieChartConfiguration;
};

type UseGraphPieChartWidgetDataResult = {
  data: PieChartDataItem[];
  loading: boolean;
  error?: Error;
  objectMetadataItem: ObjectMetadataItem;
};

export const useGraphPieChartWidgetData = ({
  objectMetadataItemId,
  configuration,
}: UseGraphPieChartWidgetDataProps): UseGraphPieChartWidgetDataResult => {
  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataItemId,
  });

  const groupByFieldId = configuration.groupByFieldMetadataId;
  const groupByField = objectMetadataItem.fields.find(
    (field) => field.id === groupByFieldId,
  );

  // Get the aggregate field for value computation
  const aggregateFieldId = configuration.aggregateFieldMetadataId;
  const aggregateField = objectMetadataItem.fields.find(
    (field) => field.id === aggregateFieldId,
  );

  const {
    data: queryData,
    loading,
    error,
    aggregateOperation,
  } = useGraphWidgetGroupByQuery({
    objectMetadataItemId,
    configuration,
    limit: PIE_CHART_MAXIMUM_SLICES,
  });

  const transformedData = useMemo((): PieChartDataItem[] => {
    if (!isDefined(queryData) || !isDefined(aggregateOperation) || !isDefined(aggregateField)) {
      return [];
    }

    const queryResultGqlFieldName = getGroupByQueryName(objectMetadataItem);
    const rawResults = queryData[queryResultGqlFieldName];

    if (!isDefined(rawResults) || !Array.isArray(rawResults)) {
      return [];
    }

    return rawResults.map((result: any, index: number) => {
      // Get the dimension value from groupByDimensionValues array
      const dimensionValue = result.groupByDimensionValues?.[0];

      // Format the label using the same logic as Bar Chart
      let label = 'Unknown';
      if (isDefined(dimensionValue) && isDefined(groupByField)) {
        label = formatDimensionValue({
          value: dimensionValue,
          fieldMetadata: groupByField,
          dateGranularity: configuration.dateGranularity ?? undefined,
          subFieldName: configuration.groupBySubFieldName ?? undefined,
        });
      } else if (isDefined(dimensionValue)) {
        label = String(dimensionValue);
      }

      // Use the same aggregate value computation as Bar Chart
      // This handles currency conversion (micros to actual value) automatically
      const aggregateValue = computeAggregateValueFromGroupByResult({
        rawResult: result,
        aggregateField,
        aggregateOperation: configuration.aggregateOperation as unknown as ExtendedAggregateOperations,
        aggregateOperationFromRawResult: aggregateOperation,
        objectMetadataItem,
      });

      // Generate filter URL for "click to see data" functionality
      const to = generateSliceFilterUrl({
        objectMetadataItem,
        groupByField,
        dimensionValue,
        configuration,
      });

      return {
        id: `slice-${index}`,
        value: aggregateValue || 0,
        label: label || 'Unknown',
        rawDimensionValue: dimensionValue,
        to,
      };
    });
  }, [
    queryData,
    aggregateOperation,
    objectMetadataItem,
    groupByField,
    configuration,
    aggregateField,
  ]);

  return {
    data: transformedData,
    loading,
    error: error as Error | undefined,
    objectMetadataItem,
  };
};

// Helper function to generate filter URL for a slice
const generateSliceFilterUrl = ({
  objectMetadataItem,
  groupByField,
  dimensionValue,
  configuration,
}: {
  objectMetadataItem: ObjectMetadataItem;
  groupByField: any;
  dimensionValue: any;
  configuration: PieChartConfiguration;
}): string | undefined => {
  if (!isDefined(groupByField)) {
    return undefined;
  }

  // Build the base path
  const basePath = getAppPath(AppPath.RecordIndexPage, {
    objectNamePlural: objectMetadataItem.namePlural,
  });

  // Build filter query parameter
  // The filter format follows Twenty's URL filter convention
  const subFieldName = configuration.groupBySubFieldName;
  const fieldName = subFieldName
    ? `${groupByField.name}.${subFieldName}`
    : groupByField.name;

  // Handle null/empty values
  const filterValue = isDefined(dimensionValue) && dimensionValue !== ''
    ? String(dimensionValue)
    : '';

  // Use 'is' operand for null values, 'eq' for others
  const operand = filterValue === '' ? 'is' : 'eq';
  const value = filterValue === '' ? 'NULL' : filterValue;

  return `${basePath}?filter=${encodeURIComponent(JSON.stringify({
    [fieldName]: { [operand]: value },
  }))}`;
};
