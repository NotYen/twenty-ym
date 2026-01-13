import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { PageLayoutRecordPageRenderer } from '@/object-record/record-show/components/PageLayoutRecordPageRenderer';
import { RecordShowContainer } from '@/object-record/record-show/components/RecordShowContainer';
import { RecordShowEffect } from '@/object-record/record-show/components/RecordShowEffect';
import { LayoutRenderingProvider } from '@/ui/layout/contexts/LayoutRenderingContext';
import { type TargetRecordIdentifier } from '@/ui/layout/contexts/TargetRecordIdentifier';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { FeatureFlagKey, PageLayoutType } from '~/generated/graphql';

export const PageLayoutDispatcher = ({
  targetRecordIdentifier,
  isInRightDrawer = false,
}: {
  targetRecordIdentifier: TargetRecordIdentifier;
  isInRightDrawer?: boolean;
}) => {
  const isRecordPageEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_RECORD_PAGE_LAYOUT_ENABLED,
  );

  // 在 right drawer (slide panel) 中時，使用原本穩定的 RecordShowContainer
  // 避免 PageLayout 初始化時序問題導致空白
  const shouldUsePageLayout =
    !isInRightDrawer &&
    (targetRecordIdentifier.targetObjectNameSingular ===
      CoreObjectNameSingular.Dashboard ||
      isRecordPageEnabled);

  if (shouldUsePageLayout) {
    return (
      <PageLayoutRecordPageRenderer
        targetRecordIdentifier={targetRecordIdentifier}
        isInRightDrawer={isInRightDrawer}
      />
    );
  }

  return (
    <>
      <RecordShowEffect
        objectNameSingular={targetRecordIdentifier.targetObjectNameSingular}
        recordId={targetRecordIdentifier.id}
      />

      <LayoutRenderingProvider
        value={{
          targetRecordIdentifier: {
            id: targetRecordIdentifier.id,
            targetObjectNameSingular:
              targetRecordIdentifier.targetObjectNameSingular,
          },
          layoutType: PageLayoutType.RECORD_PAGE,
          isInRightDrawer,
        }}
      >
        <RecordShowContainer
          objectNameSingular={targetRecordIdentifier.targetObjectNameSingular}
          objectRecordId={targetRecordIdentifier.id}
          isInRightDrawer={isInRightDrawer}
        />
      </LayoutRenderingProvider>
    </>
  );
};
