import { NavigationDrawerItemForObjectMetadataItem } from '@/object-metadata/components/NavigationDrawerItemForObjectMetadataItem';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { FeatureFlagKey } from '~/generated/graphql';

const ORDERED_STANDARD_OBJECTS: string[] = [
  CoreObjectNameSingular.Company,
  CoreObjectNameSingular.Person,
  CoreObjectNameSingular.Opportunity,
  CoreObjectNameSingular.Task,
  CoreObjectNameSingular.Note,
  CoreObjectNameSingular.SalesQuote, // 報價單列表（實際對象名稱）
  CoreObjectNameSingular.SalesQuoteLineItem, // 報價單細項列表（實際對象名稱）
];

// 報價單相關的 objects（受 IS_SALES_QUOTE_ENABLED 控制）
const SALES_QUOTE_OBJECTS: string[] = [
  CoreObjectNameSingular.SalesQuote,
  CoreObjectNameSingular.SalesQuoteLineItem,
];

type NavigationDrawerSectionForObjectMetadataItemsProps = {
  sectionTitle: string;
  isRemote: boolean;
  objectMetadataItems: ObjectMetadataItem[];
};

export const NavigationDrawerSectionForObjectMetadataItems = ({
  sectionTitle,
  isRemote,
  objectMetadataItems,
}: NavigationDrawerSectionForObjectMetadataItemsProps) => {
  const { toggleNavigationSection, isNavigationSectionOpenState } =
    useNavigationSection('Objects' + (isRemote ? 'Remote' : 'Workspace'));
  const isNavigationSectionOpen = useRecoilValue(isNavigationSectionOpenState);

  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  // 檢查報價單功能是否啟用（整合 Remote Config + 資料庫 Feature Flag）
  const isSalesQuoteEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_SALES_QUOTE_ENABLED,
  );

  const sortedStandardObjectMetadataItems = useMemo(() => {
    const standardItems = [...objectMetadataItems].filter((item) => {
      // 基本過濾：必須在 ORDERED_STANDARD_OBJECTS 中
      if (!ORDERED_STANDARD_OBJECTS.includes(item.nameSingular)) {
        return false;
      }

      // 報價單功能過濾：如果功能被關閉，過濾掉報價單相關 objects
      if (
        !isSalesQuoteEnabled &&
        SALES_QUOTE_OBJECTS.includes(item.nameSingular)
      ) {
        return false;
      }

      return true;
    });

    return standardItems.sort((objectMetadataItemA, objectMetadataItemB) => {
      const indexA = ORDERED_STANDARD_OBJECTS.indexOf(
        objectMetadataItemA.nameSingular,
      );
      const indexB = ORDERED_STANDARD_OBJECTS.indexOf(
        objectMetadataItemB.nameSingular,
      );
      if (indexA === -1 || indexB === -1) {
        return objectMetadataItemA.nameSingular.localeCompare(
          objectMetadataItemB.nameSingular,
        );
      }
      return indexA - indexB;
    });
  }, [objectMetadataItems, isSalesQuoteEnabled]);

  const sortedCustomObjectMetadataItems = useMemo(
    () =>
      [...objectMetadataItems]
        .filter((item) => !ORDERED_STANDARD_OBJECTS.includes(item.nameSingular))
        .sort((objectMetadataItemA, objectMetadataItemB) => {
          return new Date(objectMetadataItemA.createdAt) <
            new Date(objectMetadataItemB.createdAt)
            ? 1
            : -1;
        }),
    [objectMetadataItems],
  );

  const objectMetadataItemsForNavigationItems = useMemo(
    () => [
      ...sortedStandardObjectMetadataItems,
      ...sortedCustomObjectMetadataItems,
    ],
    [sortedStandardObjectMetadataItems, sortedCustomObjectMetadataItems],
  );

  const objectMetadataItemsForNavigationItemsWithReadPermission = useMemo(
    () =>
      objectMetadataItemsForNavigationItems.filter(
        (objectMetadataItem) =>
          getObjectPermissionsForObject(
            objectPermissionsByObjectMetadataId,
            objectMetadataItem.id,
          ).canReadObjectRecords,
      ),
    [
      objectMetadataItemsForNavigationItems,
      objectPermissionsByObjectMetadataId,
    ],
  );

  return (
    objectMetadataItems.length > 0 && (
      <NavigationDrawerSection>
        <NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerSectionTitle
            label={sectionTitle}
            onClick={() => toggleNavigationSection()}
          />
        </NavigationDrawerAnimatedCollapseWrapper>
        {isNavigationSectionOpen &&
          objectMetadataItemsForNavigationItemsWithReadPermission.map(
            (objectMetadataItem) => (
              <NavigationDrawerItemForObjectMetadataItem
                key={`navigation-drawer-item-${objectMetadataItem.id}`}
                objectMetadataItem={objectMetadataItem}
              />
            ),
          )}
      </NavigationDrawerSection>
    )
  );
};
