import { gql } from '@apollo/client';

export const TEST_LINE_CONNECTION = gql`
  mutation TestLineConnection {
    testLineConnection {
      success
      botInfo {
        displayName
        userId
        pictureUrl
      }
      error
    }
  }
`;
