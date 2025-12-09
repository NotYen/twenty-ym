import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { getGroupByQueryName } from '@/page-layout/utils/getGroupByQueryName';
import { type PieChartDataItem } from '@/page-layout/widgets/graph/graphWidgetPieChart/types/PieChartDataItem';
import { useGraphWidgetGroupByQuery } from '@/page-layout/widgets/graph/hooks/useGraphWidgetGroupByQuery';
import { formatDimensionValue } from '@/page-layout/widgets/graph/utils/formatDimensionValue';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';
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
    if (!isDefined(queryData) || !isDefined(aggregateOperation)) {
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

      // Get the aggregate value
      const aggregateValue = result[aggregateOperation] ?? 0;

      return {
        id: `slice-${index}`,
        value: Number(aggregateValue) || 0,
        label: label || 'Unknown',
      };
    });
  }, [
    queryData,
    aggregateOperation,
    objectMetadataItem,
    groupByField,
    configuration.dateGranularity,
    configuration.groupBySubFieldName,
  ]);

  return {
    data: transformedData,
    loading,
    error: error as Error | undefined,
    objectMetadataItem,
  };
};
