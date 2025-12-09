import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { Avatar, IconLogout } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

import { useAuth } from '@/auth/hooks/useAuth';
import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { logError } from '~/utils/logError';

const StyledWrapper = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
`;

const StyledUserInfo = styled.div<{ isExpanded: boolean }>`
  align-items: center;
  display: flex;
  flex: 1;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: ${({ isExpanded }) =>
    isExpanded ? 'flex-start' : 'center'};
  min-width: 0;
`;

const StyledTextContainer = styled.div<{ isExpanded: boolean }>`
  display: ${({ isExpanded }) => (isExpanded ? 'flex' : 'none')};
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  min-width: 0;
  overflow: hidden;
`;

const StyledName = styled.span`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledEmail = styled.span`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledLogoutButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isExpanded',
})<{ isExpanded: boolean }>`
  display: ${({ isExpanded }) => (isExpanded ? 'inline-flex' : 'none')};
  flex-shrink: 0;
`;

export const MainNavigationDrawerUserSection = () => {
  const { t } = useLingui();
  const { signOut } = useAuth();
  const { openModal } = useModal();

  const currentUser = useRecoilValue(currentUserState);
  const currentWorkspaceMember = useRecoilValue(currentWorkspaceMemberState);
  const isNavigationDrawerExpanded = useRecoilValue(
    isNavigationDrawerExpandedState,
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      logError('Failed to sign out from navigation drawer user section:');
      logError(error);
    }
  }, [signOut]);

  const handleOpenConfirmationModal = useCallback(() => {
    openModal('navigation-drawer-sign-out-confirmation');
  }, [openModal]);

  if (!currentUser) {
    return null;
  }

  const fullName = [
    currentWorkspaceMember?.name?.firstName ?? '',
    currentWorkspaceMember?.name?.lastName ?? '',
  ]
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .join(' ');

  const avatarPlaceholder = fullName.length > 0 ? fullName : currentUser.email;

  return (
    <>
      <StyledWrapper>
        <StyledUserInfo isExpanded={isNavigationDrawerExpanded}>
          <Avatar
            avatarUrl={currentWorkspaceMember?.avatarUrl ?? undefined}
            placeholder={avatarPlaceholder}
            size={isNavigationDrawerExpanded ? 'md' : 'sm'}
            type="rounded"
          />
          <StyledTextContainer isExpanded={isNavigationDrawerExpanded}>
            <StyledName>{fullName || currentUser.email}</StyledName>
            <StyledEmail>{currentUser.email}</StyledEmail>
          </StyledTextContainer>
        </StyledUserInfo>
        <StyledLogoutButton
          isExpanded={isNavigationDrawerExpanded}
          variant="secondary"
          size="small"
          Icon={IconLogout}
          title={t`Log out`}
          onClick={handleOpenConfirmationModal}
        />
      </StyledWrapper>

      <ConfirmationModal
        modalId="navigation-drawer-sign-out-confirmation"
        title={t`Confirm sign out`}
        subtitle={t`Are you sure you want to sign out?`}
        confirmButtonText={t`Confirm sign out`}
        confirmButtonAccent="danger"
        onConfirmClick={handleSignOut}
      />
    </>
  );
};
