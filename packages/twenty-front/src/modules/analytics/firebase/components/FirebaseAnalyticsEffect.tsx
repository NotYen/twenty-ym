import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { usePageTracking } from '@/analytics/firebase';
import { initializeRemoteConfig } from '@/analytics/firebase/services/firebase-remote-config.service';

export const FirebaseAnalyticsEffect = () => {
  const location = useLocation();

  // Skip for external share links - they don't need Firebase Analytics
  const isExternalShareRoute = location.pathname.startsWith('/shared/');

  // Always call usePageTracking (React Hooks rule)
  // The blockAuthQueriesLink in apollo.factory.ts will intercept GetWorkspaceConfigs
  // for external share routes, preventing authentication errors
  usePageTracking();

  // 初始化 Firebase Remote Config
  useEffect(() => {
    if (isExternalShareRoute) return;

    const initRemoteConfig = async () => {
      try {
        await initializeRemoteConfig();
        // Remote Config 初始化完成
      } catch (error) {
        // Remote Config 初始化失敗不應該影響應用程式運行
        // 使用預設值
      }
    };

    initRemoteConfig();
  }, [isExternalShareRoute]);

  return null;
};
