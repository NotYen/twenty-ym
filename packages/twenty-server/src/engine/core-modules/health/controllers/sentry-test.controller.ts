import { Controller, Get, UseGuards } from '@nestjs/common';

import * as Sentry from '@sentry/node';

import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

/**
 * Sentry 測試 Controller
 * 用於驗證 Sentry 錯誤追蹤是否正常運作
 *
 * 測試方式：
 * - GET /sentry-test/error - 觸發一個測試錯誤
 * - GET /sentry-test/message - 發送一個測試訊息
 */
@Controller('sentry-test')
export class SentryTestController {
  @Get('error')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  triggerTestError() {
    const testError = new Error(
      `[Sentry Test] Backend test error at ${new Date().toISOString()}`,
    );

    // 手動捕獲並發送到 Sentry
    Sentry.captureException(testError);

    return {
      success: true,
      message: 'Test error sent to Sentry',
      timestamp: new Date().toISOString(),
      environment: process.env.SENTRY_ENVIRONMENT || 'unknown',
    };
  }

  @Get('message')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  sendTestMessage() {
    const message = `[Sentry Test] Backend test message at ${new Date().toISOString()}`;

    // 發送測試訊息到 Sentry
    Sentry.captureMessage(message, 'info');

    return {
      success: true,
      message: 'Test message sent to Sentry',
      timestamp: new Date().toISOString(),
      environment: process.env.SENTRY_ENVIRONMENT || 'unknown',
    };
  }
}
