import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { Key } from 'ts-key-enum';
import { useLingui } from '@lingui/react/macro';

import { SubTitle } from '@/auth/components/SubTitle';
import { Title } from '@/auth/components/Title';
import { OnboardingSyncEmailsSettingsCard } from '@/onboarding/components/OnboardingSyncEmailsSettingsCard';
import { useSetNextOnboardingStatus } from '@/onboarding/hooks/useSetNextOnboardingStatus';

import { isGoogleCalendarEnabledState } from '@/client-config/states/isGoogleCalendarEnabledState';
import { isGoogleMessagingEnabledState } from '@/client-config/states/isGoogleMessagingEnabledState';
import { isMicrosoftCalendarEnabledState } from '@/client-config/states/isMicrosoftCalendarEnabledState';
import { isMicrosoftMessagingEnabledState } from '@/client-config/states/isMicrosoftMessagingEnabledState';
import { useTriggerApisOAuth } from '@/settings/accounts/hooks/useTriggerApiOAuth';
import { PageFocusId } from '@/types/PageFocusId';
import { Modal } from '@/ui/layout/modal/components/Modal';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { AppPath, ConnectedAccountProvider } from 'twenty-shared/types';
import { IconGoogle, IconMicrosoft } from 'twenty-ui/display';
import { MainButton } from 'twenty-ui/input';
import { ClickToActionLink } from 'twenty-ui/navigation';
import {
  CalendarChannelVisibility,
  MessageChannelVisibility,
  useSkipSyncEmailOnboardingStepMutation,
} from '~/generated-metadata/graphql';

const StyledSyncEmailsContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin: ${({ theme }) => theme.spacing(8)} 0;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledActionLinkContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin: ${({ theme }) => theme.spacing(3)} 0 0;
  padding-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledProviderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const SyncEmails = () => {
  const theme = useTheme();
  const { t } = useLingui();
  const { triggerApisOAuth } = useTriggerApisOAuth();
  const setNextOnboardingStatus = useSetNextOnboardingStatus();
  const [visibility, setVisibility] = useState<MessageChannelVisibility>(
    MessageChannelVisibility.SHARE_EVERYTHING,
  );
  const [skipSyncEmailOnboardingStatusMutation] =
    useSkipSyncEmailOnboardingStepMutation();

  const handleButtonClick = async (provider: ConnectedAccountProvider) => {
    const calendarChannelVisibility =
      visibility === MessageChannelVisibility.SHARE_EVERYTHING
        ? CalendarChannelVisibility.SHARE_EVERYTHING
        : CalendarChannelVisibility.METADATA;

    await triggerApisOAuth(provider, {
      redirectLocation: AppPath.Index,
      messageVisibility: visibility,
      calendarVisibility: calendarChannelVisibility,
    });
  };

  const continueWithoutSync = async () => {
    await skipSyncEmailOnboardingStatusMutation();
    setNextOnboardingStatus();
  };

  const isGoogleMessagingEnabled = useRecoilValue(
    isGoogleMessagingEnabledState,
  );
  const isMicrosoftMessagingEnabled = useRecoilValue(
    isMicrosoftMessagingEnabledState,
  );

  const isGoogleCalendarEnabled = useRecoilValue(isGoogleCalendarEnabledState);

  const isMicrosoftCalendarEnabled = useRecoilValue(
    isMicrosoftCalendarEnabledState,
  );

  const isGoogleProviderEnabled =
    isGoogleMessagingEnabled || isGoogleCalendarEnabled;
  const isMicrosoftProviderEnabled =
    isMicrosoftMessagingEnabled || isMicrosoftCalendarEnabled;

  useHotkeysOnFocusedElement({
    keys: Key.Enter,
    callback: async () => {
      await continueWithoutSync();
    },
    focusId: PageFocusId.SyncEmail,
    dependencies: [continueWithoutSync],
  });

  return (
    <Modal.Content isVerticalCentered isHorizontalCentered>
      <Title noMarginTop>{t`郵件和日曆`}</Title>
      <SubTitle>
        {t`同步您的郵件和日曆。選擇您的隱私設定。`}
      </SubTitle>
      <StyledSyncEmailsContainer>
        <OnboardingSyncEmailsSettingsCard
          value={visibility}
          onChange={setVisibility}
        />
      </StyledSyncEmailsContainer>
      <StyledProviderContainer>
        {isGoogleProviderEnabled && (
          <MainButton
            title={t`與 Google 同步`}
            onClick={() => handleButtonClick(ConnectedAccountProvider.GOOGLE)}
            width={200}
            Icon={() => <IconGoogle size={theme.icon.size.sm} />}
          />
        )}
        {isMicrosoftProviderEnabled && (
          <MainButton
            title={t`與 Outlook 同步`}
            onClick={() =>
              handleButtonClick(ConnectedAccountProvider.MICROSOFT)
            }
            width={200}
            Icon={() => <IconMicrosoft size={theme.icon.size.sm} />}
          />
        )}
        {!isMicrosoftProviderEnabled && !isGoogleProviderEnabled && (
          <MainButton
            title={t`繼續`}
            onClick={continueWithoutSync}
            width={144}
          />
        )}
      </StyledProviderContainer>
      <StyledActionLinkContainer>
        <ClickToActionLink onClick={continueWithoutSync}>
          {t`跳過同步並繼續`}
        </ClickToActionLink>
      </StyledActionLinkContainer>
    </Modal.Content>
  );
};
