import { useMutation } from '@apollo/client';

import { REMOVE_SUPER_ADMIN } from '@/settings/super-admin/graphql/mutations/removeSuperAdmin';
import { GET_SUPER_ADMINS } from '@/settings/super-admin/graphql/queries/getSuperAdmins';

export const useRemoveSuperAdmin = () => {
  const [removeSuperAdminMutation, { loading, error }] = useMutation<
    { removeSuperAdmin: boolean },
    { input: { userEmail: string } }
  >(REMOVE_SUPER_ADMIN, {
    refetchQueries: [{ query: GET_SUPER_ADMINS }],
  });

  const removeSuperAdmin = async (userEmail: string) => {
    const result = await removeSuperAdminMutation({
      variables: {
        input: { userEmail },
      },
    });

    return result.data?.removeSuperAdmin ?? false;
  };

  return {
    removeSuperAdmin,
    loading,
    error,
  };
};
