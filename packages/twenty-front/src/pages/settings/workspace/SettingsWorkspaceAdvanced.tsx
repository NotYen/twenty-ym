import { gql, useMutation, useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/display';
import { Section } from 'twenty-ui/layout';

const StyledInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

const GET_WORKSPACE_CONFIGS = gql`
  query GetWorkspaceConfigs {
    getWorkspaceConfigs {
      key
      value
      valueType
    }
  }
`;

const UPDATE_WORKSPACE_CONFIG = gql`
  mutation UpdateWorkspaceConfig($input: UpdateWorkspaceConfigInput!) {
    updateWorkspaceConfig(input: $input)
  }
`;

type ConfigFieldProps = {
  configKey: string;
  label: string;
  initialValue: string;
  placeholder?: string;
  isPassword?: boolean;
};

const ConfigField = ({ configKey, label, initialValue, placeholder, isPassword = false }: ConfigFieldProps) => {
  const [value, setValue] = useState(initialValue || '');
  const [updateConfig] = useMutation(UPDATE_WORKSPACE_CONFIG);

  const handleBlur = () => {
    if (value !== initialValue) {
      updateConfig({
        variables: {
          input: { key: configKey, value },
        },
      }).catch((e) => console.error(e));
    }
  };

  return (
    <SettingsTextInput
        instanceId={`config-${configKey}`}
        label={label}
        value={value}
        onChange={setValue}
        onBlur={handleBlur}
        placeholder={placeholder}
        type={isPassword ? 'password' : 'text'}
        fullWidth
    />
  );
};

export const SettingsWorkspaceAdvanced = () => {
    const { t } = useLingui();
    const { data, loading } = useQuery(GET_WORKSPACE_CONFIGS);

    if (loading) return <SettingsPageContainer>{t`Loading...`}</SettingsPageContainer>;

    const configs = data?.getWorkspaceConfigs || [];
    const getConfig = (key: string) => configs.find((c: any) => c.key === key)?.value || '';

    return (
        <SubMenuTopBarContainer
            title={t`Advanced Settings`}
            links={[
                {
                    children: t`Workspace`,
                    href: getSettingsPath(SettingsPath.Workspace),
                },
                { children: t`Advanced Settings` },
            ]}
        >
            <SettingsPageContainer>
                <Section>
                    <H2Title title={t`Email Provider (SMTP)`} description={t`Configure custom SMTP server for sending emails.`} />
                    <StyledInputContainer>
                        <ConfigField configKey="SMTP_HOST" label={t`SMTP Host`} initialValue={getConfig('SMTP_HOST')} placeholder="smtp.example.com" />
                        <ConfigField configKey="SMTP_PORT" label={t`SMTP Port`} initialValue={getConfig('SMTP_PORT')} placeholder="587" />
                        <ConfigField configKey="SMTP_USER" label={t`SMTP User`} initialValue={getConfig('SMTP_USER')} placeholder="user@example.com" />
                        <ConfigField configKey="SMTP_PASSWORD" label={t`SMTP Password`} initialValue={getConfig('SMTP_PASSWORD')} placeholder="******" isPassword />
                    </StyledInputContainer>
                </Section>
                <Section>
                    <H2Title title={t`LINE Integration`} description={t`Configure LINE Messaging API credentials.`} />
                    <StyledInputContainer>
                       <ConfigField configKey="LINE_CHANNEL_ACCESS_TOKEN" label={t`Channel Access Token`} initialValue={getConfig('LINE_CHANNEL_ACCESS_TOKEN')} placeholder={t`Long access token string...`} isPassword />
                       <ConfigField configKey="LINE_CHANNEL_SECRET" label={t`Channel Secret`} initialValue={getConfig('LINE_CHANNEL_SECRET')} placeholder={t`Secret string`} isPassword />
                    </StyledInputContainer>
                </Section>
                <Section>
                    <H2Title title={t`OAuth Providers`} description={t`Client IDs for external authentication.`} />
                    <StyledInputContainer>
                        <ConfigField configKey="GOOGLE_CLIENT_ID" label={t`Google Client ID`} initialValue={getConfig('GOOGLE_CLIENT_ID')} placeholder="...apps.googleusercontent.com" />
                        <ConfigField configKey="MICROSOFT_CLIENT_ID" label={t`Microsoft Client ID`} initialValue={getConfig('MICROSOFT_CLIENT_ID')} placeholder="UUID" />
                    </StyledInputContainer>
                </Section>
                <Section>
                    <H2Title title={t`Google Analytics (Firebase)`} description={t`Configure Firebase Analytics credentials.`} />
                    <StyledInputContainer>
                        <ConfigField configKey="FIREBASE_API_KEY" label={t`API Key`} initialValue={getConfig('FIREBASE_API_KEY')} placeholder="AIza..." isPassword />
                        <ConfigField configKey="FIREBASE_AUTH_DOMAIN" label={t`Auth Domain`} initialValue={getConfig('FIREBASE_AUTH_DOMAIN')} placeholder="project.firebaseapp.com" />
                        <ConfigField configKey="FIREBASE_PROJECT_ID" label={t`Project ID`} initialValue={getConfig('FIREBASE_PROJECT_ID')} placeholder="project-id" />
                        <ConfigField configKey="FIREBASE_STORAGE_BUCKET" label={t`Storage Bucket`} initialValue={getConfig('FIREBASE_STORAGE_BUCKET')} placeholder="project.appspot.com" />
                        <ConfigField configKey="FIREBASE_MESSAGING_SENDER_ID" label={t`Messaging Sender ID`} initialValue={getConfig('FIREBASE_MESSAGING_SENDER_ID')} placeholder="123456..." />
                        <ConfigField configKey="FIREBASE_APP_ID" label={t`App ID`} initialValue={getConfig('FIREBASE_APP_ID')} placeholder="1:123456...:web:..." />
                        <ConfigField configKey="FIREBASE_MEASUREMENT_ID" label={t`Measurement ID`} initialValue={getConfig('FIREBASE_MEASUREMENT_ID')} placeholder="G-XXXXXXXXXX" />
                    </StyledInputContainer>
                </Section>
            </SettingsPageContainer>
        </SubMenuTopBarContainer>
    );
};
