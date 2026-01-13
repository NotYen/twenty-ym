import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  buildDateRangeFilter,
  extractYearFromFilter,
  isNonIsoDateGranularity,
} from '@/page-layout/widgets/graph/utils/buildDateRangeFilter';
import { useEffect, useMemo, useRef } from 'react';
import {
  type ObjectRecordGroupByDateGranularity,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import {
  computeRecordGqlOperationFilter,
  isDefined,
} from 'twenty-shared/utils';
import { type PieChartConfiguration } from '~/generated/graphql';

const PIE_CHART_TOOLTIP_RECORDS_LIMIT = 50;

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
      objectMetadataItem?.fields?.find(
        (field) =>
          field.id === objectMetadataItem?.labelIdentifierFieldMetadataId,
      );

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

    // 嘗試從 filter 中提取年份（用於 MONTH_OF_THE_YEAR / QUARTER_OF_THE_YEAR）
    const referenceYear = extractYearFromFilter(
      configuration?.filter,
      groupByField.name,
    );

    // Try to build date range filter for date fields with granularity
    const dateRangeFilter = buildDateRangeFilter({
      fieldName: groupByField.name,
      dimensionValue: sliceDimensionValue,
      dateGranularity: configuration?.dateGranularity as
        | ObjectRecordGroupByDateGranularity
        | undefined,
      subFieldName,
      field: groupByField,
      referenceYear,
    });

    if (dateRangeFilter) {
      return dateRangeFilter;
    }

    // 如果是非 ISO 日期格式的粒度（如 QUARTER_OF_THE_YEAR），且無法建立日期範圍 filter，
    // 返回空物件，讓 combinedFilter 只包含 widget 的 filter，等於顯示全部記錄
    const pieGranularity = configuration?.dateGranularity as
      | ObjectRecordGroupByDateGranularity
      | undefined;
    if (isNonIsoDateGranularity(pieGranularity)) {
      return {}; // 空 filter，顯示全部記錄
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
  }, [
    groupByField,
    sliceDimensionValue,
    configuration?.groupBySubFieldName,
    configuration?.dateGranularity,
    configuration?.filter,
    shouldQuery,
  ]);

  // Combine with widget's existing filter
  const combinedFilter = useMemo((): RecordGqlOperationFilter | undefined => {
    // sliceFilter 可能是 undefined（不查詢）或空物件 {}（顯示全部）
    if (sliceFilter === undefined) {
      return undefined;
    }

    const filters: RecordGqlOperationFilter[] = [];

    // 只有非空物件才加入 filters
    if (Object.keys(sliceFilter).length > 0) {
      filters.push(sliceFilter);
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
          filters.push(convertedFilter);
        }
      } else {
        // Already in RecordGqlOperationFilter format
        filters.push(configFilter as RecordGqlOperationFilter);
      }
    }

    // 如果 filters 為空，返回空物件（查詢全部）
    if (filters.length === 0) {
      return {};
    }
    return filters.length === 1 ? filters[0] : { and: filters };
  }, [sliceFilter, configuration?.filter, objectMetadataItem]);

  const { records, loading, totalCount } = useFindManyRecords({
    objectNameSingular: objectMetadataItem?.nameSingular ?? 'skip',
    filter: combinedFilter,
    limit: PIE_CHART_TOOLTIP_RECORDS_LIMIT,
    skip:
      !shouldQuery ||
      combinedFilter === undefined ||
      !objectMetadataItem?.nameSingular,
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

  const cachedData = isDefined(cacheKey)
    ? globalSliceCache.get(cacheKey)
    : undefined;

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
