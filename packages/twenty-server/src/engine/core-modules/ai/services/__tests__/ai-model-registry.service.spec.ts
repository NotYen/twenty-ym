import { Test, TestingModule } from '@nestjs/testing';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { ModelProvider } from '../../constants/ai-models.const';
import { AiModelRegistryService } from '../ai-model-registry.service';

// Mock @ai-sdk/openai, @ai-sdk/anthropic, etc.
jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => jest.fn((modelId) => ({ modelId, provider: 'openai' }))),
  openai: jest.fn((modelId) => ({ modelId, provider: 'openai' })),
}));

jest.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: jest.fn(() => jest.fn((modelId) => ({ modelId, provider: 'anthropic' }))),
  anthropic: jest.fn((modelId) => ({ modelId, provider: 'anthropic' })),
}));

jest.mock('@ai-sdk/xai', () => ({
  createXai: jest.fn(() => jest.fn((modelId) => ({ modelId, provider: 'xai' }))),
  xai: jest.fn((modelId) => ({ modelId, provider: 'xai' })),
}));

describe('AiModelRegistryService', () => {
  let service: AiModelRegistryService;
  let workspaceConfigService: WorkspaceConfigService;
  let twentyConfigService: TwentyConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiModelRegistryService,
        {
          provide: TwentyConfigService,
          useValue: {
            get: jest.fn((key) => {
               if (key === 'DEFAULT_AI_PERFORMANCE_MODEL_ID') return 'gpt-4o';
               return null;
            }),
          },
        },
        {
          provide: WorkspaceConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiModelRegistryService>(AiModelRegistryService);
    workspaceConfigService = module.get<WorkspaceConfigService>(WorkspaceConfigService);
    twentyConfigService = module.get<TwentyConfigService>(TwentyConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveModelForAgent', () => {
    it('should use workspace specific key if available for OpenAI', async () => {
      jest.spyOn(workspaceConfigService, 'get').mockResolvedValue('sk-workspace-key');

      const agent = { modelId: 'gpt-4o', workspaceId: 'ws-1' };
      const model = await service.resolveModelForAgent(agent);

      expect(workspaceConfigService.get).toHaveBeenCalledWith('ws-1', 'OPENAI_API_KEY');
      expect(model).toBeDefined();
      expect(model?.modelId).toBe('gpt-4o');
    });

    it('should fallback to global registry if workspace key is missing', async () => {
      jest.spyOn(workspaceConfigService, 'get').mockResolvedValue(null);
      jest.spyOn(twentyConfigService, 'get').mockReturnValue('sk-global-key');

      // We need to re-init service to pick up global key in constructor/buildModelRegistry
      // Or manually verify validateApiKey behavior.
      // However buildModelRegistry is called in constructor.
      // Let's mock getModel to return something to simulate global registry hit

      const agent = { modelId: 'gpt-4o', workspaceId: 'ws-1' };

      // Need to force register logic or mock getModel
      // Actually let's assume registerOpenAIModels was called if we mock TwentyConfig correctly in beforeEach?
      // But we passed null in beforeEach.

      // Let's just mock validateApiKey to pass
      jest.spyOn(service, 'validateApiKey').mockResolvedValue(undefined);
      jest.spyOn(service, 'getModel').mockReturnValue({
          modelId: 'gpt-4o',
          provider: ModelProvider.OPENAI,
          model: {} as any
      });

      const model = await service.resolveModelForAgent(agent);

      expect(workspaceConfigService.get).toHaveBeenCalledWith('ws-1', 'OPENAI_API_KEY');
      // Should have fallen through to getModel
      expect(service.getModel).toHaveBeenCalledWith('gpt-4o');
    });
  });
});
