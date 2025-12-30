import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LINE Raw Body Middleware
 *
 * 確保 LINE Webhook 請求的 raw body 可用於簽章驗證
 *
 * NestJS 預設會解析 JSON body，但 LINE 簽章驗證需要原始的 body string
 * 此 middleware 將原始 body 附加到 request.rawBody
 *
 * 使用方式：
 * 在 LineIntegrationModule 中註冊此 middleware
 *
 * 注意：
 * - main.ts 需要設定 rawBody: true
 * - 此 middleware 應該只套用在 LINE webhook 路徑
 */
@Injectable()
export class LineRawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // NestJS 的 rawBody 功能會自動將原始 body 附加到 req.rawBody
    // 我們只需要確保它存在即可

    if (!req.rawBody && req.body) {
      // 如果 rawBody 不存在但 body 存在，手動轉換
      req.rawBody = JSON.stringify(req.body);
    }

    next();
  }
}

// 擴展 Express Request 類型以包含 rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: string | Buffer;
    }
  }
}
