import styled from '@emotion/styled';
import { Trans } from '@lingui/react/macro';

import { useWorkspaceBypass } from '@/auth/sign-in-up/hooks/useWorkspaceBypass';
import { useIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { LegalDocumentModal } from '@/auth/sign-in-up/components/LegalDocumentModal';
import {
  PRIVACY_POLICY_TITLE,
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_SECTIONS,
} from '@/auth/sign-in-up/constants/PrivacyPolicyContent';
import {
  TERMS_OF_SERVICE_TITLE,
  TERMS_OF_SERVICE_INTRO,
  TERMS_OF_SERVICE_SECTIONS,
} from '@/auth/sign-in-up/constants/TermsOfServiceContent';

const PRIVACY_POLICY_MODAL_ID = 'privacy-policy-modal';
const TERMS_OF_SERVICE_MODAL_ID = 'terms-of-service-modal';

const StyledCopyContainer = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  max-width: 280px;
  text-align: center;

  & > button {
    background: none;
    border: none;
    color: ${({ theme }) => theme.font.color.tertiary};
    cursor: pointer;
    font: inherit;
    padding: 0;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledLinksContainer = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.font.color.tertiary};
  display: flex;
  flex-wrap: nowrap;
  font-size: ${({ theme }) => theme.font.size.sm};
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: center;
  max-width: 100%;
  text-align: center;
  white-space: nowrap;

  & > a,
  & > button {
    background: none;
    border: none;
    color: ${({ theme }) => theme.font.color.tertiary};
    cursor: pointer;
    font: inherit;
    padding: 0;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledSeparator = styled.span`
  color: ${({ theme }) => theme.font.color.tertiary};
`;

export const FooterNote = () => {
  const isOnAWorkspace = useIsCurrentLocationOnAWorkspace();

  const { shouldOfferBypass, shouldUseBypass, enableBypass } =
    useWorkspaceBypass();

  const { openModal } = useModal();

  const handleOpenPrivacyPolicy = () => {
    openModal(PRIVACY_POLICY_MODAL_ID);
  };

  const handleOpenTermsOfService = () => {
    openModal(TERMS_OF_SERVICE_MODAL_ID);
  };

  if (!isOnAWorkspace) {
    return (
      <>
        <StyledCopyContainer>
          <Trans>By using YM CRM, you agree to the</Trans>{' '}
          <button type="button" onClick={handleOpenTermsOfService}>
            <Trans>Terms of Service</Trans>
          </button>{' '}
          <Trans>and</Trans>{' '}
          <button type="button" onClick={handleOpenPrivacyPolicy}>
            <Trans>Privacy Policy</Trans>
          </button>
          .
        </StyledCopyContainer>
        <LegalDocumentModal
          modalId={PRIVACY_POLICY_MODAL_ID}
          title={PRIVACY_POLICY_TITLE}
          intro={PRIVACY_POLICY_INTRO}
          sections={PRIVACY_POLICY_SECTIONS}
        />
        <LegalDocumentModal
          modalId={TERMS_OF_SERVICE_MODAL_ID}
          title={TERMS_OF_SERVICE_TITLE}
          intro={TERMS_OF_SERVICE_INTRO}
          sections={TERMS_OF_SERVICE_SECTIONS}
        />
      </>
    );
  }

  return (
    <>
      <StyledLinksContainer>
        {shouldOfferBypass && !shouldUseBypass && (
          <>
            <button type="button" onClick={enableBypass}>
              <Trans>Bypass SSO</Trans>
            </button>
            <StyledSeparator>•</StyledSeparator>
          </>
        )}
        <button type="button" onClick={handleOpenPrivacyPolicy}>
          <Trans>Privacy Policy</Trans>
        </button>
        <StyledSeparator>•</StyledSeparator>
        <button type="button" onClick={handleOpenTermsOfService}>
          <Trans>Terms of Service</Trans>
        </button>
      </StyledLinksContainer>
      <LegalDocumentModal
        modalId={PRIVACY_POLICY_MODAL_ID}
        title={PRIVACY_POLICY_TITLE}
        intro={PRIVACY_POLICY_INTRO}
        sections={PRIVACY_POLICY_SECTIONS}
      />
      <LegalDocumentModal
        modalId={TERMS_OF_SERVICE_MODAL_ID}
        title={TERMS_OF_SERVICE_TITLE}
        intro={TERMS_OF_SERVICE_INTRO}
        sections={TERMS_OF_SERVICE_SECTIONS}
      />
    </>
  );
};
