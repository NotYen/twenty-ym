import ReactDOM from 'react-dom/client';

import '@emotion/react';

import { App } from '@/app/components/App';
import 'react-loading-skeleton/dist/skeleton.css';
import 'twenty-ui/style.css';
import './index.css';

import * as Sentry from '@sentry/react';

const root = ReactDOM.createRoot(
  document.getElementById('root') ?? document.body,
);

// Sentry 初始化
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [],
    // Error Sampling (default 100%)
    sampleRate: import.meta.env.SENTRY_ERROR_SAMPLE_RATE
      ? parseFloat(import.meta.env.SENTRY_ERROR_SAMPLE_RATE)
      : 1.0,
    // Performance Monitoring
    tracesSampleRate: 0, // Zero lag: Disable tracing
    // Session Replay
    replaysSessionSampleRate: 0, // Zero lag: Disable session recording
    replaysOnErrorSampleRate: 0, // Zero lag: Disable error recording
    environment: import.meta.env.MODE,
  });
}

// 暴露 Sentry 測試函數到 window，方便在 console 測試
// @ts-expect-error - 測試用途
window.sentryTest = {
  status: () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    // eslint-disable-next-line no-console
    console.log('VITE_SENTRY_DSN:', dsn ? 'configured' : 'NOT SET');
    // eslint-disable-next-line no-console
    console.log('Sentry initialized:', Sentry.isInitialized());
    return { dsn: !!dsn, initialized: Sentry.isInitialized() };
  },
  error: () => {
    if (!Sentry.isInitialized()) {
      // eslint-disable-next-line no-console
      console.error('❌ Sentry not initialized. Check VITE_SENTRY_DSN.');
      return 'Sentry not initialized';
    }
    const error = new Error(
      `[Sentry Test] Frontend test error at ${new Date().toISOString()}`,
    );
    Sentry.captureException(error);
    // eslint-disable-next-line no-console
    console.log('✅ Test error sent to Sentry');
    return 'Error sent!';
  },
  message: () => {
    if (!Sentry.isInitialized()) {
      // eslint-disable-next-line no-console
      console.error('❌ Sentry not initialized. Check VITE_SENTRY_DSN.');
      return 'Sentry not initialized';
    }
    Sentry.captureMessage(
      `[Sentry Test] Frontend test message at ${new Date().toISOString()}`,
      'info',
    );
    // eslint-disable-next-line no-console
    console.log('✅ Test message sent to Sentry');
    return 'Message sent!';
  },
};

root.render(<App />);
