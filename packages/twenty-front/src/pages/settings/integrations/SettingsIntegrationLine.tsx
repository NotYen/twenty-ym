import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { H2Title, Section, IconBrandLine } from 'twenty-ui';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from '@/ui/input/button/components/Button';
import { TextInput } from '@/ui/input/components/TextInput';
import { GET_LINE_CONFIG } from '~/modules/settings/integrations/line/graphql/queries/getLineConfig';
import { UPDATE_LINE_CONFIG } from '~/modules/settings/integrations/line/graphql/mutations/updateLineConfig';
import { TEST_LINE_CONNECTION } from '~/modules/settings/integrations/line/graphql/mutations/testLineConnection';
import { DELETE_LINE_CONFIG } from '~/modules/settings/integrations/line/graphql/mutations/deleteLineConfig';

/**
 * LINE Integration Settings Page
 *
 * 提供 LINE Official Account (OA) 的設定介面：
 * - Channel ID、Channel Secret、Channel Access Token 設定
 * - 測試連線功能
 * - Webhook URL 顯示與複製
 * - 刪除設定
 */
export const SettingsIntegrationLine = () => {
  const { t } = useLingui();
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  // State for form inputs
  const [channelId, setChannelId] = useState('');
  const [channelSecret, setChannelSecret] = useState('');
  const [channelAccessToken, setChannelAccessToken] = useState('');

  // GraphQL queries and mutations
  const { data, loading, refetch } = useQuery(GET_LINE_CONFIG);
  const [updateLineConfig, { loading: isUpdating }] = useMutation(UPDATE_LINE_CONFIG);
  const [testLineConnection, { loading: isTesting }] = useMutation(TEST_LINE_CONNECTION);
  const [deleteLineConfig, { loading: isDeleting }] = useMutation(DELETE_LINE_CONFIG);

  const lineConfig = data?.lineConfig;
  const isConfigured = lineConfig?.isConfigured || false;

  // 取得 Webhook URL
  const webhookUrl = `${window.location.origin}/api/v1/webhooks/line`;

  const handleSave = async () => {
    if (!channelId || !channelSecret || !channelAccessToken) {
      enqueueErrorSnackBar({
        message: t`Please fill in all fields`,
      });
      return;
    }

    try {
      await updateLineConfig({
        variables: {
          input: {
            channelId,
            channelSecret,
            channelAccessToken,
          },
        },
      });

      enqueueSuccessSnackBar({
        message: t`LINE configuration saved successfully`,
      });

      // 清空密碼欄位
      setChannelSecret('');
      setChannelAccessToken('');

      // 重新載入設定
      refetch();
    } catch (error) {
      enqueueErrorSnackBar({
        message: t`Failed to save LINE configuration`,
      });
    }
  };

  const handleTest = async () => {
    try {
      const result = await testLineConnection();

      if (result.data?.testLineConnection?.success) {
        const botInfo = result.data.testLineConnection.botInfo;
        enqueueSuccessSnackBar({
          message: t`Connection successful! Bot: ${botInfo.displayName}`,
        });
      } else {
        const error = result.data?.testLineConnection?.error || 'Unknown error';
        enqueueErrorSnackBar({
          message: t`Connection failed: ${error}`,
        });
      }
    } catch (error) {
      enqueueErrorSnackBar({
        message: t`Failed to test LINE connection`,
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(t`Are you sure you want to delete LINE configuration?`)) {
      return;
    }

    try {
      await deleteLineConfig();

      enqueueSuccessSnackBar({
        message: t`LINE configuration deleted successfully`,
      });

      // 清空表單
      setChannelId('');
      setChannelSecret('');
      setChannelAccessToken('');

      // 重新載入設定
      refetch();
    } catch (error) {
      enqueueErrorSnackBar({
        message: t`Failed to delete LINE configuration`,
      });
    }
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    enqueueSuccessSnackBar({
      message: t`Webhook URL copied to clipboard`,
    });
  };

  return (
    <SettingsPageContainer>
      <SubMenuTopBarContainer
        title={t`LINE Integration`}
        Icon={IconBrandLine}
      />

      <Section>
        <H2Title title={t`LINE Official Account Configuration`} />

        {loading ? (
          <div>{t`Loading...`}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {/* Channel ID */}
            <div>
              <label>{t`Channel ID`}</label>
              <TextInput
                value={channelId || lineConfig?.channelId || ''}
                onChange={(value) => setChannelId(value)}
                placeholder={t`Enter your LINE Channel ID`}
                fullWidth
              />
            </div>

            {/* Channel Secret */}
            <div>
              <label>{t`Channel Secret`}</label>
              <TextInput
                value={channelSecret}
                onChange={(value) => setChannelSecret(value)}
                placeholder={isConfigured ? t`Enter new secret to update` : t`Enter your LINE Channel Secret`}
                type="password"
                fullWidth
              />
            </div>

            {/* Channel Access Token */}
            <div>
              <label>{t`Channel Access Token`}</label>
              <TextInput
                value={channelAccessToken}
                onChange={(value) => setChannelAccessToken(value)}
                placeholder={isConfigured ? t`Enter new token to update` : t`Enter your LINE Channel Access Token`}
                type="password"
                fullWidth
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button
                onClick={handleSave}
                variant="primary"
                disabled={isUpdating}
                title={isConfigured ? t`Update Configuration` : t`Save Configuration`}
              />

              {isConfigured && (
                <>
                  <Button
                    onClick={handleTest}
                    variant="secondary"
                    disabled={isTesting}
                    title={t`Test Connection`}
                  />

                  <Button
                    onClick={handleDelete}
                    variant="secondary"
                    accent="danger"
                    disabled={isDeleting}
                    title={t`Delete Configuration`}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Webhook URL Section */}
      <Section style={{ marginTop: '32px' }}>
        <H2Title title={t`Webhook URL`} />
        <div style={{ marginTop: '16px' }}>
          <p style={{ marginBottom: '8px' }}>
            {t`Configure this Webhook URL in your LINE Developers Console:`}
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <code style={{
              background: '#f5f5f5',
              padding: '8px 12px',
              borderRadius: '4px',
              flex: 1,
              fontSize: '14px',
              fontFamily: 'monospace',
            }}>
              {webhookUrl}
            </code>
            <Button
              onClick={handleCopyWebhookUrl}
              variant="secondary"
              title={t`Copy`}
            />
          </div>

          <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
            <p><strong>{t`Setup Instructions:`}</strong></p>
            <ol style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>{t`Go to LINE Developers Console`}</li>
              <li>{t`Navigate to Messaging API > Webhook settings`}</li>
              <li>{t`Paste the Webhook URL above`}</li>
              <li>{t`Click "Verify" to test the connection`}</li>
              <li>{t`Enable "Use webhook"`}</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* Connection Status */}
      {isConfigured && (
        <Section style={{ marginTop: '32px' }}>
          <H2Title title={t`Connection Status`} />
          <div style={{ marginTop: '16px' }}>
            <div style={{
              padding: '12px',
              background: '#e8f5e9',
              borderRadius: '4px',
              color: '#2e7d32',
            }}>
              ✓ {t`LINE Official Account is configured`}
            </div>
          </div>
        </Section>
      )}
    </SettingsPageContainer>
  );
};
