import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useEffect, useMemo, useRef } from 'react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { computeRecordGqlOperationFilter, isDefined } from 'twenty-shared/utils';
import { type AggregateChartConfiguration } from '~/generated/graphql';

const AGGREGATE_CHART_TOOLTIP_RECORDS_LIMIT = 50;

type UseAggregateChartRecordsProps = {
  objectMetadataItemId: string;
  configuration: AggregateChartConfiguration;
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

type UseAggregateChartRecordsResult = {
  records: ChartRecord[];
  totalCount: number;
  loading: boolean;
};

// Global cache to persist across re-renders and component instances
const globalAggregateChartCache = new Map<string, CachedChartData>();

export const useAggregateChartRecords = ({
  objectMetadataItemId,
  configuration,
  enabled = true,
}: UseAggregateChartRecordsProps): UseAggregateChartRecordsResult => {
  // Track the last successfully loaded data to prevent flickering during loading
  const lastSuccessfulDataRef = useRef<CachedChartData | null>(null);

  // Early return if not enabled or missing required data
  const shouldQuery =
    enabled &&
    isDefined(objectMetadataItemId) &&
    objectMetadataItemId !== '';

  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataItemId || 'skip',
  });

  const displayField = configuration?.tooltipDisplayFieldMetadataId
    ? objectMetadataItem?.fields?.find(
        (field) => field.id === configuration.tooltipDisplayFieldMetadataId,
      )
    : objectMetadataItem?.fields?.find((field) => field.name === 'name') ||
      objectMetadataItem?.fields?.find(
        (field) => field.id === objectMetadataItem?.labelIdentifierFieldMetadataId,
      );

  // Build filter from configuration
  const combinedFilter = useMemo((): RecordGqlOperationFilter | undefined => {
    if (!shouldQuery) {
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

        return convertedFilter;
      } else {
        // Already in RecordGqlOperationFilter format
        return configFilter as RecordGqlOperationFilter;
      }
    }

    return undefined;
  }, [configuration?.filter, objectMetadataItem, shouldQuery]);

  const { records, loading, totalCount } = useFindManyRecords({
    objectNameSingular: objectMetadataItem?.nameSingular ?? 'skip',
    filter: combinedFilter,
    limit: AGGREGATE_CHART_TOOLTIP_RECORDS_LIMIT,
    skip: !shouldQuery || !objectMetadataItem?.nameSingular,
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
  const cacheKey = `aggregate-${objectMetadataItemId}`;

  // Update cache and lastSuccessfulDataRef when we have new data
  useEffect(() => {
    if (!loading && transformedRecords.length > 0) {
      const newData = {
        records: transformedRecords,
        totalCount: totalCount ?? 0,
      };
      globalAggregateChartCache.set(cacheKey, newData);
      lastSuccessfulDataRef.current = newData;
    }
  }, [loading, transformedRecords, totalCount, cacheKey]);

  const cachedData = globalAggregateChartCache.get(cacheKey);

  // Priority 1: Use cached data
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
      loading: false,
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

  // Priority 4: Loaded with new data
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
