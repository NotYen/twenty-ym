import styled from '@emotion/styled';

import { Modal } from '@/ui/layout/modal/components/Modal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { PolicySection } from '@/auth/sign-in-up/constants/PrivacyPolicyContent';
import { IconX } from 'twenty-ui/display';
import { LightIconButton } from 'twenty-ui/input';

const StyledModalHeader = styled(Modal.Header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(6)};
  border-bottom: 1px solid ${({ theme }) => theme.border.color.medium};
`;

const StyledTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledModalContent = styled(Modal.Content)`
  padding: ${({ theme }) => theme.spacing(6)};
  overflow-y: auto;
  max-height: 70vh;
`;

const StyledIntro = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(6)} 0;
  font-size: ${({ theme }) => theme.font.size.md};
  line-height: 1.6;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(6)};
`;

const StyledSectionTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing(3)} 0;
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledSectionContent = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(2)} 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: 1.6;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing(5)};
`;

const StyledListItem = styled.li`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: 1.6;
  color: ${({ theme }) => theme.font.color.secondary};
`;

type LegalDocumentModalProps = {
  modalId: string;
  title: string;
  intro: string;
  sections: PolicySection[];
};

export const LegalDocumentModal = ({
  modalId,
  title,
  intro,
  sections,
}: LegalDocumentModalProps) => {
  const { closeModal } = useModal();

  const handleClose = () => {
    closeModal(modalId);
  };

  return (
    <Modal
      modalId={modalId}
      size="extraLarge"
      padding="none"
      isClosable={true}
      onClose={handleClose}
    >
      <StyledModalHeader>
        <StyledTitle>{title}</StyledTitle>
        <LightIconButton Icon={IconX} onClick={handleClose} />
      </StyledModalHeader>
      <StyledModalContent>
        <StyledIntro>{intro}</StyledIntro>
        {sections.map((section, index) => (
          <StyledSection key={index}>
            <StyledSectionTitle>{section.title}</StyledSectionTitle>
            {section.content && (
              <StyledSectionContent>{section.content}</StyledSectionContent>
            )}
            {section.items && section.items.length > 0 && (
              <StyledList>
                {section.items.map((item, itemIndex) => (
                  <StyledListItem key={itemIndex}>{item}</StyledListItem>
                ))}
              </StyledList>
            )}
          </StyledSection>
        ))}
      </StyledModalContent>
    </Modal>
  );
};
