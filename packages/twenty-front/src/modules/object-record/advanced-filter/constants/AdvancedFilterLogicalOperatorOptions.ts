import { RecordFilterGroupLogicalOperator } from 'twenty-shared/types';

export const getAdvancedFilterLogicalOperatorOptions = (
  andLabel: string,
  orLabel: string,
) => [
  {
    value: RecordFilterGroupLogicalOperator.AND,
    label: andLabel,
  },
  {
    value: RecordFilterGroupLogicalOperator.OR,
    label: orLabel,
  },
];
