import { GraphWidgetWithShare } from '@/share-link/components/GraphWidgetWithShare';
import { type PageLayoutWidget, GraphType } from '~/generated/graphql';

/**
 * 個別圖表分享示例
 *
 * 展示每個圖表都有自己獨立的分享功能
 */
export const IndividualChartSharingExample = () => {
  // 儀表板中的三個不同圖表
  const salesBarChart: PageLayoutWidget = {
    id: 'sales-bar-chart-widget',  // 🔑 唯一 ID
    title: '月度銷售業績',           // 🏷️ 圖表標題
    objectMetadataId: 'company-metadata-id',
    configuration: {
      graphType: GraphType.VERTICAL_BAR,
    },
  } as PageLayoutWidget;

  const revenuePieChart: PageLayoutWidget = {
    id: 'revenue-pie-chart-widget',  // 🔑 不同的唯一 ID
    title: '收入來源分布',            // 🏷️ 不同的圖表標題
    objectMetadataId: 'opportunity-metadata-id',
    configuration: {
      graphType: GraphType.PIE,
    },
  } as PageLayoutWidget;

  const growthLineChart: PageLayoutWidget = {
    id: 'growth-line-chart-widget',  // 🔑 又一個不同的唯一 ID
    title: '年度成長趨勢',            // 🏷️ 又一個不同的圖表標題
    objectMetadataId: 'metrics-metadata-id',
    configuration: {
      graphType: GraphType.LINE,
    },
  } as PageLayoutWidget;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
      {/* 圖表 1: 月度銷售業績 */}
      <div style={{ height: '300px', border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
        <h3>月度銷售業績</h3>
        {/*
          這個圖表的分享連結會是：
          /shared/abc123 (針對 sales-bar-chart-widget)
          外部用戶只能看到這個柱狀圖
        */}
        <GraphWidgetWithShare widget={salesBarChart} />
      </div>

      {/* 圖表 2: 收入來源分布 */}
      <div style={{ height: '300px', border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
        <h3>收入來源分布</h3>
        {/*
          這個圖表的分享連結會是：
          /shared/def456 (針對 revenue-pie-chart-widget)
          外部用戶只能看到這個圓餅圖
        */}
        <GraphWidgetWithShare widget={revenuePieChart} />
      </div>

      {/* 圖表 3: 年度成長趨勢 */}
      <div style={{ height: '300px', border: '1px solid #ccc', borderRadius: '8px', padding: '16px', gridColumn: 'span 2' }}>
        <h3>年度成長趨勢</h3>
        {/*
          這個圖表的分享連結會是：
          /shared/ghi789 (針對 growth-line-chart-widget)
          外部用戶只能看到這個折線圖
        */}
        <GraphWidgetWithShare widget={growthLineChart} />
      </div>
    </div>
  );
};

/**
 * 分享行為說明：
 *
 * 1. 🎯 **精確分享**：每個圖表都有自己的分享按鈕和分享連結
 *
 * 2. 🔗 **獨立連結**：
 *    - 銷售圖表 → /shared/token1 → 只顯示銷售數據
 *    - 收入圖表 → /shared/token2 → 只顯示收入分布
 *    - 成長圖表 → /shared/token3 → 只顯示成長趨勢
 *
 * 3. 🛡️ **資料隔離**：
 *    - 分享銷售圖表時，外部用戶看不到收入或成長數據
 *    - 每個分享連結只能存取對應圖表的數據
 *
 * 4. 🎨 **個別設定**：
 *    - 每個圖表可以設定不同的存取模式（公開/需登入）
 *    - 每個圖表可以設定不同的過期時間
 *    - 每個圖表可以獨立啟用/停用分享功能
 *
 * 5. 📊 **使用場景**：
 *    - 銷售經理只分享銷售業績給客戶
 *    - 財務長只分享收入分布給投資人
 *    - CEO 分享成長趨勢給董事會
 */
