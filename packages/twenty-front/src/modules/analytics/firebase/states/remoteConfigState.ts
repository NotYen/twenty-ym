/**
 * Firebase Remote Config Recoil State
 *
 * 使用 Recoil 管理 Remote Config 狀態，讓整個應用程式可以響應式地使用
 */

import { atom, selector } from 'recoil';

import {
    getAllRemoteFeatureFlags,
    isRemoteConfigInitialized,
} from '../services/firebase-remote-config.service';

/**
 * Remote Config 是否已初始化
 */
export const remoteConfigInitializedState = atom<boolean>({
  key: 'remoteConfigInitializedState',
  default: isRemoteConfigInitialized(),
});

/**
 * Remote Config Feature Flags 狀態
 */
export const remoteConfigFlagsState = atom<Record<string, boolean>>({
  key: 'remoteConfigFlagsState',
  default: {},
});

/**
 * 最後一次刷新時間
 */
export const remoteConfigLastRefreshState = atom<Date | null>({
  key: 'remoteConfigLastRefreshState',
  default: null,
});

/**
 * 取得特定 Feature Flag 的 selector
 */
export const remoteFeatureFlagSelector = (key: string) =>
  selector<boolean>({
    key: `remoteFeatureFlag_${key}`,
    get: ({ get }) => {
      const flags = get(remoteConfigFlagsState);
      const isInitialized = get(remoteConfigInitializedState);

      // 如果已初始化，從 state 取得
      if (isInitialized && key in flags) {
        return flags[key];
      }

      // 否則直接從 service 取得
      const allFlags = getAllRemoteFeatureFlags();
      return allFlags[key] ?? true;
    },
  });
