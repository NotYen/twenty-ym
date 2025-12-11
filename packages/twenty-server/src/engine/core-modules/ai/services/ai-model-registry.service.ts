import { Injectable } from '@nestjs/common';

import { anthropic, createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { createXai, xai } from '@ai-sdk/xai';
import { type LanguageModel } from 'ai';

import {
    AI_MODELS,
    ModelProvider,
    type AIModelConfig,
} from 'src/engine/core-modules/ai/constants/ai-models.const';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';

export interface RegisteredAIModel {
  modelId: string;
  provider: ModelProvider;
  model: LanguageModel;
  doesSupportThinking?: boolean;
}

@Injectable()
export class AiModelRegistryService {
  private modelRegistry: Map<string, RegisteredAIModel> = new Map();

  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly workspaceConfigService: WorkspaceConfigService,
  ) {
    this.buildModelRegistry();
  }

  // ... (existing buildModelRegistry and other methods)

  private buildModelRegistry(): void {
    this.modelRegistry.clear();

    const openaiApiKey = this.twentyConfigService.get('OPENAI_API_KEY');

    if (openaiApiKey) {
      this.registerOpenAIModels();
    }

    const anthropicApiKey = this.twentyConfigService.get('ANTHROPIC_API_KEY');

    if (anthropicApiKey) {
      this.registerAnthropicModels();
    }

    const xaiApiKey = this.twentyConfigService.get('XAI_API_KEY');

    if (xaiApiKey) {
      this.registerXaiModels();
    }

    const openaiCompatibleBaseUrl = this.twentyConfigService.get(
      'OPENAI_COMPATIBLE_BASE_URL',
    );
    const openaiCompatibleModelNames = this.twentyConfigService.get(
      'OPENAI_COMPATIBLE_MODEL_NAMES',
    );

    if (openaiCompatibleBaseUrl && openaiCompatibleModelNames) {
      this.registerOpenAICompatibleModels(
        openaiCompatibleBaseUrl,
        openaiCompatibleModelNames,
      );
    }
  }

  private registerOpenAIModels(): void {
    const openaiModels = AI_MODELS.filter(
      (model) => model.provider === ModelProvider.OPENAI,
    );

    openaiModels.forEach((modelConfig) => {
      this.modelRegistry.set(modelConfig.modelId, {
        modelId: modelConfig.modelId,
        provider: ModelProvider.OPENAI,
        model: openai(modelConfig.modelId),
      });
    });
  }

  private registerAnthropicModels(): void {
    const anthropicModels = AI_MODELS.filter(
      (model) => model.provider === ModelProvider.ANTHROPIC,
    );

    anthropicModels.forEach((modelConfig) => {
      this.modelRegistry.set(modelConfig.modelId, {
        modelId: modelConfig.modelId,
        provider: ModelProvider.ANTHROPIC,
        model: anthropic(modelConfig.modelId),
        doesSupportThinking: modelConfig.doesSupportThinking,
      });
    });
  }

  private registerXaiModels(): void {
    const xaiModels = AI_MODELS.filter(
      (model) => model.provider === ModelProvider.XAI,
    );

    xaiModels.forEach((modelConfig) => {
      this.modelRegistry.set(modelConfig.modelId, {
        modelId: modelConfig.modelId,
        provider: ModelProvider.XAI,
        model: xai(modelConfig.modelId),
      });
    });
  }

  private registerOpenAICompatibleModels(
    baseUrl: string,
    modelNamesString: string,
  ): void {
    const apiKey = this.twentyConfigService.get('OPENAI_COMPATIBLE_API_KEY');
    const provider = createOpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
    });

    const modelNames = modelNamesString
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    modelNames.forEach((modelId) => {
      this.modelRegistry.set(modelId, {
        modelId,
        provider: ModelProvider.OPENAI_COMPATIBLE,
        model: provider(modelId),
      });
    });
  }

  getModel(modelId: string): RegisteredAIModel | undefined {
    return this.modelRegistry.get(modelId);
  }

  getAvailableModels(): RegisteredAIModel[] {
    return Array.from(this.modelRegistry.values());
  }

  async getWorkspaceModel(
    workspaceId: string,
    modelId: string,
  ): Promise<RegisteredAIModel | undefined> {
    const effectiveModelConfig = this.getEffectiveModelConfig(modelId);
    const provider = effectiveModelConfig.provider;

    let apiKey: string | null | undefined;

    switch (provider) {
       case ModelProvider.OPENAI:
        apiKey = await this.workspaceConfigService.get(workspaceId, 'OPENAI_API_KEY');
        break;
      case ModelProvider.ANTHROPIC:
        apiKey = await this.workspaceConfigService.get(workspaceId, 'ANTHROPIC_API_KEY');
        break;
      case ModelProvider.XAI:
        apiKey = await this.workspaceConfigService.get(workspaceId, 'XAI_API_KEY');
        break;
      // Note: OPENAI_COMPATIBLE dynamic config not supported yet for workspace
    }

    if (apiKey) {
      let model: LanguageModel | undefined;

      if (provider === ModelProvider.OPENAI) {
        const openaiProvider = createOpenAI({ apiKey });
        model = openaiProvider(effectiveModelConfig.modelId);
      } else if (provider === ModelProvider.ANTHROPIC) {
        const anthropicProvider = createAnthropic({ apiKey });
        model = anthropicProvider(effectiveModelConfig.modelId);
      } else if (provider === ModelProvider.XAI) {
        const xaiProvider = createXai({ apiKey });
        model = xaiProvider(effectiveModelConfig.modelId);
      }

      if (model) {
        return {
          modelId: effectiveModelConfig.modelId,
          provider,
          model,
          doesSupportThinking: effectiveModelConfig.doesSupportThinking,
        };
      }
    }

    return this.getModel(effectiveModelConfig.modelId);
  }

  getDefaultSpeedModel(): RegisteredAIModel {
    const defaultModelId = this.twentyConfigService.get(
      'DEFAULT_AI_SPEED_MODEL_ID',
    );
    let model = this.getModel(defaultModelId);

    if (!model) {
      const availableModels = this.getAvailableModels();

      model = availableModels[0];
    }

    return model;
  }

  getDefaultPerformanceModel(): RegisteredAIModel {
    const defaultModelId = this.twentyConfigService.get(
      'DEFAULT_AI_PERFORMANCE_MODEL_ID',
    );
    let model = this.getModel(defaultModelId);

    if (!model) {
      const availableModels = this.getAvailableModels();

      model = availableModels[0];
    }

    return model;
  }

  getEffectiveModelConfig(modelId: string): AIModelConfig {
    if (modelId === 'auto') {
      const defaultModel = this.getDefaultPerformanceModel();

      if (!defaultModel) {
        throw new Error(
          'No AI models are available. Please configure at least one provider.',
        );
      }

      const modelConfig = AI_MODELS.find(
        (model) => model.modelId === defaultModel.modelId,
      );

      if (modelConfig) {
        return modelConfig;
      }

      return this.createDefaultConfigForCustomModel(defaultModel);
    }

    const predefinedModel = AI_MODELS.find(
      (model) => model.modelId === modelId,
    );

    if (predefinedModel) {
      return predefinedModel;
    }

    const registeredModel = this.getModel(modelId);

    if (registeredModel) {
      return this.createDefaultConfigForCustomModel(registeredModel);
    }

    throw new Error(`Model with ID ${modelId} not found`);
  }

  private createDefaultConfigForCustomModel(
    registeredModel: RegisteredAIModel,
  ): AIModelConfig {
    return {
      modelId: registeredModel.modelId,
      label: registeredModel.modelId,
      description: `Custom model: ${registeredModel.modelId}`,
      provider: registeredModel.provider,
      inputCostPer1kTokensInCents: 0,
      outputCostPer1kTokensInCents: 0,
      contextWindowTokens: 128000,
      maxOutputTokens: 4096,
    };
  }

  // Force refresh the registry (useful if config changes)
  refreshRegistry(): void {
    this.buildModelRegistry();
  }

  async resolveModelForAgent(agent: { modelId: string; workspaceId?: string } | null) {
    const aiModelConfig = this.getEffectiveModelConfig(agent?.modelId ?? 'auto');

    // Try to get workspace specific model if workspaceId is present
    if (agent?.workspaceId) {
        const workspaceModel = await this.getWorkspaceModel(agent.workspaceId, aiModelConfig.modelId);
        if (workspaceModel) {
            return workspaceModel;
        }
    }

    await this.validateApiKey(aiModelConfig.provider);
    const registeredModel = this.getModel(aiModelConfig.modelId);

    if (!registeredModel) {
      throw new Error(`Model ${aiModelConfig.modelId} not found in registry`);
    }

    return registeredModel;
  }

  async validateApiKey(provider: ModelProvider): Promise<void> {
    let apiKey: string | undefined;

    switch (provider) {
      case ModelProvider.OPENAI:
        apiKey = this.twentyConfigService.get('OPENAI_API_KEY');
        break;
      case ModelProvider.ANTHROPIC:
        apiKey = this.twentyConfigService.get('ANTHROPIC_API_KEY');
        break;
      case ModelProvider.XAI:
        apiKey = this.twentyConfigService.get('XAI_API_KEY');
        break;
      case ModelProvider.OPENAI_COMPATIBLE:
        apiKey = this.twentyConfigService.get('OPENAI_COMPATIBLE_API_KEY');
        break;
      default:
        return;
    }

    if (!apiKey) {
      throw new Error(`${provider.toUpperCase()} API key not configured`);
    }
  }
}
