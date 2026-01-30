import { GraphWidgetRenderer } from '@/page-layout/widgets/graph/components/GraphWidgetRenderer';
import { GraphWidgetShareWrapper } from '@/share-link/components/GraphWidgetShareWrapper';
import { type PageLayoutWidget } from '~/generated/graphql';

interface GraphWidgetWithShareProps {
  widget: PageLayoutWidget;
}

/**
 * 帶分享功能的圖表組件
 * 包裝現有的 GraphWidgetRenderer，添加分享功能
 * 完全不修改原有圖表邏輯，確保穩定性
 */
export const GraphWidgetWithShare = ({ widget }: GraphWidgetWithShareProps) => {
  return (
    <GraphWidgetShareWrapper widget={widget}>
      <GraphWidgetRenderer widget={widget} />
    </GraphWidgetShareWrapper>
  );
};
