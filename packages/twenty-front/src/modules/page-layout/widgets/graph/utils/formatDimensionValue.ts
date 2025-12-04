import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { GRAPH_DEFAULT_DATE_GRANULARITY } from '@/page-layout/widgets/graph/constants/GraphDefaultDateGranularity.constant';
import { formatDateByGranularity } from '@/page-layout/widgets/graph/utils/formatDateByGranularity';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import {
    FieldMetadataType,
    ObjectRecordGroupByDateGranularity,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { formatToShortNumber } from '~/utils/format/formatToShortNumber';
import { logDebug } from '~/utils/logDebug';

type FormatDimensionValueParams = {
  value: unknown;
  fieldMetadata: FieldMetadataItem;
  dateGranularity?: ObjectRecordGroupByDateGranularity;
  subFieldName?: string;
};

const normalizeMultiSelectValue = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [value];
  }

  const trimmed = value.trim();
  const isPostgresArrayFormat =
    trimmed.startsWith('{') && trimmed.endsWith('}');

  if (!isPostgresArrayFormat) {
    return [value];
  }

  const content = trimmed.slice(1, -1);
  return content ? content.split(',') : [];
};

export const formatDimensionValue = ({
  value,
  fieldMetadata,
  dateGranularity,
  subFieldName,
}: FormatDimensionValueParams): string => {
  if (!isDefined(value)) {
    return t`Not Set`;
  }

  const effectiveDateGranularity = (dateGranularity ??
    GRAPH_DEFAULT_DATE_GRANULARITY) as ObjectRecordGroupByDateGranularity;

  // 🔍 調試日誌：用於定位圖表標籤問題
  logDebug('[formatDimensionValue] 輸入數據', {
    value,
    type: fieldMetadata.type,
    name: fieldMetadata.name,
    label: fieldMetadata.label,
    subFieldName,
    options: fieldMetadata.options,
  });

  switch (fieldMetadata.type) {
    case FieldMetadataType.SELECT: {
      const selectedOption = fieldMetadata.options?.find(
        (option) => option.value === value,
      );
      return selectedOption?.label ?? String(value);
    }

    case FieldMetadataType.MULTI_SELECT: {
      const values = normalizeMultiSelectValue(value);

      return values
        .map((value) => {
          const option = fieldMetadata.options?.find(
            (option) => option.value === value,
          );
          return option?.label ?? String(value);
        })
        .join(', ');
    }

    case FieldMetadataType.BOOLEAN: {
      return value === true ? t`Yes` : t`No`;
    }

    case FieldMetadataType.DATE:
    case FieldMetadataType.DATE_TIME: {
      const parsedDate = new Date(String(value));

      if (isNaN(parsedDate.getTime())) {
        return String(value);
      }

      if (
        effectiveDateGranularity ===
          ObjectRecordGroupByDateGranularity.DAY_OF_THE_WEEK ||
        effectiveDateGranularity ===
          ObjectRecordGroupByDateGranularity.MONTH_OF_THE_YEAR ||
        effectiveDateGranularity ===
          ObjectRecordGroupByDateGranularity.QUARTER_OF_THE_YEAR
      ) {
        return String(value);
      }
      return formatDateByGranularity(parsedDate, effectiveDateGranularity);
    }

    case FieldMetadataType.NUMBER:
    case FieldMetadataType.CURRENCY: {
      if (
        fieldMetadata.type === FieldMetadataType.CURRENCY &&
        subFieldName === 'currencyCode'
      ) {
        if (!isNonEmptyString(value)) {
          return t`Not Set`;
        }

        return String(value);
      }
      const numericValue = typeof value === 'number' ? value : Number(value);
      if (isNaN(numericValue)) {
        return String(value);
      }
      return formatToShortNumber(numericValue);
    }

    case FieldMetadataType.RELATION: {
      if (isDefined(dateGranularity)) {
        const parsedDate = new Date(String(value));
        if (isNaN(parsedDate.getTime())) {
          return String(value);
        }
        if (
          dateGranularity ===
            ObjectRecordGroupByDateGranularity.DAY_OF_THE_WEEK ||
          dateGranularity ===
            ObjectRecordGroupByDateGranularity.MONTH_OF_THE_YEAR ||
          dateGranularity ===
            ObjectRecordGroupByDateGranularity.QUARTER_OF_THE_YEAR
        ) {
          return String(value);
        }
        return formatDateByGranularity(parsedDate, dateGranularity);
      }
      return String(value);
    }

    default: {
      const result = String(value);

      // 🔍 調試日誌：記錄 default 分支的處理結果
      logDebug('[formatDimensionValue] default 分支', {
        input: value,
        output: result,
        type: fieldMetadata.type,
      });

      return result;
    }
  }
};
