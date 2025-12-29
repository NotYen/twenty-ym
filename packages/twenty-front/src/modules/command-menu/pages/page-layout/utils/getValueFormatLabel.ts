import { t } from '@lingui/core/macro';

export type ValueDisplayType = 'shortNumber' | 'number' | 'currency';

export const getValueFormatLabel = (format: ValueDisplayType): string => {
  switch (format) {
    case 'shortNumber':
      return t`Short (1m, 1k)`;
    case 'number':
      return t`Full (1,000,000)`;
    case 'currency':
      return t`Currency ($1,000,000)`;
    default:
      return t`Short (1m, 1k)`;
  }
};

export const VALUE_FORMAT_OPTIONS: ValueDisplayType[] = [
  'shortNumber',
  'number',
  'currency',
];
