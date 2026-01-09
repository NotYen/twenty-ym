import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useEffect, useMemo, useRef } from 'react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { computeRecordGqlOperationFilter, isDefined } from 'twenty-shared/utils';
import { type LineChartConfiguration } from '~/generated/graphql';

const LINE_CHART_TOOLTIP_RECORDS_LIMIT = 50;

type UseLineChartRecordsProps = {
  objectMetadataItemId: string;
  configuration: LineChartConfiguration;
  pointDimensionValue: string | number | null | undefined;
  enabled?: boolean;
};

type ChartRecord = {
  id: string;
  displayValue: string;
};

type CachedChartData = {
  records: ChartRecord[];
  totalCount: number;
};

type UseLineChartRecordsResult = {
  records: ChartRecord[];
  totalCount: number;
  loading: boolean;
};

// Global cache to persist across re-renders and component instances
const globalLineChartCache = new Map<string, CachedChartData>();

export const useLineChartRecords = ({
  objectMetadataItemId,
  configuration,
  pointDimensionValue,
  enabled = true,
}: UseLineChartRecordsProps): UseLineChartRecordsResult => {
  // Track the last successfully loaded data to prevent flickering during loading
  const lastSuccessfulDataRef = useRef<CachedChartData | null>(null);

  // Early return if not enabled or missing required data
  const shouldQuery =
    enabled &&
    isDefined(objectMetadataItemId) &&
    objectMetadataItemId !== '' &&
    isDefined(configuration?.primaryAxisGroupByFieldMetadataId) &&
    isDefined(pointDimensionValue);

  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataItemId || 'skip',
  });

  const groupByField = objectMetadataItem?.fields?.find(
    (field) => field.id === configuration?.primaryAxisGroupByFieldMetadataId,
  );

  const displayField = configuration?.tooltipDisplayFieldMetadataId
    ? objectMetadataItem?.fields?.find(
        (field) => field.id === configuration.tooltipDisplayFieldMetadataId,
      )
    : objectMetadataItem?.fields?.find((field) => field.name === 'name') ||
      objectMetadataItem?.fields?.find(
        (field) => field.id === objectMetadataItem?.labelIdentifierFieldMetadataId,
      );


  // Build filter for this point
  const pointFilter = useMemo((): RecordGqlOperationFilter | undefined => {
    if (!isDefined(groupByField) || !shouldQuery) {
      return undefined;
    }

    const subFieldName = configuration?.primaryAxisGroupBySubFieldName;

    // Handle null/empty values
    if (!isDefined(pointDimensionValue) || pointDimensionValue === '') {
      if (subFieldName) {
        return {
          [groupByField.name]: {
            [subFieldName]: { is: 'NULL' },
          },
        };
      }
      return {
        [groupByField.name]: { is: 'NULL' },
      };
    }

    // Handle subfield (e.g., address.city)
    if (subFieldName) {
      return {
        [groupByField.name]: {
          [subFieldName]: { eq: pointDimensionValue },
        },
      };
    }

    // Handle regular field
    return {
      [groupByField.name]: { eq: pointDimensionValue },
    };
  }, [groupByField, pointDimensionValue, configuration?.primaryAxisGroupBySubFieldName, shouldQuery]);

  // Combine with widget's existing filter
  const combinedFilter = useMemo((): RecordGqlOperationFilter | undefined => {
    if (!isDefined(pointFilter)) {
      return undefined;
    }

    // Convert recordFilters/recordFilterGroups format to RecordGqlOperationFilter
    const configFilter = configuration?.filter;
    if (isDefined(configFilter) && isDefined(objectMetadataItem)) {
      const hasRecordFilters =
        Array.isArray(configFilter.recordFilters) ||
        Array.isArray(configFilter.recordFilterGroups);

      if (hasRecordFilters) {
        // Convert new format (recordFilters/recordFilterGroups) to GQL filter
        const convertedFilter = computeRecordGqlOperationFilter({
          fields: objectMetadataItem.fields,
          filterValueDependencies: {},
          recordFilters: configFilter.recordFilters ?? [],
          recordFilterGroups: configFilter.recordFilterGroups ?? [],
        });

        if (isDefined(convertedFilter)) {
          return {
            and: [pointFilter, convertedFilter],
          };
        }
      } else {
        // Already in RecordGqlOperationFilter format
        return {
          and: [pointFilter, configFilter as RecordGqlOperationFilter],
        };
      }
    }

    return pointFilter;
  }, [pointFilter, configuration?.filter, objectMetadataItem]);

  const { records, loading, totalCount } = useFindManyRecords({
    objectNameSingular: objectMetadataItem?.nameSingular ?? 'skip',
    filter: combinedFilter,
    limit: LINE_CHART_TOOLTIP_RECORDS_LIMIT,
    skip: !shouldQuery || !isDefined(combinedFilter) || !objectMetadataItem?.nameSingular,
  });

  const transformedRecords = useMemo((): ChartRecord[] => {
    if (!isDefined(records) || !isDefined(displayField)) {
      return [];
    }

    return records.map((record: any) => {
      let displayValue = '';

      if (displayField.name === 'name') {
        displayValue = record.name || record.id;
      } else {
        const fieldValue = record[displayField.name];
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          // Handle composite fields (e.g., fullName)
          displayValue =
            fieldValue.firstName && fieldValue.lastName
              ? `${fieldValue.firstName} ${fieldValue.lastName}`
              : fieldValue.primaryEmail ||
                fieldValue.primaryPhoneNumber ||
                JSON.stringify(fieldValue);
        } else {
          displayValue = String(fieldValue ?? record.id);
        }
      }

      return {
        id: record.id,
        displayValue,
      };
    });
  }, [records, displayField]);


  // Create a stable cache key
  const cacheKey = isDefined(pointDimensionValue)
    ? `${objectMetadataItemId}-${String(pointDimensionValue)}`
    : null;

  // Update cache and lastSuccessfulDataRef when we have new data
  useEffect(() => {
    if (!loading && transformedRecords.length > 0 && isDefined(cacheKey)) {
      const newData = {
        records: transformedRecords,
        totalCount: totalCount ?? 0,
      };
      globalLineChartCache.set(cacheKey, newData);
      lastSuccessfulDataRef.current = newData;
    }
  }, [loading, transformedRecords, totalCount, cacheKey]);

  // Strategy to prevent flickering:
  // 1. If we have cached data for current point, use it immediately
  // 2. If loading but we have previous successful data, keep showing it
  // 3. If loading with no previous data, return empty (don't show records section)
  // 4. If loaded with new data, show it

  const cachedData = isDefined(cacheKey) ? globalLineChartCache.get(cacheKey) : undefined;

  // Priority 1: Use cached data for current point
  if (isDefined(cachedData)) {
    return {
      records: cachedData.records,
      totalCount: cachedData.totalCount,
      loading: false,
    };
  }

  // Priority 2: If loading, keep showing last successful data to prevent flicker
  if (loading && isDefined(lastSuccessfulDataRef.current)) {
    return {
      records: lastSuccessfulDataRef.current.records,
      totalCount: lastSuccessfulDataRef.current.totalCount,
      loading: false, // Don't show loading state to prevent flicker
    };
  }

  // Priority 3: If loading with no previous data, return empty
  if (loading) {
    return {
      records: [],
      totalCount: 0,
      loading: true,
    };
  }

  // Priority 4: Loaded with new data - update ref and return
  if (transformedRecords.length > 0) {
    const newData = {
      records: transformedRecords,
      totalCount: totalCount ?? 0,
    };
    lastSuccessfulDataRef.current = newData;
  }

  return {
    records: transformedRecords,
    totalCount: totalCount ?? 0,
    loading: false,
  };
};
