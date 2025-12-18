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

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
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

root.render(<App />);
