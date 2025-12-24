/**
 * Firebase Remote Config 服務
 *
 * 用於即時遠端控制功能開關，與資料庫 Feature Flag 整合使用
 *
 * 架構：使用「關閉列表」(Blocklist) 模式
 * - 預設所有功能都開啟
 * - 只需要列出要關閉的功能
 * - 支援全域關閉 + per workspace 關閉
 *
 * Firebase Remote Config 結構（FEATURE_BLOCKLIST 參數）：
 * {
 *   "global": ["IS_AI_ENABLED"],  // 全域關閉的功能
 *   "workspaces": {
 *     "workspace-id-1": ["IS_DASHBOARD_V2_ENABLED"],  // 特定 workspace 關閉的功能
 *     "workspace-id-2": ["IS_AI_ENABLED", "IS_WORKFLOW_ENABLED"]
 *   }
 * }
 *
 * 注意：Firebase SDK 使用動態 import，避免在沒配置時影響整個 app
 */

import {
  firebaseConfig,
  isFirebaseEnabled,
} from '@/analytics/firebase/config/firebase.config';
import { logDebug } from '~/utils/logDebug';
import { logError } from '~/utils/logError';

// Firebase 類型
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type RemoteConfigModule = typeof import('firebase/remote-config');
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type FirebaseAppModule = typeof import('firebase/app');

type RemoteConfig = ReturnType<RemoteConfigModule['getRemoteConfig']>;
type FirebaseApp = ReturnType<FirebaseAppModule['initializeApp']>;

let remoteConfig: RemoteConfig | null = null;
let isInitialized = false;
let initializationPromise: Promise<boolean> | null = null;

/**
 * Feature Blocklist 結構
 */
interface FeatureBlocklist {
  global: string[];
  workspaces: Record<string, string[]>;
}

/**
 * 預設的 Blocklist（空的，表示所有功能都開啟）
 */
const DEFAULT_BLOCKLIST: FeatureBlocklist = {
  global: [],
  workspaces: {},
};

/**
 * 所有支援的 Feature Flag Keys
 */
export const SUPPORTED_FEATURE_FLAGS = [
  'IS_AI_ENABLED',
  'IS_DASHBOARD_V2_ENABLED',
  'IS_SALES_QUOTE_ENABLED',
  'IS_APPLICATION_ENABLED',
  'IS_RECORD_PAGE_LAYOUT_ENABLED',
  'IS_WORKFLOW_ENABLED',
  'IS_PAGE_LAYOUT_ENABLED',
] as const;

/**
 * 快取的 Blocklist
 */
let cachedBlocklist: FeatureBlocklist = DEFAULT_BLOCKLIST;

/**
 * 初始化 Firebase Remote Config
 *
 * 使用動態 import 載入 Firebase SDK，避免在沒配置時影響整個 app
 */
export const initializeRemoteConfig = async (
  minimumFetchIntervalMs?: number,
): Promise<boolean> => {
  const defaultInterval =
    process.env.NODE_ENV === 'development' ? 300000 : 3600000;
  const fetchInterval = minimumFetchIntervalMs ?? defaultInterval;

  if (initializationPromise !== null) {
    return initializationPromise;
  }

  if (isInitialized && remoteConfig !== null) {
    return true;
  }

  initializationPromise = (async () => {
    try {
      if (!isFirebaseEnabled()) {
        logDebug('[Firebase][RemoteConfig] Firebase 未啟用，使用預設值');
        isInitialized = true;
        return false;
      }

      const [firebaseAppModule, remoteConfigModule] = await Promise.all([
        import('firebase/app'),
        import('firebase/remote-config'),
      ]);

      const { getApps, initializeApp } = firebaseAppModule;
      const { fetchAndActivate, getRemoteConfig, getValue } =
        remoteConfigModule;

      let firebaseApp: FirebaseApp;
      const existingApps = getApps();

      if (existingApps.length > 0) {
        firebaseApp = existingApps[0];
        logDebug('[Firebase][RemoteConfig] 使用現有的 Firebase App');
      } else {
        firebaseApp = initializeApp(firebaseConfig);
        logDebug('[Firebase][RemoteConfig] 初始化新的 Firebase App');
      }

      remoteConfig = getRemoteConfig(firebaseApp);
      remoteConfig.settings.minimumFetchIntervalMillis = fetchInterval;

      logDebug(
        `[Firebase][RemoteConfig] Fetch 間隔設定為 ${fetchInterval / 1000} 秒`,
      );

      remoteConfig.defaultConfig = {
        FEATURE_BLOCKLIST: JSON.stringify(DEFAULT_BLOCKLIST),
      };

      const activated = await fetchAndActivate(remoteConfig);
      isInitialized = true;

      if (activated) {
        logDebug('[Firebase][RemoteConfig] 已獲取並啟用新的遠端配置');
      } else {
        logDebug('[Firebase][RemoteConfig] 使用快取的遠端配置');
      }

      parseAndCacheBlocklist(getValue);
      logRemoteConfigStatus();

      return true;
    } catch (error) {
      logError('[Firebase][RemoteConfig] 初始化失敗:');
      logError(error);
      isInitialized = true;
      return false;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
};

/**
 * 解析並快取 Blocklist
 */
const parseAndCacheBlocklist = (
  getValue?: RemoteConfigModule['getValue'],
): void => {
  if (remoteConfig === null || getValue === undefined) {
    cachedBlocklist = DEFAULT_BLOCKLIST;
    return;
  }

  try {
    const blocklistJson = getValue(
      remoteConfig,
      'FEATURE_BLOCKLIST',
    ).asString();
    if (blocklistJson !== '') {
      const parsed = JSON.parse(blocklistJson) as FeatureBlocklist;
      cachedBlocklist = {
        global: Array.isArray(parsed.global) ? parsed.global : [],
        workspaces:
          typeof parsed.workspaces === 'object' && parsed.workspaces !== null
            ? parsed.workspaces
            : {},
      };
      logDebug(
        `[Firebase][RemoteConfig] Blocklist 已解析: global=${cachedBlocklist.global.length} 項, workspaces=${Object.keys(cachedBlocklist.workspaces).length} 個`,
      );
    }
  } catch (error) {
    logError('[Firebase][RemoteConfig] 解析 Blocklist 失敗:', error);
    cachedBlocklist = DEFAULT_BLOCKLIST;
  }
};

/**
 * 輸出目前的 Remote Config 狀態（用於除錯）
 */
const logRemoteConfigStatus = (): void => {
  logDebug('[Firebase][RemoteConfig] 目前 Blocklist:');
  logDebug(`  全域關閉: ${cachedBlocklist.global.join(', ') || '(無)'}`);

  const workspaceCount = Object.keys(cachedBlocklist.workspaces).length;
  if (workspaceCount > 0) {
    logDebug(`  Workspace 關閉列表: ${workspaceCount} 個`);
    for (const [wsId, flags] of Object.entries(cachedBlocklist.workspaces)) {
      logDebug(`    ${wsId}: ${flags.join(', ')}`);
    }
  }
};

/**
 * 檢查功能是否被 Remote Config 關閉
 */
export const getRemoteFeatureFlag = (
  key: string,
  workspaceId?: string,
): boolean => {
  if (!isInitialized) {
    return true;
  }

  if (cachedBlocklist.global.includes(key)) {
    return false;
  }

  if (
    workspaceId !== undefined &&
    cachedBlocklist.workspaces[workspaceId] !== undefined
  ) {
    if (cachedBlocklist.workspaces[workspaceId].includes(key)) {
      return false;
    }
  }

  return true;
};

/**
 * 取得所有 Feature Flags 的狀態
 */
export const getAllRemoteFeatureFlags = (
  workspaceId?: string,
): Record<string, boolean> => {
  const result: Record<string, boolean> = {};

  for (const key of SUPPORTED_FEATURE_FLAGS) {
    result[key] = getRemoteFeatureFlag(key, workspaceId);
  }

  return result;
};

/**
 * 取得目前的 Blocklist（用於顯示）
 */
export const getBlocklist = (): FeatureBlocklist => {
  return { ...cachedBlocklist };
};

/**
 * 強制重新獲取 Remote Config
 */
export const refreshRemoteConfig = async (): Promise<boolean> => {
  if (remoteConfig === null) {
    return initializeRemoteConfig();
  }

  try {
    const { fetchAndActivate, getValue } = await import(
      'firebase/remote-config'
    );

    const originalInterval = remoteConfig.settings.minimumFetchIntervalMillis;
    remoteConfig.settings.minimumFetchIntervalMillis = 0;

    const activated = await fetchAndActivate(remoteConfig);

    remoteConfig.settings.minimumFetchIntervalMillis = originalInterval;

    parseAndCacheBlocklist(getValue);

    if (activated) {
      logDebug('[Firebase][RemoteConfig] 已強制刷新遠端配置');
      logRemoteConfigStatus();
    }

    return activated;
  } catch (error) {
    logError('[Firebase][RemoteConfig] 強制刷新失敗:');
    logError(error);
    return false;
  }
};

/**
 * 檢查 Remote Config 是否已初始化
 */
export const isRemoteConfigInitialized = (): boolean => {
  return isInitialized;
};

/**
 * 取得 Remote Config 實例（用於進階操作）
 */
export const getRemoteConfigInstance = (): RemoteConfig | null => {
  return remoteConfig;
};
