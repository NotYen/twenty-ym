import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { type Request } from 'express';
import { Strategy } from 'passport-google-oauth20';

import { getGoogleApisOauthScopes } from 'src/engine/core-modules/auth/utils/get-google-apis-oauth-scopes';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

export type GoogleAPIScopeConfig = {
  isCalendarEnabled?: boolean;
  isMessagingAliasFetchingEnabled?: boolean;
};

@Injectable()
export class GoogleAPIsOauthCommonStrategy extends PassportStrategy(
  Strategy,
  'google-apis',
) {
  protected readonly scopes: string[];
  protected readonly logger = new Logger(GoogleAPIsOauthCommonStrategy.name);

  constructor(protected readonly twentyConfigService: TwentyConfigService) {
    const scopes = getGoogleApisOauthScopes();

    super({
      clientID: twentyConfigService.get('AUTH_GOOGLE_CLIENT_ID'),
      clientSecret: twentyConfigService.get('AUTH_GOOGLE_CLIENT_SECRET'),
      callbackURL: twentyConfigService.get('AUTH_GOOGLE_APIS_CALLBACK_URL'),
      scope: scopes,
      passReqToCallback: true,
    });

    this.scopes = scopes;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authenticate(req: Request & { googleConfigOverride?: { clientID: string; clientSecret: string; callbackURL?: string } }, options: any) {
    // If workspace-specific config is provided, temporarily override OAuth2 credentials
    if (req.googleConfigOverride?.clientID && req.googleConfigOverride?.clientSecret) {
      this.logger.debug('========== Strategy Override Debug ==========');
      this.logger.debug(`Override ClientID: ${req.googleConfigOverride.clientID.substring(0, 20)}...`);
      this.logger.debug(`Override ClientSecret: SET`);
      this.logger.debug(`Override CallbackURL: ${req.googleConfigOverride.callbackURL || 'NOT PROVIDED'}`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oauth2 = (this as any)._oauth2;
      const originalClientId = oauth2._clientId;
      const originalClientSecret = oauth2._clientSecret;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalCallbackURL = (this as any)._callbackURL;

      this.logger.debug(`Original ClientID: ${originalClientId?.substring(0, 20)}...`);
      this.logger.debug(`Original CallbackURL: ${originalCallbackURL}`);

      // Temporarily override credentials
      oauth2._clientId = req.googleConfigOverride.clientID;
      oauth2._clientSecret = req.googleConfigOverride.clientSecret;

      // Override callback URL if provided
      if (req.googleConfigOverride.callbackURL) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)._callbackURL = req.googleConfigOverride.callbackURL;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.logger.debug(`After Override - ClientID: ${oauth2._clientId?.substring(0, 20)}...`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.logger.debug(`After Override - CallbackURL: ${(this as any)._callbackURL}`);
      this.logger.debug('==============================================');

      // Call parent authenticate
      const result = super.authenticate(req, options);

      // Restore original credentials after the redirect is initiated
      // Note: For the callback phase, credentials will be overridden again
      setTimeout(() => {
        oauth2._clientId = originalClientId;
        oauth2._clientSecret = originalClientSecret;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)._callbackURL = originalCallbackURL;
      }, 0);

      return result;
    }

    this.logger.debug('No workspace override, using default config');
    return super.authenticate(req, options);
  }
}
