import { gql } from '@apollo/client';

export const GET_LINE_CONFIG = gql`
  query GetLineConfig {
    lineConfig {
      channelId
      isConfigured
    }
  }
`;
