import { gql } from '@apollo/client';

export const GET_ACTIVE_SHARE_LINK = gql`
  query GetActiveShareLink($resourceType: String!, $resourceId: String!) {
    getActiveShareLink(resourceType: $resourceType, resourceId: $resourceId) {
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
    }
  }
`;
