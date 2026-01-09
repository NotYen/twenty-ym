# Sentry 錯誤追蹤整合

## 概述

整合 Sentry 錯誤追蹤服務，自動捕獲前後端的錯誤並回報到 Sentry Dashboard，方便監控和除錯。

## 功能特點

- **前端錯誤追蹤**：自動捕獲 JavaScript 錯誤、Promise rejection
- **後端錯誤追蹤**：自動捕獲未處理的 Exception
- **Zero-Lag 配置**：停用效能追蹤，不影響應用效能
- **環境區分**：development / production 環境分開顯示

## 環境變數設定

### 必要設定

```bash
# 啟用後端 Sentry（必要）
EXCEPTION_HANDLER_DRIVER=SENTRY

# 後端 DSN
SENTRY_DSN=https://xxx@xxx.ingest.de.sentry.io/xxx

# 前端 DSN
VITE_SENTRY_DSN=https://xxx@xxx.ingest.de.sentry.io/xxx

# 環境標識
SENTRY_ENVIRONMENT=production  # 或 development
```

### 可選設定（Zero-Lag 預設值）

```bash
# 效能追蹤取樣率（0 = 停用）
SENTRY_TRACES_SAMPLE_RATE=0
SENTRY_PROFILES_SAMPLE_RATE=0

# 錯誤取樣率（1.0 = 100%）
SENTRY_ERROR_SAMPLE_RATE=1.0
```

## 檔案位置

| 檔案 | 說明 |
|------|------|
| `packages/twenty-front/src/index.tsx` | 前端 Sentry 初始化 |
| `packages/twenty-server/src/instrument.ts` | 後端 Sentry 初始化 |
| `packages/twenty-server/src/engine/core-modules/health/controllers/sentry-test.controller.ts` | 測試 endpoint |
| `docker/dev-flow/aws/env.aws` | AWS 環境變數 |
| `docker/dev-flow/local_build_for_docker/env.local` | 本地環境變數 |

## 測試方式

### 後端測試

瀏覽器打開：
```
http://your-domain:8867/sentry-test/error
http://your-domain:8867/sentry-test/message
```

### 前端測試

在瀏覽器 Console 執行：
```javascript
// 檢查狀態
sentryTest.status()

// 發送測試錯誤
sentryTest.error()

// 發送測試訊息
sentryTest.message()
```

## 技術細節

### Vite 環境變數

`vite.config.ts` 的 `envPrefix` 需要包含 `VITE_`：
```typescript
envPrefix: ['REACT_APP_', 'VITE_'],
```

### Docker Build Args

`docker-compose.yml` 和 `build-amd64-images.sh` 需要傳入：
```yaml
args:
  VITE_SENTRY_DSN: ${VITE_SENTRY_DSN:-}
```

### 後端啟用條件

`instrument.ts` 只在 `EXCEPTION_HANDLER_DRIVER=SENTRY` 時初始化：
```typescript
if (process.env.EXCEPTION_HANDLER_DRIVER === ExceptionHandlerDriver.SENTRY) {
  Sentry.init({ ... });
}
```

## 注意事項

1. **DSN 分開**：前端和後端使用不同的 Sentry Project DSN
2. **環境區分**：`SENTRY_ENVIRONMENT` 用於區分 development/production
3. **效能影響**：Zero-Lag 配置下不會影響應用效能
4. **自動捕獲**：部署後錯誤會自動被捕獲，不需要手動處理

## 相關 Commit

- `feat: 整合 Sentry 錯誤追蹤（前後端）` - 2026-01-03
