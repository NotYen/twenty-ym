import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useQuery } from '@apollo/client';
import { GET_SHARED_CONTENT } from '../graphql/queries/getSharedContent';
import { SharedContentData } from '../types/ShareLink';

export interface UseGetSharedContentResult {
  content: SharedContentData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook 用於獲取外部分享內容
 * 實現需求 3.1
 */
export const useGetSharedContent = (
  token: string,
  authToken: string | null = null,
): UseGetSharedContentResult => {
  // 使用 ApolloCoreClient（連接到 /graphql endpoint）
  const apolloCoreClient = useApolloCoreClient();

  const { data, loading, error } = useQuery(GET_SHARED_CONTENT, {
    client: apolloCoreClient,
    variables: { token },
    skip: !token,
    fetchPolicy: 'network-only', // 強制從網路獲取，不使用快取
    context: {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {
            // 明確設置為空，避免 Apollo Client 自動添加認證 header
            Authorization: '',
          },
    },
  });

  // Debug: 查看返回的數據和請求狀態
  if (data) {
    console.log('[useGetSharedContent] ✅ Data received:', data);
    console.log('[useGetSharedContent] getSharedContent:', data.getSharedContent);
    if (data.getSharedContent?.data) {
      try {
        const parsedData = JSON.parse(data.getSharedContent.data);
        console.log('[useGetSharedContent] Parsed data:', parsedData);
        console.log('[useGetSharedContent] Has groupByData:', !!parsedData.groupByData);
        console.log('[useGetSharedContent] Has objectMetadata:', !!parsedData.objectMetadata);
      } catch (e) {
        console.error('[useGetSharedContent] Failed to parse data:', e);
      }
    }
  }
  if (error) {
    console.error('[useGetSharedContent] ❌ Error:', error);
    console.error('[useGetSharedContent] Error message:', error.message);
    console.error('[useGetSharedContent] Error graphQLErrors:', error.graphQLErrors);
    console.error('[useGetSharedContent] Error networkError:', error.networkError);
  }
  if (loading) {
    console.log('[useGetSharedContent] ⏳ Loading...');
  }

  return {
    content: data?.getSharedContent || null,
    loading,
    error: error?.message || null,
  };
};
