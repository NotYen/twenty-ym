import { useParams } from 'react-router-dom';

import { RecordShowActionMenu } from '@/action-menu/components/RecordShowActionMenu';
import { ActionMenuComponentInstanceContext } from '@/action-menu/states/contexts/ActionMenuComponentInstanceContext';
import { TimelineActivityContext } from '@/activities/timeline-activities/contexts/TimelineActivityContext';
import { MAIN_CONTEXT_STORE_INSTANCE_ID } from '@/context-store/constants/MainContextStoreInstanceId';
import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { MainContainerLayoutWithCommandMenu } from '@/object-record/components/MainContainerLayoutWithCommandMenu';
import { RecordComponentInstanceContextsWrapper } from '@/object-record/components/RecordComponentInstanceContextsWrapper';
import { PageLayoutDispatcher } from '@/object-record/record-show/components/PageLayoutDispatcher';
import { useRecordShowPage } from '@/object-record/record-show/hooks/useRecordShowPage';
import { computeRecordShowComponentInstanceId } from '@/object-record/record-show/utils/computeRecordShowComponentInstanceId';
import { ShareButton } from '@/share-link/components/ShareButton';
import { PageHeaderToggleCommandMenuButton } from '@/ui/layout/page-header/components/PageHeaderToggleCommandMenuButton';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { RecordShowPageHeader } from '~/pages/object-record/RecordShowPageHeader';
import { RecordShowPageTitle } from '~/pages/object-record/RecordShowPageTitle';

export const RecordShowPage = () => {
  const parameters = useParams<{
    objectNameSingular: string;
    objectRecordId: string;
  }>();

  const { objectNameSingular, objectRecordId, objectMetadataItem } =
    useRecordShowPage(
      parameters.objectNameSingular ?? '',
      parameters.objectRecordId ?? '',
    );

  const recordShowComponentInstanceId =
    computeRecordShowComponentInstanceId(objectRecordId);

  // Determine if this object type supports sharing
  const shareableObjectTypes = ['company', 'person', 'salesQuote'];
  const isShareable = shareableObjectTypes.includes(objectNameSingular);

  // Map object name singular to resource type
  const getResourceType = (
    nameSingular: string,
  ): 'COMPANY' | 'PERSON' | 'SALES_QUOTE' | undefined => {
    switch (nameSingular) {
      case 'company':
        return 'COMPANY';
      case 'person':
        return 'PERSON';
      case 'salesQuote':
        return 'SALES_QUOTE';
      default:
        return undefined;
    }
  };

  const resourceType = getResourceType(objectNameSingular);

  return (
    <RecordComponentInstanceContextsWrapper
      componentInstanceId={recordShowComponentInstanceId}
    >
      <ContextStoreComponentInstanceContext.Provider
        value={{ instanceId: MAIN_CONTEXT_STORE_INSTANCE_ID }}
      >
        <ActionMenuComponentInstanceContext.Provider
          value={{ instanceId: recordShowComponentInstanceId }}
        >
          <PageContainer>
            <RecordShowPageTitle
              objectNameSingular={objectNameSingular}
              objectRecordId={objectRecordId}
            />
            <RecordShowPageHeader
              objectNameSingular={objectNameSingular}
              objectRecordId={objectRecordId}
            >
              <RecordShowActionMenu />
              {isShareable && resourceType && (
                <ShareButton
                  resourceType={resourceType}
                  resourceId={objectRecordId}
                  resourceName={objectMetadataItem?.labelSingular ?? ''}
                />
              )}
              <PageHeaderToggleCommandMenuButton />
            </RecordShowPageHeader>
            <MainContainerLayoutWithCommandMenu>
              <TimelineActivityContext.Provider
                value={{
                  recordId: objectRecordId,
                }}
              >
                <PageLayoutDispatcher
                  targetRecordIdentifier={{
                    id: objectRecordId,
                    targetObjectNameSingular: objectNameSingular,
                  }}
                />
              </TimelineActivityContext.Provider>
            </MainContainerLayoutWithCommandMenu>
          </PageContainer>
        </ActionMenuComponentInstanceContext.Provider>
      </ContextStoreComponentInstanceContext.Provider>
    </RecordComponentInstanceContextsWrapper>
  );
};
