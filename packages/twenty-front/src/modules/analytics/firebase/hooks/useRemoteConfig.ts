/**
 * Firebase Remote Config React Hook
 *
 * 提供 React 組件使用 Remote Config 的介面
 * 使用「關閉列表」(Blocklist) 模式
 */

import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';

import {
    getAllRemoteFeatureFlags,
    getBlocklist,
    getRemoteFeatureFlag,
    initializeRemoteConfig,
    isRemoteConfigInitialized,
    refreshRemoteConfig,
    SUPPORTED_FEATURE_FLAGS,
} from '../services/firebase-remote-config.service';

/**
 * Blocklist 結構
 */
interface FeatureBlocklist {
  global: string[];
  workspaces: Record<string, string[]>;
}

/**
 * 取得單一 Remote Config Feature Flag
 *
 * @param key - Feature Flag 的 key
 * @param workspaceId - Workspace ID（可選，用於 per workspace 檢查）
 * @param defaultValue - 預設值（當 Remote Config 未初始化時使用）
 * @returns boolean - 該功能是否啟用
 */
export const useRemoteFeatureFlag = (
  key: string,
  workspaceId?: string,
  defaultValue: boolean = true,
): boolean => {
  const [value, setValue] = useState<boolean>(defaultValue);
  const [isReady, setIsReady] = useState<boolean>(isRemoteConfigInitialized());

  useEffect(() => {
    const init = async () => {
      if (!isRemoteConfigInitialized()) {
        await initializeRemoteConfig();
      }
      setIsReady(true);
      setValue(getRemoteFeatureFlag(key, workspaceId));
    };

    init();
  }, [key, workspaceId]);

  // 當 Remote Config 準備好後，更新值
  useEffect(() => {
    if (isReady) {
      setValue(getRemoteFeatureFlag(key, workspaceId));
    }
  }, [isReady, key, workspaceId]);

  return value;
};

/**
 * 取得所有 Remote Config Feature Flags（考慮當前 workspace）
 *
 * @returns {
 *   flags: Record<string, boolean> - 所有 Feature Flag 的值
 *   blocklist: FeatureBlocklist - 目前的關閉列表
 *   isReady: boolean - Remote Config 是否已初始化
 *   isRefreshing: boolean - 是否正在刷新
 *   refresh: () => Promise<void> - 手動刷新配置
 * }
 */
export const useAllRemoteFeatureFlags = () => {
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [blocklist, setBlocklist] = useState<FeatureBlocklist>({
    global: [],
    workspaces: {},
  });
  const [isReady, setIsReady] = useState<boolean>(isRemoteConfigInitialized());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      if (!isRemoteConfigInitialized()) {
        await initializeRemoteConfig();
      }
      setIsReady(true);
      setFlags(getAllRemoteFeatureFlags(currentWorkspace?.id));
      setBlocklist(getBlocklist());
    };

    init();
  }, [currentWorkspace?.id]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshRemoteConfig();
      setFlags(getAllRemoteFeatureFlags(currentWorkspace?.id));
      setBlocklist(getBlocklist());
    } finally {
      setIsRefreshing(false);
    }
  }, [currentWorkspace?.id]);

  return {
    flags,
    blocklist,
    supportedFlags: SUPPORTED_FEATURE_FLAGS,
    isReady,
    isRefreshing,
    refresh,
  };
};

/**
 * Remote Config 初始化 Hook
 * 用於在 App 啟動時初始化 Remote Config
 *
 * @returns {
 *   isInitialized: boolean - 是否已初始化
 *   error: Error | null - 初始化錯誤
 * }
 */
export const useRemoteConfigInit = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(
    isRemoteConfigInitialized(),
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeRemoteConfig();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    if (!isRemoteConfigInitialized()) {
      init();
    }
  }, []);

  return { isInitialized, error };
};
