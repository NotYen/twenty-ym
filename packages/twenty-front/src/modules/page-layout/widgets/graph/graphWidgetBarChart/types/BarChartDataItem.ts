import { type BarDatum } from '@nivo/bar';

export type BarChartDataItem = BarDatum & {
  to?: string;
  // Raw dimension value for filtering (before formatting)
  rawDimensionValue?: string | number | null;
  // Raw series values for two-dimensional (stacked) charts
  // Key is the formatted series label, value is the raw dimension value
  rawSeriesValues?: Record<string, string | number | null>;
};
