import { useMutation } from '@apollo/client';

import { ADD_SUPER_ADMIN } from '@/settings/super-admin/graphql/mutations/addSuperAdmin';
import { GET_SUPER_ADMINS } from '@/settings/super-admin/graphql/queries/getSuperAdmins';
import { SuperAdmin } from '@/settings/super-admin/hooks/useSuperAdmins';

export const useAddSuperAdmin = () => {
  const [addSuperAdminMutation, { loading, error }] = useMutation<
    { addSuperAdmin: SuperAdmin },
    { input: { userEmail: string } }
  >(ADD_SUPER_ADMIN, {
    refetchQueries: [{ query: GET_SUPER_ADMINS }],
  });

  const addSuperAdmin = async (userEmail: string) => {
    const result = await addSuperAdminMutation({
      variables: {
        input: { userEmail },
      },
    });

    return result.data?.addSuperAdmin;
  };

  return {
    addSuperAdmin,
    loading,
    error,
  };
};
