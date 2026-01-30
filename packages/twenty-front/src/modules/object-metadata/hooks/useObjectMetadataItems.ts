import { useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { objectMetadataItemsState } from '@/object-metadata/states/objectMetadataItemsState';

export const useObjectMetadataItems = () => {
  const location = useLocation();
  const objectMetadataItems = useRecoilValue(objectMetadataItemsState);

  const isExternalShareRoute = location.pathname.startsWith('/shared/');

  if (isExternalShareRoute) {
    // External share route debug info
  }

  return {
    objectMetadataItems,
  };
};
