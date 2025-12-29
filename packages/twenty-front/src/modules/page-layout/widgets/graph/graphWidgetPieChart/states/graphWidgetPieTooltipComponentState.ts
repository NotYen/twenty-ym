import { type PieChartDataItem } from '@/page-layout/widgets/graph/graphWidgetPieChart/types/PieChartDataItem';
import { GraphWidgetComponentInstanceContext } from '@/page-layout/widgets/graph/states/contexts/GraphWidgetComponentInstanceContext';
import { createComponentState } from '@/ui/utilities/state/component-state/utils/createComponentState';
import { type ComputedDatum } from '@nivo/pie';

export type PieTooltipState = {
  datum: ComputedDatum<PieChartDataItem>;
  anchorElement: Element;
} | null;

export const graphWidgetPieTooltipComponentState =
  createComponentState<PieTooltipState>({
    key: 'graphWidgetPieTooltipComponentState',
    defaultValue: null,
    componentInstanceContext: GraphWidgetComponentInstanceContext,
  });
