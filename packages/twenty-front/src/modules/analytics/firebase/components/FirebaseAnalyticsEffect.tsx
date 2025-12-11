import { usePageTracking } from '@/analytics/firebase';

export const FirebaseAnalyticsEffect = () => {
  // usePageTracking internally calls useFirebaseAnalytics to initialize
  usePageTracking();
  return null;
};
