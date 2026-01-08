import { usePageLayoutContentContext } from '@/page-layout/contexts/PageLayoutContentContext';
import { useCurrentPageLayout } from '@/page-layout/hooks/useCurrentPageLayout';
import { isDefined } from 'twenty-shared/utils';

/**
 * Hook to determine if a widget is the last visible widget in its parent tab.
 * Used to conditionally hide the bottom border for the last widget in pinned tabs.
 */
export const useIsLastWidgetInTab = (widgetId: string) => {
  const { currentPageLayout } = useCurrentPageLayout();
  const { tabId } = usePageLayoutContentContext();

  if (!isDefined(currentPageLayout)) {
    return { isLastWidget: false };
  }

  const activeTab = currentPageLayout.tabs.find((tab) => tab.id === tabId);

  if (!isDefined(activeTab) || activeTab.widgets.length === 0) {
    return { isLastWidget: false };
  }

  const lastWidget = activeTab.widgets[activeTab.widgets.length - 1];

  return {
    isLastWidget: lastWidget.id === widgetId,
  };
};
