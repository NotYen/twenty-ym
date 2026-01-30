import { useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useEffect, useState } from 'react';

import { H1Title, H1TitleFontColor, IconCheck, IconCopy } from 'twenty-ui/display';
import { Button, Checkbox } from 'twenty-ui/input';
import { Section, SectionAlignment, SectionFontColor } from 'twenty-ui/layout';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';
import { TextInput } from '~/modules/ui/input/components/TextInput';
import { Modal } from '~/modules/ui/layout/modal/components/Modal';
import { useModal } from '~/modules/ui/layout/modal/hooks/useModal';

import { GET_ACTIVE_SHARE_LINK } from '../graphql/queries/getActiveShareLink';
import { useCreateShareLinkMutation } from '../hooks/useCreateShareLinkMutation';

const StyledShareLinkModal = styled(Modal)`
  border-radius: ${({ theme }) => theme.spacing(1)};
  width: calc(500px - ${({ theme }) => theme.spacing(16)});
  max-width: 90vw;
  height: auto;
`;

const StyledCenteredTitle = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const StyledSection = styled(Section)`
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const StyledCenteredButton = styled(Button)`
  box-sizing: border-box;
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background-color: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  cursor: pointer;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.blue};
  }
`;

const StyledDateInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background-color: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.blue};
  }

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
  }
`;

const StyledLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.secondary};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledFormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(5)};

  &:last-child {
    margin-bottom: 0;
  }
`;

const StyledCheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledCheckboxLabel = styled.span`
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledDateInputContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2)};
  padding-left: ${({ theme }) => theme.spacing(6)};
`;

const StyledUrlContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  align-items: center;
`;

interface ShareLinkModalProps {
  modalId: string;
  resourceType: 'COMPANY' | 'PERSON' | 'SALES_QUOTE' | 'DASHBOARD_CHART';
  resourceId: string;
  resourceName: string;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  modalId,
  resourceType,
  resourceId,
  resourceName,
}) => {
  const { closeModal } = useModal();
  const { copyToClipboard } = useCopyToClipboard();
  const [accessMode, setAccessMode] = useState<'PUBLIC' | 'LOGIN_REQUIRED'>('PUBLIC');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [inactivityDays, setInactivityDays] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { createShareLink, loading } = useCreateShareLinkMutation();

  // Query existing share link
  const { data: existingLinkData, loading: loadingExisting } = useQuery(GET_ACTIVE_SHARE_LINK, {
    variables: {
      resourceType,
      resourceId,
    },
    skip: false,
  });

  // Track if we're editing an existing link
  const hasExistingLink = !!existingLinkData?.getActiveShareLink;

  // Load existing link data when available
  useEffect(() => {
    if (existingLinkData?.getActiveShareLink) {
      const existing = existingLinkData.getActiveShareLink;
      setAccessMode(existing.accessMode);
      setHasExpiration(!!existing.expiresAt);
      if (existing.expiresAt) {
        // Convert ISO string to YYYY-MM-DD format for date input
        const date = new Date(existing.expiresAt);
        setExpiresAt(date.toISOString().split('T')[0]);
      }
      setInactivityDays(existing.inactivityExpirationDays);

      // Set the share URL immediately if link exists
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/shared/${existing.token}`);
    }
  }, [existingLinkData]);

  const handleClose = () => {
    closeModal(modalId);
    // Reset state
    setAccessMode('PUBLIC');
    setHasExpiration(false);
    setExpiresAt('');
    setInactivityDays(null);
    setShareUrl(null);
    setCopied(false);
  };

  const handleCreateShare = async () => {
    try {
      // Convert local date to UTC for backend storage
      let expiresAtUTC: string | null = null;
      if (hasExpiration && expiresAt) {
        // Set time to end of day (23:59:59) in local timezone
        const localDate = new Date(expiresAt);
        localDate.setHours(23, 59, 59, 999);
        expiresAtUTC = localDate.toISOString();
      }

      const result = await createShareLink({
        resourceType,
        resourceId,
        accessMode,
        expiresAt: expiresAtUTC,
        inactivityExpirationDays: inactivityDays,
      });

      if (result?.token) {
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/shared/${result.token}`);
      }
    } catch (error) {
      // Failed to create share link - error logged for debugging
    }
  };

  const handleCopyUrl = async () => {
    if (shareUrl) {
      copyToClipboard(shareUrl, t`Share link copied to clipboard`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const accessModeOptions = [
    { value: 'PUBLIC', label: t`Public access - No login required` },
    { value: 'LOGIN_REQUIRED', label: t`Login required - Authentication needed` },
  ];

  const inactivityOptions = [
    { value: null, label: t`No inactivity expiration` },
    { value: 7, label: t`7 days of inactivity` },
    { value: 14, label: t`14 days of inactivity` },
    { value: 30, label: t`30 days of inactivity` },
    { value: 60, label: t`60 days of inactivity` },
    { value: 90, label: t`90 days of inactivity` },
  ];

  return (
    <StyledShareLinkModal
      modalId={modalId}
      onClose={handleClose}
      isClosable={true}
      padding="large"
      dataGloballyPreventClickOutside
    >
      <StyledCenteredTitle>
        <H1Title
          title={t`Share ${resourceName}`}
          fontColor={H1TitleFontColor.Primary}
        />
      </StyledCenteredTitle>

      {!shareUrl ? (
        <>
          <StyledSection
            alignment={SectionAlignment.Center}
            fontColor={SectionFontColor.Primary}
          >
            {loadingExisting
              ? t`Loading existing share link...`
              : t`Create a share link to allow others to view this record. You can configure access permissions and expiration settings.`
            }
          </StyledSection>

          <Section>
            {/* Access Mode Selection */}
            <StyledFormGroup>
              <StyledLabel>{t`訪問模式`}</StyledLabel>
              <StyledSelect
                value={accessMode}
                onChange={(e) => setAccessMode(e.target.value as 'PUBLIC' | 'LOGIN_REQUIRED')}
              >
                {accessModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </StyledSelect>
            </StyledFormGroup>

            {/* Expiration Settings */}
            <StyledFormGroup>
              <StyledCheckboxGroup>
                <Checkbox
                  checked={hasExpiration}
                  onChange={setHasExpiration}
                />
                <StyledCheckboxLabel>{t`設定過期日期`}</StyledCheckboxLabel>
              </StyledCheckboxGroup>

              {hasExpiration && (
                <StyledDateInputContainer>
                  <StyledLabel>{t`選擇過期日期`}</StyledLabel>
                  <StyledDateInput
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </StyledDateInputContainer>
              )}
            </StyledFormGroup>

            {/* Inactivity Expiration */}
            <StyledFormGroup>
              <StyledLabel>{t`非活躍過期`}</StyledLabel>
              <StyledSelect
                value={inactivityDays ?? ''}
                onChange={(e) => setInactivityDays(e.target.value ? Number(e.target.value) : null)}
              >
                {inactivityOptions.map((option) => (
                  <option key={option.value ?? 'none'} value={option.value ?? ''}>
                    {option.label}
                  </option>
                ))}
              </StyledSelect>
            </StyledFormGroup>
          </Section>

          <StyledCenteredButton
            onClick={handleCreateShare}
            variant="primary"
            title={loading ? t`Creating...` : hasExistingLink ? t`Update Share Link` : t`Create Share Link`}
            disabled={loading || loadingExisting}
            fullWidth
          />
        </>
      ) : (
        <>
          <StyledSection
            alignment={SectionAlignment.Center}
            fontColor={SectionFontColor.Primary}
          >
            {t`Share link created successfully! Copy the link below and share it with others.`}
          </StyledSection>

          <Section>
            <StyledLabel>{t`分享連結`}</StyledLabel>
            <StyledUrlContainer>
              <TextInput
                value={shareUrl}
                readOnly
                fullWidth
              />
              <Button
                Icon={copied ? IconCheck : IconCopy}
                variant="secondary"
                onClick={handleCopyUrl}
                disabled={copied}
              >
                {copied ? t`Copied!` : t`Copy`}
              </Button>
            </StyledUrlContainer>
          </Section>

          <StyledCenteredButton
            onClick={handleClose}
            variant="primary"
            title={t`Done`}
            fullWidth
          />
        </>
      )}
    </StyledShareLinkModal>
  );
};
