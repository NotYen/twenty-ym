# Twenty CRM 完整技術棧清單

> **環境說明**: 本地開發環境 (Yarn 直接運行，非 Docker)
> **檢查日期**: 2025-10-17

## 目錄
- [1. 前端技術](#1-前端技術)
- [2. 後端技術](#2-後端技術)
- [3. API 架構](#3-api-架構)
- [4. Worker & Cron Jobs](#4-worker--cron-jobs)
- [5. 數據庫](#5-數據庫)
- [6. 文件存儲](#6-文件存儲)
- [7. 認證與授權](#7-認證與授權)
- [8. 第三方服務整合](#8-第三方服務整合)
- [9. 監控與追蹤](#9-監控與追蹤)
- [10. 開發與測試工具](#10-開發與測試工具)
- [11. DevOps 與部署](#11-devops-與部署)

---

## 1. 前端技術

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **React** | 18.3.1 | ✅ 使用中 | UI 框架 | 預設啟用 |
| **TypeScript** | 5.9.2 | ✅ 使用中 | 類型安全 | 預設啟用 |
| **Vite** | 7.0.0 | ✅ 使用中 | 構建工具和開發伺服器 | 預設啟用 |
| **Recoil** | 0.7.7 | ✅ 使用中 | 狀態管理 | 預設啟用 |
| **Apollo Client** | 3.7.17 | ✅ 使用中 | GraphQL 客戶端 | 預設啟用 |
| **@wyw-in-js** | 0.7.0 | ✅ 使用中 | 零運行時 CSS-in-JS (Linaria v6) | 預設啟用 |
| **BlockNote** | 0.31.1 | ✅ 使用中 | 區塊式富文本編輯器 | 預設啟用 |
| **TipTap** | 3.4.2 | ✅ 使用中 | 富文本編輯器 | 預設啟用 |
| **Monaco Editor** | 0.51.0 | ✅ 使用中 | 程式碼編輯器 | 預設啟用 |
| **@nivo** | 0.99.0 | ✅ 使用中 | 圖表庫 (bar, line, pie, radial-bar) | 預設啟用 |
| **@xyflow/react** | 12.4.2 | ✅ 使用中 | 流程圖與工作流可視化 | 預設啟用 |
| **React Hook Form** | 7.45.1 | ✅ 使用中 | 表單管理 | 預設啟用 |
| **@lingui** | 5.1.2 | ✅ 使用中 | 國際化 (i18n) | 預設啟用 |
| **Firebase** | 12.4.0 | ✅ 使用中 | Google Analytics 4 (GA4) | 已整合使用 |
| **Vercel AI SDK** | 5.0.49 | ✅ 使用中 | AI 功能集成 | 預設啟用 |

---

## 2. 後端技術

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **Node.js** | 24.5.0 | ✅ 使用中 | JavaScript 運行環境 | 預設啟用 |
| **NestJS** | 9.4.3 | ✅ 使用中 | Node.js 後端框架 | 預設啟用 |
| **Express** | 4.21.2 | ✅ 使用中 | HTTP 伺服器 | 預設啟用 |
| **TypeScript** | 5.9.2 | ✅ 使用中 | 類型安全 | 預設啟用 |
| **TypeORM** | 0.3.20 | ✅ 使用中 | PostgreSQL ORM | 預設啟用 |

---

## 3. API 架構

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **GraphQL** | 16.8.0 | ✅ 使用中 | API 查詢語言 | 預設啟用 |
| **GraphQL Yoga** | 4.0.5 | ✅ 使用中 | GraphQL 伺服器 | 預設啟用 |
| **GraphQL Subscriptions** | 2.0.0 | ✅ 使用中 | 實時訂閱 (WebSocket) | 預設啟用，需 Redis |
| **GraphQL Upload** | 13.0.0 | ✅ 使用中 | 文件上傳支持 | 預設啟用 |
| **Apollo Link REST** | 0.9.0 | ✅ 使用中 | REST API 支持 | 預設啟用 |

---

## 4. Worker & Cron Jobs

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **BullMQ** | 5.40.0 | ✅ 使用中 | 分布式任務隊列 | 預設啟用，需 Redis |
| **@nestjs/schedule** | 3.0.0 | ✅ 使用中 | Cron 任務調度 | 預設啟用，可用環境變數 `DISABLE_CRON_JOBS_REGISTRATION=true` 關閉 |
| **Redis** | 5.6.0 | ✅ 使用中 | 隊列後端存儲 | 預設啟用 |

**Worker 任務類型**:
- ✅ 文件處理
- ❌ Gmail 同步 (需啟用 Google OAuth)
- ❌ Outlook 同步 (需啟用 Microsoft OAuth)
- ❌ Google Calendar 同步 (需啟用)
- ❌ Outlook Calendar 同步 (需啟用)
- ✅ Webhook 處理
- ✅ 數據導入/導出
- ✅ 清理任務

---

## 5. 數據庫

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **PostgreSQL** | 16 | ✅ 使用中 | 主數據庫 | 預設啟用，必需 |
| **Redis** | latest | ✅ 使用中 | 緩存、Session、隊列 | 預設啟用，必需 |
| **ClickHouse** | 1.11.0 | ❌ 未啟用 | 分析數據庫（審計日誌、時間序列數據） | 設置環境變數：<br>`CLICKHOUSE_URL=http://default:password@localhost:8123/twenty`<br>需安裝 ClickHouse 服務 |

**ClickHouse 啟用步驟**:
```bash
# 1. 安裝 ClickHouse (Docker)
docker run -d \
  --name clickhouse \
  -p 8123:8123 \
  -p 9000:9000 \
  clickhouse/clickhouse-server

# 2. 在 .env 文件中設置
CLICKHOUSE_URL=http://default:@localhost:8123/twenty

# 3. 運行遷移
npx nx run twenty-server:clickhouse:migrate:prod

# 4. 重啟服務
```

---

## 6. 文件存儲

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **本地文件系統** | - | ✅ 使用中 | 文件存儲（預設） | 預設啟用<br>存儲路徑: `packages/twenty-server/.local-storage/` |
| **AWS S3** | 3.825.0 | ❌ 未啟用 | 雲端文件存儲 | 設置環境變數：<br>`STORAGE_TYPE=s3`<br>`STORAGE_S3_REGION=us-east-1`<br>`STORAGE_S3_NAME=bucket-name`<br>`STORAGE_S3_ENDPOINT=https://s3.amazonaws.com`<br>`STORAGE_S3_ACCESS_KEY_ID=xxx`<br>`STORAGE_S3_SECRET_ACCESS_KEY=xxx` |
| **sharp** | 0.32.6 | ✅ 使用中 | 圖片處理 | 預設啟用 |
| **archiver** | 7.0.1 | ✅ 使用中 | 文件壓縮 | 預設啟用 |

---

## 7. 認證與授權

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **Passport** | 0.7.0 | ✅ 使用中 | 認證中間件 | 預設啟用 |
| **JWT** | 9.0.2 | ✅ 使用中 | Token 認證 | 預設啟用 |
| **bcrypt** | 5.1.1 | ✅ 使用中 | 密碼加密 | 預設啟用 |
| **express-session** | 1.18.1 | ✅ 使用中 | Session 管理 | 預設啟用 |
| **Google OAuth** | 2.0.0 | ❌ 未啟用 | Google 登入 | 設置環境變數：<br>`AUTH_GOOGLE_ENABLED=true`<br>`AUTH_GOOGLE_CLIENT_ID=xxx`<br>`AUTH_GOOGLE_CLIENT_SECRET=xxx`<br>`AUTH_GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/redirect` |
| **Microsoft OAuth** | 2.1.0 | ❌ 未啟用 | Microsoft 登入 | 設置環境變數：<br>`AUTH_MICROSOFT_ENABLED=true`<br>`AUTH_MICROSOFT_CLIENT_ID=xxx`<br>`AUTH_MICROSOFT_CLIENT_SECRET=xxx`<br>`AUTH_MICROSOFT_CALLBACK_URL=http://localhost:3000/auth/microsoft/redirect` |
| **SAML SSO** | 5.1.0 | ✅ 代碼已整合 | 企業 SSO | 透過管理面板配置，需企業版 |
| **OIDC** | 5.7.0 | ✅ 代碼已整合 | OpenID Connect | 透過管理面板配置，需企業版 |
| **2FA (OTP)** | 12.0.1 | ✅ 使用中 | 雙因素認證 | 預設啟用 |

---

## 8. 第三方服務整合

### 8.1 Google Services

| 服務 | 本地使用狀態 | 用途 | 啟用方式 |
|------|-------------|------|----------|
| **Gmail 整合** | ❌ 未啟用 | 郵件同步 | 設置環境變數：<br>`MESSAGING_PROVIDER_GMAIL_ENABLED=true`<br>`AUTH_GOOGLE_APIS_CALLBACK_URL=http://localhost:3000/auth/google-apis/get-access-token`<br>並配置 Google OAuth |
| **Google Calendar** | ❌ 未啟用 | 日曆同步 | 設置環境變數：<br>`CALENDAR_PROVIDER_GOOGLE_ENABLED=true`<br>並配置 Google OAuth |

### 8.2 Microsoft Services

| 服務 | 本地使用狀態 | 用途 | 啟用方式 |
|------|-------------|------|----------|
| **Outlook 郵件** | ❌ 未啟用 | 郵件同步 | 設置環境變數：<br>`MESSAGING_PROVIDER_MICROSOFT_ENABLED=true`<br>`AUTH_MICROSOFT_APIS_CALLBACK_URL=http://localhost:3000/auth/microsoft-apis/get-access-token`<br>並配置 Microsoft OAuth |
| **Outlook Calendar** | ❌ 未啟用 | 日曆同步 | 設置環境變數：<br>`CALENDAR_PROVIDER_MICROSOFT_ENABLED=true`<br>並配置 Microsoft OAuth |

### 8.3 AWS Services

| 服務 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **AWS S3** | 3.825.0 | ❌ 未啟用 | 文件存儲 | 見「6. 文件存儲」章節 |
| **AWS SES** | 3.888.0 | ❌ 未啟用 | 郵件發送 | 設置環境變數：<br>`EMAIL_DRIVER=ses`<br>`AWS_REGION=us-east-1`<br>`AWS_ACCESS_KEY_ID=xxx`<br>`AWS_SECRET_ACCESS_KEY=xxx` |
| **AWS Lambda** | 3.825.0 | ✅ SDK 已安裝 | 無伺服器函數 | 需透過 serverless functions 功能使用 |

### 8.4 AI Services

| 服務 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **OpenAI** | 2.0.30 | ✅ SDK 已安裝 | AI 助手、文本生成 | 設置環境變數：<br>`OPENAI_API_KEY=sk-xxx` |
| **Anthropic (Claude)** | 2.0.17 | ✅ SDK 已安裝 | AI 助手 | 設置環境變數：<br>`ANTHROPIC_API_KEY=xxx` |
| **xAI (Grok)** | 2.0.19 | ✅ SDK 已安裝 | AI 助手 | 設置環境變數：<br>`XAI_API_KEY=xxx` |

### 8.5 其他服務

| 服務 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **Stripe** | 17.3.1 | ✅ SDK 已安裝 | 支付處理 | 設置環境變數：<br>`STRIPE_API_KEY=sk_xxx`<br>`STRIPE_WEBHOOK_SECRET=whsec_xxx` |
| **Cloudflare** | 4.5.0 | ✅ SDK 已安裝 | CDN、安全防護 | 需要 Cloudflare 帳號配置 |
| **Cal.com** | 1.5.3 | ✅ 使用中 | 會議排程 (前端嵌入) | 預設啟用 |

---

## 9. 監控與追蹤

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **Sentry** | 8.55.0 | ❌ 未啟用 | 錯誤追蹤 | 設置環境變數：<br>`SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx`<br>`SENTRY_FRONT_DSN=https://xxx@xxx.ingest.sentry.io/xxx`<br>`SENTRY_ENVIRONMENT=production` |
| **OpenTelemetry** | 1.9.0 | ✅ SDK 已安裝 | 可觀測性（指標、追蹤） | 設置環境變數：<br>`TELEMETRY_ENABLED=true`<br>`OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` |
| **Grafana** | - | ❌ 未啟用 | 監控儀表板 | 需要安裝 Grafana 服務並配置數據源 |
| **Firebase Analytics** | 12.4.0 | ✅ 使用中 | Google Analytics 4 (GA4) | 已整合，前端自動追蹤 |

---

## 10. 開發與測試工具

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **Nx** | 21.3.11 | ✅ 使用中 | Monorepo 管理 | 預設啟用 |
| **Yarn** | 4.9.2 | ✅ 使用中 | 包管理器 (PnP 模式) | 預設啟用 |
| **Jest** | 29.7.0 | ✅ 使用中 | 單元測試 | `npx nx test <project>` |
| **Playwright** | 1.46.0 | ✅ 使用中 | E2E 測試 | `npx nx e2e twenty-e2e-testing` |
| **Storybook** | 8.6.14 | ✅ 使用中 | UI 組件文檔 | `npx nx storybook:serve twenty-front` |
| **ESLint** | 9.32.0 | ✅ 使用中 | 程式碼檢查 | `npx nx lint <project>` |
| **Prettier** | 3.1.1 | ✅ 使用中 | 程式碼格式化 | 預設啟用 |
| **GraphiQL** | 3.1.1 | ✅ 使用中 | GraphQL 探索器 | 訪問 http://localhost:3000/graphql |
| **MSW** | 2.0.11 | ✅ 使用中 | API Mock (測試用) | 開發時啟用 |

---

## 11. DevOps 與部署

| 技術 | 本地使用狀態 | 用途 | 啟用方式 |
|------|-------------|------|----------|
| **Docker** | ❌ 未使用 | 容器化部署 | 使用 `packages/twenty-docker/docker-compose.yml` |
| **Podman** | ❌ 未使用 | 容器運行時（Docker 替代） | 見 `packages/twenty-docker/podman/` |
| **Kubernetes** | ❌ 未使用 | 容器編排 | 見 `packages/twenty-docker/k8s/` |
| **GitHub Actions** | ✅ 配置存在 | CI/CD | 自動化工作流 |
| **Render** | ❌ 未使用 | 雲端部署平台 | 使用 `render.yaml` 配置 |

---

## 12. 郵件系統

| 技術 | 版本 | 本地使用狀態 | 用途 | 啟用方式 |
|------|------|-------------|------|----------|
| **nodemailer** | 6.9.14 | ✅ 使用中 | 郵件發送 | 預設啟用 (SMTP) |
| **imapflow** | 1.0.187 | ❌ 未啟用 | IMAP 郵件接收 | 啟用 Gmail/Outlook 整合後自動使用 |
| **mailparser** | 3.7.3 | ❌ 未啟用 | 郵件解析 | 啟用郵件整合後自動使用 |
| **@react-email** | 1.2.3 | ✅ 使用中 | 郵件模板 | 預設啟用 |

**SMTP 郵件設置**:
```bash
# 在 .env 文件中設置
EMAIL_DRIVER=smtp
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME="Your Company"
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password
```

---

## 附錄：環境變數完整設置範例

### 基礎配置（已啟用）
```bash
# 服務端口
SERVER_URL=http://localhost:3000
NODE_PORT=3000
REACT_APP_PORT=3001

# 數據庫
PG_DATABASE_URL=postgres://postgres:postgres@localhost:5432/default
REDIS_URL=redis://localhost:6379

# 安全
APP_SECRET=your-secret-key-here

# 存儲
STORAGE_TYPE=local
```

### 可選配置（未啟用，需手動設置）

```bash
# ========== Google 整合 ==========
AUTH_GOOGLE_ENABLED=true
AUTH_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
AUTH_GOOGLE_CLIENT_SECRET=GOCSPX-xxx
AUTH_GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/redirect
AUTH_GOOGLE_APIS_CALLBACK_URL=http://localhost:3000/auth/google-apis/get-access-token

MESSAGING_PROVIDER_GMAIL_ENABLED=true
CALENDAR_PROVIDER_GOOGLE_ENABLED=true

# ========== Microsoft 整合 ==========
AUTH_MICROSOFT_ENABLED=true
AUTH_MICROSOFT_CLIENT_ID=xxx
AUTH_MICROSOFT_CLIENT_SECRET=xxx
AUTH_MICROSOFT_CALLBACK_URL=http://localhost:3000/auth/microsoft/redirect
AUTH_MICROSOFT_APIS_CALLBACK_URL=http://localhost:3000/auth/microsoft-apis/get-access-token

MESSAGING_PROVIDER_MICROSOFT_ENABLED=true
CALENDAR_PROVIDER_MICROSOFT_ENABLED=true

# ========== AWS S3 存儲 ==========
STORAGE_TYPE=s3
STORAGE_S3_REGION=us-east-1
STORAGE_S3_NAME=your-bucket-name
STORAGE_S3_ENDPOINT=https://s3.amazonaws.com
STORAGE_S3_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
STORAGE_S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ========== AWS SES 郵件 ==========
EMAIL_DRIVER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ========== ClickHouse 分析 ==========
CLICKHOUSE_URL=http://default:password@localhost:8123/twenty

# ========== Sentry 錯誤追蹤 ==========
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_FRONT_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production

# ========== OpenTelemetry 監控 ==========
TELEMETRY_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# ========== AI 服務 ==========
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
XAI_API_KEY=xai-xxx

# ========== Stripe 支付 ==========
STRIPE_API_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ========== SMTP 郵件 ==========
EMAIL_DRIVER=smtp
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME="Your Company"
EMAIL_SYSTEM_ADDRESS=system@yourdomain.com
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password
```

---

## 總結

### ✅ 本地環境已啟用的核心技術
- React + TypeScript + Vite (前端)
- NestJS + Express + TypeORM (後端)
- GraphQL + Apollo (API)
- PostgreSQL + Redis (數據庫)
- BullMQ + @nestjs/schedule (任務隊列)
- 本地文件系統 (文件存儲)
- JWT + bcrypt (認證)
- Firebase Analytics (GA4 追蹤)

### ❌ 未啟用但可選的技術
- ClickHouse (分析數據庫)
- AWS S3 (雲端存儲)
- Google/Microsoft OAuth (第三方登入)
- Gmail/Outlook 同步 (郵件整合)
- Google/Outlook Calendar (日曆整合)
- Sentry (錯誤追蹤)
- OpenTelemetry (監控)
- Docker/K8s (容器化部署)

### 📝 建議
1. **生產環境**建議啟用：
   - ClickHouse (審計日誌)
   - AWS S3 (文件存儲)
   - Sentry (錯誤追蹤)
   - Docker (容器化部署)

2. **企業客戶**建議啟用：
   - Google/Microsoft OAuth
   - Gmail/Outlook 整合
   - SAML SSO / OIDC

3. **開發環境**可選：
   - OpenTelemetry (性能分析)
   - Grafana (監控儀表板)

---

**文檔生成時間**: 2025-10-17
**Twenty CRM 版本**: 0.2.1

