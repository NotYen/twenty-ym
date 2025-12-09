import { ChartGroupByFieldSelectionDropdownContentBase } from '@/command-menu/pages/page-layout/components/dropdown-content/ChartGroupByFieldSelectionDropdownContentBase';
import {
  FieldMetadataType,
  type PieChartConfiguration,
} from '~/generated/graphql';

// Field types that are not suitable for grouping in Pie Chart
const EXCLUDED_FIELD_TYPES_FOR_PIE_CHART_GROUP_BY: FieldMetadataType[] = [
  FieldMetadataType.NUMBER,
  FieldMetadataType.CURRENCY,
  FieldMetadataType.RICH_TEXT,
  FieldMetadataType.RICH_TEXT_V2,
];

export const ChartPieFieldSelectionDropdownContent = () => {
  return (
    <ChartGroupByFieldSelectionDropdownContentBase<PieChartConfiguration>
      fieldMetadataIdKey="groupByFieldMetadataId"
      subFieldNameKey="groupBySubFieldName"
      excludedFieldTypes={EXCLUDED_FIELD_TYPES_FOR_PIE_CHART_GROUP_BY}
    />
  );
};
