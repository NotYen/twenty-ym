import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { DEFAULT_COMPANY_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultCompanyRecordPageLayoutId';
import { DEFAULT_NOTE_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultNoteRecordPageLayoutId';
import { DEFAULT_OPPORTUNITY_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultOpportunityRecordPageLayoutId';
import { DEFAULT_PERSON_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultPersonRecordPageLayoutId';
import { DEFAULT_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultRecordPageLayoutId';
import { DEFAULT_TASK_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultTaskRecordPageLayoutId';
import { DEFAULT_WORKFLOW_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultWorkflowPageLayoutId';
import { DEFAULT_WORKFLOW_RUN_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultWorkflowRunPageLayoutId';
import { DEFAULT_WORKFLOW_VERSION_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultWorkflowVersionPageLayoutId';
import { type TargetRecordIdentifier } from '@/ui/layout/contexts/TargetRecordIdentifier';
import { isDefined } from 'twenty-shared/utils';
import { logDebug } from '~/utils/logDebug';

const OBJECT_NAME_TO_DEFAULT_LAYOUT_ID: Record<string, string> = {
  [CoreObjectNameSingular.Company]: DEFAULT_COMPANY_RECORD_PAGE_LAYOUT_ID,
  [CoreObjectNameSingular.Person]: DEFAULT_PERSON_RECORD_PAGE_LAYOUT_ID,
  [CoreObjectNameSingular.Opportunity]:
    DEFAULT_OPPORTUNITY_RECORD_PAGE_LAYOUT_ID,
  [CoreObjectNameSingular.Note]: DEFAULT_NOTE_RECORD_PAGE_LAYOUT_ID,
  [CoreObjectNameSingular.Task]: DEFAULT_TASK_RECORD_PAGE_LAYOUT_ID,
  [CoreObjectNameSingular.Workflow]: DEFAULT_WORKFLOW_PAGE_LAYOUT_ID,
  [CoreObjectNameSingular.WorkflowVersion]:
    DEFAULT_WORKFLOW_VERSION_PAGE_LAYOUT_ID,
  [CoreObjectNameSingular.WorkflowRun]: DEFAULT_WORKFLOW_RUN_PAGE_LAYOUT_ID,
};

// Dashboard 需要從 record 取得 pageLayoutId，沒有預設 layout
const OBJECTS_REQUIRING_RECORD_PAGE_LAYOUT_ID = [
  CoreObjectNameSingular.Dashboard,
];

export const useRecordPageLayoutId = ({
  id,
  targetObjectNameSingular,
}: TargetRecordIdentifier) => {
  const { record, loading } = useFindOneRecord<
    ObjectRecord & { pageLayoutId?: string }
  >({
    objectNameSingular: targetObjectNameSingular,
    objectRecordId: id,
  });

  // 取得預設 layout ID
  const defaultLayoutId =
    OBJECT_NAME_TO_DEFAULT_LAYOUT_ID[targetObjectNameSingular] ??
    DEFAULT_RECORD_PAGE_LAYOUT_ID;

  // Dashboard 等需要從 record 取得 pageLayoutId 的 object
  const requiresRecordPageLayoutId =
    OBJECTS_REQUIRING_RECORD_PAGE_LAYOUT_ID.includes(
      targetObjectNameSingular as CoreObjectNameSingular,
    );

  logDebug('[useRecordPageLayoutId]', {
    id,
    targetObjectNameSingular,
    loading,
    hasRecord: isDefined(record),
    recordPageLayoutId: record?.pageLayoutId,
    defaultLayoutId,
    requiresRecordPageLayoutId,
  });

  // 如果 record 有自訂的 pageLayoutId，使用它
  if (isDefined(record?.pageLayoutId)) {
    return {
      pageLayoutId: record.pageLayoutId,
      loading,
    };
  }

  // Dashboard 等 object 必須等 record 載入後才能取得 pageLayoutId
  // 在 loading 時返回 null，避免先顯示錯誤的 layout
  if (requiresRecordPageLayoutId) {
    return {
      pageLayoutId: loading ? null : null, // record 沒有 pageLayoutId 時也返回 null
      loading,
    };
  }

  // 其他 object 可以使用預設 layout ID
  // 這樣在 loading 時也能顯示頁面框架
  return {
    pageLayoutId: defaultLayoutId,
    loading,
  };
};
