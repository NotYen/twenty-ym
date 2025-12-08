import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { type PieChartDataItem } from '@/page-layout/widgets/graph/graphWidgetPieChart/types/PieChartDataItem';
import { useGraphWidgetGroupByQuery } from '@/page-layout/widgets/graph/hooks/useGraphWidgetGroupByQuery';
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

    const queryKey = Object.keys(queryData)[0];
    const groups = queryData[queryKey]?.groups ?? [];

    return groups.map((group: any, index: number) => {
      const groupValue = group.group?.[groupByField?.name ?? ''];
      const aggregateValue = group.aggregate?.[aggregateOperation] ?? 0;

      let label = 'Unknown';
      if (isDefined(groupValue)) {
        if (typeof groupValue === 'object') {
          label =
            Object.values(groupValue).filter(Boolean).join(' ') || 'Unknown';
        } else {
          label = String(groupValue);
        }
      }

      return {
        id: `slice-${index}`,
        value: Number(aggregateValue) || 0,
        label,
      };
    });
  }, [queryData, aggregateOperation, groupByField?.name]);

  return {
    data: transformedData,
    loading,
    error: error as Error | undefined,
    objectMetadataItem,
  };
};
