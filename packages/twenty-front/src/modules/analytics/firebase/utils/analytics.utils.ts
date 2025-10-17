import { logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { getFirebaseAnalytics } from '../services/firebase-analytics.service';

// 記錄自定義事件
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>,
): void => {
  const analytics = getFirebaseAnalytics();
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, params);
    console.log(`[GA] Event tracked: ${eventName}`, params);
  } catch (error) {
    console.error('[GA] 追蹤事件失敗:', error);
  }
};

// 設置用戶 ID
export const setAnalyticsUserId = (userId: string): void => {
  const analytics = getFirebaseAnalytics();
  if (!analytics) return;

  try {
    setUserId(analytics, userId);
    console.log(`[GA] User ID set: ${userId}`);
  } catch (error) {
    console.error('[GA] 設置用戶 ID 失敗:', error);
  }
};

// 設置用戶屬性
export const setAnalyticsUserProperties = (
  properties: Record<string, any>,
): void => {
  const analytics = getFirebaseAnalytics();
  if (!analytics) return;

  try {
    setUserProperties(analytics, properties);
    console.log('[GA] User properties set:', properties);
  } catch (error) {
    console.error('[GA] 設置用戶屬性失敗:', error);
  }
};

// 常用事件快捷方法
export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
};

export const trackButtonClick = (buttonName: string, location?: string): void => {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location,
  });
};

export const trackSearch = (searchTerm: string): void => {
  trackEvent('search', {
    search_term: searchTerm,
  });
};

export const trackFormSubmit = (formName: string, success: boolean): void => {
  trackEvent('form_submit', {
    form_name: formName,
    success: success,
  });
};

export const trackError = (errorMessage: string, errorLocation?: string): void => {
  trackEvent('error_occurred', {
    error_message: errorMessage,
    error_location: errorLocation,
  });
};

