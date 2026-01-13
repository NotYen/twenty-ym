// Analytics
export { firebaseConfig, isFirebaseEnabled } from './config/firebase.config';
export { useFirebaseAnalytics } from './hooks/useFirebaseAnalytics';
export { usePageTracking } from './hooks/usePageTracking';
export {
  getFirebaseAnalytics,
  initializeFirebaseAnalytics,
} from './services/firebase-analytics.service';
export {
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  trackButtonClick,
  trackError,
  trackEvent,
  trackFormSubmit,
  trackPageView,
  trackSearch,
} from './utils/analytics.utils';

// Remote Config
export {
  useAllRemoteFeatureFlags,
  useRemoteConfigInit,
  useRemoteFeatureFlag,
} from './hooks/useRemoteConfig';
export {
  SUPPORTED_FEATURE_FLAGS,
  getAllRemoteFeatureFlags,
  getBlocklist,
  getRemoteFeatureFlag,
  initializeRemoteConfig,
  isRemoteConfigInitialized,
  refreshRemoteConfig,
} from './services/firebase-remote-config.service';
export {
  remoteConfigFlagsState,
  remoteConfigInitializedState,
  remoteConfigLastRefreshState,
} from './states/remoteConfigState';
