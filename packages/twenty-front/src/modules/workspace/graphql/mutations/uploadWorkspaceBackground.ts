import { gql } from '@apollo/client';

export const UPLOAD_WORKSPACE_BACKGROUND = gql`
  mutation UploadWorkspaceBackground($file: Upload!) {
    uploadWorkspaceBackground(file: $file) {
      path
      token
    }
  }
`;
