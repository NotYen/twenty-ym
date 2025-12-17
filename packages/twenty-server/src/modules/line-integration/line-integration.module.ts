import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LineConfigService } from 'src/modules/line-integration/services/line-config.service';
import { LineApiService } from 'src/modules/line-integration/services/line-api.service';
import { LineWebhookService } from 'src/modules/line-integration/services/line-webhook.service';
import { LinePersonService } from 'src/modules/line-integration/services/line-person.service';
import { LineEncryptionService } from 'src/modules/line-integration/services/line-encryption.service';
import { LineWebhookController } from 'src/modules/line-integration/controllers/line-webhook.controller';
import { LineSignatureGuard } from 'src/modules/line-integration/guards/line-signature.guard';
import { LineConfigResolver } from 'src/modules/line-integration/resolvers/line-config.resolver';
import { LineChannelConfigEntity } from 'src/modules/line-integration/entities/line-channel-config.entity';
import { LineRawBodyMiddleware } from 'src/modules/line-integration/middleware/line-raw-body.middleware';

/**
 * LINE Integration Module
 *
 * 此模組負責整合 LINE Official Account (OA) 的所有功能，包括：
 * - 金鑰設定與管理 (LineConfigService)
 * - Webhook 接收與處理 (LineWebhookController & Service)
 * - LINE Messaging API 客戶端 (LineApiService)
 * - Person 實體整合 (LinePersonService with TwentyORM)
 * - 簽章驗證與安全防護 (LineSignatureGuard)
 * - 冪等性檢查 (使用 Redis)
 *
 * 依賴模組：
 * - HttpModule: 用於對外 HTTP 請求 (呼叫 LINE API)
 * - TypeOrmModule: 存取 LineChannelConfigEntity
 * - CacheStorageModule: 用於 Redis 冪等性檢查 (全域模組)
 * - TwentyORMManager: 透過 LinePersonService 存取 Person 實體 (已整合)
 */
@Module({
  imports: [
    // 配置 HTTP 客戶端，設定逾時與重導向限制
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    // 註冊 TypeORM Entity
    TypeOrmModule.forFeature([LineChannelConfigEntity]),
    // CacheStorageModule 是全域模組，不需要在此 import
    // TwentyORMManager 是全域可用，透過 LinePersonService 使用
  ],
  controllers: [LineWebhookController],
  providers: [
    LineConfigService,
    LineApiService,
    LineWebhookService,
    LinePersonService,
    LineEncryptionService,
    LineSignatureGuard,
    LineConfigResolver,
  ],
  exports: [
    // 導出服務供其他模組使用 (如工作流、GraphQL Resolver)
    LineApiService,
    LineConfigService,
    LinePersonService,
  ],
})
export class LineIntegrationModule implements NestModule {
  /**
   * 配置 Middleware
   * 將 LineRawBodyMiddleware 套用在 LINE webhook 路徑
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LineRawBodyMiddleware)
      .forRoutes({ path: 'api/v1/webhooks/line', method: RequestMethod.POST });
  }
}
