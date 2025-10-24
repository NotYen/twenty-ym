import { ExportQuoteToPdfSingleRecordAction } from '@/action-menu/actions/record-actions/single-record/quote-actions/components/ExportQuoteToPdfSingleRecordAction';
import { SingleRecordActionKeys } from '@/action-menu/actions/record-actions/single-record/types/SingleRecordActionsKey';
import { inheritActionsFromDefaultConfig } from '@/action-menu/actions/record-actions/utils/inheritActionsFromDefaultConfig';
import { ActionScope } from '@/action-menu/actions/types/ActionScope';
import { ActionType } from '@/action-menu/actions/types/ActionType';
import { ActionViewType } from '@/action-menu/actions/types/ActionViewType';
import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconFileText } from 'twenty-ui/display';

export enum QuoteSingleRecordActionKeys {
  EXPORT_QUOTE_TO_PDF = 'export-quote-to-pdf',
}

export const QUOTE_ACTIONS_CONFIG = inheritActionsFromDefaultConfig({
  config: {
    [QuoteSingleRecordActionKeys.EXPORT_QUOTE_TO_PDF]: {
      key: QuoteSingleRecordActionKeys.EXPORT_QUOTE_TO_PDF,
      label: msg`Export as PDF`,
      shortLabel: msg`PDF`,
      isPinned: true,
      position: 0,
      Icon: IconFileText,
      type: ActionType.Standard,
      scope: ActionScope.RecordSelection,
      shouldBeRegistered: ({ selectedRecord }) =>
        isDefined(selectedRecord) && !isDefined(selectedRecord?.deletedAt),
      availableOn: [
        ActionViewType.SHOW_PAGE,
        ActionViewType.INDEX_PAGE_SINGLE_RECORD_SELECTION,
      ],
      component: <ExportQuoteToPdfSingleRecordAction />,
    },
  },
  actionKeys: [
    SingleRecordActionKeys.ADD_TO_FAVORITES,
    SingleRecordActionKeys.REMOVE_FROM_FAVORITES,
    SingleRecordActionKeys.DELETE,
    SingleRecordActionKeys.DESTROY,
    SingleRecordActionKeys.RESTORE,
    SingleRecordActionKeys.EXPORT_FROM_RECORD_SHOW,
    SingleRecordActionKeys.NAVIGATE_TO_PREVIOUS_RECORD,
    SingleRecordActionKeys.NAVIGATE_TO_NEXT_RECORD,
  ],
  propertiesToOverwrite: {
    [SingleRecordActionKeys.ADD_TO_FAVORITES]: {
      position: 1,
    },
    [SingleRecordActionKeys.REMOVE_FROM_FAVORITES]: {
      position: 2,
    },
    [SingleRecordActionKeys.EXPORT_FROM_RECORD_SHOW]: {
      position: 3,
      label: msg`Export quote`,
    },
    [SingleRecordActionKeys.DELETE]: {
      position: 4,
      label: msg`Delete quote`,
    },
    [SingleRecordActionKeys.DESTROY]: {
      position: 5,
      label: msg`Permanently destroy quote`,
    },
    [SingleRecordActionKeys.RESTORE]: {
      position: 6,
      label: msg`Restore quote`,
    },
    [SingleRecordActionKeys.NAVIGATE_TO_PREVIOUS_RECORD]: {
      position: 7,
      label: msg`Navigate to previous quote`,
    },
    [SingleRecordActionKeys.NAVIGATE_TO_NEXT_RECORD]: {
      position: 8,
      label: msg`Navigate to next quote`,
    },
  },
});
