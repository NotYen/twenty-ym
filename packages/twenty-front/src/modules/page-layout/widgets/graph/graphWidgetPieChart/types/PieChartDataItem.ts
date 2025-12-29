import { type GraphColor } from '@/page-layout/widgets/graph/types/GraphColor';

export type PieChartDataItem = {
  id: string;
  value: number;
  label?: string;
  color?: GraphColor;
  to?: string;
  // Raw dimension value for filtering (before formatting)
  rawDimensionValue?: string | number | null;
};
