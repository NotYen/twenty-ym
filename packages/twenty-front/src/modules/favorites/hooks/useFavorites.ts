import { getRemoteFeatureFlag } from '@/analytics/firebase';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { favoriteViewsWithMinimalDataSelector } from '@/favorites/states/selectors/favoriteViewsWithMinimalDataSelector';
import { sortFavorites } from '@/favorites/utils/sortFavorites';
import { useGetObjectRecordIdentifierByNameSingular } from '@/object-metadata/hooks/useGetObjectRecordIdentifierByNameSingular';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { objectMetadataItemsState } from '@/object-metadata/states/objectMetadataItemsState';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { usePrefetchedFavoritesData } from './usePrefetchedFavoritesData';

// 報價單相關的 objects（受 IS_SALES_QUOTE_ENABLED 控制）
const SALES_QUOTE_OBJECTS: string[] = [
  CoreObjectNameSingular.SalesQuote,
  CoreObjectNameSingular.SalesQuoteLineItem,
];

export const useFavorites = () => {
  const { favorites } = usePrefetchedFavoritesData();
  const favoriteViewsWithMinimalData = useRecoilValue(
    favoriteViewsWithMinimalDataSelector,
  );
  const objectMetadataItems = useRecoilValue(objectMetadataItemsState);
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const { objectMetadataItem: favoriteObjectMetadataItem } =
    useObjectMetadataItem({
      objectNameSingular: CoreObjectNameSingular.Favorite,
    });
  const getObjectRecordIdentifierByNameSingular =
    useGetObjectRecordIdentifierByNameSingular();

  // 檢查報價單功能是否啟用（使用 Remote Config）
  const isSalesQuoteEnabled = getRemoteFeatureFlag(
    'IS_SALES_QUOTE_ENABLED',
    currentWorkspace?.id,
  );

  // 過濾掉被 Feature Flag 關閉的 objectMetadataItems
  const filteredObjectMetadataItems = useMemo(() => {
    if (isSalesQuoteEnabled) {
      return objectMetadataItems;
    }
    return objectMetadataItems.filter(
      (item) => !SALES_QUOTE_OBJECTS.includes(item.nameSingular),
    );
  }, [objectMetadataItems, isSalesQuoteEnabled]);

  // 過濾掉被 Feature Flag 關閉的 views
  const filteredFavoriteViews = useMemo(() => {
    if (isSalesQuoteEnabled) {
      return favoriteViewsWithMinimalData;
    }
    // 找出報價單相關的 objectMetadataItem IDs
    const salesQuoteObjectIds = objectMetadataItems
      .filter((item) => SALES_QUOTE_OBJECTS.includes(item.nameSingular))
      .map((item) => item.id);

    return favoriteViewsWithMinimalData.filter(
      (view) => !salesQuoteObjectIds.includes(view.objectMetadataId),
    );
  }, [favoriteViewsWithMinimalData, objectMetadataItems, isSalesQuoteEnabled]);

  const favoriteRelationFieldMetadataItems = useMemo(
    () =>
      favoriteObjectMetadataItem.readableFields.filter(
        (fieldMetadataItem) =>
          fieldMetadataItem.type === FieldMetadataType.RELATION &&
          fieldMetadataItem.name !== 'forWorkspaceMember' &&
          fieldMetadataItem.name !== 'favoriteFolder',
      ),
    [favoriteObjectMetadataItem.readableFields],
  );

  const sortedFavorites = useMemo(
    () =>
      sortFavorites(
        favorites,
        favoriteRelationFieldMetadataItems,
        getObjectRecordIdentifierByNameSingular,
        true,
        filteredFavoriteViews,
        filteredObjectMetadataItems,
      ),
    [
      favorites,
      favoriteRelationFieldMetadataItems,
      getObjectRecordIdentifierByNameSingular,
      filteredFavoriteViews,
      filteredObjectMetadataItems,
    ],
  );

  return { sortedFavorites };
};
