import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { trackPageView } from '../utils/analytics.utils';
import { useFirebaseAnalytics } from './useFirebaseAnalytics';

export const usePageTracking = () => {
  const location = useLocation();
  const { analytics } = useFirebaseAnalytics();

  useEffect(() => {
    if (!analytics) return;

    // 追蹤頁面瀏覽
    trackPageView(location.pathname + location.search, document.title);
  }, [location, analytics]);
};
