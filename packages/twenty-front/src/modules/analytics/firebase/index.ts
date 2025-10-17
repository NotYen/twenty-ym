export { useFirebaseAnalytics } from './hooks/useFirebaseAnalytics';
export { usePageTracking } from './hooks/usePageTracking';
export {
  trackEvent,
  trackPageView,
  trackButtonClick,
  trackSearch,
  trackFormSubmit,
  trackError,
  setAnalyticsUserId,
  setAnalyticsUserProperties,
} from './utils/analytics.utils';
export { firebaseConfig, isFirebaseEnabled } from './config/firebase.config';
export {
  initializeFirebaseAnalytics,
  getFirebaseAnalytics,
} from './services/firebase-analytics.service';

