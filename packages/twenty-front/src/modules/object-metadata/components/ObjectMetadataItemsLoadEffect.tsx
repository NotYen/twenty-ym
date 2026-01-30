import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useLoadMockedObjectMetadataItems } from '@/object-metadata/hooks/useLoadMockedObjectMetadataItems';
import { useRefreshObjectMetadataItems } from '@/object-metadata/hooks/useRefreshObjectMetadataItems';
import { isWorkspaceActiveOrSuspended } from 'twenty-shared/workspace';
import { isUndefinedOrNull } from '~/utils/isUndefinedOrNull';

export const ObjectMetadataItemsLoadEffect = () => {
  const location = useLocation();
  const currentUser = useRecoilValue(currentUserState);
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const [isInitialized, setIsInitialized] = useState(false);

  const { refreshObjectMetadataItems } =
    useRefreshObjectMetadataItems('cache-first');
  const { loadMockedObjectMetadataItems } = useLoadMockedObjectMetadataItems();

  // Skip for external share links
  const isExternalShareRoute = location.pathname.startsWith('/shared/');

  useEffect(() => {
    if (isExternalShareRoute) return;
    if (isInitialized) {
      return;
    }

    const loadObjectMetadata = async () => {
      if (
        isUndefinedOrNull(currentUser) ||
        !isWorkspaceActiveOrSuspended(currentWorkspace)
      ) {
        await loadMockedObjectMetadataItems();
      } else {
        await refreshObjectMetadataItems();
      }
      setIsInitialized(true);
    };

    loadObjectMetadata();
  }, [
    isExternalShareRoute,
    currentUser,
    currentWorkspace,
    loadMockedObjectMetadataItems,
    refreshObjectMetadataItems,
    isInitialized,
  ]);

  return <></>;
};
