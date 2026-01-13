import { type ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { GoogleAPIsOauthRequestCodeStrategy } from 'src/engine/core-modules/auth/strategies/google-apis-oauth-request-code.auth.strategy';
import { TransientTokenService } from 'src/engine/core-modules/auth/token/services/transient-token.service';
import { setRequestExtraParams } from 'src/engine/core-modules/auth/utils/google-apis-set-request-extra-params.util';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { GuardRedirectService } from 'src/engine/core-modules/guard-redirect/services/guard-redirect.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Injectable()
export class GoogleAPIsOauthRequestCodeGuard extends AuthGuard('google-apis') {
  private readonly logger = new Logger(GoogleAPIsOauthRequestCodeGuard.name);

  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly transientTokenService: TransientTokenService,
    private readonly guardRedirectService: GuardRedirectService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    private readonly workspaceConfigService: WorkspaceConfigService,
  ) {
    super({
      prompt: 'select_account',
    });
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    return {
      prompt: 'select_account',
      ...(request.googleConfigOverride || {}),
    };
  }

  async canActivate(context: ExecutionContext) {
    let workspace: WorkspaceEntity | null = null;

    try {
      const request = context.switchToHttp().getRequest();

      const { workspaceId, userId } =
        await this.transientTokenService.verifyTransientToken(
          request.query.transientToken,
        );

      workspace = await this.workspaceRepository.findOneBy({
        id: workspaceId,
      });

      // Debug: Log workspace config lookup
      const wsClientId = await this.workspaceConfigService.get(
        workspaceId,
        'AUTH_GOOGLE_CLIENT_ID',
      );
      const wsClientSecret = await this.workspaceConfigService.get(
        workspaceId,
        'AUTH_GOOGLE_CLIENT_SECRET',
      );
      const wsCallbackUrl = await this.workspaceConfigService.get(
        workspaceId,
        'AUTH_GOOGLE_APIS_CALLBACK_URL',
      );

      const envClientId = this.twentyConfigService.get('AUTH_GOOGLE_CLIENT_ID');
      const envClientSecret = this.twentyConfigService.get(
        'AUTH_GOOGLE_CLIENT_SECRET',
      );
      const envCallbackUrl = this.twentyConfigService.get(
        'AUTH_GOOGLE_APIS_CALLBACK_URL',
      );

      this.logger.debug(
        '========== OAuth Config Debug (RequestCode) ==========',
      );
      this.logger.debug(`WorkspaceId: ${workspaceId}`);
      this.logger.debug(
        `Workspace Config - ClientId: ${wsClientId ? `${wsClientId.substring(0, 20)}...` : 'NULL'}`,
      );
      this.logger.debug(
        `Workspace Config - ClientSecret: ${wsClientSecret ? 'SET' : 'NULL'}`,
      );
      this.logger.debug(
        `Workspace Config - CallbackUrl: ${wsCallbackUrl || 'NULL'}`,
      );
      this.logger.debug(
        `Env Config - ClientId: ${envClientId ? `${envClientId.substring(0, 20)}...` : 'NULL'}`,
      );
      this.logger.debug(
        `Env Config - ClientSecret: ${envClientSecret ? 'SET' : 'NULL'}`,
      );
      this.logger.debug(
        `Env Config - CallbackUrl: ${envCallbackUrl || 'NULL'}`,
      );

      const clientId = wsClientId || envClientId;
      const clientSecret = wsClientSecret || envClientSecret;
      const callbackUrl = wsCallbackUrl || envCallbackUrl;

      this.logger.debug(
        `Final - ClientId: ${clientId ? `${clientId.substring(0, 20)}...` : 'NULL'}`,
      );
      this.logger.debug(
        `Final - ClientSecret: ${clientSecret ? 'SET' : 'NULL'}`,
      );
      this.logger.debug(`Final - CallbackUrl: ${callbackUrl || 'NULL'}`);
      this.logger.debug(
        '======================================================',
      );

      if (clientId && clientSecret) {
        request.googleConfigOverride = {
          clientID: clientId,
          clientSecret: clientSecret,
          callbackURL: callbackUrl,
        };
      }

      setRequestExtraParams(request, {
        transientToken: request.query.transientToken,
        redirectLocation: request.query.redirectLocation,
        calendarVisibility: request.query.calendarVisibility,
        messageVisibility: request.query.messageVisibility,
        loginHint: request.query.loginHint,
        userId: userId,
        workspaceId: workspaceId,
      });

      if (
        !this.twentyConfigService.get('MESSAGING_PROVIDER_GMAIL_ENABLED') &&
        !this.twentyConfigService.get('CALENDAR_PROVIDER_GOOGLE_ENABLED')
      ) {
        throw new AuthException(
          'Google apis auth is not enabled',
          AuthExceptionCode.GOOGLE_API_AUTH_DISABLED,
        );
      }

      new GoogleAPIsOauthRequestCodeStrategy(this.twentyConfigService);

      return (await super.canActivate(context)) as boolean;
    } catch (err) {
      this.guardRedirectService.dispatchErrorFromGuard(
        context,
        err,
        this.workspaceDomainsService.getSubdomainAndCustomDomainFromWorkspaceFallbackOnDefaultSubdomain(
          workspace,
        ),
      );

      return false;
    }
  }
}
