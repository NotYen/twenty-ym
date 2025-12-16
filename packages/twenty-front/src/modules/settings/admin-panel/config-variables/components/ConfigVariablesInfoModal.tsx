// Rebuild Checksum: 2025-12-11-FIX-01
import { Modal } from '@/ui/layout/modal/components/Modal';
import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { H2Title } from 'twenty-ui/display';

const StyledModalContent = styled(Modal.Content)`
  padding: ${({ theme }) => theme.spacing(4)};
  padding-top: ${({ theme }) => theme.spacing(2)};
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  color: ${({ theme }) => theme.font.color.primary};

  h2 {
    margin-bottom: 0;
  }
`;

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledTitle = styled.h3`
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledText = styled.p`
  margin: 0;
  line-height: 1.5;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledExample = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  padding: ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

export const CONFIG_VARIABLES_INFO_MODAL_ID = 'config-variables-info-modal';

export const ConfigVariablesInfoModal = () => {
  const { t } = useLingui();

  return (
    <Modal
      modalId={CONFIG_VARIABLES_INFO_MODAL_ID}
      isClosable
      size="medium"
    >
      <Modal.Header>
         <H2Title title={t`Configuration Hierarchy Explained`} />
      </Modal.Header>
      <StyledModalContent>
        <ContentContainer>
          <StyledSection>
            <StyledTitle>
              1. {t`Admin Panel (Global Defaults)`} 🌍
            </StyledTitle>
            <StyledText>
              {t`Settings seen in "Other / Admin Panel / Config Variables" serve as the server-wide default values. These typically originate from the 'env.local' or '.env' files configured during deployment.`}
            </StyledText>
            <StyledText>
              <strong>{t`Scope:`}</strong> {t`If a Workspace has NOT configured its own Advanced Settings, the system will fall back to reading these values.`}
            </StyledText>
          </StyledSection>

          <StyledSection>
            <StyledTitle>
              2. {t`Advanced Settings (Workspace Override)`} 🏢
            </StyledTitle>
            <StyledText>
              {t`This is the newly implemented feature. Its purpose is to "override" the defaults mentioned above.`}
            </StyledText>
            <StyledText>
              <strong>{t`Scope:`}</strong> {t`These settings affect ONLY the current Workspace.`}
            </StyledText>
          </StyledSection>

          <StyledSection>
            <StyledTitle>{t`Example`} 🌰</StyledTitle>
            <StyledExample>
              <StyledText style={{ marginBottom: '12px' }}>
                {t`Suppose Admin Panel GOOGLE_AUTH is 'Client-A' (Default).`}
              </StyledText>

              <div style={{ display: 'grid', gap: '8px', paddingLeft: '8px', borderLeft: '4px solid #e0e0e0' }}>
                <div>
                   <StyledText>
                      <strong>{t`Workspace 1`}</strong> <span style={{ opacity: 0.7 }}>({t`No advanced settings`})</span>
                   </StyledText>
                   <StyledText>
                      👉 {t`Uses 'Client-A' for login.`}
                   </StyledText>
                </div>
                <div style={{ marginTop: '4px' }}>
                   <StyledText>
                      <strong>{t`Workspace 2`}</strong> <span style={{ opacity: 0.7 }}>({t`Filled 'Client-B' in Advanced Settings`})</span>
                   </StyledText>
                   <StyledText>
                      👉 {t`Uses 'Client-B' for login.`}
                   </StyledText>
                </div>
              </div>

              <StyledText style={{ marginTop: '16px', fontStyle: 'italic', fontSize: '0.9em' }}>
                {t`This 'Default vs. Override' relationship ensures flexibility: most use defaults, while specific cases can be customized.`}
              </StyledText>
            </StyledExample>
          </StyledSection>
        </ContentContainer>
      </StyledModalContent>
    </Modal>
  );
};
