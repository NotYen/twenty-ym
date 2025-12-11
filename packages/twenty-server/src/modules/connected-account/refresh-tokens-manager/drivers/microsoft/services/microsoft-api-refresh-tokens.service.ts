import { Injectable } from '@nestjs/common';

import axios, { AxiosError } from 'axios';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import {
    ConnectedAccountRefreshAccessTokenException,
    ConnectedAccountRefreshAccessTokenExceptionCode,
} from 'src/modules/connected-account/refresh-tokens-manager/exceptions/connected-account-refresh-tokens.exception';
import { type ConnectedAccountTokens } from 'src/modules/connected-account/refresh-tokens-manager/services/connected-account-refresh-tokens.service';

export type MicrosoftTokens = {
  accessToken: string;
  refreshToken: string;
};

interface MicrosoftRefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
}

import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';

@Injectable()
export class MicrosoftAPIRefreshAccessTokenService {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly workspaceConfigService: WorkspaceConfigService,
  ) {}

  async refreshTokens(
    refreshToken: string,
    workspaceId: string,
  ): Promise<ConnectedAccountTokens> {
    const clientId =
      (await this.workspaceConfigService.get(
        workspaceId,
        'AUTH_MICROSOFT_CLIENT_ID',
      )) || this.twentyConfigService.get('AUTH_MICROSOFT_CLIENT_ID');

    const clientSecret =
      (await this.workspaceConfigService.get(
        workspaceId,
        'AUTH_MICROSOFT_CLIENT_SECRET',
      )) || this.twentyConfigService.get('AUTH_MICROSOFT_CLIENT_SECRET');

    try {
      const response = await axios.post<MicrosoftRefreshTokenResponse>(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      const responseData = response.data as MicrosoftRefreshTokenResponse;

      return {
        accessToken: responseData.access_token,
        refreshToken: responseData.refresh_token,
      };
    } catch (error) {
      if (
        error instanceof AxiosError &&
        error.response?.data?.error === 'invalid_grant'
      ) {
        throw new ConnectedAccountRefreshAccessTokenException(
          `Failed to refresh Microsoft token: ${error.response?.data?.error} - ${error.response?.data?.error_description}`,
          ConnectedAccountRefreshAccessTokenExceptionCode.INVALID_REFRESH_TOKEN,
        );
      }
      throw error;
    }
  }
}
