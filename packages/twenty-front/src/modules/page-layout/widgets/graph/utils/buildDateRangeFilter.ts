import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import {
  FieldMetadataType,
  ObjectRecordGroupByDateGranularity,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { logDebug } from '~/utils/logDebug';

type DateRange = {
  start: string;
  end: string;
};

/**
 * 嘗試解析 ISO 日期格式 (DATE_TRUNC 的結果)
 * 格式: "2026-01-01T00:00:00.000Z" 或 "2026-01-01"
 */
const parseIsoDate = (
  value: string,
): { year: number; month: number; day: number } | undefined => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/);
  if (!match) return undefined;

  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
  };
};

/**
 * 英文星期名稱對應到星期幾 (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
const DAY_OF_WEEK_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * 英文月份名稱對應到月份 (1-12)
 */
const MONTH_OF_YEAR_MAP: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

/**
 * 格式化日期為 YYYY-MM-DD 字串
 * 後端 DateScalarType 期望的格式是 "yyyy-MM-dd"（例如 "2025-12-31"）
 * 不需要時間部分，PostgreSQL 會正確處理 DATE 類型的比較
 */
const formatDateString = (year: number, month: number, day: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * 取得某月的最後一天
 */
const getLastDayOfMonth = (year: number, month: number): number => {
  // month 是 1-indexed (1 = January)
  // new Date(year, month, 0) 會返回上個月的最後一天
  // 所以 new Date(2026, 1, 0) 返回 2026-01-31
  return new Date(year, month, 0).getDate();
};

/**
 * Parse a raw dimension value to a date range based on granularity.
 *
 * 後端 SQL 產生的 rawDimensionValue 格式：
 * - DAY/MONTH/QUARTER/YEAR/WEEK: DATE_TRUNC 結果 → ISO 日期 "2026-01-01T00:00:00.000Z"
 * - DAY_OF_THE_WEEK: TO_CHAR → "Monday", "Tuesday", etc.
 * - MONTH_OF_THE_YEAR: TO_CHAR → "January", "February", etc.
 * - QUARTER_OF_THE_YEAR: TO_CHAR → "Q1", "Q2", "Q3", "Q4"
 *
 * @param referenceYear - 用於 DAY_OF_THE_WEEK/MONTH_OF_THE_YEAR/QUARTER_OF_THE_YEAR 的參考年份
 */
const parseDateRange = (
  dimensionValue: string,
  dateGranularity: ObjectRecordGroupByDateGranularity,
  referenceYear?: number,
): DateRange | undefined => {
  logDebug('[parseDateRange] 輸入', {
    dimensionValue,
    dateGranularity,
    referenceYear,
  });

  switch (dateGranularity) {
    case ObjectRecordGroupByDateGranularity.DAY: {
      // DATE_TRUNC('day', ...) → "2026-01-15T00:00:00.000Z"
      const parsed = parseIsoDate(dimensionValue);
      if (!parsed) return undefined;

      const dateStr = formatDateString(parsed.year, parsed.month, parsed.day);
      return {
        start: dateStr,
        end: dateStr,
      };
    }

    case ObjectRecordGroupByDateGranularity.MONTH: {
      // DATE_TRUNC('month', ...) → "2026-01-01T00:00:00.000Z" (該月第一天)
      const parsed = parseIsoDate(dimensionValue);
      if (!parsed) return undefined;

      const lastDay = getLastDayOfMonth(parsed.year, parsed.month);

      return {
        start: formatDateString(parsed.year, parsed.month, 1),
        end: formatDateString(parsed.year, parsed.month, lastDay),
      };
    }

    case ObjectRecordGroupByDateGranularity.QUARTER: {
      // DATE_TRUNC('quarter', ...) → "2026-01-01T00:00:00.000Z" (該季第一天)
      const parsed = parseIsoDate(dimensionValue);
      if (!parsed) return undefined;

      // 從月份計算季度 (1-3 = Q1, 4-6 = Q2, 7-9 = Q3, 10-12 = Q4)
      const quarter = Math.ceil(parsed.month / 3);
      const startMonth = (quarter - 1) * 3 + 1; // 1-indexed: 1, 4, 7, 10
      const endMonth = startMonth + 2; // 1-indexed: 3, 6, 9, 12
      const lastDay = getLastDayOfMonth(parsed.year, endMonth);

      logDebug('[parseDateRange] QUARTER 解析', {
        parsed,
        quarter,
        startMonth,
        endMonth,
        lastDay,
      });

      return {
        start: formatDateString(parsed.year, startMonth, 1),
        end: formatDateString(parsed.year, endMonth, lastDay),
      };
    }

    case ObjectRecordGroupByDateGranularity.YEAR: {
      // DATE_TRUNC('year', ...) → "2026-01-01T00:00:00.000Z" (該年第一天)
      const parsed = parseIsoDate(dimensionValue);
      if (!parsed) return undefined;

      return {
        start: formatDateString(parsed.year, 1, 1),
        end: formatDateString(parsed.year, 12, 31),
      };
    }

    case ObjectRecordGroupByDateGranularity.WEEK: {
      // DATE_TRUNC('week', ...) → "2026-01-06T00:00:00.000Z" (該週週一)
      const parsed = parseIsoDate(dimensionValue);
      if (!parsed) return undefined;

      // 計算週日的日期 (週一 + 6 天)
      const mondayDate = new Date(parsed.year, parsed.month - 1, parsed.day);
      const sundayDate = new Date(mondayDate);
      sundayDate.setDate(mondayDate.getDate() + 6);

      return {
        start: formatDateString(parsed.year, parsed.month, parsed.day),
        end: formatDateString(
          sundayDate.getFullYear(),
          sundayDate.getMonth() + 1,
          sundayDate.getDate(),
        ),
      };
    }

    case ObjectRecordGroupByDateGranularity.DAY_OF_THE_WEEK: {
      // TO_CHAR → "Monday", "Tuesday", etc.
      // 需要 referenceYear 來確定具體日期範圍
      // 由於無法確定具體是哪一天，這種粒度不適合用於精確 filter
      // 但如果有 referenceYear，我們可以返回該年所有該星期幾的日期（不實際）
      // 目前保持返回 undefined，讓調用方使用其他 filter 策略
      logDebug('[parseDateRange] DAY_OF_THE_WEEK 無法轉換為單一日期範圍', {
        dimensionValue,
        referenceYear,
      });
      return undefined;
    }

    case ObjectRecordGroupByDateGranularity.MONTH_OF_THE_YEAR: {
      // TO_CHAR → "January", "February", etc.
      // 需要 referenceYear 來確定具體年份
      if (!referenceYear) {
        logDebug('[parseDateRange] MONTH_OF_THE_YEAR 缺少 referenceYear', {
          dimensionValue,
        });
        return undefined;
      }

      const monthNum = MONTH_OF_YEAR_MAP[dimensionValue.toLowerCase().trim()];
      if (!monthNum) {
        logDebug('[parseDateRange] MONTH_OF_THE_YEAR 無法解析月份', {
          dimensionValue,
        });
        return undefined;
      }

      const lastDay = getLastDayOfMonth(referenceYear, monthNum);

      logDebug('[parseDateRange] MONTH_OF_THE_YEAR 解析成功', {
        dimensionValue,
        referenceYear,
        monthNum,
        lastDay,
      });

      return {
        start: formatDateString(referenceYear, monthNum, 1),
        end: formatDateString(referenceYear, monthNum, lastDay),
      };
    }

    case ObjectRecordGroupByDateGranularity.QUARTER_OF_THE_YEAR: {
      // TO_CHAR → "Q1", "Q2", "Q3", "Q4"
      // 需要 referenceYear 來確定具體年份
      if (!referenceYear) {
        logDebug('[parseDateRange] QUARTER_OF_THE_YEAR 缺少 referenceYear', {
          dimensionValue,
        });
        return undefined;
      }

      const quarterMatch = dimensionValue.match(/^Q([1-4])$/i);
      if (!quarterMatch) {
        logDebug('[parseDateRange] QUARTER_OF_THE_YEAR 無法解析季度', {
          dimensionValue,
        });
        return undefined;
      }

      const quarter = parseInt(quarterMatch[1], 10);
      const startMonth = (quarter - 1) * 3 + 1; // 1-indexed: 1, 4, 7, 10
      const endMonth = startMonth + 2; // 1-indexed: 3, 6, 9, 12
      const lastDay = getLastDayOfMonth(referenceYear, endMonth);

      logDebug('[parseDateRange] QUARTER_OF_THE_YEAR 解析成功', {
        dimensionValue,
        referenceYear,
        quarter,
        startMonth,
        endMonth,
        lastDay,
      });

      return {
        start: formatDateString(referenceYear, startMonth, 1),
        end: formatDateString(referenceYear, endMonth, lastDay),
      };
    }

    case ObjectRecordGroupByDateGranularity.NONE:
    default:
      return undefined;
  }
};

/**
 * Check if a field is a date type field
 */
const isDateField = (field: FieldMetadataItem): boolean => {
  return (
    field.type === FieldMetadataType.DATE ||
    field.type === FieldMetadataType.DATE_TIME
  );
};

/**
 * 判斷粒度是否為「非 ISO 日期格式」的類型
 * 這些粒度的 rawDimensionValue 不是 ISO 日期，不能直接用於 eq filter
 * - QUARTER_OF_THE_YEAR: "Q1", "Q2", "Q3", "Q4"
 * - MONTH_OF_THE_YEAR: "January", "February", etc.
 * - DAY_OF_THE_WEEK: "Monday", "Tuesday", etc.
 */
export const isNonIsoDateGranularity = (
  granularity: ObjectRecordGroupByDateGranularity | null | undefined,
): boolean => {
  if (!granularity) return false;
  return [
    ObjectRecordGroupByDateGranularity.QUARTER_OF_THE_YEAR,
    ObjectRecordGroupByDateGranularity.MONTH_OF_THE_YEAR,
    ObjectRecordGroupByDateGranularity.DAY_OF_THE_WEEK,
  ].includes(granularity);
};

type BuildDateRangeFilterParams = {
  fieldName: string;
  dimensionValue: string | number | null | undefined;
  dateGranularity?: ObjectRecordGroupByDateGranularity | null;
  subFieldName?: string | null;
  field?: FieldMetadataItem;
  /** 用於 MONTH_OF_THE_YEAR / QUARTER_OF_THE_YEAR 的參考年份 */
  referenceYear?: number;
};

/**
 * Build a filter for date fields with granularity support.
 * For date fields with granularity (e.g., QUARTER, MONTH), converts the formatted
 * dimension value to a date range filter (gte/lte).
 * For non-date fields or unsupported granularities, returns undefined to use default eq filter.
 */
export const buildDateRangeFilter = ({
  fieldName,
  dimensionValue,
  dateGranularity,
  subFieldName,
  field,
  referenceYear,
}: BuildDateRangeFilterParams): RecordGqlOperationFilter | undefined => {
  logDebug('[buildDateRangeFilter] 輸入', {
    fieldName,
    dimensionValue,
    dateGranularity,
    subFieldName,
    fieldType: field?.type,
    referenceYear,
  });

  // If no dimension value, return undefined
  if (!isDefined(dimensionValue) || dimensionValue === '') {
    logDebug('[buildDateRangeFilter] 無 dimensionValue，返回 undefined');
    return undefined;
  }

  // If no date granularity or field is not a date type, return undefined (use default eq filter)
  if (!isDefined(dateGranularity) || (field && !isDateField(field))) {
    logDebug('[buildDateRangeFilter] 無日期粒度或非日期欄位，返回 undefined', {
      hasGranularity: isDefined(dateGranularity),
      isDateField: field ? isDateField(field) : 'no field',
    });
    return undefined;
  }

  // Try to parse the dimension value to a date range
  const dateRange = parseDateRange(
    String(dimensionValue),
    dateGranularity,
    referenceYear,
  );

  logDebug('[buildDateRangeFilter] 解析結果', { dateRange });

  if (!dateRange) {
    // Cannot parse, return undefined to use default eq filter
    logDebug('[buildDateRangeFilter] 無法解析日期範圍，返回 undefined');
    return undefined;
  }

  // Build the date range filter
  // 注意：後端 GraphqlQueryFilterFieldParser 只處理第一個 operator
  // 所以需要把 gte 和 lte 分開成兩個 filter 用 and 組合
  const gteFilter = subFieldName
    ? { [fieldName]: { [subFieldName]: { gte: dateRange.start } } }
    : { [fieldName]: { gte: dateRange.start } };

  const lteFilter = subFieldName
    ? { [fieldName]: { [subFieldName]: { lte: dateRange.end } } }
    : { [fieldName]: { lte: dateRange.end } };

  // 如果開始和結束日期相同（如 DAY 粒度），只需要一個 filter
  if (dateRange.start === dateRange.end) {
    const eqFilter = subFieldName
      ? { [fieldName]: { [subFieldName]: { eq: dateRange.start } } }
      : { [fieldName]: { eq: dateRange.start } };
    logDebug('[buildDateRangeFilter] 返回 eq filter（同一天）', eqFilter);
    return eqFilter;
  }

  const result = {
    and: [gteFilter, lteFilter],
  };
  logDebug('[buildDateRangeFilter] 返回 and filter', result);
  return result;
};

/**
 * 從 filter 配置中提取日期欄位的年份資訊
 * 用於 MONTH_OF_THE_YEAR / QUARTER_OF_THE_YEAR 等需要年份的粒度
 */
export const extractYearFromFilter = (
  filter: unknown,
  dateFieldName?: string,
): number | undefined => {
  if (!filter || typeof filter !== 'object') {
    return undefined;
  }

  const filterObj = filter as Record<string, unknown>;

  // 嘗試從 recordFilters 中提取
  if (Array.isArray(filterObj.recordFilters)) {
    for (const recordFilter of filterObj.recordFilters) {
      if (
        recordFilter &&
        typeof recordFilter === 'object' &&
        'value' in recordFilter
      ) {
        const value = (recordFilter as { value: string }).value;
        // 嘗試解析日期值
        const parsed = parseIsoDate(value);
        if (parsed) {
          logDebug('[extractYearFromFilter] 從 recordFilters 提取年份', {
            value,
            year: parsed.year,
          });
          return parsed.year;
        }
      }
    }
  }

  // 嘗試從直接的 GQL filter 格式中提取
  if (dateFieldName && filterObj[dateFieldName]) {
    const fieldFilter = filterObj[dateFieldName] as Record<string, unknown>;
    const possibleDateValues = [
      fieldFilter.gte,
      fieldFilter.lte,
      fieldFilter.eq,
      fieldFilter.gt,
      fieldFilter.lt,
    ];

    for (const value of possibleDateValues) {
      if (typeof value === 'string') {
        const parsed = parseIsoDate(value);
        if (parsed) {
          logDebug('[extractYearFromFilter] 從 GQL filter 提取年份', {
            value,
            year: parsed.year,
          });
          return parsed.year;
        }
      }
    }
  }

  // 遞迴搜尋 and/or 條件
  if (Array.isArray(filterObj.and)) {
    for (const subFilter of filterObj.and) {
      const year = extractYearFromFilter(subFilter, dateFieldName);
      if (year) return year;
    }
  }

  if (Array.isArray(filterObj.or)) {
    for (const subFilter of filterObj.or) {
      const year = extractYearFromFilter(subFilter, dateFieldName);
      if (year) return year;
    }
  }

  return undefined;
};
