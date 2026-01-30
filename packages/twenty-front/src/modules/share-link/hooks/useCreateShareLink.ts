import { useMutation } from '@apollo/client';
import { t } from '@lingui/core/macro';
import { useState } from 'react';

import { CREATE_SHARE_LINK } from '../graphql/mutations/createShareLink';
import { CreateShareLinkInput } from '../types/ShareLink';

export interface UseCreateShareLinkResult {
  createShareLink: (input: CreateShareLinkInput) => Promise<void>;
  shareUrl: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * 創建分享連結的 Hook
 * 實現需求 1.5, 1.6
 *
 * 功能：
 * - 調用 GraphQL mutation 創建分享連結
 * - 生成完整的分享 URL
 * - 處理載入狀態和錯誤
 */
export const useCreateShareLink = (): UseCreateShareLinkResult => {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createShareLinkMutation, { loading }] = useMutation(CREATE_SHARE_LINK, {
    onCompleted: (data) => {
      if (data?.createShareLink?.token) {
        // 使用環境變數或當前 origin 來生成完整的 HTTPS URL
        // 在生產環境中，window.location.origin 會自動是 https://
        const baseUrl = import.meta.env.VITE_FRONT_BASE_URL || window.location.origin;
        const fullShareUrl = `${baseUrl}/shared/${data.createShareLink.token}`;
        setShareUrl(fullShareUrl);
        setError(null);
      }
    },
    onError: (apolloError) => {
      console.error('Failed to create share link:', apolloError);
      setError(t`Failed to create share link. Please try again.`);
      setShareUrl(null);
    },
  });

  const createShareLink = async (input: CreateShareLinkInput) => {
    try {
      setError(null);
      await createShareLinkMutation({
        variables: {
          input: {
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            accessMode: input.accessMode,
            expiresAt: input.expiresAt?.toISOString(),
            inactivityExpirationDays: input.inactivityExpirationDays,
          },
        },
      });
    } catch (err) {
      // 錯誤已在 onError 中處理
      console.error('Create share link error:', err);
    }
  };

  return {
    createShareLink,
    shareUrl,
    loading,
    error,
  };
};
