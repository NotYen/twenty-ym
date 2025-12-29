import { gql } from '@apollo/client';

export const GET_SUPER_ADMINS = gql`
  query GetSuperAdmins {
    getSuperAdmins {
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
