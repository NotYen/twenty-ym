import { gql } from '@apollo/client';

export const DELETE_LINE_CONFIG = gql`
  mutation DeleteLineConfig {
    deleteLineConfig {
      success
    }
  }
`;
