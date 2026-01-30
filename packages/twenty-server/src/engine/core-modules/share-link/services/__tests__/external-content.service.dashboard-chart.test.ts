import { Test, type TestingModule } from '@nestjs/testing';

import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';

import { ExternalContentService } from '../external-content.service';

describe('ExternalContentService - Dashboard Chart', () => {
  let service: ExternalContentService;
  let mockTwentyORMGlobalManager: jest.Mocked<TwentyORMGlobalManager>;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
    };

    mockTwentyORMGlobalManager = {
      getRepositoryForWorkspace: jest.fn().mockResolvedValue(mockRepository),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalContentService,
        {
          provide: TwentyORMGlobalManager,
          useValue: mockTwentyORMGlobalManager,
        },
      ],
    }).compile();

    service = module.get<ExternalContentService>(ExternalContentService);
  });

  describe('getDashboardChartContent', () => {
    const workspaceId = 'test-workspace-id';
    const chartWidgetId = 'test-chart-widget-id';

    it('should return chart content for valid widget', async () => {
      // 模擬圖表 widget 數據
      const mockWidget = {
        id: chartWidgetId,
        title: 'Sales Performance Chart',
        objectMetadataId: 'company-metadata-id',
        configuration: {
          graphType: 'VERTICAL_BAR',
          // 其他配置...
        },
      };

      mockRepository.findOne.mockResolvedValue(mockWidget);

      // 使用反射來測試私有方法
      const result = await (service as any).getDashboardChartContent(
        chartWidgetId,
        workspaceId,
      );

      expect(result).toEqual({
        id: chartWidgetId,
        title: 'Sales Performance Chart',
        type: 'VERTICAL_BAR',
        configuration: {
          graphType: 'VERTICAL_BAR',
        },
        objectMetadataId: 'company-metadata-id',
        metadata: {
          isSharedChart: true,
          sharedAt: expect.any(String),
        },
      });

      expect(
        mockTwentyORMGlobalManager.getRepositoryForWorkspace,
      ).toHaveBeenCalledWith(workspaceId, 'pageLayoutWidget', {
        shouldBypassPermissionChecks: true,
      });
    });

    it('should generate default title when widget has no title', async () => {
      const mockWidget = {
        id: chartWidgetId,
        title: null,
        objectMetadataId: 'company-metadata-id',
        configuration: {
          graphType: 'PIE',
        },
      };

      mockRepository.findOne.mockResolvedValue(mockWidget);

      const result = await (service as any).getDashboardChartContent(
        chartWidgetId,
        workspaceId,
      );

      expect(result.title).toBe('PIE Chart');
      expect(result.type).toBe('PIE');
    });

    it('should handle widget not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await (service as any).getDashboardChartContent(
        chartWidgetId,
        workspaceId,
      );

      expect(result).toEqual({
        id: chartWidgetId,
        title: 'Dashboard Chart',
        type: 'BAR',
        data: [],
        config: {},
        error: 'Chart not accessible',
      });
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const result = await (service as any).getDashboardChartContent(
        chartWidgetId,
        workspaceId,
      );

      expect(result).toEqual({
        id: chartWidgetId,
        title: 'Dashboard Chart',
        type: 'BAR',
        data: [],
        config: {},
        error: 'Chart not accessible',
      });
    });

    it('should only return safe configuration fields', async () => {
      const mockWidget = {
        id: chartWidgetId,
        title: 'Test Chart',
        objectMetadataId: 'test-metadata-id',
        configuration: {
          graphType: 'LINE',
          // 模擬一些可能敏感的配置
          internalFilters: { secret: 'value' },
          adminSettings: { hidden: true },
          // 安全的配置
          colorScheme: 'blue',
        },
      };

      mockRepository.findOne.mockResolvedValue(mockWidget);

      const result = await (service as any).getDashboardChartContent(
        chartWidgetId,
        workspaceId,
      );

      // 確保只返回安全的配置欄位
      expect(result.configuration).toEqual({
        graphType: 'LINE',
        // 不應該包含敏感配置
      });
      expect(result.configuration.internalFilters).toBeUndefined();
      expect(result.configuration.adminSettings).toBeUndefined();
    });

    it('should handle different chart types correctly', async () => {
      const chartTypes = [
        'VERTICAL_BAR',
        'HORIZONTAL_BAR',
        'PIE',
        'LINE',
        'GAUGE',
      ];

      for (const graphType of chartTypes) {
        const mockWidget = {
          id: `${graphType.toLowerCase()}-chart`,
          title: `${graphType} Chart`,
          objectMetadataId: 'test-metadata-id',
          configuration: { graphType },
        };

        mockRepository.findOne.mockResolvedValue(mockWidget);

        const result = await (service as any).getDashboardChartContent(
          mockWidget.id,
          workspaceId,
        );

        expect(result.type).toBe(graphType);
        expect(result.title).toBe(`${graphType} Chart`);
        expect(result.configuration.graphType).toBe(graphType);
      }
    });
  });

  describe('getContentByShareLink - DASHBOARD_CHART', () => {
    it('should handle DASHBOARD_CHART resource type', async () => {
      const mockShareLink = {
        id: 'share-link-id',
        token: 'test-token',
        resourceType: 'DASHBOARD_CHART',
        resourceId: 'chart-widget-id',
        accessMode: 'PUBLIC',
        isActive: true,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-id',
      };

      const mockWidget = {
        id: 'chart-widget-id',
        title: 'Shared Chart',
        objectMetadataId: 'company-metadata-id',
        configuration: {
          graphType: 'VERTICAL_BAR',
        },
      };

      mockRepository.findOne.mockResolvedValue(mockWidget);

      const result = await service.getContentByShareLink(
        mockShareLink,
        'workspace-id',
      );

      expect(result.resourceType).toBe('DASHBOARD_CHART');
      expect(result.title).toBe('Shared Chart');
      expect(result.data.type).toBe('VERTICAL_BAR');
      expect(result.data.id).toBe('chart-widget-id');
    });
  });
});
