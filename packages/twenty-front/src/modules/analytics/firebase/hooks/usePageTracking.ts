import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics.utils';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // 追蹤頁面瀏覽
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);
};
