import React from 'react';
import { useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { PreComputedChipGeneratorsProvider } from '@/object-metadata/components/PreComputedChipGeneratorsProvider';
import { objectMetadataItemsState } from '@/object-metadata/states/objectMetadataItemsState';
import { shouldAppBeLoadingState } from '@/object-metadata/states/shouldAppBeLoadingState';
import { UserOrMetadataLoader } from '~/loading/components/UserOrMetadataLoader';

export const ObjectMetadataItemsProvider = ({
  children,
}: React.PropsWithChildren) => {
  const location = useLocation();
  const objectMetadataItems = useRecoilValue(objectMetadataItemsState);
  const shouldAppBeLoading = useRecoilValue(shouldAppBeLoadingState);

  // Skip metadata check for external share links
  const isExternalShareRoute = location.pathname.startsWith('/shared/');

  const shouldDisplayChildren =
    isExternalShareRoute ||
    (!shouldAppBeLoading && objectMetadataItems.length > 0);

  return (
    <>
      {shouldDisplayChildren ? (
        <PreComputedChipGeneratorsProvider>
          {children}
        </PreComputedChipGeneratorsProvider>
      ) : (
        <UserOrMetadataLoader />
      )}
    </>
  );
};
