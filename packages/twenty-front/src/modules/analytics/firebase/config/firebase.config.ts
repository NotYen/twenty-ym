import { FirebaseOptions } from 'firebase/app';

// Firebase 配置
// 從環境變數讀取 Firebase 配置
export const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId:
    import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.REACT_APP_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.REACT_APP_FIREBASE_MEASUREMENT_ID || '',
};

// 檢查 Firebase 是否已啟用
export const isFirebaseEnabled = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      firebaseConfig.measurementId,
  );
};

