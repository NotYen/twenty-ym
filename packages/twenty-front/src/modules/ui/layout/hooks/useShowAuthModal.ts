import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { isMatchingLocation } from '~/utils/isMatchingLocation';

export const useShowAuthModal = () => {
  const location = useLocation();

  return useMemo(() => {
    // Skip auth modal for external share links
    if (location.pathname.startsWith('/shared/')) {
      // Skipping auth modal for external share link
      return false;
    }

    if (
      isMatchingLocation(location, AppPath.Invite) ||
      isMatchingLocation(location, AppPath.InviteTeam) ||
      isMatchingLocation(location, AppPath.CreateProfile) ||
      isMatchingLocation(location, AppPath.SyncEmails) ||
      isMatchingLocation(location, AppPath.ResetPassword) ||
      isMatchingLocation(location, AppPath.VerifyEmail) ||
      isMatchingLocation(location, AppPath.Verify) ||
      isMatchingLocation(location, AppPath.SignInUp) ||
      isMatchingLocation(location, AppPath.CreateWorkspace) ||
      isMatchingLocation(location, AppPath.PlanRequired) ||
      isMatchingLocation(location, AppPath.PlanRequiredSuccess) ||
      isMatchingLocation(location, AppPath.BookCallDecision) ||
      isMatchingLocation(location, AppPath.BookCall)
    ) {
      // Showing auth modal for path
      return true;
    }

    // Not showing auth modal for path
    return false;
  }, [location]);
};
