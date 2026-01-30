import { gql } from '@apollo/client';

export const GET_MY_SHARE_LINKS = gql`
  query GetMyShareLinks {
    getMyShareLinks {
      id
      token
      resourceType
      resourceId
      accessMode
      isActive
      expiresAt
      inactivityExpirationDays
      accessCount
      lastAccessedAt
      createdAt
      updatedAt
      createdById
    }
  }
`;
