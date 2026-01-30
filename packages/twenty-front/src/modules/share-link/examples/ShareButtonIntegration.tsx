import { ShareButton } from '../components/ShareButton';

/**
 * ShareButton 整合示例
 * 展示如何將分享按鈕添加到現有的記錄頁面中
 *
 * 使用方式：
 * 1. 在公司詳情頁面的操作按鈕區域添加
 * 2. 在人員詳情頁面的操作按鈕區域添加
 * 3. 在報價單詳情頁面的操作按鈕區域添加
 */

// 示例 1: 公司記錄頁面整合
export const CompanyRecordPageExample = ({ companyId, companyName }: { companyId: string; companyName: string }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* 現有的操作按鈕 */}
      <button>Edit</button>
      <button>Delete</button>

      {/* 新增的分享按鈕 */}
      <ShareButton
        resourceType="COMPANY"
        resourceId={companyId}
        resourceName={companyName}
      />
    </div>
  );
};

// 示例 2: 人員記錄頁面整合
export const PersonRecordPageExample = ({ personId, personName }: { personId: string; personName: string }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* 現有的操作按鈕 */}
      <button>Edit</button>
      <button>Delete</button>

      {/* 新增的分享按鈕 */}
      <ShareButton
        resourceType="PERSON"
        resourceId={personId}
        resourceName={personName}
      />
    </div>
  );
};

// 示例 3: 報價單記錄頁面整合
export const SalesQuoteRecordPageExample = ({ quoteId, quoteName }: { quoteId: string; quoteName: string }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* 現有的操作按鈕 */}
      <button>Edit</button>
      <button>Delete</button>
      <button>Download PDF</button>

      {/* 新增的分享按鈕 */}
      <ShareButton
        resourceType="SALES_QUOTE"
        resourceId={quoteId}
        resourceName={quoteName}
      />
    </div>
  );
};

// 示例 4: 儀表板圖表整合
export const DashboardChartExample = ({ chartId, chartTitle }: { chartId: string; chartTitle: string }) => {
  return (
    <div style={{ position: 'relative' }}>
      {/* 圖表內容 */}
      <div style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>{chartTitle}</h3>
        <div>Chart content here...</div>
      </div>

      {/* 分享按鈕（右上角） */}
      <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
        <ShareButton
          resourceType="DASHBOARD_CHART"
          resourceId={chartId}
          resourceName={chartTitle}
        />
      </div>
    </div>
  );
};

/**
 * 整合指南：
 *
 * 1. 在現有的記錄頁面中找到操作按鈕區域
 * 2. 導入 ShareButton 組件
 * 3. 添加 ShareButton 並傳入正確的 props：
 *    - resourceType: 資源類型
 *    - resourceId: 資源 ID
 *    - resourceName: 資源名稱（用於顯示）
 *
 * 4. 確保在頁面的 GraphQL provider 中包含分享連結的 mutations
 *
 * 範例整合位置：
 * - packages/twenty-front/src/modules/companies/components/CompanyShowPage.tsx
 * - packages/twenty-front/src/modules/people/components/PersonShowPage.tsx
 * - packages/twenty-front/src/modules/sales-quote/components/SalesQuoteShowPage.tsx
 * - packages/twenty-front/src/modules/dashboards/components/DashboardChart.tsx
 */
