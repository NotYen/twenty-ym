import { useQuery } from '@apollo/client';

import {
    CHECK_IS_PRIMARY_SUPER_ADMIN,
    CHECK_IS_SUPER_ADMIN,
} from '@/settings/super-admin/graphql/queries/checkIsSuperAdmin';

export const useCheckIsSuperAdmin = () => {
  const { data, loading, error } = useQuery<{
    checkIsSuperAdmin: boolean;
  }>(CHECK_IS_SUPER_ADMIN, {
    fetchPolicy: 'cache-first',
  });

  return {
    isSuperAdmin: data?.checkIsSuperAdmin ?? false,
    loading,
    error,
  };
};

export const useCheckIsPrimarySuperAdmin = () => {
  const { data, loading, error } = useQuery<{
    checkIsPrimarySuperAdmin: boolean;
  }>(CHECK_IS_PRIMARY_SUPER_ADMIN, {
    fetchPolicy: 'cache-first',
  });

  return {
    isPrimarySuperAdmin: data?.checkIsPrimarySuperAdmin ?? false,
    loading,
    error,
  };
};
