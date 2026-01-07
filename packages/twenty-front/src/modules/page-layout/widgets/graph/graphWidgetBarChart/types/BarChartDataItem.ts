import { type BarDatum } from '@nivo/bar';

export type BarChartDataItem = BarDatum & {
  to?: string;
  // Raw dimension value for filtering (before formatting)
  rawDimensionValue?: string | number | null;
};
