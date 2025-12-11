import { Test, TestingModule } from '@nestjs/testing';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { ScopedWorkspaceContextFactory } from 'src/engine/twenty-orm/factories/scoped-workspace-context.factory';
import { LineMessagingTool } from './line-messaging-tool';

describe('LineMessagingTool', () => {
  let tool: LineMessagingTool;
  let workspaceConfigService: WorkspaceConfigService;
  let twentyConfigService: TwentyConfigService;
  let scopedWorkspaceContextFactory: ScopedWorkspaceContextFactory;

  const mockWorkspaceId = 'test-workspace-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineMessagingTool,
        {
          provide: TwentyConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: WorkspaceConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ScopedWorkspaceContextFactory,
          useValue: {
            create: jest.fn(() => ({ workspaceId: mockWorkspaceId })),
          },
        },
      ],
    }).compile();

    tool = module.get<LineMessagingTool>(LineMessagingTool);
    workspaceConfigService = module.get<WorkspaceConfigService>(WorkspaceConfigService);
    twentyConfigService = module.get<TwentyConfigService>(TwentyConfigService);
    scopedWorkspaceContextFactory = module.get<ScopedWorkspaceContextFactory>(ScopedWorkspaceContextFactory);
  });

  it('should be defined', () => {
    expect(tool).toBeDefined();
  });

  it('should use workspace config if available', async () => {
    jest.spyOn(workspaceConfigService, 'get').mockResolvedValue('workspace-token');

    // Mock axios to avoid actual call, or spy on private method if any (here logic is inside execute)
    // Since execute sends request, we expect it to fail on axios, but we can check if it tries to send with token
    // Actually `execute` calls `this.twentyConfigService.get` or `workspaceConfigService.get`.

    // We can spy on the get method and see if it was called.
    // However, execute relies on axios. We should mock axios?
    // Or just check if `get` is called.

    // For simplicity, we just check if it throws "token not configured" or tries to proceed.
    // If we mock axios we can verify the token used in header.

    const axios = (await import('axios')).default;
    jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, statusText: 'OK', headers: {} });

    const result = await tool.execute({ to: 'user', message: 'hello' });

    expect(workspaceConfigService.get).toHaveBeenCalledWith(mockWorkspaceId, 'LINE_CHANNEL_ACCESS_TOKEN');
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer workspace-token',
        }),
      }),
    );
  });

  it('should fallback to global config if workspace config is missing', async () => {
    jest.spyOn(workspaceConfigService, 'get').mockResolvedValue(null);
    jest.spyOn(twentyConfigService, 'get').mockReturnValue('global-token');

    const axios = (await import('axios')).default;
    jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, statusText: 'OK', headers: {} });

    await tool.execute({ to: 'user', message: 'hello' });

    expect(workspaceConfigService.get).toHaveBeenCalledWith(mockWorkspaceId, 'LINE_CHANNEL_ACCESS_TOKEN');
    expect(twentyConfigService.get).toHaveBeenCalledWith('LINE_CHANNEL_ACCESS_TOKEN');
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer global-token',
        }),
      }),
    );
  });

  it('should use global config if workspaceId is missing', async () => {
    jest.spyOn(scopedWorkspaceContextFactory, 'create').mockReturnValue({ workspaceId: undefined });
    jest.spyOn(twentyConfigService, 'get').mockReturnValue('global-token');

    const axios = (await import('axios')).default;
    jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, statusText: 'OK', headers: {} });

    await tool.execute({ to: 'user', message: 'hello' });

    expect(workspaceConfigService.get).not.toHaveBeenCalled();
    expect(twentyConfigService.get).toHaveBeenCalledWith('LINE_CHANNEL_ACCESS_TOKEN');
  });

  it('should return error if no token is configured', async () => {
    jest.spyOn(workspaceConfigService, 'get').mockResolvedValue(null);
    jest.spyOn(twentyConfigService, 'get').mockReturnValue(null);

    const result = await tool.execute({ to: 'user', message: 'hello' });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not configured');
  });
});
