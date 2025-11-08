import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { logDebug } from '~/utils/logDebug';
import { logError } from '~/utils/logError';
import { firebaseConfig, isFirebaseEnabled } from '../config/firebase.config';

let firebaseApp: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let isInitialized = false;
let hasLoggedFirebaseConfig = false;

export const initializeFirebaseAnalytics = async (): Promise<Analytics | null> => {
  // 僅在首次初始化時輸出一次當前 Firebase 配置狀態（error 等級，以便 dev/prod 都可見）
  if (!hasLoggedFirebaseConfig) {
    const requiredKeys: Array<keyof typeof firebaseConfig> = [
      'apiKey',
      'projectId',
      'appId',
      'measurementId',
    ];
    const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);
    const enabled = isFirebaseEnabled();

    logError(`[Firebase][Config] Enabled: ${String(enabled)}`);
    if (missingKeys.length > 0) {
      logError(`[Firebase][Config] Missing keys: ${missingKeys.join(', ')}`);
    } else {
      logError('[Firebase][Config] All required keys are present');
    }

    hasLoggedFirebaseConfig = true;
  }

  // 如果已初始化，直接返回
  if (isInitialized && analytics !== null) {
    return analytics;
  }

  // 檢查是否啟用 Firebase
  if (!isFirebaseEnabled()) {
    logError('[Firebase] Firebase Analytics 未啟用：缺少必要的環境變數');
    return null;
  }

  try {
    // 檢查瀏覽器是否支持 Analytics
    const supported = await isSupported();
    if (!supported) {
      logError('[Firebase] 當前瀏覽器不支持 Firebase Analytics');
      return null;
    }

    // 初始化 Firebase App
    if (!firebaseApp) {
      firebaseApp = initializeApp(firebaseConfig);
      logDebug('[Firebase] Firebase App 已初始化');
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
