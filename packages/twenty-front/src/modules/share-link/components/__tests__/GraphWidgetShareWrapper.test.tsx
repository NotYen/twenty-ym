import { render, screen } from '@testing-library/react';
import { type PageLayoutWidget, GraphType } from '~/generated/graphql';
import { GraphWidgetShareWrapper } from '../GraphWidgetShareWrapper';

// Mock ShareButton 組件
jest.mock('@/share-link/components/ShareButton', () => ({
  ShareButton: ({ resourceType, resourceId, resourceName }: any) => (
    <div data-testid="share-button">
      Share {resourceName} ({resourceType}: {resourceId})
    </div>
  ),
}));

describe('GraphWidgetShareWrapper', () => {
  const mockWidget: PageLayoutWidget = {
    id: 'test-widget-id',
    title: 'Test Chart',
    objectMetadataId: 'test-metadata-id',
    configuration: {
      graphType: GraphType.VERTICAL_BAR,
    },
  } as PageLayoutWidget;

  it('should render children without modification', () => {
    const TestChild = () => <div data-testid="test-child">Original Chart</div>;

    render(
      <GraphWidgetShareWrapper widget={mockWidget}>
        <TestChild />
      </GraphWidgetShareWrapper>
    );

    // 確保原有內容正常渲染
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Original Chart')).toBeInTheDocument();
  });

  it('should render share button with correct props', () => {
    const TestChild = () => <div>Chart Content</div>;

    render(
      <GraphWidgetShareWrapper widget={mockWidget}>
        <TestChild />
      </GraphWidgetShareWrapper>
    );

    // 確保分享按鈕存在且參數正確
    const shareButton = screen.getByTestId('share-button');
    expect(shareButton).toBeInTheDocument();
    expect(shareButton).toHaveTextContent('Share Test Chart (DASHBOARD_CHART: test-widget-id)');
  });

  it('should generate default title when widget has no title', () => {
    const widgetWithoutTitle = {
      ...mockWidget,
      title: undefined,
    };

    const TestChild = () => <div>Chart Content</div>;

    render(
      <GraphWidgetShareWrapper widget={widgetWithoutTitle}>
        <TestChild />
      </GraphWidgetShareWrapper>
    );

    const shareButton = screen.getByTestId('share-button');
    expect(shareButton).toHaveTextContent('VERTICAL_BAR Chart');
  });

  it('should not interfere with child component props or events', () => {
    const mockOnClick = jest.fn();
    const TestChild = () => (
      <button data-testid="chart-button" onClick={mockOnClick}>
        Chart Button
      </button>
    );

    render(
      <GraphWidgetShareWrapper widget={mockWidget}>
        <TestChild />
      </GraphWidgetShareWrapper>
    );

    // 確保子組件的事件處理不受影響
    const chartButton = screen.getByTestId('chart-button');
    chartButton.click();
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should maintain proper DOM structure', () => {
    const TestChild = () => <div className="chart-content">Chart</div>;

    const { container } = render(
      <GraphWidgetShareWrapper widget={mockWidget}>
        <TestChild />
      </GraphWidgetShareWrapper>
    );

    // 確保 DOM 結構正確
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle('position: relative');

    const chartContent = container.querySelector('.chart-content');
    expect(chartContent).toBeInTheDocument();

    const shareButton = screen.getByTestId('share-button');
    expect(shareButton.parentElement).toHaveStyle('position: absolute');
  });
});
