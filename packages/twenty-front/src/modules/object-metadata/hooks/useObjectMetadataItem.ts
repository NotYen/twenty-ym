import { useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { ObjectMetadataItemNotFoundError } from '@/object-metadata/errors/ObjectMetadataNotFoundError';
import { objectMetadataItemFamilySelector } from '@/object-metadata/states/objectMetadataItemFamilySelector';
import { objectMetadataItemsState } from '@/object-metadata/states/objectMetadataItemsState';

import { isDefined } from 'twenty-shared/utils';
import { type ObjectMetadataItemIdentifier } from '../types/ObjectMetadataItemIdentifier';

export const useObjectMetadataItem = ({
  objectNameSingular,
}: ObjectMetadataItemIdentifier) => {
  const location = useLocation();
  const objectMetadataItem = useRecoilValue(
    objectMetadataItemFamilySelector({
      objectName: objectNameSingular,
      objectNameType: 'singular',
    }),
  );

  const objectMetadataItems = useRecoilValue(objectMetadataItemsState);

  // For external share routes, return a mock metadata item instead of throwing error
  // External share routes don't have access to workspace metadata
  const isExternalShareRoute = location.pathname.startsWith('/shared/');

  if (!isDefined(objectMetadataItem)) {
    if (isExternalShareRoute) {
      // External share route - returning mock for objectNameSingular

      // Return a minimal mock object to prevent errors in external share routes
      return {
        objectMetadataItem: {
          id: 'mock-id',
          nameSingular: objectNameSingular,
          namePlural: objectNameSingular + 's',
          labelSingular: objectNameSingular,
          labelPlural: objectNameSingular + 's',
          fields: [],
          readableFields: [],
          updatableFields: [],
          labelIdentifierFieldMetadataId: '',
          indexMetadatas: [],
        } as any,
      };
    }

    throw new ObjectMetadataItemNotFoundError(
      objectNameSingular,
      objectMetadataItems,
    );
  }

  return {
    objectMetadataItem,
  };
};
