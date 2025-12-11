import { gql, useMutation, useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
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

export const SettingsWorkspaceAdvanced = () => {
    const { t } = useLingui();
    const { data, loading } = useQuery(GET_WORKSPACE_CONFIGS);
    const [updateConfig] = useMutation(UPDATE_WORKSPACE_CONFIG);
    const { enqueueSuccessSnackBar, enqueueErrorSnackBar, enqueueInfoSnackBar } = useSnackBar();

    // Local state to track edits. Key -> Value
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Populate formValues with initial data once loaded
    // We use a separate state to distinguish between "initial" and "current" for diffing
    const [initialValues, setInitialValues] = useState<Record<string, string>>({});

    // Effect to hydration when data loads
    useMemo(() => {
        if (data?.getWorkspaceConfigs) {
            const values: Record<string, string> = {};
            data.getWorkspaceConfigs.forEach((c: any) => {
                values[c.key] = c.value || '';
            });
            setInitialValues(values);
            setFormValues(values);
        }
    }, [data]);

    const handleChange = (key: string, value: string) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const promises = [];
            let changeCount = 0;

            for (const key in formValues) {
                const currentVal = formValues[key];
                const initialVal = initialValues[key] || '';

                // Only save changed fields
                if (currentVal !== initialVal) {
                    changeCount++;
                    promises.push(
                        updateConfig({
                            variables: {
                                input: { key, value: currentVal },
                            },
                        })
                    );
                }
            }

            if (changeCount === 0) {
                enqueueInfoSnackBar({ message: t`No changes to save` });
                setIsSaving(false);
                return;
            }

            await Promise.all(promises);

            // Update initial values to current after successful save
            setInitialValues({ ...formValues });
            enqueueSuccessSnackBar({ message: t`Settings saved successfully` });
        } catch (error) {
            console.error(error);
            enqueueErrorSnackBar({ message: t`Failed to save settings`, apolloError: error as any });
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = useMemo(() => {
        // Check if any value in formValues differs from initialValues
        // We only care about keys that exist in formValues (modified ones)
        // But logical integrity check: iterate all keys that *could* be modified.
        // Actually, formValues starts as a copy of initialValues.
        // So checking all keys in formValues is sufficient if we keeping them in sync.
        // But let's be safe: all known keys.
        const allKeys = new Set([...Object.keys(formValues), ...Object.keys(initialValues)]);
        return Array.from(allKeys).some(key => {
            const current = formValues[key] ?? initialValues[key] ?? '';
            const initial = initialValues[key] ?? '';
            return current !== initial;
        });
    }, [formValues, initialValues]);

    if (loading) return <SettingsPageContainer>{t`Loading...`}</SettingsPageContainer>;

    const getValue = (key: string) => formValues[key] !== undefined ? formValues[key] : (initialValues[key] || '');

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
            actionButton={
                <Button
                    variant="primary"
                    title={t`Save`}
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                />
            }
        >
            <SettingsPageContainer>
                <Section>
                    <H2Title title={t`Email Provider (SMTP)`} description={t`Configure custom SMTP server for sending emails.`} />
                    <StyledInputContainer>
                        <SettingsTextInput instanceId="EMAIL_SMTP_HOST" label={t`SMTP Host`} value={getValue('EMAIL_SMTP_HOST')} onChange={(v) => handleChange('EMAIL_SMTP_HOST', v)} placeholder="smtp.example.com" fullWidth />
                        <SettingsTextInput instanceId="EMAIL_SMTP_PORT" label={t`SMTP Port`} value={getValue('EMAIL_SMTP_PORT')} onChange={(v) => handleChange('EMAIL_SMTP_PORT', v)} placeholder="587" fullWidth />
                        <SettingsTextInput instanceId="EMAIL_SMTP_USER" label={t`SMTP User`} value={getValue('EMAIL_SMTP_USER')} onChange={(v) => handleChange('EMAIL_SMTP_USER', v)} placeholder="user@example.com" fullWidth />
                        <SettingsTextInput instanceId="EMAIL_SMTP_PASSWORD" label={t`SMTP Password`} value={getValue('EMAIL_SMTP_PASSWORD')} onChange={(v) => handleChange('EMAIL_SMTP_PASSWORD', v)} placeholder="******" type="password" fullWidth />
                        <SettingsTextInput instanceId="EMAIL_SMTP_NO_TLS" label={t`Disable SMTP TLS`} value={getValue('EMAIL_SMTP_NO_TLS')} onChange={(v) => handleChange('EMAIL_SMTP_NO_TLS', v)} placeholder="true/false" fullWidth />
                    </StyledInputContainer>
                </Section>
                <Section>
                    <H2Title title={t`LINE Integration`} description={t`Configure LINE Messaging API credentials.`} />
                    <StyledInputContainer>
                       <SettingsTextInput instanceId="LINE_CHANNEL_ACCESS_TOKEN" label={t`Channel Access Token`} value={getValue('LINE_CHANNEL_ACCESS_TOKEN')} onChange={(v) => handleChange('LINE_CHANNEL_ACCESS_TOKEN', v)} placeholder={t`Long access token string...`} type="password" fullWidth />
                       <SettingsTextInput instanceId="LINE_CHANNEL_SECRET" label={t`Channel Secret`} value={getValue('LINE_CHANNEL_SECRET')} onChange={(v) => handleChange('LINE_CHANNEL_SECRET', v)} placeholder={t`Secret string`} type="password" fullWidth />
                    </StyledInputContainer>
                </Section>
                <Section>
                    <H2Title title={t`OAuth Providers`} description={t`Client IDs for external authentication.`} />
                    <StyledInputContainer>
                        <SettingsTextInput instanceId="AUTH_GOOGLE_CLIENT_ID" label={t`Google Client ID`} value={getValue('AUTH_GOOGLE_CLIENT_ID')} onChange={(v) => handleChange('AUTH_GOOGLE_CLIENT_ID', v)} placeholder="...apps.googleusercontent.com" fullWidth />
                        <SettingsTextInput instanceId="AUTH_GOOGLE_CLIENT_SECRET" label={t`Google Client Secret`} value={getValue('AUTH_GOOGLE_CLIENT_SECRET')} onChange={(v) => handleChange('AUTH_GOOGLE_CLIENT_SECRET', v)} placeholder="GOCSPX-..." type="password" fullWidth />
                        <SettingsTextInput instanceId="AUTH_MICROSOFT_CLIENT_ID" label={t`Microsoft Client ID`} value={getValue('AUTH_MICROSOFT_CLIENT_ID')} onChange={(v) => handleChange('AUTH_MICROSOFT_CLIENT_ID', v)} placeholder="UUID" fullWidth />
                        <SettingsTextInput instanceId="AUTH_MICROSOFT_CLIENT_SECRET" label={t`Microsoft Client Secret`} value={getValue('AUTH_MICROSOFT_CLIENT_SECRET')} onChange={(v) => handleChange('AUTH_MICROSOFT_CLIENT_SECRET', v)} placeholder="Secret..." type="password" fullWidth />
                    </StyledInputContainer>
                </Section>
                <Section>
                    <H2Title title={t`AI Integration`} description={t`Configure AI provider keys.`} />
                    <StyledInputContainer>
                        <SettingsTextInput instanceId="OPENAI_API_KEY" label={t`OpenAI API Key`} value={getValue('OPENAI_API_KEY')} onChange={(v) => handleChange('OPENAI_API_KEY', v)} placeholder="sk-..." type="password" fullWidth />
                        <SettingsTextInput instanceId="ANTHROPIC_API_KEY" label={t`Anthropic API Key`} value={getValue('ANTHROPIC_API_KEY')} onChange={(v) => handleChange('ANTHROPIC_API_KEY', v)} placeholder="sk-ant-..." type="password" fullWidth />
                        <SettingsTextInput instanceId="XAI_API_KEY" label={t`xAI API Key`} value={getValue('XAI_API_KEY')} onChange={(v) => handleChange('XAI_API_KEY', v)} placeholder="key..." type="password" fullWidth />
                    </StyledInputContainer>
                </Section>
                <Section>
                    <H2Title title={t`Google Analytics (Firebase)`} description={t`Configure Firebase Analytics credentials.`} />
                    <StyledInputContainer>
                        <SettingsTextInput instanceId="REACT_APP_FIREBASE_API_KEY" label={t`API Key`} value={getValue('REACT_APP_FIREBASE_API_KEY')} onChange={(v) => handleChange('REACT_APP_FIREBASE_API_KEY', v)} placeholder="AIza..." type="password" fullWidth />
                        <SettingsTextInput instanceId="REACT_APP_FIREBASE_AUTH_DOMAIN" label={t`Auth Domain`} value={getValue('REACT_APP_FIREBASE_AUTH_DOMAIN')} onChange={(v) => handleChange('REACT_APP_FIREBASE_AUTH_DOMAIN', v)} placeholder="project.firebaseapp.com" fullWidth />
                        <SettingsTextInput instanceId="REACT_APP_FIREBASE_PROJECT_ID" label={t`Project ID`} value={getValue('REACT_APP_FIREBASE_PROJECT_ID')} onChange={(v) => handleChange('REACT_APP_FIREBASE_PROJECT_ID', v)} placeholder="project-id" fullWidth />
                        <SettingsTextInput instanceId="REACT_APP_FIREBASE_STORAGE_BUCKET" label={t`Storage Bucket`} value={getValue('REACT_APP_FIREBASE_STORAGE_BUCKET')} onChange={(v) => handleChange('REACT_APP_FIREBASE_STORAGE_BUCKET', v)} placeholder="project.appspot.com" fullWidth />
                        <SettingsTextInput instanceId="REACT_APP_FIREBASE_MESSAGING_SENDER_ID" label={t`Messaging Sender ID`} value={getValue('REACT_APP_FIREBASE_MESSAGING_SENDER_ID')} onChange={(v) => handleChange('REACT_APP_FIREBASE_MESSAGING_SENDER_ID', v)} placeholder="123456..." fullWidth />
                        <SettingsTextInput instanceId="REACT_APP_FIREBASE_APP_ID" label={t`App ID`} value={getValue('REACT_APP_FIREBASE_APP_ID')} onChange={(v) => handleChange('REACT_APP_FIREBASE_APP_ID', v)} placeholder="1:123456...:web:..." fullWidth />
                        <SettingsTextInput instanceId="REACT_APP_FIREBASE_MEASUREMENT_ID" label={t`Measurement ID`} value={getValue('REACT_APP_FIREBASE_MEASUREMENT_ID')} onChange={(v) => handleChange('REACT_APP_FIREBASE_MEASUREMENT_ID', v)} placeholder="G-XXXXXXXXXX" fullWidth />
                    </StyledInputContainer>
                </Section>
            </SettingsPageContainer>
        </SubMenuTopBarContainer>
    );
};
