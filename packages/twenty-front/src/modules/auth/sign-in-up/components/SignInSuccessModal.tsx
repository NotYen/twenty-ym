import { Logo } from '@/auth/components/Logo';
import { Title } from '@/auth/components/Title';
import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useDefaultHomePagePath } from '@/navigation/hooks/useDefaultHomePagePath';
import { Modal } from '@/ui/layout/modal/components/Modal';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { MainButton } from 'twenty-ui/input';

const StyledContainer = styled(Modal.Content)`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  justify-content: center;
`;

const StyledButtonContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledTitleContainer = styled.div`
  line-height: 1.5;
  text-align: center;
`;

export type SignInSuccessModalProps = {
  modalId: string;
  isOpen: boolean;
  onClose?: () => void;
};

export const SignInSuccessModal = ({
  modalId,
  isOpen,
  onClose,
}: SignInSuccessModalProps) => {
  const navigate = useNavigate();
  const currentUser = useRecoilValue(currentUserState);
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const { defaultHomePagePath } = useDefaultHomePagePath();

  const displayName = useMemo(() => {
    const firstName = currentUser?.firstName ?? '';
    const lastName = currentUser?.lastName ?? '';
    const name =
      `${firstName}${firstName && lastName ? ' ' : ''}${lastName}`.trim();
    return name || currentUser?.email || '';
  }, [currentUser?.email, currentUser?.firstName, currentUser?.lastName]);

  const logoPlaceholder = useMemo(() => {
    const firstName = currentUser?.firstName ?? '';
    const lastName = currentUser?.lastName ?? '';
    if (firstName.length > 0) return firstName.charAt(0).toUpperCase();
    if (lastName.length > 0) return lastName.charAt(0).toUpperCase();
    if (
      currentUser?.email !== undefined &&
      currentUser?.email !== null &&
      currentUser.email.length > 0
    ) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  }, [currentUser?.email, currentUser?.firstName, currentUser?.lastName]);

  const titleLine1 = useMemo(() => {
    return `${displayName} ${t`successfully signed in`},`;
  }, [displayName]);

  const titleLine2 = t`Welcome to ${
    currentWorkspace?.displayName ?? 'Y-CRM'
  }`;

  const handleContinue = () => {
    onClose?.();
    navigate(defaultHomePagePath);
  };

  if (!isOpen) return null;

  return (
    <Modal modalId={modalId} isClosable onClose={onClose} padding="large">
      <StyledContainer>
        <Logo placeholder={logoPlaceholder} />
        <StyledTitleContainer>
          <Title animate>
            {titleLine1}
            <br />
            {titleLine2}
          </Title>
        </StyledTitleContainer>
        <StyledButtonContainer>
          {/* 新增的多國語系 key（不要覆蓋既有文案） */}
          <MainButton
            title={t`Continue (login success)`}
            onClick={handleContinue}
          />
        </StyledButtonContainer>
      </StyledContainer>
    </Modal>
  );
};
