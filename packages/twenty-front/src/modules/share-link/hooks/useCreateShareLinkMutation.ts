import { gql, useMutation } from '@apollo/client';
import { useState } from 'react';

const CREATE_SHARE_LINK = gql`
  mutation CreateShareLink($input: CreateShareLinkInput!) {
    createShareLink(input: $input) {
      id
      token
      resourceType
      resourceId
      accessMode
      isActive
      expiresAt
      inactivityExpirationDays
      createdAt
    }
  }
`;

interface CreateShareLinkInput {
  resourceType: 'COMPANY' | 'PERSON' | 'SALES_QUOTE' | 'DASHBOARD_CHART';
  resourceId: string;
  accessMode: 'PUBLIC' | 'LOGIN_REQUIRED';
  expiresAt?: string | null;
  inactivityExpirationDays?: number | null;
}

interface ShareLinkResult {
  id: string;
  token: string;
  resourceType: string;
  resourceId: string;
  accessMode: string;
  isActive: boolean;
  expiresAt: Date | null;
  inactivityExpirationDays: number | null;
  createdAt: Date;
}

export const useCreateShareLinkMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createShareLinkMutation] = useMutation(CREATE_SHARE_LINK);

  const createShareLink = async (input: CreateShareLinkInput): Promise<ShareLinkResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await createShareLinkMutation({
        variables: { input },
      });

      return data?.createShareLink || null;
    } catch (err: any) {
      setError(err.message || 'Failed to create share link');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createShareLink,
    loading,
    error,
  };
};
