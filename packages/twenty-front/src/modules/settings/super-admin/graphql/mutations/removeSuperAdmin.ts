import { gql } from '@apollo/client';

export const REMOVE_SUPER_ADMIN = gql`
  mutation RemoveSuperAdmin($input: RemoveSuperAdminInput!) {
    removeSuperAdmin(input: $input)
  }
`;
