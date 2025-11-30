import styled from '@emotion/styled';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { VCardFields } from '@/settings/profile/components/vcard/VCardFields';
import { VCardPreview } from '@/settings/profile/components/vcard/VCardPreview';
import {
  type VCardData,
  type VCardFormData,
  VCARD_STORAGE_KEY,
} from '@/settings/profile/components/vcard/types/VCardData';
import { logError } from '~/utils/logError';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

// 主容器（左右分欄佈局，遵循 Twenty 的響應式設計）
const StyledContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing(6)};
  width: 100%;

  // 響應式：小螢幕改為上下排列（使用 Twenty 的 MOBILE_VIEWPORT 常數）
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// 左側表單容器
const StyledFieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

// 右側預覽容器
const StyledPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

// vCard Section 主組件（遵循 Twenty 的組件架構）
export const VCardSection = () => {
  const currentUser = useRecoilValue(currentUserState);
  const currentWorkspaceMember = useRecoilValue(currentWorkspaceMemberState);

  // 追蹤是否已經初始化（只初始化一次）
  const isInitialized = useRef(false);

  // 從 localStorage 讀取初始值
  const getInitialData = (): VCardFormData => {
    try {
      const saved = localStorage.getItem(VCARD_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logError('Failed to load vCard data from localStorage:');
      logError(error);
    }
    return { company: '', jobTitle: '', phone: '' };
  };

  // 表單資料狀態（初始值從 localStorage 讀取）
  const [formData, setFormData] = useState<VCardFormData>(getInitialData);

  // 使用 Twenty 的標準 hook 查詢當前用戶的 Person 記錄（只查詢一次）
  const personEmailFilter: RecordGqlOperationFilter | undefined =
    currentUser?.email
      ? ({
          emails: {
            primaryEmail: {
              eq: currentUser.email,
            },
          },
        } as RecordGqlOperationFilter)
      : undefined;

  const { records: personRecords, loading } = useFindManyRecords({
    objectNameSingular: 'person',
    filter: personEmailFilter,
    limit: 1,
    skip: !currentUser?.email,
  });

  // 只在首次載入且查詢完成時，用資料庫的值覆蓋 localStorage
  useEffect(() => {
    if (!loading && !isInitialized.current && personRecords.length > 0) {
      const person = personRecords[0];
      const dbData: VCardFormData = {
        company: person.company?.name || '',
        jobTitle: person.jobTitle || '',
        phone: person.phones?.primaryPhoneNumber || '',
      };

      // 只在資料庫有值時才覆蓋
      setFormData((prev) => ({
        company: dbData.company || prev.company,
        jobTitle: dbData.jobTitle || prev.jobTitle,
        phone: dbData.phone || prev.phone,
      }));

      // 標記已初始化，防止重複觸發
      isInitialized.current = true;
    } else if (!loading && !isInitialized.current) {
      // 如果沒有找到 Person 記錄，也標記為已初始化
      isInitialized.current = true;
    }
  }, [loading, personRecords]);

  // 處理表單資料變更（使用 useCallback 優化性能）
  const handleDataChange = useCallback((data: VCardFormData) => {
    setFormData(data);
  }, []);

  // 組合完整的 vCard 資料
  const vcardData: VCardData = {
    firstName: currentWorkspaceMember?.name.firstName ?? '',
    lastName: currentWorkspaceMember?.name.lastName ?? '',
    email: currentUser?.email ?? '',
    company: formData.company,
    jobTitle: formData.jobTitle,
    phone: formData.phone,
    avatarUrl: currentWorkspaceMember?.avatarUrl,
  };

  return (
    <StyledContainer>
      {/* 左側：輸入表單 */}
      <StyledFieldsContainer>
        <VCardFields onDataChange={handleDataChange} />
      </StyledFieldsContainer>

      {/* 右側：vCard 預覽 */}
      <StyledPreviewContainer>
        <VCardPreview data={vcardData} />
      </StyledPreviewContainer>
    </StyledContainer>
  );
};
