import { useRecoilValue } from 'recoil';

import { getRemoteFeatureFlag } from '@/analytics/firebase/services/firebase-remote-config.service';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { type FeatureFlagKey } from '~/generated/graphql';

/**
 * 檢查功能是否啟用
 *
 * 整合 Firebase Remote Config + 資料庫 Feature Flag
 *
 * 邏輯：
 * 1. 檢查 Remote Config Blocklist（關閉列表）
 *    - 如果在 global 關閉列表中 → 關閉
 *    - 如果在該 workspace 的關閉列表中 → 關閉
 * 2. 檢查資料庫 Feature Flag
 *    - 如果資料庫 Feature Flag 為 false → 關閉
 * 3. 以上都通過 → 開啟
 *
 * Firebase Remote Config 結構（FEATURE_BLOCKLIST）：
 * {
 *   "global": ["IS_AI_ENABLED"],  // 全域關閉
 *   "workspaces": {
 *     "workspace-id": ["IS_DASHBOARD_V2_ENABLED"]  // 特定 workspace 關閉
 *   }
 * }
 *
 * @param featureKey - Feature Flag 的 key
 * @returns boolean - 是否啟用該功能
 */
export const useIsFeatureEnabled = (featureKey: FeatureFlagKey | null) => {
  const currentWorkspace = useRecoilValue(currentWorkspaceState);

  if (featureKey === null) {
    return false;
  }

  // 1. 檢查 Firebase Remote Config Blocklist
  // 傳入 workspaceId 以支援 per workspace 關閉
  const remoteEnabled = getRemoteFeatureFlag(featureKey, currentWorkspace?.id);
  if (!remoteEnabled) {
    return false;
  }

  // 2. 檢查資料庫 Feature Flag（per workspace）
  const featureFlag = currentWorkspace?.featureFlags?.find(
    (flag) => flag.key === featureKey,
  );

  return featureFlag?.value === true;
};
