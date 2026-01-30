import { gql, useQuery } from '@apollo/client';
import type { Analytics } from 'firebase/analytics';
import type { FirebaseOptions } from 'firebase/app';
import { useEffect, useState } from 'react';

import { initializeFirebaseAnalytics } from '../services/firebase-analytics.service';

const GET_WORKSPACE_CONFIGS = gql`
  query GetWorkspaceConfigs {
    getWorkspaceConfigs {
      key
      value
      valueType
    }
  }
`;

export const useFirebaseAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data, loading: isConfigLoading } = useQuery(GET_WORKSPACE_CONFIGS, {
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    const initializeAnalytics = async () => {
      if (isConfigLoading) return;
      if (!data) return;

      const configs = data.getWorkspaceConfigs || [];
      const getConfig = (key: string) =>
        configs.find((c: any) => c.key === key)?.value;

      const workspaceFirebaseConfig: FirebaseOptions = {
        apiKey: getConfig('REACT_APP_FIREBASE_API_KEY'),
        authDomain: getConfig('REACT_APP_FIREBASE_AUTH_DOMAIN'),
        projectId: getConfig('REACT_APP_FIREBASE_PROJECT_ID'),
        storageBucket: getConfig('REACT_APP_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getConfig('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
        appId: getConfig('REACT_APP_FIREBASE_APP_ID'),
        measurementId: getConfig('REACT_APP_FIREBASE_MEASUREMENT_ID'),
      };

      const hasWorkspaceConfig = Object.values(workspaceFirebaseConfig).some(
        (v) => !!v,
      );

      const configToUse = hasWorkspaceConfig
        ? workspaceFirebaseConfig
        : undefined;

      const analyticsInstance = await initializeFirebaseAnalytics(configToUse);
      setAnalytics(analyticsInstance);
      setIsLoading(false);
    };

    initializeAnalytics();
  }, [data, isConfigLoading]);

  return { analytics, isLoading };
};
