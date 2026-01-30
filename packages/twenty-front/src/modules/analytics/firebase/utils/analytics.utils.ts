/**
 * Firebase Analytics 工具函數
 *
 * 使用動態 import 載入 Firebase SDK，避免在沒配置時影響整個 app
 */

import { logError } from '~/utils/logError';
import { getFirebaseAnalytics } from '../services/firebase-analytics.service';

// 快取動態載入的 Firebase Analytics 模組
let analyticsModule: typeof import('firebase/analytics') | null = null;

const getAnalyticsModule = async () => {
  if (analyticsModule === null) {
    analyticsModule = await import('firebase/analytics');
  }
  return analyticsModule;
};

// 記錄自定義事件
export const trackEvent = async (
  eventName: string,
  params?: Record<string, unknown>,
): Promise<void> => {
  const analytics = getFirebaseAnalytics();
  if (analytics === null) return;

  try {
    const { logEvent } = await getAnalyticsModule();
    logEvent(analytics, eventName, params);
    // GA Event tracked successfully
  } catch (error) {
    logError('[GA] 追蹤事件失敗:');
    logError(error);
  }
};

// 設置用戶 ID
export const setAnalyticsUserId = async (userId: string): Promise<void> => {
  const analytics = getFirebaseAnalytics();
  if (analytics === null) return;

  try {
    const { setUserId } = await getAnalyticsModule();
    setUserId(analytics, userId);
    // GA User ID set successfully
  } catch (error) {
    logError('[GA] 設置用戶 ID 失敗:');
    logError(error);
  }
};

// 設置用戶屬性
export const setAnalyticsUserProperties = async (
  properties: Record<string, unknown>,
): Promise<void> => {
  const analytics = getFirebaseAnalytics();
  if (analytics === null) return;

  try {
    const { setUserProperties } = await getAnalyticsModule();
    setUserProperties(analytics, properties);
    // GA User properties set successfully
  } catch (error) {
    logError('[GA] 設置用戶屬性失敗:');
    logError(error);
  }
};

// 常用事件快捷方法
export const trackPageView = async (
  pagePath: string,
  pageTitle?: string,
): Promise<void> => {
  await trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
};

export const trackButtonClick = async (
  buttonName: string,
  location?: string,
): Promise<void> => {
  await trackEvent('button_click', {
    button_name: buttonName,
    location: location,
  });
};

export const trackSearch = async (searchTerm: string): Promise<void> => {
  await trackEvent('search', {
    search_term: searchTerm,
  });
};

export const trackFormSubmit = async (
  formName: string,
  success: boolean,
): Promise<void> => {
  await trackEvent('form_submit', {
    form_name: formName,
    success: success,
  });
};

export const trackError = async (
  errorMessage: string,
  errorLocation?: string,
): Promise<void> => {
  await trackEvent('error_occurred', {
    error_message: errorMessage,
    error_location: errorLocation,
  });
};
