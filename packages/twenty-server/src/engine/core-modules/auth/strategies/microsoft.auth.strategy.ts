import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { type Request } from 'express';
import { type VerifyCallback } from 'passport-google-oauth20';
import { Strategy } from 'passport-microsoft';
import { type APP_LOCALES } from 'twenty-shared/translations';

import {
    AuthException,
    AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { type SocialSSOSignInUpActionType } from 'src/engine/core-modules/auth/types/signInUp.type';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { undefined } from 'zod';

const getWorkspaceIdFromState = (req: Request): string | undefined => {
  if (typeof req.query.state === 'string') {
    try {
      const state = JSON.parse(req.query.state);
      return state.workspaceId;
    } catch (e) {
      // ignore
    }
  }
  return undefined;
};

export type MicrosoftRequest = Omit<
  Request,
  'user' | 'workspace' | 'workspaceMetadataVersion'
> & {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    picture: string | null;
    locale?: keyof typeof APP_LOCALES | null;
    workspaceInviteHash?: string;
    workspacePersonalInviteToken?: string;
    workspaceId?: string;
    billingCheckoutSessionState?: string;
    action: SocialSSOSignInUpActionType;
  };
};

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly workspaceConfigService: WorkspaceConfigService,
  ) {
    super({
      clientID: twentyConfigService.get('AUTH_MICROSOFT_CLIENT_ID'),
      clientSecret: twentyConfigService.get('AUTH_MICROSOFT_CLIENT_SECRET'),
      callbackURL: twentyConfigService.get('AUTH_MICROSOFT_CALLBACK_URL'),
      tenant: 'common',
      scope: ['user.read'],
      passReqToCallback: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async authenticate(req: Request, options: any) {
    let workspaceId = getWorkspaceIdFromState(req);

    if (typeof req.params.workspaceId === 'string') {
      workspaceId = req.params.workspaceId;
    }

    let clientID: string | null | undefined;
    let clientSecret: string | null | undefined;

    if (workspaceId && typeof workspaceId === 'string') {
      clientID = await this.workspaceConfigService.get(
        workspaceId,
        'AUTH_MICROSOFT_CLIENT_ID',
      );
      clientSecret = await this.workspaceConfigService.get(
        workspaceId,
        'AUTH_MICROSOFT_CLIENT_SECRET',
      );
    }

    if (clientID && clientSecret) {
      const dynamicStrategy = new Strategy(
        {
          clientID,
          clientSecret,
          callbackURL: this.twentyConfigService.get(
            'AUTH_MICROSOFT_CALLBACK_URL',
          ),
          tenant: 'common',
          scope: ['user.read'],
          passReqToCallback: true,
        },
        this.validate.bind(this),
      );

      dynamicStrategy.authenticate(req, {
        ...options,
        state: JSON.stringify({
          workspaceInviteHash: req.query.workspaceInviteHash,
          workspaceId: req.params.workspaceId,
          locale: req.query.locale,
          billingCheckoutSessionState: req.query.billingCheckoutSessionState,
          workspacePersonalInviteToken: req.query.workspacePersonalInviteToken,
          action: req.query.action,
        }),
      });
    } else {
      options = {
        ...options,
        state: JSON.stringify({
          workspaceInviteHash: req.query.workspaceInviteHash,
          workspaceId: req.params.workspaceId,
          locale: req.query.locale,
          billingCheckoutSessionState: req.query.billingCheckoutSessionState,
          workspacePersonalInviteToken: req.query.workspacePersonalInviteToken,
          action: req.query.action,
        }),
      };

      return super.authenticate(req, options);
    }
  }

  private validate(
    request: MicrosoftRequest,
    accessToken: string,
    refreshToken: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any,
    done: VerifyCallback,
  ): void {
    // This is a wrapper to call the original validate method which returns a Promise
    // but the strategy expects a void return or handling via done callback
    this.validatePromise(
      request,
      accessToken,
      refreshToken,
      profile,
      done,
    ).catch((err) => done(err, false));
  }

  async validatePromise(
    request: MicrosoftRequest,
    _accessToken: string,
    _refreshToken: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const { name, userPrincipalName, photos } = profile;

    const state =
      typeof request.query.state === 'string'
        ? JSON.parse(request.query.state)
        : undefined;

    if (!userPrincipalName) {
      throw new AuthException(
        'User principal name not found',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    const user: MicrosoftRequest['user'] = {
      email: userPrincipalName,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos?.[0]?.value,
      workspaceInviteHash: state.workspaceInviteHash,
      workspacePersonalInviteToken: state.workspacePersonalInviteToken,
      workspaceId: state.workspaceId,
      billingCheckoutSessionState: state.billingCheckoutSessionState,
      locale: state.locale,
      action: state.action,
    };

    done(null, user);
  }
}
