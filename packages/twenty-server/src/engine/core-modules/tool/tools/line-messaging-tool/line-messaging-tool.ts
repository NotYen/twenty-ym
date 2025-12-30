import { Injectable, Logger } from '@nestjs/common';

import axios from 'axios';

import { LineMessagingToolParametersZodSchema } from 'src/engine/core-modules/tool/tools/line-messaging-tool/line-messaging-tool.schema';
import { type LineMessagingInput } from 'src/engine/core-modules/tool/tools/line-messaging-tool/types/line-messaging-input.type';
import { type ToolInput } from 'src/engine/core-modules/tool/types/tool-input.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';
import { type Tool } from 'src/engine/core-modules/tool/types/tool.type';
import { LineConfigService } from 'src/engine/core-modules/line-integration/services/line-config.service';
import { ScopedWorkspaceContextFactory } from 'src/engine/twenty-orm/factories/scoped-workspace-context.factory';

@Injectable()
export class LineMessagingTool implements Tool {
  private readonly logger = new Logger(LineMessagingTool.name);

  description =
    'Send a text message to a LINE user through the configured channel access token.';
  inputSchema = LineMessagingToolParametersZodSchema;

  constructor(
    private readonly lineConfigService: LineConfigService,
    private readonly scopedWorkspaceContextFactory: ScopedWorkspaceContextFactory,
  ) {}

  async execute(parameters: ToolInput): Promise<ToolOutput> {
    const { to, message } = parameters as LineMessagingInput;
    const { workspaceId } = this.scopedWorkspaceContextFactory.create();

    if (!workspaceId) {
      const errorMessage = 'Workspace ID is not available';

      this.logger.error(errorMessage);

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }

    // Get LINE channel config from database
    const lineConfig =
      await this.lineConfigService.getDecryptedConfig(workspaceId);

    if (!lineConfig) {
      const errorMessage = 'LINE channel is not configured for this workspace';

      this.logger.error(errorMessage);

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }

    const channelAccessToken = lineConfig.channelAccessToken;

    try {
      const response = await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to,
          messages: [
            {
              type: 'text',
              text: message,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${channelAccessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        message: `LINE message sent successfully to ${to}`,
        result: {
          to,
          message,
        },
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Failed to send LINE message to ${to}: ${error.message}`,
        );

        return {
          success: false,
          message: `Failed to send LINE message to ${to}`,
          error:
            typeof error.response?.data === 'string'
              ? error.response.data
              : (error.message ?? 'Failed to send LINE message'),
          status: error.response?.status,
          statusText: error.response?.statusText,
        };
      }

      this.logger.error(`Failed to send LINE message to ${to}: ${error}`);

      return {
        success: false,
        message: `Failed to send LINE message to ${to}`,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send LINE message',
      };
    }
  }
}
