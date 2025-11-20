import { STANDARD_OBJECT_IDS } from 'twenty-shared/metadata';

import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';

const WORKFLOW_OBJECT_NAMES = ['workflowVersion', 'workflowRun'];

export const isWorkflowRunObject = (
  objectMetadata: ObjectMetadataEntity,
): boolean => {
  if (objectMetadata.standardId) {
    return objectMetadata.standardId === STANDARD_OBJECT_IDS.workflowRun;
  }

  return WORKFLOW_OBJECT_NAMES.includes(objectMetadata.nameSingular);
};
