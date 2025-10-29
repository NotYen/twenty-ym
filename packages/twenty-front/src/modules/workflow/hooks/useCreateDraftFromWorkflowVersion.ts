import { trackEvent } from '@/analytics/firebase';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useFindManyRecordsQuery } from '@/object-record/hooks/useFindManyRecordsQuery';
import {
  type CreateDraftFromWorkflowVersionInput,
  useCreateDraftFromWorkflowVersionMutation,
} from '~/generated-metadata/graphql';

export const useCreateDraftFromWorkflowVersion = () => {
  const apolloCoreClient = useApolloCoreClient();

  const [mutate] = useCreateDraftFromWorkflowVersionMutation({
    client: apolloCoreClient,
  });

  const { findManyRecordsQuery: findManyWorkflowsQuery } =
    useFindManyRecordsQuery({
      objectNameSingular: CoreObjectNameSingular.Workflow,
      recordGqlFields: {
        id: true,
        name: true,
        statuses: true,
        lastPublishedVersionId: true,
        versions: true,
      },
    });

  const createDraftFromWorkflowVersion = async (
    input: CreateDraftFromWorkflowVersionInput,
  ) => {
    const result = await mutate({
      variables: { input },
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: findManyWorkflowsQuery,
          variables: {
            id: input.workflowId,
          },
        },
      ],
    });

    const createdDraftId = result?.data?.createDraftFromWorkflowVersion.id;

    // Firebase Analytics: 追蹤 Workflow 草稿創建
    if (createdDraftId) {
      trackEvent('workflow_draft_created', {
        workflow_id: input.workflowId,
        workflow_version_id: input.workflowVersionIdToCopy,
        draft_id: createdDraftId,
      });
    }

    return createdDraftId;
  };

  return {
    createDraftFromWorkflowVersion,
  };
};
