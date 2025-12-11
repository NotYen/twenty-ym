import { Injectable, Logger } from '@nestjs/common';

import { google, type Auth } from 'googleapis';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';

@Injectable()
export class GoogleOAuth2ClientManagerService {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly workspaceConfigService: WorkspaceConfigService,
    private readonly logger: Logger,
  ) {}

  public async getOAuth2Client(
    refreshToken: string,
    workspaceId: string,
  ): Promise<Auth.OAuth2Client> {
    const gmailClientId =
      (await this.workspaceConfigService.get(
        workspaceId,
        'AUTH_GOOGLE_CLIENT_ID',
      )) || this.twentyConfigService.get('AUTH_GOOGLE_CLIENT_ID');

    const gmailClientSecret =
      (await this.workspaceConfigService.get(
        workspaceId,
        'AUTH_GOOGLE_CLIENT_SECRET',
      )) || this.twentyConfigService.get('AUTH_GOOGLE_CLIENT_SECRET');

    try {
      const oAuth2Client = new google.auth.OAuth2(
        gmailClientId,
        gmailClientSecret,
      );

      oAuth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      return oAuth2Client;
    } catch (error) {
      this.logger.error(
        `Error in ${GoogleOAuth2ClientManagerService.name}`,
        error,
      );

      throw error;
    }
  }
}
