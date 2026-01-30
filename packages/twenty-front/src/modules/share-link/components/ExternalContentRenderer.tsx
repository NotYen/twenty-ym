
import { SharedContentData } from '../types/ShareLink';
import { DashboardChartRenderer } from './renderers/DashboardChartRenderer';
import { RecordRenderer } from './renderers/RecordRenderer';

interface ExternalContentRendererProps {
  content: SharedContentData;
}

/**
 * 外部內容統一渲染器
 * 根據資源類型選擇對應的渲染器
 * 實現需求 3.1, 3.2, 3.3, 3.4, 3.5
 */
export const ExternalContentRenderer = ({ content }: ExternalContentRendererProps) => {
  console.log('[ExternalContentRenderer] Rendering content:', {
    resourceType: content.resourceType,
    resourceId: content.resourceId,
    title: content.title,
    dataType: typeof content.data,
    dataLength: content.data?.length,
  });

  // Parse JSON 字串
  let parsedData: any;
  try {
    parsedData = typeof content.data === 'string' ? JSON.parse(content.data) : content.data;
    console.log('[ExternalContentRenderer] Parsed data:', {
      hasGroupByData: !!parsedData.groupByData,
      hasObjectMetadata: !!parsedData.objectMetadata,
      groupByDataKeys: parsedData.groupByData ? Object.keys(parsedData.groupByData) : [],
    });
  } catch (e) {
    console.error('[ExternalContentRenderer] Failed to parse data:', e);
    return <div>Failed to load content data</div>;
  }

  // 圖表分享
  if (content.resourceType === 'DASHBOARD_CHART') {
    return <DashboardChartRenderer data={parsedData} />;
  }

  // 表格分享 - 使用通用 renderer
  // 後端已經返回 objectMetadata，直接使用
  if (parsedData.objectMetadata || parsedData.__typename) {
    return <RecordRenderer data={parsedData} objectMetadata={parsedData.objectMetadata} />;
  }

  return <div>Unsupported resource type: {content.resourceType}</div>;
};
