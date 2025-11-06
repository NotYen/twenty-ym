import { NavigationDrawerItemForObjectMetadataItem } from '@/object-metadata/components/NavigationDrawerItemForObjectMetadataItem';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { logDebug } from '~/utils/logDebug';

const ORDERED_STANDARD_OBJECTS: string[] = [
  CoreObjectNameSingular.Company,
  CoreObjectNameSingular.Person,
  CoreObjectNameSingular.Opportunity,
  CoreObjectNameSingular.Task,
  CoreObjectNameSingular.Note,
  CoreObjectNameSingular.SalesQuote, // 報價單列表（實際對象名稱）
  CoreObjectNameSingular.SalesQuoteLineItem, // 報價單細項列表（實際對象名稱）
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

  // 優化：使用 useMemo 緩存排序結果，避免每次渲染都重新計算
  // 只在 objectMetadataItems 改變時才重新排序
  const sortedStandardObjectMetadataItems = useMemo(() => {
    // 調試：查看所有傳入的對象
    logDebug(
      '[NavigationDrawer] 所有對象:',
      objectMetadataItems.map((item) => ({
        name: item.nameSingular,
        label: item.labelSingular,
        isSystem: item.isSystem,
        isRemote: item.isRemote,
        createdAt: item.createdAt,
      })),
    );

    logDebug(
      '[NavigationDrawer] ORDERED_STANDARD_OBJECTS:',
      ORDERED_STANDARD_OBJECTS,
    );

    const standardItems = [...objectMetadataItems].filter((item) =>
      ORDERED_STANDARD_OBJECTS.includes(item.nameSingular),
    );

    logDebug(
      '[NavigationDrawer] 被識別為 standard 的對象:',
      standardItems.map((item) => item.nameSingular),
    );

    // 調試：確認 quote 和 quoteLineItem 是否被識別為 standard
    const quoteItems = standardItems.filter(
      (item) =>
        item.nameSingular === 'salesquote' ||
        item.nameSingular === 'salesquotelineitem',
    );
    if (quoteItems.length > 0) {
      logDebug(
        '[NavigationDrawer] Quote items 被識別為 standard objects:',
        quoteItems.map((item) => ({
          name: item.nameSingular,
          label: item.labelSingular,
          createdAt: item.createdAt,
        })),
      );
    } else {
      logDebug('[NavigationDrawer] ⚠️ Quote items 未被識別為 standard objects');
    }

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
  }, [objectMetadataItems]);

  // 優化：使用 useMemo 緩存自定義對象排序
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

  // 優化：使用 useMemo 合併排序結果
  const objectMetadataItemsForNavigationItems = useMemo(
    () => [
      ...sortedStandardObjectMetadataItems,
      ...sortedCustomObjectMetadataItems,
    ],
    [sortedStandardObjectMetadataItems, sortedCustomObjectMetadataItems],
  );

  // 優化：使用 useMemo 緩存權限篩選結果
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
