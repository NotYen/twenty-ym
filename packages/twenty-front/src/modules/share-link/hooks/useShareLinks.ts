import { useMutation, useQuery } from '@apollo/client';
import { useCallback } from 'react';

import {
    CREATE_SHARE_LINK,
    DELETE_SHARE_LINK,
    UPDATE_SHARE_LINK,
} from '@/share-link/graphql/mutations/createShareLink';
import { GET_MY_SHARE_LINKS } from '@/share-link/graphql/queries/getMyShareLinks';
import type {
    CreateShareLinkInput,
    ShareLinkData,
    UpdateShareLinkInput,
} from '@/share-link/types/ShareLink';

export const useShareLinks = () => {
  // Query
  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery<{ getMyShareLinks: ShareLinkData[] }>(GET_MY_SHARE_LINKS);

  // Mutations
  const [createShareLinkMutation] = useMutation(CREATE_SHARE_LINK);
  const [updateShareLinkMutation] = useMutation(UPDATE_SHARE_LINK);
  const [deleteShareLinkMutation] = useMutation(DELETE_SHARE_LINK);

  // Create share link
  const createShareLink = useCallback(
    async (input: CreateShareLinkInput) => {
      const result = await createShareLinkMutation({
        variables: { input },
        refetchQueries: [{ query: GET_MY_SHARE_LINKS }],
      });
      return result.data?.createShareLink;
    },
    [createShareLinkMutation],
  );

  // Update share link
  const updateShareLink = useCallback(
    async (input: UpdateShareLinkInput) => {
      const result = await updateShareLinkMutation({
        variables: { input },
        refetchQueries: [{ query: GET_MY_SHARE_LINKS }],
      });
      return result.data?.updateShareLink;
    },
    [updateShareLinkMutation],
  );

  // Delete share link
  const deleteShareLink = useCallback(
    async (token: string) => {
      await deleteShareLinkMutation({
        variables: { token },
        refetchQueries: [{ query: GET_MY_SHARE_LINKS }],
      });
    },
    [deleteShareLinkMutation],
  );

  // Toggle active status
  const toggleShareLinkStatus = useCallback(
    async (token: string, isActive: boolean) => {
      return updateShareLink({ token, isActive });
    },
    [updateShareLink],
  );

  return {
    shareLinks: data?.getMyShareLinks || [],
    loading,
    error,
    refetch,
    createShareLink,
    updateShareLink,
    deleteShareLink,
    toggleShareLinkStatus,
  };
};
