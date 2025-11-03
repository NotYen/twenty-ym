import { availableWorkspacesState } from '@/auth/states/availableWorkspacesState';
import { currentUserState } from '@/auth/states/currentUserState';
import { currentUserWorkspaceState } from '@/auth/states/currentUserWorkspaceState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
<<<<<<< HEAD
import { isCurrentUserLoadedState } from '@/auth/states/isCurrentUserLoadedState';
=======
import { authProvidersState } from '@/client-config/states/authProvidersState';
>>>>>>> main
import { useIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import { useLastAuthenticatedWorkspaceDomain } from '@/domain-manager/hooks/useLastAuthenticatedWorkspaceDomain';
import { useInitializeFormatPreferences } from '@/localization/hooks/useInitializeFormatPreferences';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { getDateFnsLocale } from '@/ui/field/display/utils/getDateFnsLocale.util';
import { coreViewsState } from '@/views/states/coreViewState';
<<<<<<< HEAD
import { enUS } from 'date-fns/locale';
import { useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { APP_LOCALES, SOURCE_LOCALE } from 'twenty-shared/translations';
=======
import { workspaceAuthBypassProvidersState } from '@/workspace/states/workspaceAuthBypassProvidersState';
import { useCallback } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { SOURCE_LOCALE, type APP_LOCALES } from 'twenty-shared/translations';
>>>>>>> main
import { type ObjectPermissions } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { type ColorScheme } from 'twenty-ui/input';
import {
  useFindAllCoreViewsLazyQuery,
  useGetCurrentUserLazyQuery,
} from '~/generated-metadata/graphql';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { useRefreshObjectMetadataItems } from '~/modules/object-metadata/hooks/useRefreshObjectMetadataItems';
import { useUpdateOneRecord } from '~/modules/object-record/hooks/useUpdateOneRecord';
import { useRefreshAllCoreViews } from '~/modules/views/hooks/useRefreshAllCoreViews';
import { getWorkspaceUrl } from '~/utils/getWorkspaceUrl';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

export const useLoadCurrentUser = () => {
  const setCurrentUser = useSetRecoilState(currentUserState);
  const setAvailableWorkspaces = useSetRecoilState(availableWorkspacesState);
  const setCurrentWorkspaceMember = useSetRecoilState(
    currentWorkspaceMemberState,
  );
  const { setLastAuthenticateWorkspaceDomain } =
    useLastAuthenticatedWorkspaceDomain();
  const setCurrentUserWorkspace = useSetRecoilState(currentUserWorkspaceState);
  const setCurrentWorkspaceMembers = useSetRecoilState(
    currentWorkspaceMembersState,
  );
  const setCurrentWorkspace = useSetRecoilState(currentWorkspaceState);
  const { initializeFormatPreferences } = useInitializeFormatPreferences();
  const setCoreViews = useSetRecoilState(coreViewsState);
<<<<<<< HEAD
  const setDateLocale = useSetRecoilState(dateLocaleState);

  // 添加必要的 hooks
  const { updateOneRecord } = useUpdateOneRecord({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
  });
  const { refreshObjectMetadataItems } =
    useRefreshObjectMetadataItems('network-only');
  const { refreshAllCoreViews } = useRefreshAllCoreViews('network-only');
  const setIsCurrentUserLoaded = useSetRecoilState(isCurrentUserLoadedState);
=======
  const setWorkspaceAuthBypassProviders = useSetRecoilState(
    workspaceAuthBypassProvidersState,
  );
  const authProviders = useRecoilValue(authProvidersState);
>>>>>>> main

  const { isOnAWorkspace } = useIsCurrentLocationOnAWorkspace();

  const [getCurrentUser] = useGetCurrentUserLazyQuery();
  const [findAllCoreViews] = useFindAllCoreViewsLazyQuery();

  const loadCurrentUser = useCallback(async () => {
    const currentUserResult = await getCurrentUser({
      fetchPolicy: 'network-only',
    });

    const coreViewsResult = await findAllCoreViews({
      fetchPolicy: 'network-only',
    });

    if (isDefined(currentUserResult.error)) {
      throw new Error(currentUserResult.error.message);
    }

    const user = currentUserResult.data?.currentUser;

    if (!user) {
      throw new Error('No current user result');
    }

    let workspaceMember = null;

    setCurrentUser(user);

    if (isDefined(user.workspaceMembers)) {
      setCurrentWorkspaceMembers(user.workspaceMembers);
    }

    if (isDefined(user.availableWorkspaces)) {
      setAvailableWorkspaces(user.availableWorkspaces);
    }

    if (isDefined(user.currentUserWorkspace)) {
      setCurrentUserWorkspace({
        ...user.currentUserWorkspace,
        objectsPermissions:
          (user.currentUserWorkspace.objectsPermissions as Array<
            ObjectPermissions & { objectMetadataId: string }
          >) ?? [],
      });
    }

    if (isDefined(user.workspaceMember)) {
      workspaceMember = {
        ...user.workspaceMember,
        colorScheme: user.workspaceMember?.colorScheme as ColorScheme,
        locale: user.workspaceMember?.locale ?? SOURCE_LOCALE,
      };

      setCurrentWorkspaceMember(workspaceMember);

      // Initialize unified format preferences state
      initializeFormatPreferences(workspaceMember);

      // 檢查用戶是否已經設定過語言
      const currentLocale = workspaceMember.locale as keyof typeof APP_LOCALES;
      const storedLocale = localStorage.getItem('locale');

      // 如果用戶沒有設定過語言（使用預設的 SOURCE_LOCALE），則設定為 zh-TW
      if (currentLocale === SOURCE_LOCALE && !storedLocale) {
        // 使用與 LocalePicker 相同的流程來設定語言
        const newLocale = APP_LOCALES['zh-TW'];

        // 1. 更新前端狀態
        setCurrentWorkspaceMember({
          ...workspaceMember,
          locale: newLocale,
        });

        // 2. 更新後端數據庫
        await updateOneRecord({
          idToUpdate: workspaceMember.id,
          updateOneRecordInput: { locale: newLocale },
        });

        // 3. 更新日期格式
        const dateFnsLocale = await getDateFnsLocale(newLocale);
        setDateLocale({
          locale: newLocale,
          localeCatalog: dateFnsLocale || enUS,
        });

        // 4. 激活語言
        await dynamicActivate(newLocale);

        // 5. 保存到 localStorage
        try {
          localStorage.setItem('locale', newLocale);
        } catch {
          // Silently fail if localStorage is not available
        }

        // 6. 刷新數據
        await refreshObjectMetadataItems();
        await refreshAllCoreViews();
      } else {
        // 如果用戶已經設定過語言，使用現有設定
        const finalLocale =
          currentLocale || storedLocale || APP_LOCALES['zh-TW'];
        await dynamicActivate(finalLocale);
      }
    }

    const workspace = user.currentWorkspace ?? null;

    setCurrentWorkspace(workspace);

    if (isDefined(workspace)) {
      setWorkspaceAuthBypassProviders({
        google: authProviders.google && workspace.isGoogleAuthBypassEnabled,
        microsoft:
          authProviders.microsoft && workspace.isMicrosoftAuthBypassEnabled,
        password:
          authProviders.password && workspace.isPasswordAuthBypassEnabled,
      });
    }

    if (isDefined(workspace) && isOnAWorkspace) {
      setLastAuthenticateWorkspaceDomain({
        workspaceId: workspace.id,
        workspaceUrl: getWorkspaceUrl(workspace.workspaceUrls),
      });
    }

    if (isDefined(coreViewsResult.data?.getCoreViews)) {
      setCoreViews(coreViewsResult.data.getCoreViews);
    }

    setIsCurrentUserLoaded(true);

    return {
      user,
      workspaceMember,
      workspace,
    };
  }, [
    getCurrentUser,
    findAllCoreViews,
    setCurrentUser,
    setCurrentWorkspace,
    isOnAWorkspace,
    setCurrentWorkspaceMembers,
    setAvailableWorkspaces,
    setCurrentUserWorkspace,
    setCurrentWorkspaceMember,
    initializeFormatPreferences,
    setLastAuthenticateWorkspaceDomain,
    setCoreViews,
<<<<<<< HEAD
    setIsCurrentUserLoaded,
    updateOneRecord,
    setDateLocale,
    refreshObjectMetadataItems,
    refreshAllCoreViews,
=======
    authProviders,
    setWorkspaceAuthBypassProviders,
>>>>>>> main
  ]);

  return {
    loadCurrentUser,
  };
};
