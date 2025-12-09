import { useEffect, useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import { useIsLogged } from '@/auth/hooks/useIsLogged';
import { currentUserState } from '@/auth/states/currentUserState';
import { isCurrentUserLoadedState } from '@/auth/states/isCurrentUserLoadedState';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { isModalOpenedComponentState } from '@/ui/layout/modal/states/isModalOpenedComponentState';
import { isDefined } from 'twenty-shared/utils';
import { logDebug } from '~/utils/logDebug';
import { SignInSuccessModal } from './SignInSuccessModal';

const SESSION_FLAG = 'signInSuccessShown';
const MODAL_ID = 'sign-in-success-modal';

export const SignInSuccessEffect = () => {
  const isLogged = useIsLogged();
  const currentUser = useRecoilValue(currentUserState);
  const isCurrentUserLoaded = useRecoilValue(isCurrentUserLoadedState);
  const { openModal, closeModal } = useModal();

  // 監聽 modal 的 Recoil state 用於 debug
  const isModalOpen = useRecoilValue(
    isModalOpenedComponentState.atomFamily({ instanceId: MODAL_ID }),
  );

  // 無條件掛載訊息，便於確認元件是否已被渲染
  logDebug('[SignInSuccessEffect] mounted');

  const alreadyShown = useMemo(
    () =>
      typeof window !== 'undefined' &&
      sessionStorage.getItem(SESSION_FLAG) === '1',
    [],
  );

  useEffect(() => {
    logDebug('[SignInSuccessEffect] status', {
      isLogged,
      isCurrentUserLoaded,
      hasUser: isDefined(currentUser),
      alreadyShown,
      isModalOpen,
    });

    if (
      isLogged &&
      isCurrentUserLoaded &&
      isDefined(currentUser) &&
      !alreadyShown
    ) {
      logDebug('[SignInSuccessEffect] calling openModal()');
      openModal(MODAL_ID);

      // 延遲檢查 modal 是否真的被打開
      setTimeout(() => {
        logDebug('[SignInSuccessEffect] after openModal, DOM check:', {
          modalElement: document.querySelector('#sign-in-success-modal'),
          modalBackdrop: document.querySelector(
            '[data-testid="modal-backdrop"]',
          ),
          allModals: document.querySelectorAll('[role="dialog"]'),
        });
      }, 500);
    }
  }, [isLogged, isCurrentUserLoaded, currentUser, alreadyShown, openModal]);

  // 監聽 isModalOpen 變化
  useEffect(() => {
    logDebug('[SignInSuccessEffect] isModalOpen changed to:', isModalOpen);
  }, [isModalOpen]);

  const handleClose = () => {
    try {
      sessionStorage.setItem(SESSION_FLAG, '1');
    } catch {
      // Ignore sessionStorage errors (e.g., in private browsing mode)
    }
    logDebug('[SignInSuccessEffect] close modal');
    closeModal(MODAL_ID);
  };

  return (
    <SignInSuccessModal
      modalId={MODAL_ID}
      isOpen={isModalOpen}
      onClose={handleClose}
    />
  );
};
