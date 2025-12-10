import { ChartFiltersSettings } from '@/command-menu/pages/page-layout/components/ChartFiltersSettings';
import { usePageLayoutIdFromContextStoreTargetedRecord } from '@/command-menu/pages/page-layout/hooks/usePageLayoutFromContextStoreTargetedRecord';
import { isChartWidget } from '@/command-menu/pages/page-layout/utils/isChartWidget';
import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { pageLayoutDraftComponentState } from '@/page-layout/states/pageLayoutDraftComponentState';
import { pageLayoutEditingWidgetIdComponentState } from '@/page-layout/states/pageLayoutEditingWidgetIdComponentState';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { isDefined } from 'twenty-shared/utils';

export const CommandMenuPageLayoutGraphFilter = () => {
  const { pageLayoutId } = usePageLayoutIdFromContextStoreTargetedRecord();

  const draftPageLayout = useRecoilComponentValue(
    pageLayoutDraftComponentState,
    pageLayoutId,
  );

  const pageLayoutEditingWidgetId = useRecoilComponentValue(
    pageLayoutEditingWidgetIdComponentState,
    pageLayoutId,
  );

  const widgetInEditMode = draftPageLayout.tabs
    .flatMap((tab) => tab.widgets)
    .find((widget) => widget.id === pageLayoutEditingWidgetId);

  // Return null if widget is not found (e.g., during cleanup)
  if (!isDefined(pageLayoutEditingWidgetId) || !isDefined(widgetInEditMode)) {
    return null;
  }

  if (!isDefined(widgetInEditMode?.objectMetadataId)) {
    return null;
  }

  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: widgetInEditMode.objectMetadataId,
  });

  if (!isChartWidget(widgetInEditMode)) {
    return null;
  }

  return (
    <>
      <ChartFiltersSettings
        widget={widgetInEditMode}
        objectMetadataItem={objectMetadataItem}
      />
    </>
  );
};
