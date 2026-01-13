/**
 * Firebase Analytics 服務
 *
 * 使用動態 import 載入 Firebase SDK，避免在沒配置時影響整個 app
 */

import { logDebug } from '~/utils/logDebug';
import { logError } from '~/utils/logError';
import { firebaseConfig } from '../config/firebase.config';

import type { FirebaseOptions } from 'firebase/app';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type FirebaseAppModule = typeof import('firebase/app');
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type AnalyticsModule = typeof import('firebase/analytics');

type FirebaseApp = ReturnType<FirebaseAppModule['initializeApp']>;
type Analytics = ReturnType<AnalyticsModule['getAnalytics']>;

let firebaseApp: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let isInitialized = false;
let hasLoggedFirebaseConfig = false;

export const initializeFirebaseAnalytics = async (
  config?: FirebaseOptions,
): Promise<Analytics | null> => {
  const finalConfig = config ?? firebaseConfig;

  // 僅在首次初始化時輸出一次當前 Firebase 配置狀態
  if (!hasLoggedFirebaseConfig) {
    const requiredKeys: Array<keyof typeof firebaseConfig> = [
      'apiKey',
      'projectId',
      'appId',
      'measurementId',
    ];
    const missingKeys = requiredKeys.filter((key) => !finalConfig[key]);

    const enabled = Boolean(
      finalConfig.apiKey &&
        finalConfig.projectId &&
        finalConfig.appId &&
        finalConfig.measurementId,
    );

    logDebug(`[Firebase][Config] Enabled: ${String(enabled)}`);
    if (missingKeys.length > 0) {
      logError(`[Firebase][Config] Missing keys: ${missingKeys.join(', ')}`);
    } else {
      logDebug('[Firebase][Config] All required keys are present');
    }

    hasLoggedFirebaseConfig = true;
  }

  // 如果已初始化，直接返回
  if (isInitialized && analytics !== null) {
    return analytics;
  }

  const isEnabled = Boolean(
    finalConfig.apiKey &&
      finalConfig.projectId &&
      finalConfig.appId &&
      finalConfig.measurementId,
  );

  // 檢查是否啟用 Firebase
  if (!isEnabled) {
    logError('[Firebase] Firebase Analytics 未啟用：缺少必要的配置');
    return null;
  }

  try {
    // 動態 import Firebase SDK
    const [firebaseAppModule, analyticsModule] = await Promise.all([
      import('firebase/app'),
      import('firebase/analytics'),
    ]);

    const { initializeApp, getApps } = firebaseAppModule;
    const { getAnalytics, isSupported } = analyticsModule;

    // 檢查瀏覽器是否支持 Analytics
    const supported = await isSupported();
    if (!supported) {
      logError('[Firebase] 當前瀏覽器不支持 Firebase Analytics');
      return null;
    }

    // 初始化 Firebase App
    if (firebaseApp === null) {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        firebaseApp = existingApps[0];
        logDebug('[Firebase] 使用現有的 Firebase App');
      } else {
        firebaseApp = initializeApp(finalConfig);
        logDebug('[Firebase] Firebase App 已初始化');
      }
    }

    // 初始化 Analytics
    analytics = getAnalytics(firebaseApp);
    isInitialized = true;
    logDebug('[Firebase] Firebase Analytics 已初始化');

    return analytics;
  } catch (error) {
    logError('[Firebase] 初始化 Firebase Analytics 失敗:');
    logError(error);
    return null;
  }
};

export const getFirebaseAnalytics = (): Analytics | null => {
  return analytics;
};
