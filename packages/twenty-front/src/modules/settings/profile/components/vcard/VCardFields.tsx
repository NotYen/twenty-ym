import styled from '@emotion/styled';
import { useEffect, useState, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useLingui } from '@lingui/react/macro';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import {
  type VCardFormData,
  VCARD_STORAGE_KEY,
} from '@/settings/profile/components/vcard/types/VCardData';
import { logError } from '~/utils/logError';

type VCardFieldsProps = {
  onDataChange: (data: VCardFormData) => void;
};

// 表單容器（遵循 Twenty 的間距系統）
const StyledFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(5)};
  width: 100%;
`;

// 欄位組容器
const StyledFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

// 欄位標籤
const StyledLabel = styled.label`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

// 必填標記
const StyledRequired = styled.span`
  color: ${({ theme }) => theme.color.red};
`;

// 提示文字
const StyledHint = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: 1.4;
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

// vCard 輸入表單組件（遵循 Twenty 的 React 架構）
export const VCardFields = ({ onDataChange }: VCardFieldsProps) => {
  const { t } = useLingui();
  const currentUser = useRecoilValue(currentUserState);
  const currentWorkspaceMember = useRecoilValue(currentWorkspaceMemberState);

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

  // 初始化表單資料
  const [formData, setFormData] = useState<VCardFormData>(getInitialData);

  // 當表單資料變更時，儲存到 localStorage 並通知父組件
  useEffect(() => {
    try {
      localStorage.setItem(VCARD_STORAGE_KEY, JSON.stringify(formData));
      onDataChange(formData);
    } catch (error) {
      logError('Failed to save vCard data to localStorage:');
      logError(error);
    }
  }, [formData, onDataChange]);

  // 更新表單資料（使用 useCallback 優化性能）
  const handleCompanyChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, company: value }));
  }, []);

  const handleJobTitleChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, jobTitle: value }));
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));
  }, []);

  // 從現有資料自動填入
  const firstName = currentWorkspaceMember?.name.firstName ?? '';
  const lastName = currentWorkspaceMember?.name.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const email = currentUser?.email ?? '';

  return (
    <StyledFormContainer>
      {/* 公司名稱 */}
      <StyledFieldGroup>
        <StyledLabel htmlFor="vcard-company">{t`Company`}</StyledLabel>
        <SettingsTextInput
          instanceId="vcard-company"
          value={formData.company}
          onChange={handleCompanyChange}
          placeholder={t`Enter company name`}
          fullWidth
        />
        <StyledHint>{t`Your organization name`}</StyledHint>
      </StyledFieldGroup>

      {/* 職稱 */}
      <StyledFieldGroup>
        <StyledLabel htmlFor="vcard-job-title">{t`Job Title`}</StyledLabel>
        <SettingsTextInput
          instanceId="vcard-job-title"
          value={formData.jobTitle}
          onChange={handleJobTitleChange}
          placeholder={t`Enter job title`}
          fullWidth
        />
        <StyledHint>{t`Your position in the organization`}</StyledHint>
      </StyledFieldGroup>

      {/* 姓名（自動填入，不可編輯） */}
      <StyledFieldGroup>
        <StyledLabel htmlFor="vcard-name">
          {t`Name`} <StyledRequired>*</StyledRequired>
        </StyledLabel>
        <SettingsTextInput
          instanceId="vcard-name"
          value={fullName}
          disabled
          fullWidth
        />
        <StyledHint>{t`Automatically filled from your profile`}</StyledHint>
      </StyledFieldGroup>

      {/* 電話 */}
      <StyledFieldGroup>
        <StyledLabel htmlFor="vcard-phone">{t`Phone`}</StyledLabel>
        <SettingsTextInput
          instanceId="vcard-phone"
          value={formData.phone}
          onChange={handlePhoneChange}
          placeholder={t`Enter phone number`}
          fullWidth
        />
        <StyledHint>{t`International format recommended (e.g., +886-912-345-678)`}</StyledHint>
      </StyledFieldGroup>

      {/* Email（自動填入，不可編輯） */}
      <StyledFieldGroup>
        <StyledLabel htmlFor="vcard-email">
          {t`Email`} <StyledRequired>*</StyledRequired>
        </StyledLabel>
        <SettingsTextInput
          instanceId="vcard-email"
          value={email}
          disabled
          fullWidth
        />
        <StyledHint>{t`Automatically filled from your account`}</StyledHint>
      </StyledFieldGroup>
    </StyledFormContainer>
  );
};
