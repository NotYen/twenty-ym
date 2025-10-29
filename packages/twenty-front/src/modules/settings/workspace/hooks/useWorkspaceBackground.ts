import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { useRecoilState } from 'recoil';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { UPLOAD_WORKSPACE_BACKGROUND } from '@/workspace/graphql/mutations/uploadWorkspaceBackground';
import { useUpdateWorkspaceMutation } from '~/generated-metadata/graphql';
import { isUndefinedOrNull } from '~/utils/isUndefinedOrNull';
import { logError } from '~/utils/logError';

export type BackgroundSettings = {
  opacity: number;
  scale: number;
  position: { x: number; y: number };
  size: 'cover' | 'contain' | 'auto';
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
};

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  opacity: 0.3,
  scale: 1.0,
  position: { x: 50, y: 50 },
  size: 'cover',
  repeat: 'no-repeat',
};

export const useWorkspaceBackground = () => {
  const [currentWorkspace, setCurrentWorkspace] = useRecoilState(
    currentWorkspaceState,
  );
  const [uploadBackgroundMutation, { loading: isUploading }] = useMutation(
    UPLOAD_WORKSPACE_BACKGROUND,
  );
  const [updateWorkspace] = useUpdateWorkspaceMutation();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadBackground = async (file: File): Promise<string> => {
    if (isUndefinedOrNull(file)) {
      throw new Error('No file provided');
    }

    if (!currentWorkspace?.id) {
      throw new Error('Workspace not found');
    }

    try {
      // 簡單驗證（符合 Twenty 官方模式）
      if (!file.type.startsWith('image/')) {
        const errorMsg = '請上傳圖片文件';
        enqueueErrorSnackBar({ message: errorMsg });
        throw new Error(errorMsg);
      }

      // 文件大小限制檢查
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        const errorMsg = `圖片文件過大（${fileSizeMB.toFixed(1)}MB）。請選擇小於 10MB 的圖片。`;
        enqueueErrorSnackBar({ message: errorMsg });
        throw new Error(errorMsg);
      }

      // 上傳（後端 Sharp 會自動優化）
      const result = await uploadBackgroundMutation({
        variables: { file },
      });

      const signedFile = result?.data?.uploadWorkspaceBackground;

      if (!signedFile) {
        logError(
          '[useWorkspaceBackground] Upload failed: no signed file returned',
        );
        throw new Error('Upload failed');
      }

      // ⭐ 重新查詢 workspace 以獲取後端 resolver 簽名後的 backgroundImage
      // 這樣可以確保 token 由後端統一管理，且不會手動構建過期的 token
      const updatedWorkspace = await updateWorkspace({
        variables: { input: {} },
      });

      const signedBackgroundImage =
        updatedWorkspace.data?.updateWorkspace?.backgroundImage;

      if (!signedBackgroundImage) {
        logError(
          '[useWorkspaceBackground] Failed to retrieve signed background image',
        );
        throw new Error('Failed to retrieve signed background image');
      }

      // 更新本地狀態（使用後端 resolver 簽名後的路徑）
      setCurrentWorkspace({
        ...currentWorkspace,
        backgroundImage: signedBackgroundImage,
      });

      setErrorMessage(null);
      enqueueSuccessSnackBar({ message: '背景圖片上傳成功' });

      return signedBackgroundImage;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : '上傳背景圖片時發生錯誤';
      setErrorMessage(errorMsg);
      enqueueErrorSnackBar({ message: errorMsg });
      throw error;
    }
  };

  const updateBackgroundSettings = async (settings: BackgroundSettings) => {
    if (!currentWorkspace?.id) {
      throw new Error('Workspace not found');
    }

    try {
      await updateWorkspace({
        variables: {
          input: {
            backgroundImageSettings: settings,
          } as any,
        },
      });

      setCurrentWorkspace({
        ...currentWorkspace,
        backgroundImageSettings: settings,
      });

      setErrorMessage(null);
      enqueueSuccessSnackBar({ message: '背景設定已保存' });
    } catch (error) {
      const errorMsg = '保存背景設定時發生錯誤';
      setErrorMessage(errorMsg);
      enqueueErrorSnackBar({ message: errorMsg });
      throw error;
    }
  };

  const removeBackground = async () => {
    if (!currentWorkspace?.id) {
      throw new Error('Workspace not found');
    }

    try {
      await updateWorkspace({
        variables: {
          input: {
            backgroundImage: null,
            backgroundImageSettings: null,
          } as any,
        },
      });

      setCurrentWorkspace({
        ...currentWorkspace,
        backgroundImage: null,
        backgroundImageSettings: null,
      });

      setErrorMessage(null);
      enqueueSuccessSnackBar({ message: '背景圖片已移除' });
    } catch (error) {
      const errorMsg = '移除背景圖片時發生錯誤';
      setErrorMessage(errorMsg);
      enqueueErrorSnackBar({ message: errorMsg });
      throw error;
    }
  };

  const resetToDefault = async () => {
    if (!currentWorkspace?.id) {
      throw new Error('Workspace not found');
    }

    try {
      // 重置設定為預設值，同時刪除背景圖片
      await updateWorkspace({
        variables: {
          input: {
            backgroundImage: null,
            backgroundImageSettings: DEFAULT_BACKGROUND_SETTINGS,
          } as any,
        },
      });

      setCurrentWorkspace({
        ...currentWorkspace,
        backgroundImage: null,
        backgroundImageSettings: DEFAULT_BACKGROUND_SETTINGS,
      });

      setErrorMessage(null);
      enqueueSuccessSnackBar({ message: '已重設為預設圖片' });
    } catch (error) {
      const errorMsg = '重設預設圖片時發生錯誤';
      setErrorMessage(errorMsg);
      enqueueErrorSnackBar({ message: errorMsg });
      throw error;
    }
  };

  return {
    uploadBackground,
    updateBackgroundSettings,
    removeBackground,
    resetToDefault,
    isUploading,
    errorMessage,
  };
};
