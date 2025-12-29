import { gql } from '@apollo/client';

export const ADD_SUPER_ADMIN = gql`
  mutation AddSuperAdmin($input: AddSuperAdminInput!) {
    addSuperAdmin(input: $input) {
      id
      userEmail
      grantedBy
      grantedAt
      isPrimary
      createdAt
      updatedAt
    }
  }
`;
