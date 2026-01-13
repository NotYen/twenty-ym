import { gql, useMutation, useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { lazy, Suspense, useMemo, useState } from 'react';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SuperAdminManagement } from '@/settings/super-admin/components/SuperAdminManagement';
import { GET_LINE_CONFIG } from '@/settings/workspace/line/graphql/queries/getLineConfig';
import { UPDATE_LINE_CONFIG } from '@/settings/workspace/line/graphql/mutations/updateLineConfig';
import { TEST_LINE_CONNECTION } from '@/settings/workspace/line/graphql/mutations/testLineConnection';
import { DELETE_LINE_CONFIG } from '@/settings/workspace/line/graphql/mutations/deleteLineConfig';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { TextInput } from '@/ui/input/components/TextInput';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';

// Lazy load SettingsRemoteConfigStatus to avoid Firebase module loading issues
const SettingsRemoteConfigStatus = lazy(() =>
  import('@/settings/components/SettingsRemoteConfigStatus').then((module) => ({
    default: module.SettingsRemoteConfigStatus,
  })),
);

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
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar, enqueueInfoSnackBar } =
    useSnackBar();

  // Local state to track edits. Key -> Value
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // LINE Integration state
  const [lineChannelId, setLineChannelId] = useState('');
  const [lineChannelSecret, setLineChannelSecret] = useState('');
  const [lineChannelAccessToken, setLineChannelAccessToken] = useState('');

  // LINE GraphQL queries and mutations
  const {
    data: lineConfigData,
    loading: lineLoading,
    refetch: refetchLineConfig,
  } = useQuery(GET_LINE_CONFIG);
  const [updateLineConfig, { loading: isUpdatingLine }] =
    useMutation(UPDATE_LINE_CONFIG);
  const [testLineConnection, { loading: isTestingLine }] =
    useMutation(TEST_LINE_CONNECTION);
  const [deleteLineConfig, { loading: isDeletingLine }] =
    useMutation(DELETE_LINE_CONFIG);

  const lineConfig = lineConfigData?.lineConfig;
  const isLineConfigured = lineConfig?.isConfigured || false;

  // Populate formValues with initial data once loaded
  // We use a separate state to distinguish between "initial" and "current" for diffing
  const [initialValues, setInitialValues] = useState<Record<string, string>>(
    {},
  );

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
    setFormValues((prev) => ({ ...prev, [key]: value }));
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
            }),
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
      enqueueErrorSnackBar({
        message: t`Failed to save settings`,
        apolloError: error as any,
      });
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
    const allKeys = new Set([
      ...Object.keys(formValues),
      ...Object.keys(initialValues),
    ]);
    return Array.from(allKeys).some((key) => {
      const current = formValues[key] ?? initialValues[key] ?? '';
      const initial = initialValues[key] ?? '';
      return current !== initial;
    });
  }, [formValues, initialValues]);

  // LINE Integration handlers
  const handleLineSave = async () => {
    if (!lineChannelId || !lineChannelSecret || !lineChannelAccessToken) {
      enqueueErrorSnackBar({ message: t`Please fill in all LINE fields` });
      return;
    }

    try {
      await updateLineConfig({
        variables: {
          input: {
            channelId: lineChannelId,
            channelSecret: lineChannelSecret,
            channelAccessToken: lineChannelAccessToken,
          },
        },
      });

      enqueueSuccessSnackBar({
        message: t`LINE configuration saved successfully`,
      });

      // Clear password fields
      setLineChannelSecret('');
      setLineChannelAccessToken('');

      // Refetch config and auto-test to get bot user ID
      await refetchLineConfig();

      // Auto test connection to get bot user ID
      try {
        const testResult = await testLineConnection();
        if (testResult.data?.testLineConnection?.success) {
          const botInfo = testResult.data.testLineConnection.botInfo;
          enqueueSuccessSnackBar({
            message: t`Bot verified: ${botInfo.displayName} (ID: ${botInfo.userId})`,
          });
        }
      } catch {
        // Test failed but save succeeded, don't show error
      }
    } catch (error: any) {
      enqueueErrorSnackBar({
        message: t`Failed to save LINE configuration: ${error?.message || 'Unknown error'}`,
      });
    }
  };

  const handleLineTest = async () => {
    try {
      const result = await testLineConnection();

      if (result.data?.testLineConnection?.success) {
        const botInfo = result.data.testLineConnection.botInfo;
        enqueueSuccessSnackBar({
          message: t`Connection successful! Bot: ${botInfo.displayName} (ID: ${botInfo.userId})`,
        });
      } else {
        const error = result.data?.testLineConnection?.error || 'Unknown error';
        enqueueErrorSnackBar({ message: t`Connection failed: ${error}` });
      }
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to test LINE connection` });
    }
  };

  const handleLineDelete = async () => {
    if (!confirm(t`Are you sure you want to delete LINE configuration?`)) {
      return;
    }

    try {
      await deleteLineConfig();
      enqueueSuccessSnackBar({
        message: t`LINE configuration deleted successfully`,
      });

      // Clear form
      setLineChannelId('');
      setLineChannelSecret('');
      setLineChannelAccessToken('');

      // Refetch config
      await refetchLineConfig();
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to delete LINE configuration` });
    }
  };

  if (loading || lineLoading)
    return <SettingsPageContainer>{t`Loading...`}</SettingsPageContainer>;

  const getValue = (key: string) =>
    formValues[key] !== undefined ? formValues[key] : initialValues[key] || '';

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
          <H2Title
            title={t`Email Provider (SMTP)`}
            description={t`Configure custom SMTP server for sending emails.`}
          />
          <StyledInputContainer>
            <SettingsTextInput
              instanceId="EMAIL_SMTP_HOST"
              label={t`SMTP Host`}
              value={getValue('EMAIL_SMTP_HOST')}
              onChange={(v) => handleChange('EMAIL_SMTP_HOST', v)}
              placeholder="smtp.example.com"
              fullWidth
            />
            <SettingsTextInput
              instanceId="EMAIL_SMTP_PORT"
              label={t`SMTP Port`}
              value={getValue('EMAIL_SMTP_PORT')}
              onChange={(v) => handleChange('EMAIL_SMTP_PORT', v)}
              placeholder="587"
              fullWidth
            />
            <SettingsTextInput
              instanceId="EMAIL_SMTP_USER"
              label={t`SMTP User`}
              value={getValue('EMAIL_SMTP_USER')}
              onChange={(v) => handleChange('EMAIL_SMTP_USER', v)}
              placeholder="user@example.com"
              fullWidth
            />
            <SettingsTextInput
              instanceId="EMAIL_SMTP_PASSWORD"
              label={t`SMTP Password`}
              value={getValue('EMAIL_SMTP_PASSWORD')}
              onChange={(v) => handleChange('EMAIL_SMTP_PASSWORD', v)}
              placeholder="******"
              type="password"
              fullWidth
            />
            <SettingsTextInput
              instanceId="EMAIL_SMTP_NO_TLS"
              label={t`Disable SMTP TLS`}
              value={getValue('EMAIL_SMTP_NO_TLS')}
              onChange={(v) => handleChange('EMAIL_SMTP_NO_TLS', v)}
              placeholder="true/false"
              fullWidth
            />
          </StyledInputContainer>
        </Section>
        <Section>
          <H2Title
            title={t`LINE Integration`}
            description={t`Configure LINE Official Account credentials for messaging integration.`}
          />
          <StyledInputContainer>
            <TextInput
              value={lineChannelId || lineConfig?.channelId || ''}
              onChange={(value) => setLineChannelId(value)}
              placeholder={t`Enter your LINE Channel ID`}
              label={t`Channel ID`}
              fullWidth
            />
            <TextInput
              value={lineChannelSecret}
              onChange={(value) => setLineChannelSecret(value)}
              placeholder={
                isLineConfigured
                  ? t`Enter new secret to update`
                  : t`Enter your LINE Channel Secret`
              }
              label={t`Channel Secret`}
              type="password"
              fullWidth
            />
            <TextInput
              value={lineChannelAccessToken}
              onChange={(value) => setLineChannelAccessToken(value)}
              placeholder={
                isLineConfigured
                  ? t`Enter new token to update`
                  : t`Enter your LINE Channel Access Token`
              }
              label={t`Channel Access Token`}
              type="password"
              fullWidth
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button
                onClick={handleLineSave}
                variant="primary"
                disabled={isUpdatingLine}
                title={
                  isLineConfigured
                    ? t`Update Configuration`
                    : t`Save Configuration`
                }
              />
              {isLineConfigured && (
                <>
                  <Button
                    onClick={handleLineTest}
                    variant="secondary"
                    disabled={isTestingLine}
                    title={t`Test Connection`}
                  />
                  <Button
                    onClick={handleLineDelete}
                    variant="secondary"
                    accent="danger"
                    disabled={isDeletingLine}
                    title={t`Delete Configuration`}
                  />
                </>
              )}
            </div>
            {isLineConfigured && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(0, 200, 83, 0.1)',
                  borderRadius: '4px',
                  color: '#00c853',
                }}
              >
                ✓ {t`LINE Official Account is configured`}
              </div>
            )}
          </StyledInputContainer>
        </Section>
        <Section>
          <H2Title
            title={t`OAuth Providers`}
            description={t`Client IDs for external authentication. Leave empty to use system defaults.`}
          />
          <StyledInputContainer>
            <SettingsTextInput
              instanceId="AUTH_GOOGLE_CLIENT_ID"
              label={t`Google Client ID`}
              value={getValue('AUTH_GOOGLE_CLIENT_ID')}
              onChange={(v) => handleChange('AUTH_GOOGLE_CLIENT_ID', v)}
              placeholder="...apps.googleusercontent.com"
              fullWidth
            />
            <SettingsTextInput
              instanceId="AUTH_GOOGLE_CLIENT_SECRET"
              label={t`Google Client Secret`}
              value={getValue('AUTH_GOOGLE_CLIENT_SECRET')}
              onChange={(v) => handleChange('AUTH_GOOGLE_CLIENT_SECRET', v)}
              placeholder="GOCSPX-..."
              type="password"
              fullWidth
            />
            <SettingsTextInput
              instanceId="AUTH_GOOGLE_CALLBACK_URL"
              label={t`Google OAuth Callback URL`}
              value={getValue('AUTH_GOOGLE_CALLBACK_URL')}
              onChange={(v) => handleChange('AUTH_GOOGLE_CALLBACK_URL', v)}
              placeholder="https://your-domain/auth/google/redirect"
              fullWidth
            />
            <SettingsTextInput
              instanceId="AUTH_GOOGLE_APIS_CALLBACK_URL"
              label={t`Google APIs Callback URL`}
              value={getValue('AUTH_GOOGLE_APIS_CALLBACK_URL')}
              onChange={(v) => handleChange('AUTH_GOOGLE_APIS_CALLBACK_URL', v)}
              placeholder="https://your-domain/auth/google-apis/get-access-token"
              fullWidth
            />
            <SettingsTextInput
              instanceId="AUTH_MICROSOFT_CLIENT_ID"
              label={t`Microsoft Client ID`}
              value={getValue('AUTH_MICROSOFT_CLIENT_ID')}
              onChange={(v) => handleChange('AUTH_MICROSOFT_CLIENT_ID', v)}
              placeholder="UUID"
              fullWidth
            />
            <SettingsTextInput
              instanceId="AUTH_MICROSOFT_CLIENT_SECRET"
              label={t`Microsoft Client Secret`}
              value={getValue('AUTH_MICROSOFT_CLIENT_SECRET')}
              onChange={(v) => handleChange('AUTH_MICROSOFT_CLIENT_SECRET', v)}
              placeholder="Secret..."
              type="password"
              fullWidth
            />
          </StyledInputContainer>
        </Section>
        <Section>
          <H2Title
            title={t`AI Integration`}
            description={t`Configure AI provider keys.`}
          />
          <StyledInputContainer>
            <SettingsTextInput
              instanceId="OPENAI_API_KEY"
              label={t`OpenAI API Key`}
              value={getValue('OPENAI_API_KEY')}
              onChange={(v) => handleChange('OPENAI_API_KEY', v)}
              placeholder="sk-..."
              type="password"
              fullWidth
            />
            <SettingsTextInput
              instanceId="ANTHROPIC_API_KEY"
              label={t`Anthropic API Key`}
              value={getValue('ANTHROPIC_API_KEY')}
              onChange={(v) => handleChange('ANTHROPIC_API_KEY', v)}
              placeholder="sk-ant-..."
              type="password"
              fullWidth
            />
            <SettingsTextInput
              instanceId="XAI_API_KEY"
              label={t`xAI API Key`}
              value={getValue('XAI_API_KEY')}
              onChange={(v) => handleChange('XAI_API_KEY', v)}
              placeholder="key..."
              type="password"
              fullWidth
            />
          </StyledInputContainer>
        </Section>
        <Section>
          <H2Title
            title={t`Google Analytics (Firebase)`}
            description={t`Configure Firebase Analytics credentials.`}
          />
          <StyledInputContainer>
            <SettingsTextInput
              instanceId="REACT_APP_FIREBASE_API_KEY"
              label={t`API Key`}
              value={getValue('REACT_APP_FIREBASE_API_KEY')}
              onChange={(v) => handleChange('REACT_APP_FIREBASE_API_KEY', v)}
              placeholder="AIza..."
              type="password"
              fullWidth
            />
            <SettingsTextInput
              instanceId="REACT_APP_FIREBASE_AUTH_DOMAIN"
              label={t`Auth Domain`}
              value={getValue('REACT_APP_FIREBASE_AUTH_DOMAIN')}
              onChange={(v) =>
                handleChange('REACT_APP_FIREBASE_AUTH_DOMAIN', v)
              }
              placeholder="project.firebaseapp.com"
              fullWidth
            />
            <SettingsTextInput
              instanceId="REACT_APP_FIREBASE_PROJECT_ID"
              label={t`Project ID`}
              value={getValue('REACT_APP_FIREBASE_PROJECT_ID')}
              onChange={(v) => handleChange('REACT_APP_FIREBASE_PROJECT_ID', v)}
              placeholder="project-id"
              fullWidth
            />
            <SettingsTextInput
              instanceId="REACT_APP_FIREBASE_STORAGE_BUCKET"
              label={t`Storage Bucket`}
              value={getValue('REACT_APP_FIREBASE_STORAGE_BUCKET')}
              onChange={(v) =>
                handleChange('REACT_APP_FIREBASE_STORAGE_BUCKET', v)
              }
              placeholder="project.appspot.com"
              fullWidth
            />
            <SettingsTextInput
              instanceId="REACT_APP_FIREBASE_MESSAGING_SENDER_ID"
              label={t`Messaging Sender ID`}
              value={getValue('REACT_APP_FIREBASE_MESSAGING_SENDER_ID')}
              onChange={(v) =>
                handleChange('REACT_APP_FIREBASE_MESSAGING_SENDER_ID', v)
              }
              placeholder="123456..."
              fullWidth
            />
            <SettingsTextInput
              instanceId="REACT_APP_FIREBASE_APP_ID"
              label={t`App ID`}
              value={getValue('REACT_APP_FIREBASE_APP_ID')}
              onChange={(v) => handleChange('REACT_APP_FIREBASE_APP_ID', v)}
              placeholder="1:123456...:web:..."
              fullWidth
            />
            <SettingsTextInput
              instanceId="REACT_APP_FIREBASE_MEASUREMENT_ID"
              label={t`Measurement ID`}
              value={getValue('REACT_APP_FIREBASE_MEASUREMENT_ID')}
              onChange={(v) =>
                handleChange('REACT_APP_FIREBASE_MEASUREMENT_ID', v)
              }
              placeholder="G-XXXXXXXXXX"
              fullWidth
            />
          </StyledInputContainer>
        </Section>
        <Section>
          <H2Title
            title={t`Remote Config Status`}
            description={t`Firebase Remote Config feature flags status. These flags control feature availability globally.`}
          />
          <Suspense fallback={<div>Loading...</div>}>
            <SettingsRemoteConfigStatus />
          </Suspense>
        </Section>
        <SuperAdminManagement />
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
