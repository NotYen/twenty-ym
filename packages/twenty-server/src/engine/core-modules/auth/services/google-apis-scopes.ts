import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

import {
    AuthException,
    AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { includesExpectedScopes } from 'src/engine/core-modules/auth/services/google-apis-scopes.service.util';
import { getGoogleApisOauthScopes } from 'src/engine/core-modules/auth/utils/get-google-apis-oauth-scopes';

interface TokenInfoResponse {
  scope: string;
  exp: string;
  email: string;
  email_verified: string;
  access_type: string;
  client_id: string;
  user_id: string;
  aud: string;
  azp: string;
  sub: string;
  hd: string;
}

@Injectable()
export class GoogleAPIScopesService {
  private readonly logger = new Logger(GoogleAPIScopesService.name);

  constructor(private httpService: HttpService) {}

  public async getScopesFromGoogleAccessTokenAndCheckIfExpectedScopesArePresent(
    accessToken: string,
  ): Promise<{ scopes: string[]; isValid: boolean }> {
    try {
      this.logger.debug('Fetching token info from Google...');
      const response = await this.httpService.axiosRef.get<TokenInfoResponse>(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`,
        { timeout: 5000 },
      );

      const scopes = response.data.scope.split(' ');
      const expectedScopes = getGoogleApisOauthScopes();

      this.logger.debug('========== Scope Validation Debug ==========');
      this.logger.debug(`Token Client ID: ${response.data.client_id}`);
      this.logger.debug(`Token Email: ${response.data.email}`);
      this.logger.debug(`Received scopes (${scopes.length}): ${JSON.stringify(scopes)}`);
      this.logger.debug(`Expected scopes (${expectedScopes.length}): ${JSON.stringify(expectedScopes)}`);

      const isValid = includesExpectedScopes(scopes, expectedScopes);

      if (!isValid) {
        // Find missing scopes
        const missingScopes = expectedScopes.filter(
          (expected) =>
            !scopes.includes(expected) &&
            !scopes.includes(`https://www.googleapis.com/auth/userinfo.${expected}`),
        );
        this.logger.error(`Missing scopes: ${JSON.stringify(missingScopes)}`);
      } else {
        this.logger.debug('All expected scopes are present!');
      }
      this.logger.debug('=============================================');

      return {
        scopes,
        isValid,
      };
    } catch (error) {
      this.logger.error('Failed to fetch token info from Google', error);
      throw new AuthException(
        'Google account connect error: cannot read scopes from token',
        AuthExceptionCode.INSUFFICIENT_SCOPES,
      );
    }
  }
}
