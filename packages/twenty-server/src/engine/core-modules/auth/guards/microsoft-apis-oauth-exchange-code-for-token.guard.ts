import { type ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
    AuthException,
    AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { MicrosoftAPIsOauthExchangeCodeForTokenStrategy } from 'src/engine/core-modules/auth/strategies/microsoft-apis-oauth-exchange-code-for-token.auth.strategy';
import { TransientTokenService } from 'src/engine/core-modules/auth/token/services/transient-token.service';
import { setRequestExtraParams } from 'src/engine/core-modules/auth/utils/google-apis-set-request-extra-params.util';
import { GuardRedirectService } from 'src/engine/core-modules/guard-redirect/services/guard-redirect.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Injectable()
export class MicrosoftAPIsOauthExchangeCodeForTokenGuard extends AuthGuard(
  'microsoft-apis',
) {
  constructor(
    private readonly guardRedirectService: GuardRedirectService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly transientTokenService: TransientTokenService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly workspaceConfigService: WorkspaceConfigService,
  ) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    return {
      ...(request.microsoftConfigOverride || {}),
    };
  }

  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest();
      const state = JSON.parse(request.query.state);

      if (
        !this.twentyConfigService.get('MESSAGING_PROVIDER_MICROSOFT_ENABLED') &&
        !this.twentyConfigService.get('CALENDAR_PROVIDER_MICROSOFT_ENABLED')
      ) {
        throw new AuthException(
          'Microsoft apis auth is not enabled',
          AuthExceptionCode.MICROSOFT_API_AUTH_DISABLED,
        );
      }

      const { workspaceId } =
        await this.transientTokenService.verifyTransientToken(
          state.transientToken,
        );

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

      if (clientId && clientSecret) {
        request.microsoftConfigOverride = {
          clientID: clientId,
          clientSecret: clientSecret,
        };
      }

      new MicrosoftAPIsOauthExchangeCodeForTokenStrategy(
        this.twentyConfigService,
      );

      setRequestExtraParams(request, {
        transientToken: state.transientToken,
        redirectLocation: state.redirectLocation,
        calendarVisibility: state.calendarVisibility,
        messageVisibility: state.messageVisibility,
      });

      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      this.guardRedirectService.dispatchErrorFromGuard(
        context,
        error?.oauthError?.statusCode === 403
          ? new AuthException(
              `Insufficient privileges to access this microsoft resource. Make sure you have the correct scopes or ask your admin to update your scopes. ${error?.message}`,
              AuthExceptionCode.INSUFFICIENT_SCOPES,
            )
          : error,
        this.guardRedirectService.getSubdomainAndCustomDomainFromContext(
          context,
        ),
      );

      return false;
    }
  }
}
