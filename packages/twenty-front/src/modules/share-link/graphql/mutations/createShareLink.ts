import { gql } from '@apollo/client';

export const CREATE_SHARE_LINK = gql`
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
      accessCount
      lastAccessedAt
      createdAt
      updatedAt
      createdById
    }
  }
`;

export const UPDATE_SHARE_LINK = gql`
  mutation UpdateShareLink($input: UpdateShareLinkInput!) {
    updateShareLink(input: $input) {
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

export const DELETE_SHARE_LINK = gql`
  mutation DeleteShareLink($token: String!) {
    deleteShareLink(token: $token)
  }
`;
