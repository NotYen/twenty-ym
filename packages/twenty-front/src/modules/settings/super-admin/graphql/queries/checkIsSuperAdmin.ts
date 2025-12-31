import { gql } from '@apollo/client';

export const CHECK_IS_SUPER_ADMIN = gql`
  query CheckIsSuperAdmin {
    checkIsSuperAdmin
  }
`;

export const CHECK_IS_PRIMARY_SUPER_ADMIN = gql`
  query CheckIsPrimarySuperAdmin {
    checkIsPrimarySuperAdmin
  }
`;
