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
    const initialize = async () => {
      if (isConfigLoading) return;

      const configs = data?.getWorkspaceConfigs || [];
      const getConfig = (key: string) => configs.find((c: any) => c.key === key)?.value;

      const workspaceFirebaseConfig: FirebaseOptions = {
        apiKey: getConfig('FIREBASE_API_KEY'),
        authDomain: getConfig('FIREBASE_AUTH_DOMAIN'),
        projectId: getConfig('FIREBASE_PROJECT_ID'),
        storageBucket: getConfig('FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getConfig('FIREBASE_MESSAGING_SENDER_ID'),
        appId: getConfig('FIREBASE_APP_ID'),
        measurementId: getConfig('FIREBASE_MEASUREMENT_ID'),
      };

      // Filter out undefined values to let fallback work if needed,
      // though our service logic prefers the passed config if valid.
      // Actually service logic: const finalConfig = config || firebaseConfig;
      // If we pass an object with undefined keys, it is still an object.
      // But service checks keys on finalConfig.
      // If workspace config is empty, we might want to pass undefined to trigger fallback?
      // But the requirement is "override global".
      // If workspace has ANY key, we probably want to try it.
      // If workspace has NO keys, maybe fallback?
      // Let's pass the object. The service checks `finalConfig.apiKey`.
      // If `apiKey` is undefined in workspace config, it will fail the enabled check in service
      // (unless we merge? No, complete override is safer for multi-tenant).

      // However, if the query returns empty (no config set), all values are undefined.
      // If we pass { apiKey: undefined, ... }, finalConfig will be that object.
      // finalConfig.apiKey will be undefined. Service will log "Missing keys".
      // exact logic: const finalConfig = config || firebaseConfig;
      // If config is {}, finalConfig is {}.
      // If we want to fallback to env when workspace has NOTHING set, we should check here.

      const hasWorkspaceConfig = Object.values(workspaceFirebaseConfig).some(v => !!v);

      const configToUse = hasWorkspaceConfig ? workspaceFirebaseConfig : undefined;

      const analyticsInstance = await initializeFirebaseAnalytics(configToUse);
      setAnalytics(analyticsInstance);
      setIsLoading(false);
    };

    initialize();
  }, [data, isConfigLoading]);

  return { analytics, isLoading: isLoading || isConfigLoading };
};
