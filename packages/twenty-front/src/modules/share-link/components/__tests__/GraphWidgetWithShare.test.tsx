import { render, screen } from '@testing-library/react';
import { type PageLayoutWidget, GraphType } from '~/generated/graphql';
import { GraphWidgetWithShare } from '../GraphWidgetWithShare';

// Mock 相關組件
jest.mock('@/page-layout/widgets/graph/components/GraphWidgetRenderer', () => ({
  GraphWidgetRenderer: ({ widget }: { widget: PageLayoutWidget }) => (
    <div data-testid="graph-widget-renderer">
      Chart: {widget.title} (ID: {widget.id})
    </div>
  ),
}));

jest.mock('@/share-link/components/ShareButton', () => ({
  ShareButton: ({ resourceType, resourceId, resourceName }: any) => (
    <button data-testid="share-button">
      Share {resourceName} ({resourceType}: {resourceId})
    </button>
  ),
}));

describe('GraphWidgetWithShare', () => {
  const mockWidget: PageLayoutWidget = {
    id: 'test-chart-widget-123',
    title: 'Sales Performance Chart',
    objectMetadataId: 'company-metadata-id',
    configuration: {
      graphType: GraphType.VERTICAL_BAR,
    },
  } as PageLayoutWidget;

  it('should render the original chart component unchanged', () => {
    render(<GraphWidgetWithShare widget={mockWidget} />);

    // 確保原始圖表組件正常渲染
    const chartRenderer = screen.getByTestId('graph-widget-renderer');
    expect(chartRenderer).toBeInTheDocument();
    expect(chartRenderer).toHaveTextContent('Chart: Sales Performance Chart (ID: test-chart-widget-123)');
  });

  it('should add share functionality for individual chart', () => {
    render(<GraphWidgetWithShare widget={mockWidget} />);

    // 確保分享按鈕針對這個特定圖表
    const shareButton = screen.getByTestId('share-button');
    expect(shareButton).toBeInTheDocument();
    expect(shareButton).toHaveTextContent('Share Sales Performance Chart (DASHBOARD_CHART: test-chart-widget-123)');
  });

  it('should handle different chart types correctly', () => {
    const pieChartWidget: PageLayoutWidget = {
      id: 'pie-chart-widget-456',
      title: 'Revenue Distribution',
      objectMetadataId: 'opportunity-metadata-id',
      configuration: {
        graphType: GraphType.PIE,
      },
    } as PageLayoutWidget;

    render(<GraphWidgetWithShare widget={pieChartWidget} />);

    // 確保每個圖表類型都能正確分享
    const shareButton = screen.getByTestId('share-button');
    expect(shareButton).toHaveTextContent('Share Revenue Distribution (DASHBOARD_CHART: pie-chart-widget-456)');

    const chartRenderer = screen.getByTestId('graph-widget-renderer');
    expect(chartRenderer).toHaveTextContent('Chart: Revenue Distribution (ID: pie-chart-widget-456)');
  });

  it('should maintain chart functionality while adding share capability', () => {
    const { container } = render(<GraphWidgetWithShare widget={mockWidget} />);

    // 確保包裝結構正確
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle('position: relative');

    // 確保原始圖表和分享按鈕都存在
    expect(screen.getByTestId('graph-widget-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('share-button')).toBeInTheDocument();
  });

  it('should work with charts that have no title', () => {
    const chartWithoutTitle: PageLayoutWidget = {
      id: 'untitled-chart-789',
      title: undefined,
      objectMetadataId: 'metrics-metadata-id',
      configuration: {
        graphType: GraphType.LINE,
      },
    } as PageLayoutWidget;

    render(<GraphWidgetWithShare widget={chartWithoutTitle} />);

    // 確保沒有標題的圖表也能正確分享
    const shareButton = screen.getByTestId('share-button');
    expect(shareButton).toHaveTextContent('LINE Chart');
    expect(shareButton).toHaveTextContent('untitled-chart-789');
  });

  it('should create unique share links for different charts', () => {
    const chart1: PageLayoutWidget = {
      id: 'chart-1',
      title: 'Chart One',
      objectMetadataId: 'meta-1',
      configuration: { graphType: GraphType.BAR },
    } as PageLayoutWidget;

    const chart2: PageLayoutWidget = {
      id: 'chart-2',
      title: 'Chart Two',
      objectMetadataId: 'meta-2',
      configuration: { graphType: GraphType.PIE },
    } as PageLayoutWidget;

    const { rerender } = render(<GraphWidgetWithShare widget={chart1} />);

    let shareButton = screen.getByTestId('share-button');
    expect(shareButton).toHaveTextContent('chart-1');

    rerender(<GraphWidgetWithShare widget={chart2} />);

    shareButton = screen.getByTestId('share-button');
    expect(shareButton).toHaveTextContent('chart-2');
  });
});
