import { gql } from '@apollo/client';

export const GET_SHARED_CONTENT = gql`
  query GetSharedContent($token: String!) {
    getSharedContent(token: $token) {
      resourceType
      resourceId
      title
      data
      metadata
    }
  }
`;
