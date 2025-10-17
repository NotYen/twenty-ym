import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { firebaseConfig, isFirebaseEnabled } from '../config/firebase.config';

let firebaseApp: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let isInitialized = false;

export const initializeFirebaseAnalytics = async (): Promise<Analytics | null> => {
  // 如果已初始化，直接返回
  if (isInitialized && analytics) {
    return analytics;
  }

  // 檢查是否啟用 Firebase
  if (!isFirebaseEnabled()) {
    console.warn('[Firebase] Firebase Analytics 未啟用：缺少必要的環境變數');
    return null;
  }

  try {
    // 檢查瀏覽器是否支持 Analytics
    const supported = await isSupported();
    if (!supported) {
      console.warn('[Firebase] 當前瀏覽器不支持 Firebase Analytics');
      return null;
    }

    // 初始化 Firebase App
    if (!firebaseApp) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('[Firebase] Firebase App 已初始化');
    }

    // 初始化 Analytics
    analytics = getAnalytics(firebaseApp);
    isInitialized = true;
    console.log('[Firebase] Firebase Analytics 已初始化');

    return analytics;
  } catch (error) {
    console.error('[Firebase] 初始化 Firebase Analytics 失敗:', error);
    return null;
  }
};

export const getFirebaseAnalytics = (): Analytics | null => {
  return analytics;
};

