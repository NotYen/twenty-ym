import { usePageLayoutContentContext } from '@/page-layout/contexts/PageLayoutContentContext';
import { useCurrentPageLayoutOrThrow } from '@/page-layout/hooks/useCurrentPageLayoutOrThrow';
import { useDeletePageLayoutWidget } from '@/page-layout/hooks/useDeletePageLayoutWidget';
import { useEditPageLayoutWidget } from '@/page-layout/hooks/useEditPageLayoutWidget';
import { useTranslateTabTitle } from '@/page-layout/hooks/useTranslateTabTitle';
import { isPageLayoutInEditModeComponentState } from '@/page-layout/states/isPageLayoutInEditModeComponentState';
import { pageLayoutDraggingWidgetIdComponentState } from '@/page-layout/states/pageLayoutDraggingWidgetIdComponentState';
import { pageLayoutEditingWidgetIdComponentState } from '@/page-layout/states/pageLayoutEditingWidgetIdComponentState';
import { pageLayoutResizingWidgetIdComponentState } from '@/page-layout/states/pageLayoutResizingWidgetIdComponentState';
import { PageLayoutWidgetForbiddenDisplay } from '@/page-layout/widgets/components/PageLayoutWidgetForbiddenDisplay';
import { WidgetContentRenderer } from '@/page-layout/widgets/components/WidgetContentRenderer';
import { useIsInPinnedTab } from '@/page-layout/widgets/hooks/useIsInPinnedTab';
import { useIsLastWidgetInTab } from '@/page-layout/widgets/hooks/useIsLastWidgetInTab';
import { useWidgetPermissions } from '@/page-layout/widgets/hooks/useWidgetPermissions';
import { WidgetCard } from '@/page-layout/widgets/widget-card/components/WidgetCard';
import { WidgetCardContent } from '@/page-layout/widgets/widget-card/components/WidgetCardContent';
import { WidgetCardHeader } from '@/page-layout/widgets/widget-card/components/WidgetCardHeader';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { useTheme } from '@emotion/react';
import { useState, type MouseEvent } from 'react';
import { IconLock } from 'twenty-ui/display';
import { PageLayoutType, WidgetType, type PageLayoutWidget } from '~/generated/graphql';
import { ShareLinkModal } from '~/modules/share-link/components/ShareLinkModal';
import { useModal } from '~/modules/ui/layout/modal/hooks/useModal';

type WidgetRendererProps = {
  widget: PageLayoutWidget;
};

export const WidgetRenderer = ({ widget }: WidgetRendererProps) => {
  const theme = useTheme();
  const { deletePageLayoutWidget } = useDeletePageLayoutWidget();
  const { handleEditWidget } = useEditPageLayoutWidget();
  const { translateTabTitle } = useTranslateTabTitle();
  const { openModal } = useModal();

  const isPageLayoutInEditMode = useRecoilComponentValue(
    isPageLayoutInEditModeComponentState,
  );

  const draggingWidgetId = useRecoilComponentValue(
    pageLayoutDraggingWidgetIdComponentState,
  );

  const resizingWidgetId = useRecoilComponentValue(
    pageLayoutResizingWidgetIdComponentState,
  );

  const currentlyEditingWidgetId = useRecoilComponentValue(
    pageLayoutEditingWidgetIdComponentState,
  );

  const isEditing = currentlyEditingWidgetId === widget.id;

  const isDragging = draggingWidgetId === widget.id;

  const isResizing = resizingWidgetId === widget.id;

  const { hasAccess, restriction } = useWidgetPermissions(widget);

  const { layoutMode } = usePageLayoutContentContext();
  const { isInPinnedTab } = useIsInPinnedTab();
  const { isLastWidget } = useIsLastWidgetInTab(widget.id);

  const { currentPageLayout } = useCurrentPageLayoutOrThrow();

  const showHeader = layoutMode !== 'canvas' && !isInPinnedTab;

  // Check if this is a Graph widget (shareable)
  const isGraphWidget = widget.type === WidgetType.GRAPH;
  const shareModalId = `share-link-modal-DASHBOARD_CHART-${widget.id}`;

  const handleClick = () => {
    handleEditWidget({
      widgetId: widget.id,
      widgetType: widget.type,
    });
  };

  const handleRemove = (e?: MouseEvent) => {
    e?.stopPropagation();
    deletePageLayoutWidget(widget.id);
  };

  const handleShare = (e?: MouseEvent) => {
    e?.stopPropagation();
    openModal(shareModalId);
  };

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <WidgetCard
        isDragging={isDragging}
        isResizing={isResizing}
        layoutMode={layoutMode}
        isEditing={isEditing}
        pageLayoutType={currentPageLayout.type}
        isInPinnedTab={isInPinnedTab}
        isLastWidget={isLastWidget}
        onClick={isPageLayoutInEditMode ? handleClick : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showHeader && (
          <WidgetCardHeader
            isWidgetCardHovered={isHovered}
            isInEditMode={isPageLayoutInEditMode}
            isResizing={isResizing}
            title={translateTabTitle(widget.title)}
            onRemove={handleRemove}
            onShare={isGraphWidget ? handleShare : undefined}
            forbiddenDisplay={
              !hasAccess && (
                <PageLayoutWidgetForbiddenDisplay
                  widgetId={widget.id}
                  restriction={restriction}
                />
              )
            }
          />
        )}

        <WidgetCardContent
          layoutMode={layoutMode}
          pageLayoutType={currentPageLayout.type}
          isInPinnedTab={isInPinnedTab}
          isPageLayoutInEditMode={isPageLayoutInEditMode}
        >
          {hasAccess && <WidgetContentRenderer widget={widget} />}
          {!hasAccess && currentPageLayout.type === PageLayoutType.DASHBOARD && (
            <IconLock
              color={theme.font.color.tertiary}
              stroke={theme.icon.stroke.sm}
            />
          )}
        </WidgetCardContent>
      </WidgetCard>

      {/* Share Link Modal for Graph Widgets */}
      {isGraphWidget && (
        <ShareLinkModal
          modalId={shareModalId}
          resourceType="DASHBOARD_CHART"
          resourceId={widget.id}
          resourceName={widget.title || 'Chart'}
        />
      )}
    </>
  );
};
