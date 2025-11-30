import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { STANDARD_OBJECT_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids';

const WORKFLOW_OBJECT_NAMES = [
  'workflow',
  'workflowVersion',
  'workflowRun',
  'workflowEventListener',
  'workflowAutomatedTrigger',
];

export const isWorkflowRelatedObject = (
  objectMetadata: ObjectMetadataEntity,
): boolean => {
  if (objectMetadata.standardId) {
    return (
      objectMetadata.standardId === STANDARD_OBJECT_IDS.workflow ||
      objectMetadata.standardId === STANDARD_OBJECT_IDS.workflowVersion ||
      objectMetadata.standardId === STANDARD_OBJECT_IDS.workflowRun ||
      objectMetadata.standardId ===
        STANDARD_OBJECT_IDS.workflowEventListener ||
      objectMetadata.standardId ===
        STANDARD_OBJECT_IDS.workflowAutomatedTrigger
    );
  }

  return WORKFLOW_OBJECT_NAMES.includes(objectMetadata.nameSingular);
};

