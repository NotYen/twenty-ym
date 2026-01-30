import { ShareButton } from '@/share-link/components/ShareButton';
import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { type PageLayoutWidget } from '~/generated/graphql';

const StyledWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const StyledShareButtonContainer = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing(2)};
  right: ${({ theme }) => theme.spacing(2)};
  z-index: 10;
`;

interface GraphWidgetShareWrapperProps {
  widget: PageLayoutWidget;
  children: ReactNode;
}

/**
 * 圖表分享包裝組件
 * 在圖表上方添加分享按鈕，不影響原有圖表功能
 */
export const GraphWidgetShareWrapper = ({
  widget,
  children,
}: GraphWidgetShareWrapperProps) => {
  // 生成圖表標題，用於分享
  const getChartTitle = () => {
    if (widget.title) {
      return widget.title;
    }

    // 根據圖表類型生成預設標題
    const configuration = widget.configuration as any;
    if (configuration?.graphType) {
      return `${configuration.graphType} Chart`;
    }

    return 'Dashboard Chart';
  };

  return (
    <StyledWrapper>
      {children}
      <StyledShareButtonContainer>
        <ShareButton
          resourceType="DASHBOARD_CHART"
          resourceId={widget.id}
          resourceName={getChartTitle()}
        />
      </StyledShareButtonContainer>
    </StyledWrapper>
  );
};
