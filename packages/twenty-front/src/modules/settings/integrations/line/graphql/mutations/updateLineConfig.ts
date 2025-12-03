import { gql } from '@apollo/client';

export const UPDATE_LINE_CONFIG = gql`
  mutation UpdateLineConfig($input: UpdateLineConfigInput!) {
    updateLineConfig(input: $input) {
      success
      message
    }
  }
`;
