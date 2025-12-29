import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { RecordGqlOperationFilter } from '@/object-record/graphql/types/RecordGqlOperationFilter';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useEffect, useMemo, useRef } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { type PieChartConfiguration } from '~/generated/graphql';

const PIE_CHART_TOOLTIP_RECORDS_LIMIT = 5;

type UsePieChartSliceRecordsProps = {
  objectMetadataItemId: string;
  configuration: PieChartConfiguration;
  sliceDimensionValue: string | number | null | undefined;
  enabled?: boolean;
};

type SliceRecord = {
  id: string;
  displayValue: string;
};

type CachedSliceData = {
  records: SliceRecord[];
  totalCount: number;
};

type UsePieChartSliceRecordsResult = {
  records: SliceRecord[];
  totalCount: number;
  loading: boolean;
};

// Global cache to persist across re-renders and component instances
const globalSliceCache = new Map<string, CachedSliceData>();

export const usePieChartSliceRecords = ({
  objectMetadataItemId,
  configuration,
  sliceDimensionValue,
  enabled = true,
}: UsePieChartSliceRecordsProps): UsePieChartSliceRecordsResult => {
  // Track the last successfully loaded data to prevent flickering during loading
  const lastSuccessfulDataRef = useRef<CachedSliceData | null>(null);

  // Early return if not enabled or missing required data
  const shouldQuery =
    enabled &&
    isDefined(objectMetadataItemId) &&
    objectMetadataItemId !== '' &&
    isDefined(configuration?.groupByFieldMetadataId) &&
    isDefined(sliceDimensionValue);

  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataItemId || 'skip',
  });

  const groupByField = objectMetadataItem?.fields?.find(
    (field) => field.id === configuration?.groupByFieldMetadataId,
  );

  const displayField = configuration?.tooltipDisplayFieldMetadataId
    ? objectMetadataItem?.fields?.find(
        (field) => field.id === configuration.tooltipDisplayFieldMetadataId,
      )
    : objectMetadataItem?.fields?.find((field) => field.name === 'name') ||
      objectMetadataItem?.labelIdentifierFieldMetadata;

  // Build filter for this slice
  const sliceFilter = useMemo((): RecordGqlOperationFilter | undefined => {
    if (!isDefined(groupByField) || !shouldQuery) {
      return undefined;
    }

    const subFieldName = configuration?.groupBySubFieldName;

    // Handle null/empty values
    if (!isDefined(sliceDimensionValue) || sliceDimensionValue === '') {
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
          [subFieldName]: { eq: sliceDimensionValue },
        },
      };
    }

    // Handle regular field
    return {
      [groupByField.name]: { eq: sliceDimensionValue },
    };
  }, [groupByField, sliceDimensionValue, configuration?.groupBySubFieldName, shouldQuery]);

  // Combine with widget's existing filter
  const combinedFilter = useMemo((): RecordGqlOperationFilter | undefined => {
    if (!isDefined(sliceFilter)) {
      return undefined;
    }

    if (isDefined(configuration?.filter)) {
      return {
        and: [sliceFilter, configuration.filter as RecordGqlOperationFilter],
      };
    }

    return sliceFilter;
  }, [sliceFilter, configuration?.filter]);

  const { records, loading, totalCount } = useFindManyRecords({
    objectNameSingular: objectMetadataItem?.nameSingular ?? 'skip',
    filter: combinedFilter,
    limit: PIE_CHART_TOOLTIP_RECORDS_LIMIT,
    skip: !shouldQuery || !isDefined(combinedFilter) || !objectMetadataItem?.nameSingular,
  });

  const transformedRecords = useMemo((): SliceRecord[] => {
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
  const cacheKey = isDefined(sliceDimensionValue)
    ? `${objectMetadataItemId}-${String(sliceDimensionValue)}`
    : null;

  // Update cache and lastSuccessfulDataRef when we have new data
  useEffect(() => {
    if (!loading && transformedRecords.length > 0 && isDefined(cacheKey)) {
      const newData = {
        records: transformedRecords,
        totalCount: totalCount ?? 0,
      };
      globalSliceCache.set(cacheKey, newData);
      lastSuccessfulDataRef.current = newData;
    }
  }, [loading, transformedRecords, totalCount, cacheKey]);

  // Strategy to prevent flickering:
  // 1. If we have cached data for current slice, use it immediately
  // 2. If loading but we have previous successful data, keep showing it
  // 3. If loading with no previous data, return empty (don't show records section)
  // 4. If loaded with new data, show it

  const cachedData = isDefined(cacheKey) ? globalSliceCache.get(cacheKey) : undefined;

  // Priority 1: Use cached data for current slice
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
