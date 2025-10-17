import { useEffect, useState } from 'react';
import { Analytics } from 'firebase/analytics';
import { initializeFirebaseAnalytics } from '../services/firebase-analytics.service';

export const useFirebaseAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const analyticsInstance = await initializeFirebaseAnalytics();
      setAnalytics(analyticsInstance);
      setIsLoading(false);
    };

    initialize();
  }, []);

  return { analytics, isLoading };
};

