import { Action } from '@/action-menu/actions/components/Action';
import { ActionLink } from '@/action-menu/actions/components/ActionLink';
import { ActionScope } from '@/action-menu/actions/types/ActionScope';
import { ActionType } from '@/action-menu/actions/types/ActionType';
import { getRemoteFeatureFlag } from '@/analytics/firebase';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { MAX_SEARCH_RESULTS } from '@/command-menu/constants/MaxSearchResults';
import { useOpenRecordInCommandMenu } from '@/command-menu/hooks/useOpenRecordInCommandMenu';
import { commandMenuSearchState } from '@/command-menu/states/commandMenuSearchState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { getObjectPermissionsFromMapByObjectMetadataId } from '@/settings/roles/role-permissions/objects-permissions/utils/getObjectPermissionsFromMapByObjectMetadataId';
import { t } from '@lingui/core/macro';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { AppPath } from 'twenty-shared/types';
import { Avatar } from 'twenty-ui/display';
import { useDebounce } from 'use-debounce';
import { useSearchQuery } from '~/generated/graphql';

// 報價單相關的 objects（受 IS_SALES_QUOTE_ENABLED 控制）
const SALES_QUOTE_OBJECTS: string[] = [
  CoreObjectNameSingular.SalesQuote,
  CoreObjectNameSingular.SalesQuoteLineItem,
];

export const useCommandMenuSearchRecords = () => {
  const commandMenuSearch = useRecoilValue(commandMenuSearchState);
  const coreClient = useApolloCoreClient();
  const currentWorkspace = useRecoilValue(currentWorkspaceState);

  const [deferredCommandMenuSearch] = useDebounce(commandMenuSearch, 300);
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const { objectMetadataItems } = useObjectMetadataItems();

  // 檢查報價單功能是否啟用（使用 Remote Config）
  const isSalesQuoteEnabled = getRemoteFeatureFlag(
    'IS_SALES_QUOTE_ENABLED',
    currentWorkspace?.id,
  );

  const nonReadableObjectMetadataItemsNameSingular = useMemo(() => {
    return Object.values(objectMetadataItems)
      .filter((objectMetadataItem) => {
        const objectPermission = getObjectPermissionsFromMapByObjectMetadataId({
          objectPermissionsByObjectMetadataId,
          objectMetadataId: objectMetadataItem.id,
        });

        return !objectPermission?.canReadObjectRecords;
      })
      .map((objectMetadataItem) => objectMetadataItem.nameSingular);
  }, [objectMetadataItems, objectPermissionsByObjectMetadataId]);

  // 根據 Feature Flag 決定要排除的 objects
  const excludedObjectNameSingulars = useMemo(() => {
    const baseExclusions = [
      'workspaceMember',
      ...nonReadableObjectMetadataItemsNameSingular,
    ];

    // 如果報價單功能被關閉，排除報價單相關 objects
    if (!isSalesQuoteEnabled) {
      return [...baseExclusions, ...SALES_QUOTE_OBJECTS];
    }

    return baseExclusions;
  }, [nonReadableObjectMetadataItemsNameSingular, isSalesQuoteEnabled]);

  const { data: searchData, loading } = useSearchQuery({
    client: coreClient,
    variables: {
      searchInput: deferredCommandMenuSearch ?? '',
      limit: MAX_SEARCH_RESULTS,
      excludedObjectNameSingulars,
    },
  });

  const { openRecordInCommandMenu } = useOpenRecordInCommandMenu();

  const actionItems = useMemo(() => {
    return (searchData?.search.edges.map((edge) => edge.node) ?? []).map(
      (searchRecord, index) => {
        const baseAction = {
          type: ActionType.Navigation,
          scope: ActionScope.Global,
          key: searchRecord.recordId,
          label: searchRecord.label,
          position: index,
          Icon: () => (
            <Avatar
              type={
                searchRecord.objectNameSingular ===
                CoreObjectNameSingular.Company
                  ? 'squared'
                  : 'rounded'
              }
              avatarUrl={searchRecord.imageUrl}
              placeholderColorSeed={searchRecord.recordId}
              placeholder={searchRecord.label}
            />
          ),
          shouldBeRegistered: () => true,
          description:
            objectMetadataItems.find(
              (item) => item.nameSingular === searchRecord.objectNameSingular,
            )?.labelSingular ?? searchRecord.objectNameSingular,
        };

        if (
          [CoreObjectNameSingular.Task, CoreObjectNameSingular.Note].includes(
            searchRecord.objectNameSingular as CoreObjectNameSingular,
          )
        ) {
          return {
            ...baseAction,
            component: (
              <Action
                onClick={() => {
                  searchRecord.objectNameSingular === 'task'
                    ? openRecordInCommandMenu({
                        recordId: searchRecord.recordId,
                        objectNameSingular: CoreObjectNameSingular.Task,
                      })
                    : openRecordInCommandMenu({
                        recordId: searchRecord.recordId,
                        objectNameSingular: CoreObjectNameSingular.Note,
                      });
                }}
                closeSidePanelOnCommandMenuListActionExecution={false}
              />
            ),
          };
        }

        return {
          ...baseAction,
          component: (
            <ActionLink
              to={AppPath.RecordShowPage}
              params={{
                objectNameSingular: searchRecord.objectNameSingular,
                objectRecordId: searchRecord.recordId,
              }}
            />
          ),
        };
      },
    );
  }, [searchData, openRecordInCommandMenu, objectMetadataItems]);

  return {
    loading,
    noResults: !actionItems?.length,
    commandGroups: [
      {
        heading: t`Results`,
        items: actionItems,
      },
    ],
    hasMore: false,
    pageSize: 0,
    onLoadMore: () => {},
  };
};
