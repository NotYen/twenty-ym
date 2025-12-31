import { useQuery } from '@apollo/client';

import { GET_SUPER_ADMINS } from '@/settings/super-admin/graphql/queries/getSuperAdmins';

export interface SuperAdmin {
  id: string;
  userEmail: string;
  grantedBy: string;
  grantedAt: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useSuperAdmins = () => {
  const { data, loading, error, refetch } = useQuery<{
    getSuperAdmins: SuperAdmin[];
  }>(GET_SUPER_ADMINS, {
    fetchPolicy: 'network-only',
  });

  return {
    superAdmins: data?.getSuperAdmins ?? [],
    loading,
    error,
    refetch,
  };
};
