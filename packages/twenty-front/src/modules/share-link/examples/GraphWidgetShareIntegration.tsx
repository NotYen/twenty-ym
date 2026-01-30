import { GraphWidgetWithShare } from '@/share-link/components/GraphWidgetWithShare';
import { type PageLayoutWidget, GraphType } from '~/generated/graphql';

/**
 * 圖表分享整合示例
 *
 * 這個文件展示如何安全地為圖表添加分享功能：
 *
 * 1. 使用包裝組件模式，不修改原有圖表
 * 2. 分享按鈕只在 hover 時顯示，不影響圖表交互
 * 3. 完全向後兼容，可以隨時移除
 */

// 示例：如何在儀表板中使用帶分享功能的圖表
export const DashboardWithShareableCharts = () => {
  // 模擬圖表 widget 數據
  const mockBarChartWidget: PageLayoutWidget = {
    id: 'chart-widget-1',
    title: 'Sales Performance',
    objectMetadataId: 'company-metadata-id',
    configuration: {
      graphType: GraphType.VERTICAL_BAR,
      // ... 其他圖表配置
    },
    // ... 其他 widget 屬性
  } as PageLayoutWidget;

  const mockPieChartWidget: PageLayoutWidget = {
    id: 'chart-widget-2',
    title: 'Revenue Distribution',
    objectMetadataId: 'opportunity-metadata-id',
    configuration: {
      graphType: GraphType.PIE,
      // ... 其他圖表配置
    },
    // ... 其他 widget 屬性
  } as PageLayoutWidget;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px' }}>
      {/* 原有圖表功能完全保持不變 */}
      <div style={{ height: '300px' }}>
        <GraphWidgetWithShare widget={mockBarChartWidget} />
      </div>

      <div style={{ height: '300px' }}>
        <GraphWidgetWithShare widget={mockPieChartWidget} />
      </div>
    </div>
  );
};

/**
 * 整合指南：
 *
 * 要在現有的儀表板中啟用圖表分享功能，只需要：
 *
 * 1. 將現有的 <GraphWidgetRenderer widget={widget} />
 *    替換為 <GraphWidgetWithShare widget={widget} />
 *
 * 2. 如果需要禁用分享功能，只需要改回原來的組件即可
 *
 * 3. 所有現有的圖表功能、樣式、交互都會完全保持不變
 *
 * 安全性保證：
 * - 不修改任何現有圖表組件
 * - 不影響圖表的渲染邏輯
 * - 不改變圖表的事件處理
 * - 分享按鈕使用絕對定位，不影響圖表佈局
 */
