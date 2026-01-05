export type LineChartDataPoint = {
  x: number | string | Date;
  y: number | null;
  to?: string;
  // Raw dimension value for filtering (before formatting)
  rawDimensionValue?: string | number | null;
};
