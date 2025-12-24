# AWS 部署流程步驟教學

本文件記錄完整的 AWS 部署流程，包含備份、Build Image、Push 到 Docker Hub、部署到 AWS 等步驟。

---

## 目錄

1. [前置準備](#1-前置準備)
2. [備份 AWS 資料庫](#2-備份-aws-資料庫)
3. [清理 AWS Docker 空間（可選）](#3-清理-aws-docker-空間可選)
4. [Build AMD64 Images](#4-build-amd64-images)
5. [Push Images 到 Docker Hub](#5-push-images-到-docker-hub)
6. [更新環境變數配置](#6-更新環境變數配置)
7. [部署到 AWS](#7-部署到-aws)
8. [驗證部署結果](#8-驗證部署結果)
9. [常見問題排解](#9-常見問題排解)

---

## 1. 前置準備

### 1.1 確認 SSH Key 存在

```bash
ls -la ~/.ssh/y-crm-aws-key.pem
```

### 1.2 確認可以連線到 AWS

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
```

### 1.3 確認 Docker Hub 登入

```bash
docker login
```

如果未登入，輸入 Docker Hub 帳號密碼。

---

## 2. 備份 AWS 資料庫

**⚠️ 重要：每次部署前務必先備份資料庫！**

### 2.1 SSH 連線到 AWS

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
```

### 2.2 執行資料庫備份

```bash
# 建立備份檔案名稱（包含日期時間）
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).dump"

# 執行 pg_dump 備份
docker exec Y-CRM-postgres pg_dump -U postgres -d default -Fc > ~/$BACKUP_FILE

# 確認備份檔案大小
ls -lh ~/$BACKUP_FILE
```

### 2.3 下載備份到本機（可選）

在本機執行：

```bash
# 建立本地備份目錄
mkdir -p docker/backups

# 下載備份檔案
scp -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185:~/backup_*.dump docker/backups/
```

### 2.4 還原備份（如需要）

```bash
# 在 AWS 上還原
docker exec -i Y-CRM-postgres pg_restore -U postgres -d default --clean --if-exists < ~/backup_file.dump
```

---

## 3. 清理 AWS Docker 空間（可選）

### 3.1 檢查 Docker 空間使用

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker system df"
```

### 3.2 查看現有 Images

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker images"
```

### 3.3 刪除舊版本 Images

```bash
# 刪除特定舊版本（保留最近 1-2 個版本作為回滾備用）
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker rmi ycrm/y-crm:舊版本tag"
```

### 3.4 清理未使用的資源

```bash
# 清理 dangling images
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker image prune -f"

# 清理所有未使用資源（謹慎使用）
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker system prune -f"
```

---

## 4. Build AMD64 Images

### 4.1 更新 env.aws 中的 Image 版本

編輯 `docker/dev-flow/aws/env.aws`：

```bash
# 更新版本號（格式：b_YYYYMMDD_v版本_aws_image）
FRONTEND_IMAGE_VERSION=f_20251222_v1_aws_image
BACKEND_IMAGE_VERSION=b_20251222_v1_aws_image
```

### 4.2 執行 Build 腳本

```bash
cd /Users/ym/twenty-ym
./docker/dev-flow/aws/build-amd64-images.sh
```

腳本會提示輸入版本號，直接按 Enter 使用預設值，或輸入自訂版本。

### 4.3 Build 時間預估

- **首次 Build（無 cache）**：1-2 小時（跨平台編譯 ARM → AMD64）
- **有 cache 的 Build**：10-30 分鐘

### 4.4 Build 完成確認

```bash
docker images | grep ycrm
```

應該看到新建立的 images：
- `ycrm/y-crm:b_YYYYMMDD_vX_aws_image`
- `ycrm/y-crm:f_YYYYMMDD_vX_aws_image`

---

## 5. Push Images 到 Docker Hub

### 5.1 使用 --push 參數自動 Push

```bash
./docker/dev-flow/aws/build-amd64-images.sh --push
```

### 5.2 手動 Push（如果 Build 時沒有加 --push）

```bash
docker push ycrm/y-crm:b_20251222_v1_aws_image
docker push ycrm/y-crm:f_20251222_v1_aws_image
```

### 5.3 驗證 Push 成功

到 Docker Hub 網站確認：https://hub.docker.com/r/ycrm/y-crm/tags

---

## 6. 更新環境變數配置

### 6.1 編輯 env.aws

檔案位置：`docker/dev-flow/aws/env.aws`

確認以下設定正確：

```bash
# Image 版本
FRONTEND_IMAGE_VERSION=f_20251222_v1_aws_image
BACKEND_IMAGE_VERSION=b_20251222_v1_aws_image

# 多租戶設定
IS_MULTIWORKSPACE_ENABLED=true
IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=true

# 其他環境變數...
```

### 6.2 env.aws 會自動同步

`deploy-to-aws.sh` 腳本會自動將 `env.aws` 上傳到 AWS 作為 `.env`。

---

## 7. 部署到 AWS

### 7.1 執行部署腳本

```bash
./docker/dev-flow/aws/deploy-to-aws.sh \
  --backend-tag b_20251222_v1_aws_image \
  --frontend-tag f_20251222_v1_aws_image
```

### 7.2 部署腳本會自動執行

1. 更新 `docker-compose.aws.yml` 中的 image tags
2. 上傳 `docker-compose.aws.yml` 到 AWS
3. 上傳 `.env`（來自 env.aws）到 AWS
4. `docker compose pull` - 拉取新 images
5. `docker compose up -d` - 啟動服務
6. `yarn database:migrate:prod` - 執行資料庫 migrations
7. `yarn command:prod workspace:sync-metadata` - 同步 metadata
8. `yarn command:prod workspace:seed-sales-quote-views` - 建立報價單 views

### 7.3 部署時間預估

- Pull images：2-5 分鐘
- 啟動服務：1-2 分鐘
- Migration：1-2 分鐘

---

## 8. 驗證部署結果

### 8.1 檢查容器狀態

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'"
```

應該看到所有容器都是 `Up` 狀態。

### 8.2 檢查 Backend 健康狀態

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "curl -s http://localhost:8867/healthz"
```

應該回傳：`{"status":"ok",...}`

### 8.3 檢查 Backend Logs

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker logs Y-CRM-backend --tail 50"
```

### 8.4 訪問前端

瀏覽器打開：http://52.195.151.185.nip.io:8866

### 8.5 檢查資料庫 Migration 結果

```bash
# 檢查特定資料表是否存在
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker exec Y-CRM-postgres psql -U postgres -d default -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'core';\""
```

---

## 9. 常見問題排解

### 9.1 Image Pull 失敗

**錯誤訊息：**
```
failed to resolve reference "docker.io/ycrm/y-crm:xxx": not found
```

**解決方案：**
1. 確認 image 已 push 到 Docker Hub
2. 確認 tag 名稱正確（注意 deploy 腳本可能會加上前綴）
3. 手動修正 `docker-compose.aws.yml` 中的 image tag

### 9.2 Build 卡住超過 90 分鐘

**可能原因：**
- 跨平台編譯（ARM → AMD64）本來就慢
- Docker build cache 問題

**解決方案：**
1. 取消目前的 build（Ctrl+C）
2. 清理 Docker build cache：
   ```bash
   docker builder prune -f
   ```
3. 重新執行 build

### 9.3 Migration 失敗

**解決方案：**
1. 檢查 backend logs：
   ```bash
   ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker logs Y-CRM-backend"
   ```
2. 手動執行 migration：
   ```bash
   ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
     "docker exec Y-CRM-backend yarn database:migrate:prod"
   ```

### 9.4 需要回滾到舊版本

```bash
# 修改 env.aws 中的版本號為舊版本
# 然後重新部署
./docker/dev-flow/aws/deploy-to-aws.sh \
  --backend-tag b_舊版本tag \
  --frontend-tag f_舊版本tag
```

### 9.5 資料庫需要還原

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185

# 停止服務
docker compose -f docker-compose.aws.yml stop backend worker

# 還原資料庫
docker exec -i Y-CRM-postgres pg_restore -U postgres -d default --clean --if-exists < ~/backup_file.dump

# 重啟服務
docker compose -f docker-compose.aws.yml up -d
```

---

## 附錄：相關檔案位置

| 檔案 | 路徑 | 說明 |
|------|------|------|
| Build 腳本 | `docker/dev-flow/aws/build-amd64-images.sh` | Build AMD64 images |
| Deploy 腳本 | `docker/dev-flow/aws/deploy-to-aws.sh` | 部署到 AWS |
| AWS 環境變數 | `docker/dev-flow/aws/env.aws` | AWS 環境設定 |
| Docker Compose | `docker/dev-flow/aws/docker-compose.aws.yml` | AWS Docker 配置 |
| 本地備份目錄 | `docker/backups/` | 資料庫備份檔案 |

---

## 10. 2025-12-22/23 部署問題總結（v1~v5）

本節記錄從 v1 到 v5 部署過程中遇到的所有問題及解決方案。

### 10.1 v1 問題：TimelineActivityWorkspaceEntity 未 import

**錯誤訊息：**
```
Cannot find name 'TimelineActivityWorkspaceEntity'
```

**問題檔案：**
`packages/twenty-server/src/modules/sales-quote/standard-objects/sales-quote-line-item.workspace-entity.ts`

**解決方案：**
```typescript
// 新增 import
import { TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';
```

**Commit：** `0029b4dd14`

---

### 10.2 v2 問題：Sales Quote View 檔案被意外刪除

**錯誤訊息：**
```
Cannot find module '@/views/sales-quotes-all.view'
```

**問題原因：**
Cherry-pick 過程中意外刪除了以下檔案：
- `packages/twenty-front/src/modules/views/sales-quotes-all.view.ts`
- `packages/twenty-front/src/modules/views/sales-quote-line-items-all.view.ts`

**解決方案：**
重新建立這兩個 view 檔案。

**Commit：** `737e48373b`

---

### 10.3 v3 問題：Google OAuth Strategies 缺少 Logger import

**錯誤訊息：**
```
Cannot find name 'Logger'
```

**問題檔案：**
- `packages/twenty-server/src/engine/core-modules/auth/strategies/google.auth.strategy.ts`
- `packages/twenty-server/src/engine/core-modules/auth/strategies/microsoft.auth.strategy.ts`

**解決方案：**
```typescript
// 新增 import
import { Logger } from '@nestjs/common';
```

**Commit：** `680f12a7e8`

---

### 10.4 v3 問題：isDefined 未 import

**錯誤訊息：**
```
Cannot find name 'isDefined'
```

**問題檔案：**
`packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/filter/utils/evaluate-filter-conditions.util.ts`

**解決方案：**
```typescript
// 新增 import
import { isDefined } from 'twenty-shared/utils';
```

**Commit：** `42a7b4d285`

---

### 10.5 儀表板 Widget 資料庫問題

#### 10.5.1 configurationType 缺失

**問題：**
舊的 GRAPH widget 沒有 `configurationType` 欄位，導致前端無法正確渲染。

**診斷 SQL：**
```sql
SELECT id, "graphType", "configurationType"
FROM core."pageLayoutWidget"
WHERE type = 'GRAPH' AND "configurationType" IS NULL;
```

**修復 SQL：**
```sql
UPDATE core."pageLayoutWidget"
SET "configurationType" = 'CHART_CONFIG'
WHERE type = 'GRAPH' AND "configurationType" IS NULL;
```

#### 10.5.2 graphType 值不正確

**問題：**
舊資料使用了已棄用的 graphType 值。

**修復 SQL：**
```sql
-- NUMBER → AGGREGATE
UPDATE core."pageLayoutWidget"
SET "graphType" = 'AGGREGATE'
WHERE "graphType" = 'NUMBER';

-- BAR → VERTICAL_BAR
UPDATE core."pageLayoutWidget"
SET "graphType" = 'VERTICAL_BAR'
WHERE "graphType" = 'BAR';
```

---

### 10.6 GraphQL GroupBy Query 缺少 limit 參數

**錯誤訊息：**
```json
{"errors": [{"message": "Unknown argument \"limit\" on field \"Query.salesquotesGroupBy\"."}]}
```

**問題原因：**
前端程式碼使用了 `limit` 參數，但後端 GraphQL schema 沒有這個參數。

**解決方案：**
需要重新 build image 並部署，讓後端 schema 與前端程式碼同步。

**關鍵：** 確保 `metadataVersion` 增加以強制重新生成 GraphQL schema：
```sql
UPDATE core.workspace SET "metadataVersion" = "metadataVersion" + 1;
```

---

### 10.7 Feature Flags 問題

#### 10.7.1 IS_DASHBOARD_V2_ENABLED 未生效

**問題：**
資料庫中有 `IS_DASHBOARD_V2_ENABLED = true`，但前端 API response 沒有返回這個 flag，導致 Pie/Line/Gauge 圖表類型反灰。

**診斷方法：**

1. 檢查資料庫：
```sql
SELECT key, value FROM core."featureFlag"
WHERE "workspaceId" = '3be9d202-5461-4881-a6de-4c1f96e4b02d'
AND key = 'IS_DASHBOARD_V2_ENABLED';
```

2. 檢查前端 API response（瀏覽器 DevTools > Network > 搜尋 `GetCurrentUser`）

3. 檢查 localStorage（Console）：
```javascript
JSON.parse(localStorage.getItem('recoil-persist'))?.currentWorkspaceState?.featureFlags?.find(f => f.key === 'IS_DASHBOARD_V2_ENABLED')
```

**解決方案：**
重啟 backend 和 worker 容器以清除 Redis cache：
```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 "docker restart Y-CRM-backend Y-CRM-worker"
```

#### 10.7.2 新增缺少的 Feature Flags

**需要的 Feature Flags：**
```sql
INSERT INTO core."featureFlag" (id, key, value, "workspaceId", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'IS_DASHBOARD_V2_ENABLED', true, 'WORKSPACE_ID', NOW(), NOW()),
  (gen_random_uuid(), 'IS_APPLICATION_ENABLED', true, 'WORKSPACE_ID', NOW(), NOW()),
  (gen_random_uuid(), 'IS_WORKFLOW_RUN_STOPPAGE_ENABLED', true, 'WORKSPACE_ID', NOW(), NOW()),
  (gen_random_uuid(), 'IS_RECORD_PAGE_LAYOUT_ENABLED', true, 'WORKSPACE_ID', NOW(), NOW());
```

---

### 10.8 Pie Chart 設定顯示值顛倒

**問題：**
Pie Chart 設定頁面的「顯示的數據」和「每個切片代表」選中後顯示的值是顛倒的。

**問題檔案：**
`packages/twenty-front/src/modules/command-menu/pages/page-layout/hooks/useChartSettingsValues.ts`

**問題原因：**
```typescript
// 錯誤：EACH_SLICE_REPRESENTS 返回 aggregateField
case CHART_CONFIGURATION_SETTING_IDS.EACH_SLICE_REPRESENTS:
  return aggregateField?.label;  // ❌ 應該返回 groupByField

// 錯誤：DATA_ON_DISPLAY_PIE_CHART 返回 groupByField
case CHART_CONFIGURATION_SETTING_IDS.DATA_ON_DISPLAY_PIE_CHART:
  return groupByField?.label;  // ❌ 應該返回 aggregateField
```

**解決方案：**
交換這兩個 case 的返回值：
- `DATA_ON_DISPLAY_PIE_CHART` → 返回 `aggregateField`（聚合欄位）
- `EACH_SLICE_REPRESENTS` → 返回 `groupByField`（分組欄位）

---

### 10.9 Apollo Cache Warning

**警告訊息：**
```
Cache data may be lost when replacing the dashboards field of a Query object.
```

**問題原因：**
Apollo Client cache 配置問題，當 `DashboardConnection` 物件被替換時會觸發警告。

**影響：**
不影響功能，只是警告訊息。

**解決方案（可選）：**
在 Apollo Client 配置中為 `Query.dashboards` 定義 custom merge function。

---

### 10.10 Build Script 環境變數問題

**問題：**
`build-amd64-images.sh` 沒有正確讀取 `env.aws` 中的 `VITE_IS_DEBUG_MODE`。

**問題原因：**
Build script 中 `VITE_IS_DEBUG_MODE` 是 hardcoded 為 `false`。

**解決方案：**
修改 `build-amd64-images.sh`，從 `env.aws` 讀取環境變數：
```bash
# 在 build 前 source env 檔案
source "${ENV_SELECTED_FILE}"

# 使用環境變數
--build-arg VITE_IS_DEBUG_MODE="${VITE_IS_DEBUG_MODE:-false}"
```

---

### 10.11 workspace_config 進階設定參數

**可設定的參數（共 20 個）：**

| 分類 | 參數 Key | 用途 |
|------|----------|------|
| **Email (SMTP)** | `EMAIL_SMTP_HOST` | SMTP 伺服器 |
| | `EMAIL_SMTP_PORT` | SMTP 埠號 |
| | `EMAIL_SMTP_USER` | SMTP 使用者 |
| | `EMAIL_SMTP_PASSWORD` | SMTP 密碼 |
| | `EMAIL_SMTP_NO_TLS` | 停用 TLS |
| **LINE** | `LINE_CHANNEL_ACCESS_TOKEN` | LINE 存取權杖 |
| | `LINE_CHANNEL_SECRET` | LINE 頻道密鑰 |
| **Google OAuth** | `AUTH_GOOGLE_CLIENT_ID` | Google Client ID |
| | `AUTH_GOOGLE_CLIENT_SECRET` | Google Client Secret |
| | `AUTH_GOOGLE_CALLBACK_URL` | Google OAuth Callback |
| | `AUTH_GOOGLE_APIS_CALLBACK_URL` | Google APIs Callback |
| **Microsoft OAuth** | `AUTH_MICROSOFT_CLIENT_ID` | Microsoft Client ID |
| | `AUTH_MICROSOFT_CLIENT_SECRET` | Microsoft Client Secret |
| **AI** | `OPENAI_API_KEY` | OpenAI API Key |
| | `ANTHROPIC_API_KEY` | Anthropic API Key |
| | `XAI_API_KEY` | xAI API Key |
| **Firebase** | `REACT_APP_FIREBASE_*` | Firebase Analytics 設定 |

**Fallback 邏輯：**
1. 先從 `workspace_config` 表讀取（workspace 專屬設定）
2. 如果沒有設定，fallback 到全域環境變數

---

## 版本歷史

| 日期 | 版本 | 說明 |
|------|------|------|
| 2025-12-22 | v1 | 單租戶轉多租戶部署，新增 workspace_config 資料表 |
| 2025-12-22 | v2 | 修復 Sales Quote View 檔案缺失 |
| 2025-12-22 | v3 | 修復 Logger import、isDefined import |
| 2025-12-23 | v5 | 修復 GraphQL limit 參數、Feature Flags、Pie Chart 設定顯示 |
| 2025-12-23 | v6 | 修復 Google Account Sync workspaceId 參數缺失問題 |
| 2025-12-23 | v7 | 修復 prefill-core-views 缺少報價單 views、CSV 匯出中文亂碼 |

---

### 10.12 v6 問題：Google Account Sync workspaceId 參數缺失

**錯誤訊息：**
```
TypeError: Cannot read properties of undefined (reading 'substring')
at WorkspaceConfigService.get
at GoogleOAuth2ClientManagerService.getOAuth2Client
```

**問題原因：**
在 commit `ea4250e0bc` 中，修改了 `getGoogleOAuth2Client` 需要 `workspaceId` 參數，但沒有修改所有調用者來傳遞這個參數。

**調用鏈分析：**
```
GmailGetAllFoldersService.getAllMessageFolders(connectedAccount)  // ❌ 缺少 workspaceId
  → OAuth2ClientManagerService.getGoogleOAuth2Client(connectedAccount, workspaceId)
    → GoogleOAuth2ClientManagerService.getOAuth2Client(refreshToken, workspaceId)
      → WorkspaceConfigService.get(workspaceId, key)  // workspaceId 是 undefined
        → workspaceId.substring(0, 8)  // 💥 報錯！
```

**受影響的檔案（需要修復）：**

| 檔案 | 問題 |
|------|------|
| `gmail-get-all-folders.service.ts` | `getAllMessageFolders` 缺少 `workspaceId` 參數 |
| `sync-message-folders.service.ts` | `discoverAllFolders` 缺少 `workspaceId` 參數 |
| `messaging-send-message.service.ts` | `sendMessage` 缺少 `workspaceId` 參數 |
| `send-email-tool.ts` | 調用 `sendMessage` 時沒有傳遞 `workspaceId` |
| `google-email-alias-manager.service.ts` | `getHandleAliases` 缺少 `workspaceId` 參數 |
| `email-alias-manager.service.ts` | `refreshHandleAliases` 缺少 `workspaceId` 參數 |
| `messaging-messages-import.service.ts` | 調用 `refreshHandleAliases` 時沒有傳遞 `workspaceId` |
| `workspace-config.service.ts` | `get` 方法沒有防護 undefined workspaceId |

**解決方案：**

1. 為所有缺少 `workspaceId` 的方法添加可選參數
2. 在調用鏈中傳遞 `workspaceId`
3. 在 `WorkspaceConfigService.get` 中添加 undefined 防護

**修復範例：**

```typescript
// gmail-get-all-folders.service.ts
async getAllMessageFolders(
  connectedAccount: Pick<...>,
  workspaceId?: string,  // 新增參數
): Promise<MessageFolder[]> {
  const oAuth2Client = await this.oAuth2ClientManagerService.getGoogleOAuth2Client(
    connectedAccount,
    workspaceId ?? '',  // 傳遞 workspaceId
  );
  // ...
}

// workspace-config.service.ts
async get(workspaceId: string, key: string, defaultValue?: string): Promise<string | null> {
  // 防護 undefined workspaceId
  if (!workspaceId) {
    this.logger.debug(`[GET] No workspaceId provided for key "${key}", returning null`);
    return defaultValue ?? null;
  }
  // ...
}
```

**為什麼本機沒有報錯？**
- 本機沒有連接 Google Account，或沒有觸發 Gmail folder sync 操作
- AWS 上有 5 個 Google connected accounts，當系統嘗試同步時就會觸發這個 bug

**教訓：**
修改底層函數的參數時，必須同時修改所有調用者，否則會導致運行時錯誤。

---

### 10.13 v7 問題：新建 Workspace 沒有報價單 Views

**問題現象：**
新建立的 workspace 左側選單沒有「報價單列表」和「報價單細項列表」。

**問題原因：**
`prefill-core-views.ts` 中的 `views` 陣列**沒有包含** `salesQuotesAllView` 和 `salesQuoteLineItemsAllView`！

```typescript
// packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/prefill-core-views.ts
// 修改前：views 陣列沒有報價單 views
const views = [
  companiesAllView(objectMetadataItems, true),
  // ... 其他 views
  calendarEventsAllView(objectMetadataItems, true),
  // ❌ 沒有 salesQuotesAllView
  // ❌ 沒有 salesQuoteLineItemsAllView
];
```

**為什麼本機轉多租戶時沒發現？**
- 本機的舊 workspace 是從單租戶遷移過來的，資料庫中已經有這些 views
- 只有**新建立的 workspace** 才會呼叫 `prefillCoreViews()`，才會發現缺少

**解決方案：**
在 `prefill-core-views.ts` 中加入 import 和 views：

```typescript
// 新增 import
import { salesQuoteLineItemsAllView } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/sales-quote-line-items-all.view';
import { salesQuotesAllView } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/sales-quotes-all.view';

// 在 views 陣列中加入
const views = [
  // ... 其他 views
  calendarEventsAllView(objectMetadataItems, true),
  salesQuotesAllView(objectMetadataItems, true),        // ✅ 新增
  salesQuoteLineItemsAllView(objectMetadataItems, true), // ✅ 新增
];
```

**修復後效果：**
- ✅ 新建的 workspace 會自動包含報價單和報價單細項的 views
- ✅ 不需要再手動執行 `yarn command:prod workspace:seed-sales-quote-views`

**⚠️ 注意：現有 workspace 的補救**
對於已經存在但缺少報價單 views 的 workspace，仍需執行一次補救命令：
```bash
yarn command:prod workspace:seed-sales-quote-views
```

**📌 重要提醒：**
v7 之後部署到新機器，新建的 workspace 會自動有報價單 views，**不需要再執行** `workspace:seed-sales-quote-views` 補救命令了！

---

### 10.14 v7 問題：CSV 匯出中文亂碼

**問題現象：**
從系統匯出 CSV 檔案後，用 Excel 開啟中文顯示亂碼。

**問題原因：**
CSV 匯出時沒有加上 UTF-8 BOM（Byte Order Mark），Excel 預設用系統編碼（如 Big5）解析導致亂碼。

**受影響的檔案：**
- `packages/twenty-front/src/modules/object-record/record-index/export/hooks/useRecordIndexExportRecords.ts`
- `packages/twenty-front/src/modules/spreadsheet-import/steps/components/UploadStep/hooks/useDownloadFakeRecords.ts`

**解決方案：**
在 CSV 內容前加上 UTF-8 BOM (`\uFEFF`) 並設定正確的 charset：

```typescript
// 修改前
const blob = new Blob([csvContent], { type: 'text/csv' });

// 修改後
const BOM = '\uFEFF';  // UTF-8 BOM
const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
```

**為什麼需要 BOM？**
- UTF-8 BOM 是一個特殊的字元序列 (EF BB BF)
- Excel 看到這個序列就知道要用 UTF-8 編碼解析
- 沒有 BOM 的話，Excel 會用系統預設編碼（Windows 繁體中文是 Big5）

---

### 10.15 部署後必要的補救命令

**⚠️ 僅適用於 v7 之前建立的 workspace：**

```bash
# 1. 同步 Feature Flags（確保所有功能開關正確）
yarn command:prod workspace:sync-feature-flags

# 2. 為現有 workspace 補上報價單 views（僅 v7 之前建立的 workspace 需要）
yarn command:prod workspace:seed-sales-quote-views
```

**📌 v7 之後新建的 workspace 不需要執行這些補救命令！**

---

*最後更新：2025-12-23*


---

### 10.16 v8 問題：新建 Workspace 的 databaseSchema 和中文 Label

**問題現象：**
1. Calleen公司 和 Ryan公司 的 `workspace.databaseSchema` 欄位為空
2. 新建的 workspace 左側選單顯示英文 "Sales Quote" 而不是中文 "報價單"
3. 查詢 favorites 時報錯：`column favorite.salesquoteId does not exist`

**問題分析：**

#### 10.16.1 databaseSchema 欄位問題

**診斷 SQL：**
```sql
SELECT id, "displayName", "databaseSchema"
FROM core.workspace
WHERE "displayName" IN ('Y-CRM', 'Calleen公司', 'Ryan公司');
```

**發現：**
- Y-CRM 有 `databaseSchema`：`workspace_3joxkr9ofo5hlxjan164egffx`
- Calleen公司 和 Ryan公司 的 `databaseSchema` 為空

**原因分析：**
- Twenty ORM 實際使用 `core.dataSource.schema` 來取得 workspace schema
- `workspace.databaseSchema` 是冗餘欄位（舊版本遺留）
- 但某些查詢可能仍依賴這個欄位

**修復 SQL：**
```sql
-- 先確認 dataSource 表中的 schema 對應
SELECT
    w."displayName",
    ds.schema,
    ds."workspaceId"
FROM core."dataSource" ds
JOIN core.workspace w ON ds."workspaceId" = w.id
ORDER BY w."displayName";

-- 更新 Calleen公司 的 databaseSchema
UPDATE core.workspace
SET "databaseSchema" = 'workspace_qboo9ppaeg4cydsnxf46dws0'
WHERE id = '0c59fbf1-a4aa-4ef4-af68-420780fd6d30';

-- 更新 Ryan公司 的 databaseSchema
UPDATE core.workspace
SET "databaseSchema" = 'workspace_ajgo83c7a59te56ig55ofd7zo'
WHERE id = 'b20b4b4d-397d-468a-a5fc-5bd79353c8b4';
```

#### 10.16.2 中文 Label 問題

**診斷 SQL：**
```sql
SELECT
    w."displayName",
    om."nameSingular",
    om."labelSingular",
    om."labelPlural"
FROM core."objectMetadata" om
JOIN core.workspace w ON om."workspaceId" = w.id
WHERE om."nameSingular" IN ('salesQuote', 'salesQuoteLineItem')
ORDER BY w."displayName", om."nameSingular";
```

**發現：**
- Y-CRM 顯示中文：`報價單`、`報價單列表`
- Calleen公司/Ryan公司 顯示英文：`Sales Quote`、`Sales Quotes`

**原因：**
- Y-CRM 是舊 workspace，之前手動修改過 label
- Calleen公司/Ryan公司 是新建的，使用程式碼中的預設值（英文）

**修復方案：**

**方案 A：修改程式碼（推薦）**

修改 `packages/twenty-server/src/modules/sales-quote/standard-objects/sales-quote.workspace-entity.ts`：
```typescript
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.salesQuote,
  namePlural: 'salesQuotes',
  labelSingular: msg`報價單`,      // 改為中文
  labelPlural: msg`報價單列表`,    // 改為中文
  // ...
})
```

修改 `packages/twenty-server/src/modules/sales-quote/standard-objects/sales-quote-line-item.workspace-entity.ts`：
```typescript
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.salesQuoteLineItem,
  namePlural: 'salesQuoteLineItems',
  labelSingular: msg`報價單細項`,      // 改為中文
  labelPlural: msg`報價單細項列表`,    // 改為中文
  // ...
})
```

**方案 B：手動更新資料庫（現有 workspace）**

```sql
-- 更新 Calleen公司 的 salesQuote label
UPDATE core."objectMetadata"
SET "labelSingular" = '報價單', "labelPlural" = '報價單列表'
WHERE "workspaceId" = '0c59fbf1-a4aa-4ef4-af68-420780fd6d30'
AND "nameSingular" = 'salesQuote';

-- 更新 Calleen公司 的 salesQuoteLineItem label
UPDATE core."objectMetadata"
SET "labelSingular" = '報價單細項', "labelPlural" = '報價單細項列表'
WHERE "workspaceId" = '0c59fbf1-a4aa-4ef4-af68-420780fd6d30'
AND "nameSingular" = 'salesQuoteLineItem';

-- 更新 Ryan公司 的 salesQuote label
UPDATE core."objectMetadata"
SET "labelSingular" = '報價單', "labelPlural" = '報價單列表'
WHERE "workspaceId" = 'b20b4b4d-397d-468a-a5fc-5bd79353c8b4'
AND "nameSingular" = 'salesQuote';

-- 更新 Ryan公司 的 salesQuoteLineItem label
UPDATE core."objectMetadata"
SET "labelSingular" = '報價單細項', "labelPlural" = '報價單細項列表'
WHERE "workspaceId" = 'b20b4b4d-397d-468a-a5fc-5bd79353c8b4'
AND "nameSingular" = 'salesQuoteLineItem';
```

#### 10.16.3 sync-metadata 補齊缺失的 fieldMetadata

**問題：**
Calleen公司 和 Ryan公司 缺少 `favorite.salesQuote` 的 fieldMetadata。

**解決方案：**
```bash
# 為 Calleen公司 同步 metadata
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata -w 0c59fbf1-a4aa-4ef4-af68-420780fd6d30

# 為 Ryan公司 同步 metadata
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata -w b20b4b4d-397d-468a-a5fc-5bd79353c8b4
```

#### 10.16.4 清除 Redis Cache

**重要：** 修改資料庫後必須清除 Redis cache 並重啟服務！

```bash
# 清除 Redis cache
docker exec Y-CRM-redis redis-cli FLUSHALL

# 重啟 backend 和 worker
docker restart Y-CRM-backend Y-CRM-worker
```

---

### 10.17 Twenty 多租戶架構說明

#### 10.17.1 資料隔離機制

| 層級 | 說明 |
|------|------|
| **Schema 隔離** | 每個 workspace 有獨立的 PostgreSQL schema（如 `workspace_xxx`） |
| **Metadata 隔離** | 每個 workspace 有獨立的 objectMetadata 和 fieldMetadata |
| **資料隔離** | 不同 workspace 的資料完全隔離，不會互通 |

#### 10.17.2 關鍵資料表關係

```
core.workspace
  ├── id (workspace UUID)
  ├── displayName (顯示名稱)
  ├── databaseSchema (冗餘欄位，實際不使用)
  └── metadataVersion (metadata 版本號)

core.dataSource
  ├── workspaceId (關聯 workspace)
  └── schema (實際的 schema 名稱，ORM 使用這個)

core.objectMetadata
  ├── workspaceId (關聯 workspace)
  ├── nameSingular (物件名稱，如 salesQuote)
  ├── labelSingular (顯示名稱，如 報價單)
  ├── labelPlural (複數顯示名稱，如 報價單列表)
  ├── standardId (標準物件 ID，用於識別)
  └── isCustom (是否為自訂物件)

core.fieldMetadata
  ├── workspaceId (關聯 workspace)
  ├── objectMetadataId (關聯 objectMetadata)
  ├── name (欄位名稱)
  └── settings (包含 joinColumnName 等設定)
```

#### 10.17.3 新建 Workspace 流程

```
用戶建立 workspace
    ↓
WorkspaceManagerService.init()
    ↓
1. createWorkspaceDBSchema() - 建立 PostgreSQL schema
    ↓
2. createDataSourceMetadata() - 在 core.dataSource 建立記錄
    ↓
3. workspaceSyncMetadataService.synchronize() - 同步 metadata
    ↓
4. prefillWorkspaceWithStandardObjectsRecords() - 建立預設資料和 views
```

#### 10.17.4 什麼時候需要手動 sync-metadata？

| 情況 | 需要手動操作？ |
|-----|--------------|
| 新建 workspace | ❌ 自動同步 |
| 修改程式碼後（新增欄位/物件） | ✅ 需要 `workspace:sync-metadata` |
| 資料庫 metadata 被手動修改 | ✅ 需要修復或 sync |
| 升級 Twenty 版本 | ✅ 通常需要 migration + sync |

---

### 10.18 v8 部署後必要的補救命令

**⚠️ 僅適用於 v8 之前建立的 workspace：**

```bash
# 1. 更新 databaseSchema（如果為空）
docker exec Y-CRM-postgres psql -U postgres -d default -c "
UPDATE core.workspace w
SET \"databaseSchema\" = ds.schema
FROM core.\"dataSource\" ds
WHERE w.id = ds.\"workspaceId\"
AND (w.\"databaseSchema\" IS NULL OR w.\"databaseSchema\" = '');
"

# 2. 更新中文 Label
docker exec Y-CRM-postgres psql -U postgres -d default -c "
UPDATE core.\"objectMetadata\"
SET \"labelSingular\" = '報價單', \"labelPlural\" = '報價單列表'
WHERE \"nameSingular\" = 'salesQuote';

UPDATE core.\"objectMetadata\"
SET \"labelSingular\" = '報價單細項', \"labelPlural\" = '報價單細項列表'
WHERE \"nameSingular\" = 'salesQuoteLineItem';
"

# 3. 為所有 workspace 同步 metadata
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata

# 4. 清除 Redis cache 並重啟服務
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

**📌 v8 之後新建的 workspace 會自動：**
- ✅ 有正確的 databaseSchema
- ✅ 顯示中文 Label（報價單、報價單細項）
- ✅ 有完整的 metadata

---

## 版本歷史（更新）

| 日期 | 版本 | 說明 |
|------|------|------|
| 2025-12-22 | v1 | 單租戶轉多租戶部署，新增 workspace_config 資料表 |
| 2025-12-22 | v2 | 修復 Sales Quote View 檔案缺失 |
| 2025-12-22 | v3 | 修復 Logger import、isDefined import |
| 2025-12-23 | v5 | 修復 GraphQL limit 參數、Feature Flags、Pie Chart 設定顯示 |
| 2025-12-23 | v6 | 修復 Google Account Sync workspaceId 參數缺失問題 |
| 2025-12-23 | v7 | 修復 prefill-core-views 缺少報價單 views、CSV 匯出中文亂碼 |
| 2025-12-24 | v8 | 修復新建 workspace 的 databaseSchema 和中文 Label 問題 |

---

*最後更新：2025-12-24*
