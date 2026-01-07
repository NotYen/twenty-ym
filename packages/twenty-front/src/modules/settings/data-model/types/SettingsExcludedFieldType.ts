import { type FieldType } from '@/settings/data-model/types/FieldType';
import { type PickLiteral } from '~/types/PickLiteral';

// RICH_TEXT (舊版) 已被 RICH_TEXT_V2 取代，排除以避免用戶選錯
// RICH_TEXT_V2 是 Composite 類型，在 SettingsCompositeFieldTypeConfigs 中定義
export type SettingsExcludedFieldType = PickLiteral<
  FieldType,
  'POSITION' | 'TS_VECTOR' | 'RICH_TEXT' | 'RICH_TEXT_V2' | 'NUMERIC'
>;
