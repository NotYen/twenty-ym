import { Injectable } from '@nestjs/common';

import { type EmailDriverInterface } from 'src/engine/core-modules/email/drivers/interfaces/email-driver.interface';

import { LoggerDriver } from 'src/engine/core-modules/email/drivers/logger.driver';
import { SmtpDriver } from 'src/engine/core-modules/email/drivers/smtp.driver';
import { EmailDriver } from 'src/engine/core-modules/email/enums/email-driver.enum';
import { DriverFactoryBase } from 'src/engine/core-modules/twenty-config/dynamic-factory.base';
import { ConfigVariablesGroup } from 'src/engine/core-modules/twenty-config/enums/config-variables-group.enum';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';

@Injectable()
export class EmailDriverFactory extends DriverFactoryBase<EmailDriverInterface> {
  constructor(
    twentyConfigService: TwentyConfigService,
    private readonly workspaceConfigService: WorkspaceConfigService,
  ) {
    super(twentyConfigService);
  }

  public async getWorkspaceDriver(
    workspaceId: string,
  ): Promise<EmailDriverInterface> {
    const smtpHost = await this.workspaceConfigService.get(
      workspaceId,
      'EMAIL_SMTP_HOST',
    );

    if (!smtpHost) {
      return this.getCurrentDriver();
    }

    const smtpPort = await this.workspaceConfigService.get(
      workspaceId,
      'EMAIL_SMTP_PORT',
    );
    const smtpUser = await this.workspaceConfigService.get(
      workspaceId,
      'EMAIL_SMTP_USER',
    );
    const smtpPassword = await this.workspaceConfigService.get(
      workspaceId,
      'EMAIL_SMTP_PASSWORD',
    );
    const smtpNoTls = await this.workspaceConfigService.get(
      workspaceId,
      'EMAIL_SMTP_NO_TLS',
    );

    if (!smtpPort) {
      // If host is set but port is missing, maybe fallback or throw?
      // For now, fallback to global if incomplete, or throw specific error.
      // Let's rely on standard SMTP defaults if possible or just use what we have.
      // But SmtpDriver likely needs port.
      // If user provided Host, they should provide Port.
      // Let's assume port 587 if missing or strict check.
      // If configuration is incomplete, we should probably fallback to global to avoid outages,
      // OR if the user explicitly tried to configure it, we should error.
      // Implementation Plan decision: "Fallback to global settings if not found".
      // But partial config is dangerous.
      // I will assume if HOST is present, we try to use it.
    }

    const port = smtpPort ? parseInt(smtpPort, 10) : 587;

    const options: {
      host: string;
      port: number;
      auth?: { user: string; pass: string };
      secure?: boolean;
      ignoreTLS?: boolean;
      requireTLS?: boolean;
    } = { host: smtpHost, port };

    if (smtpUser && smtpPassword) {
      options.auth = { user: smtpUser, pass: smtpPassword };
    }

    if (smtpNoTls === 'true') {
      options.secure = false;
      options.ignoreTLS = true;
    }

    return new SmtpDriver(options);
  }

  protected buildConfigKey(): string {
    const driver = this.twentyConfigService.get('EMAIL_DRIVER');

    if (driver === EmailDriver.LOGGER) {
      return 'logger';
    }

    if (driver === EmailDriver.SMTP) {
      const emailConfigHash = this.getConfigGroupHash(
        ConfigVariablesGroup.EMAIL_SETTINGS,
      );

      return `smtp|${emailConfigHash}`;
    }

    throw new Error(`Unsupported email driver: ${driver}`);
  }

  protected createDriver(): EmailDriverInterface {
    const driver = this.twentyConfigService.get('EMAIL_DRIVER');

    switch (driver) {
      case EmailDriver.LOGGER:
        return new LoggerDriver();

      case EmailDriver.SMTP: {
        const host = this.twentyConfigService.get('EMAIL_SMTP_HOST');
        const port = this.twentyConfigService.get('EMAIL_SMTP_PORT');
        const user = this.twentyConfigService.get('EMAIL_SMTP_USER');
        const pass = this.twentyConfigService.get('EMAIL_SMTP_PASSWORD');
        const noTLS = this.twentyConfigService.get('EMAIL_SMTP_NO_TLS');

        if (!host || !port) {
          throw new Error('SMTP driver requires host and port to be defined');
        }

        const options: {
          host: string;
          port: number;
          auth?: { user: string; pass: string };
          secure?: boolean;
          ignoreTLS?: boolean;
          requireTLS?: boolean;
        } = { host, port };

        if (user && pass) {
          options.auth = { user, pass };
        }

        if (noTLS) {
          options.secure = false;
          options.ignoreTLS = true;
        }

        return new SmtpDriver(options);
      }

      default:
        throw new Error(`Invalid email driver: ${driver}`);
    }
  }
}
