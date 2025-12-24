import { useEffect } from 'react';

import { usePageTracking } from '@/analytics/firebase';
import { initializeRemoteConfig } from '@/analytics/firebase/services/firebase-remote-config.service';
import { logDebug } from '~/utils/logDebug';

export const FirebaseAnalyticsEffect = () => {
  // usePageTracking internally calls useFirebaseAnalytics to initialize
  usePageTracking();

  // 初始化 Firebase Remote Config
  useEffect(() => {
    const initRemoteConfig = async () => {
      try {
        await initializeRemoteConfig();
        logDebug('[Firebase] Remote Config 初始化完成');
      } catch (error) {
        // Remote Config 初始化失敗不應該影響應用程式運行
        logDebug('[Firebase] Remote Config 初始化失敗，使用預設值');
      }
    };

    initRemoteConfig();
  }, []);

  return null;
};
