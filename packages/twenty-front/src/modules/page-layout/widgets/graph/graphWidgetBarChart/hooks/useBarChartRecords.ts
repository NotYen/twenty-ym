import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
    buildDateRangeFilter,
    extractYearFromFilter,
    isNonIsoDateGranularity,
} from '@/page-layout/widgets/graph/utils/buildDateRangeFilter';
import { useEffect, useMemo, useRef } from 'react';
import {
    ObjectRecordGroupByDateGranularity,
    type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { computeRecordGqlOperationFilter, isDefined } from 'twenty-shared/utils';
import { type BarChartConfiguration } from '~/generated/graphql';
import { logDebug } from '~/utils/logDebug';

const BAR_CHART_TOOLTIP_RECORDS_LIMIT = 50;

type UseBarChartRecordsProps = {
  objectMetadataItemId: string;
  configuration: BarChartConfiguration;
  barDimensionValue: string | number | null | undefined;
  barSeriesValue?: string | number | null | undefined;
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

type UseBarChartRecordsResult = {
  records: ChartRecord[];
  totalCount: number;
  loading: boolean;
};

// Global cache to persist across re-renders and component instances
const globalBarChartCache = new Map<string, CachedChartData>();

export const useBarChartRecords = ({
  objectMetadataItemId,
  configuration,
  barDimensionValue,
  barSeriesValue,
  enabled = true,
}: UseBarChartRecordsProps): UseBarChartRecordsResult => {
  // Track the last successfully loaded data to prevent flickering during loading
  const lastSuccessfulDataRef = useRef<CachedChartData | null>(null);

  // Early return if not enabled or missing required data
  const shouldQuery =
    enabled &&
    isDefined(objectMetadataItemId) &&
    objectMetadataItemId !== '' &&
    isDefined(configuration?.primaryAxisGroupByFieldMetadataId) &&
    isDefined(barDimensionValue);


  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataItemId || 'skip',
  });

  const groupByField = objectMetadataItem?.fields?.find(
    (field) => field.id === configuration?.primaryAxisGroupByFieldMetadataId,
  );

  // Secondary axis field for stacked charts
  const secondaryGroupByField = objectMetadataItem?.fields?.find(
    (field) => field.id === configuration?.secondaryAxisGroupByFieldMetadataId,
  );

  const displayField = configuration?.tooltipDisplayFieldMetadataId
    ? objectMetadataItem?.fields?.find(
        (field) => field.id === configuration.tooltipDisplayFieldMetadataId,
      )
    : objectMetadataItem?.fields?.find((field) => field.name === 'name') ||
      objectMetadataItem?.fields?.find(
        (field) => field.id === objectMetadataItem?.labelIdentifierFieldMetadataId,
      );

  // Build filter for this bar (primary axis)
  const barFilter = useMemo((): RecordGqlOperationFilter | undefined => {
    if (!isDefined(groupByField) || !shouldQuery) {
      return undefined;
    }

    const subFieldName = configuration?.primaryAxisGroupBySubFieldName;

    // Handle null/empty values
    if (!isDefined(barDimensionValue) || barDimensionValue === '') {
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
      dimensionValue: barDimensionValue,
      dateGranularity: configuration?.primaryAxisDateGranularity as ObjectRecordGroupByDateGranularity | undefined,
      subFieldName,
      field: groupByField,
      referenceYear,
    });

    if (dateRangeFilter) {
      return dateRangeFilter;
    }

    // 如果是非 ISO 日期格式的粒度（如 QUARTER_OF_THE_YEAR），且無法建立日期範圍 filter，
    // 返回空物件，讓 combinedFilter 只包含 widget 的 filter，等於顯示全部記錄
    const primaryGranularity = configuration?.primaryAxisDateGranularity as ObjectRecordGroupByDateGranularity | undefined;
    if (isNonIsoDateGranularity(primaryGranularity)) {
      return {}; // 空 filter，顯示全部記錄
    }

    // Handle subfield (e.g., address.city)
    if (subFieldName) {
      return {
        [groupByField.name]: {
          [subFieldName]: { eq: barDimensionValue },
        },
      };
    }

    // Handle regular field
    return {
      [groupByField.name]: { eq: barDimensionValue },
    };
  }, [groupByField, barDimensionValue, configuration?.primaryAxisGroupBySubFieldName, configuration?.primaryAxisDateGranularity, configuration?.filter, shouldQuery]);

  // Combine with widget's existing filter
  const combinedFilter = useMemo((): RecordGqlOperationFilter | undefined => {
    // barFilter 可能是 undefined（不查詢）或空物件 {}（顯示全部）
    // 只有 undefined 時才不查詢
    if (barFilter === undefined) {
      return undefined;
    }

    // Start with primary axis filter (可能是空物件)
    const filters: RecordGqlOperationFilter[] = [];

    // 只有非空物件才加入 filters
    if (Object.keys(barFilter).length > 0) {
      filters.push(barFilter);
    }

    // Add secondary axis filter for stacked charts (if we have the raw value)
    if (isDefined(barSeriesValue) && isDefined(secondaryGroupByField)) {
      const secondarySubFieldName = configuration?.secondaryAxisGroupBySubFieldName;
      const secondaryGranularity = configuration?.secondaryAxisGroupByDateGranularity as ObjectRecordGroupByDateGranularity | undefined;

      // 嘗試從 filter 中提取年份（用於 MONTH_OF_THE_YEAR / QUARTER_OF_THE_YEAR）
      const secondaryReferenceYear = extractYearFromFilter(
        configuration?.filter,
        secondaryGroupByField.name,
      );

      logDebug('[useBarChartRecords] Secondary axis filter 建立', {
        fieldName: secondaryGroupByField.name,
        barSeriesValue,
        secondaryGranularity,
        secondaryReferenceYear,
        fieldType: secondaryGroupByField.type,
      });

      // Try to build date range filter for date fields with granularity
      const secondaryDateRangeFilter = buildDateRangeFilter({
        fieldName: secondaryGroupByField.name,
        dimensionValue: barSeriesValue,
        dateGranularity: secondaryGranularity,
        subFieldName: secondarySubFieldName,
        field: secondaryGroupByField,
        referenceYear: secondaryReferenceYear,
      });

      logDebug('[useBarChartRecords] Secondary date range filter 結果', {
        secondaryDateRangeFilter,
      });

      if (secondaryDateRangeFilter) {
        filters.push(secondaryDateRangeFilter);
      } else {
        // 檢查是否為非 ISO 日期格式的粒度
        if (isNonIsoDateGranularity(secondaryGranularity)) {
          // 非 ISO 日期格式且無法建立日期範圍 filter，不加入 secondary filter（顯示全部）
          logDebug('[useBarChartRecords] 非 ISO 日期格式粒度，不加入 secondary filter');
        } else if (secondarySubFieldName) {
          // 只有非特殊粒度才使用 eq filter
          filters.push({
            [secondaryGroupByField.name]: {
              [secondarySubFieldName]: { eq: barSeriesValue },
            },
          });
        } else {
          filters.push({
            [secondaryGroupByField.name]: { eq: barSeriesValue },
          });
        }
      }
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

        if (isDefined(convertedFilter) && Object.keys(convertedFilter).length > 0) {
          filters.push(convertedFilter);
        }
      } else {
        // Already in RecordGqlOperationFilter format
        // 只有非空物件才加入
        if (Object.keys(configFilter).length > 0) {
          filters.push(configFilter as RecordGqlOperationFilter);
        }
      }
    }

    // Return combined filter
    // 如果 filters 為空，返回空物件（查詢全部）而不是 undefined
    if (filters.length === 0) {
      return {};
    }
    const finalFilter = filters.length === 1 ? filters[0] : { and: filters };
    logDebug('[useBarChartRecords] 最終 combinedFilter', {
      filtersCount: filters.length,
      finalFilter,
    });
    return finalFilter;
  }, [barFilter, barSeriesValue, secondaryGroupByField, configuration?.secondaryAxisGroupBySubFieldName, configuration?.secondaryAxisGroupByDateGranularity, configuration?.filter, objectMetadataItem]);

  const { records, loading, totalCount } = useFindManyRecords({
    objectNameSingular: objectMetadataItem?.nameSingular ?? 'skip',
    filter: combinedFilter,
    limit: BAR_CHART_TOOLTIP_RECORDS_LIMIT,
    skip: !shouldQuery || combinedFilter === undefined || !objectMetadataItem?.nameSingular,
    fetchPolicy: 'network-only', // 確保每次都從後端取得最新資料
  });

  // 診斷：查看實際查詢返回的資料
  logDebug('[useBarChartRecords] 查詢結果', {
    recordsCount: records?.length,
    loading,
    totalCount,
    firstFewRecords: records?.slice(0, 3).map((r: any) => ({
      id: r.id,
      name: r.name,
      yuJiJieDanRiQi: r.yuJiJieDanRiQi,
    })),
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

  // Create a stable cache key (include series value for stacked charts)
  const cacheKey = isDefined(barDimensionValue)
    ? `${objectMetadataItemId}-${String(barDimensionValue)}${isDefined(barSeriesValue) ? `-${String(barSeriesValue)}` : ''}`
    : null;

  // Update cache and lastSuccessfulDataRef when we have new data
  useEffect(() => {
    if (!loading && transformedRecords.length > 0 && isDefined(cacheKey)) {
      const newData = {
        records: transformedRecords,
        totalCount: totalCount ?? 0,
      };
      globalBarChartCache.set(cacheKey, newData);
      lastSuccessfulDataRef.current = newData;
    }
  }, [loading, transformedRecords, totalCount, cacheKey]);

  // Strategy to prevent flickering:
  // 1. If we have cached data for current bar, use it immediately
  // 2. If loading but we have previous successful data, keep showing it
  // 3. If loading with no previous data, return empty (don't show records section)
  // 4. If loaded with new data, show it

  const cachedData = isDefined(cacheKey) ? globalBarChartCache.get(cacheKey) : undefined;

  // Priority 1: Use cached data for current bar
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
