/**
 * Settings 頁面的 Remote Config 狀態顯示組件
 *
 * 顯示目前 Firebase Remote Config 的 Blocklist 狀態
 * 使用「關閉列表」模式：列出的功能會被關閉，沒列出的預設開啟
 */

import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { isFirebaseEnabled } from '@/analytics/firebase/config/firebase.config';
import { useAllRemoteFeatureFlags } from '@/analytics/firebase/hooks/useRemoteConfig';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { IconCheck, IconLock, IconRefresh, IconServer, IconX } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StyledTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledStatus = styled.div<{ isEnabled: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme, isEnabled }) =>
    isEnabled ? theme.color.green : theme.font.color.tertiary};
`;

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledSectionTitle = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.secondary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledFlagList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.md};
`;

const StyledFlagItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.background.primary};
  border-radius: ${({ theme }) => theme.border.radius.sm};
`;

const StyledFlagName = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-family: ${({ theme }) => theme.font.family};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledFlagValue = styled.span<{ isEnabled: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme, isEnabled }) =>
    isEnabled ? theme.color.green : theme.color.red};
`;

const StyledBlocklistSection = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.md};
`;

const StyledBlocklistItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.red};
`;

const StyledEmptyMessage = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.font.color.tertiary};
  font-style: italic;
`;

const StyledLastRefresh = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.font.color.tertiary};
  text-align: right;
`;

const StyledDisabledMessage = styled.div`
  padding: ${({ theme }) => theme.spacing(4)};
  background: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.md};
  color: ${({ theme }) => theme.font.color.tertiary};
  text-align: center;
`;

const StyledWorkspaceId = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.font.color.tertiary};
  font-family: monospace;
`;

export const SettingsRemoteConfigStatus = () => {
  const { t } = useLingui();
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const { flags, blocklist, supportedFlags, isReady, isRefreshing, refresh } =
    useAllRemoteFeatureFlags();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const firebaseEnabled = isFirebaseEnabled();

  const handleRefresh = useCallback(async () => {
    await refresh();
    setLastRefresh(new Date());
  }, [refresh]);

  // 取得當前 workspace 的關閉列表
  const currentWorkspaceBlocklist = currentWorkspace?.id
    ? blocklist.workspaces[currentWorkspace.id] || []
    : [];

  if (!firebaseEnabled) {
    return (
      <StyledContainer>
        <StyledHeader>
          <StyledTitle>
            <IconServer size={20} />
            {t`Remote Config`}
          </StyledTitle>
          <StyledStatus isEnabled={false}>
            <IconX size={14} />
            {t`Disabled`}
          </StyledStatus>
        </StyledHeader>
        <StyledDisabledMessage>
          {t`Firebase is not configured. Remote Config is disabled.`}
        </StyledDisabledMessage>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>
          <IconServer size={20} />
          {t`Remote Config`}
        </StyledTitle>
        <StyledStatus isEnabled={isReady}>
          {isReady ? <IconCheck size={14} /> : <IconX size={14} />}
          {isReady ? t`Connected` : t`Initializing...`}
        </StyledStatus>
      </StyledHeader>

      {/* 關閉列表顯示 */}
      <StyledSection>
        <StyledSectionTitle>
          <IconLock size={16} />
          {t`Blocklist (Disabled Features)`}
        </StyledSectionTitle>
        <StyledBlocklistSection>
          <StyledSectionTitle>{t`Global`}</StyledSectionTitle>
          {blocklist.global.length > 0 ? (
            blocklist.global.map((flag) => (
              <StyledBlocklistItem key={flag}>
                <IconX size={14} />
                {flag}
              </StyledBlocklistItem>
            ))
          ) : (
            <StyledEmptyMessage>{t`No globally disabled features`}</StyledEmptyMessage>
          )}

          {currentWorkspace && (
            <>
              <StyledSectionTitle style={{ marginTop: '12px' }}>
                {t`This Workspace`}
                <StyledWorkspaceId>
                  ({currentWorkspace.id.substring(0, 8)}...)
                </StyledWorkspaceId>
              </StyledSectionTitle>
              {currentWorkspaceBlocklist.length > 0 ? (
                currentWorkspaceBlocklist.map((flag) => (
                  <StyledBlocklistItem key={flag}>
                    <IconX size={14} />
                    {flag}
                  </StyledBlocklistItem>
                ))
              ) : (
                <StyledEmptyMessage>
                  {t`No workspace-specific disabled features`}
                </StyledEmptyMessage>
              )}
            </>
          )}
        </StyledBlocklistSection>
      </StyledSection>

      {/* 所有功能狀態 */}
      <StyledSection>
        <StyledSectionTitle>{t`Feature Status (for this workspace)`}</StyledSectionTitle>
        <StyledFlagList>
          {supportedFlags.map((key) => (
            <StyledFlagItem key={key}>
              <StyledFlagName>{key}</StyledFlagName>
              <StyledFlagValue isEnabled={flags[key] ?? true}>
                {flags[key] ?? true ? (
                  <IconCheck size={14} />
                ) : (
                  <IconX size={14} />
                )}
                {flags[key] ?? true ? t`Enabled` : t`Disabled`}
              </StyledFlagValue>
            </StyledFlagItem>
          ))}
        </StyledFlagList>
      </StyledSection>

      <StyledHeader>
        <Button
          Icon={IconRefresh}
          title={t`Refresh`}
          onClick={handleRefresh}
          disabled={isRefreshing}
        />
        {lastRefresh && (
          <StyledLastRefresh>
            {t`Last refresh`}: {lastRefresh.toLocaleTimeString()}
          </StyledLastRefresh>
        )}
      </StyledHeader>
    </StyledContainer>
  );
};
