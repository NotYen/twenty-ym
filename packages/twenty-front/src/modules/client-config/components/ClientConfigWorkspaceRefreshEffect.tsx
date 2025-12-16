import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useClientConfig } from '@/client-config/hooks/useClientConfig';
import { useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { logDebug } from '~/utils/logDebug';

/**
 * This effect monitors workspace changes and refreshes the client config
 * when the user switches to a different workspace.
 *
 * This ensures that workspace-specific configurations (like AI models)
 * are properly loaded when switching between workspaces.
 */
export const ClientConfigWorkspaceRefreshEffect = () => {
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const { refetch } = useClientConfig();
  const previousWorkspaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentWorkspaceId = currentWorkspace?.id ?? null;

    // Skip if workspace hasn't changed or if this is the initial load
    if (
      previousWorkspaceIdRef.current === null ||
      previousWorkspaceIdRef.current === currentWorkspaceId
    ) {
      previousWorkspaceIdRef.current = currentWorkspaceId;
      return;
    }

    logDebug(
      `[ClientConfigWorkspaceRefreshEffect] Workspace changed from ${previousWorkspaceIdRef.current?.substring(0, 8)}... to ${currentWorkspaceId?.substring(0, 8)}..., refreshing client config`,
    );

    previousWorkspaceIdRef.current = currentWorkspaceId;

    // Refresh client config when workspace changes
    if (currentWorkspaceId) {
      refetch();
    }
  }, [currentWorkspace?.id, refetch]);

  return null;
};
