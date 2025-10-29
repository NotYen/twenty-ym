import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { ImageInput } from '@/ui/input/components/ImageInput';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { getImageAbsoluteURI } from 'twenty-shared/utils';
import { IconPencil, IconRestore } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { useWorkspaceBackground } from '../hooks/useWorkspaceBackground';
import { BackgroundImageEditor } from './BackgroundImageEditor';

const BACKGROUND_EDITOR_MODAL_ID = 'background-image-editor';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledDescription = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.font.color.tertiary};
  margin: 0;
`;

export const WorkspaceBackgroundManager = () => {
  const { t } = useLingui();
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const { openModal, closeModal } = useModal();
  const {
    uploadBackground,
    removeBackground,
    updateBackgroundSettings,
    resetToDefault,
    isUploading,
  } = useWorkspaceBackground();

  // 選中的文件（用於預覽和編輯）
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 預覽 URL
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // 是否是編輯現有背景（而不是上傳新圖片）
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // 處理文件選擇（不立即上傳，先預覽）
  const handleFileSelect = (file: File) => {
    try {
      // 簡單驗證
      if (!file.type.startsWith('image/')) {
        return;
      }

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        return;
      }

      // 創建預覽 URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      setIsEditingExisting(false);

      // 打開編輯器
      openModal(BACKGROUND_EDITOR_MODAL_ID);
    } catch {
      // Error handling
    }
  };

  // 處理移除背景
  const handleRemove = async () => {
    try {
      await removeBackground();
      // 清理預覽
      if (previewUrl !== null) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
    } catch {
      // Error handling is done in the hook
    }
  };

  // 處理編輯現有背景（不重新上傳）
  const handleEditExisting = () => {
    if (
      currentWorkspace?.backgroundImage === null ||
      currentWorkspace?.backgroundImage === undefined
    )
      return;

    setIsEditingExisting(true);
    setSelectedFile(null);
    setPreviewUrl(null);
    openModal(BACKGROUND_EDITOR_MODAL_ID);
  };

  // 處理保存（上傳 + 設定）
  const handleSave = async (settings: any) => {
    try {
      if (isEditingExisting) {
        // 只更新設定，不重新上傳
        await updateBackgroundSettings(settings);
      } else if (selectedFile !== null) {
        // 先上傳圖片，再更新設定
        const uploadedUrl = await uploadBackground(selectedFile);

        // 等待圖片上傳完成後再更新設定
        if (uploadedUrl !== null && uploadedUrl !== undefined) {
          await updateBackgroundSettings(settings);
        }

        // 清理預覽
        if (previewUrl !== null) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setSelectedFile(null);
      }

      closeModal(BACKGROUND_EDITOR_MODAL_ID);
    } catch {
      // Error handling is done in the hook
    }
  };

  // 處理取消
  const handleCancel = () => {
    // 清理預覽
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setIsEditingExisting(false);
    closeModal(BACKGROUND_EDITOR_MODAL_ID);
  };

  // 處理重置為預設
  const handleResetToDefault = async () => {
    try {
      await resetToDefault();
    } catch {
      // Error handling is done in the hook
    }
  };

  const hasBackground = !!currentWorkspace?.backgroundImage;

  // 將相對路徑轉換為絕對 URL（用於編輯器預覽）
  const editorImageUrl = useMemo(() => {
    if (
      isEditingExisting &&
      currentWorkspace?.backgroundImage !== null &&
      currentWorkspace?.backgroundImage !== undefined
    ) {
      // 編輯現有背景：轉換為絕對 URL
      return getImageAbsoluteURI({
        imageUrl: currentWorkspace.backgroundImage,
        baseUrl: REACT_APP_SERVER_BASE_URL,
      });
    } else if (previewUrl !== null && previewUrl !== '') {
      // 新上傳的預覽：使用 blob URL
      return previewUrl;
    }
    return '';
  }, [isEditingExisting, currentWorkspace?.backgroundImage, previewUrl]);

  return (
    <StyledContainer>
      <StyledDescription>
        {t`We support PNGs, JPEGs and GIFs under 10MB`}
      </StyledDescription>

      <ImageInput
        picture={currentWorkspace?.backgroundImage ?? null}
        onUpload={handleFileSelect}
        onRemove={handleRemove}
        disabled={isUploading}
      />

      {hasBackground && (
        <StyledButtonRow>
          <Button
            variant="secondary"
            title={t`Edit Background Settings`}
            Icon={IconPencil}
            onClick={handleEditExisting}
          />
          <Button
            variant="secondary"
            title={t`Reset Default Background Image`}
            Icon={IconRestore}
            onClick={handleResetToDefault}
          />
        </StyledButtonRow>
      )}

      {/* 編輯器 Modal */}
      {editorImageUrl !== '' && editorImageUrl !== null && (
        <BackgroundImageEditor
          imageUrl={editorImageUrl}
          initialSettings={
            isEditingExisting
              ? (currentWorkspace?.backgroundImageSettings as any)
              : undefined
          }
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </StyledContainer>
  );
};
