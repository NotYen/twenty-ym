# LINE OA 整合 - Phase 1 技術說明文件

## 📋 概述

**Phase 1: 基礎建設** 已完成，此階段建立了 LINE Official Account 整合功能的底層基礎設施，包括模組架構、設定管理、加密機制和環境配置。

**完成日期**: 2025-11-17
**狀態**: ✅ 已完成

---

## 🎯 Phase 1 完成項目

### 1.1 ✅ LineIntegrationModule 骨架

**檔案路徑**: `packages/twenty-server/src/modules/line-integration/line-integration.module.ts`

**功能描述**:
- 建立完整的 NestJS 模組結構
- 註冊所有必要的 Service、Controller、Guard 和 Resolver
- 配置 HttpModule 用於 LINE API 呼叫
- 註冊 TypeORM Entity (LineChannelConfigEntity)

**模組依賴**:
```typescript
imports: [
  HttpModule.register({ timeout: 5000, maxRedirects: 5 }),
  TypeOrmModule.forFeature([LineChannelConfigEntity]),
]
```

**已註冊到主模組**: `packages/twenty-server/src/modules/modules.module.ts`

---

### 1.2 ✅ LineConfigService (含加密)

#### 1.2.1 LineChannelConfigEntity (資料庫實體)

**檔案路徑**: `packages/twenty-server/src/modules/line-integration/entities/line-channel-config.entity.ts`

**資料表結構**:
```sql
TABLE core.lineChannelConfig (
  id UUID PRIMARY KEY,
  channelId VARCHAR NOT NULL,
  channelSecretEncrypted TEXT NOT NULL,      -- 加密儲存
  channelAccessTokenEncrypted TEXT NOT NULL, -- 加密儲存
  workspaceId UUID UNIQUE NOT NULL,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
)

INDEX IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID ON workspaceId;
INDEX IDX_LINE_CHANNEL_CONFIG_WORKSPACE_ID_UNIQUE UNIQUE ON workspaceId;
```

**安全設計**:
- 敏感資料 (Secret, Token) 在資料庫中以加密形式儲存
- 支援多租戶隔離 (透過 workspaceId)

#### 1.2.2 LineEncryptionService (加密服務)

**檔案路徑**: `packages/twenty-server/src/modules/line-integration/services/line-encryption.service.ts`

**加密規格**:
- **演算法**: AES-256-GCM
- **IV 長度**: 16 bytes (隨機產生)
- **Auth Tag 長度**: 16 bytes
- **Master Key**: 32 bytes (從環境變數 `LINE_CONFIG_ENCRYPTION_KEY` 取得)

**加密格式**:
```
iv:authTag:encryptedData
(全部使用 base64 編碼)
```

**核心方法**:
- `encrypt(plaintext: string): string` - 加密明文
- `decrypt(encrypted: string): string` - 解密密文
- `static generateKey(): string` - 產生新的加密金鑰 (工具方法)

**安全特性**:
- 每次加密使用不同的 IV，相同明文產生不同密文
- 使用 GCM 模式確保資料完整性 (防篡改)
- 啟動時驗證 Master Key 長度

#### 1.2.3 LineConfigService (設定管理服務)

**檔案路徑**: `packages/twenty-server/src/modules/line-integration/services/line-config.service.ts`

**核心方法**:

1. **`createOrUpdate(workspaceId, configData)`**
   - 建立或更新 LINE Channel 設定
   - 自動加密 `channelSecret` 和 `channelAccessToken`
   - 支援 Upsert 語意 (存在則更新，不存在則新增)

2. **`getDecryptedConfig(workspaceId)`** ⚠️ 僅供後端內部使用
   - 取得解密後的完整設定
   - 用於 LINE API 呼叫和 Webhook 簽章驗證
   - 解密失敗時拋出錯誤

3. **`getPublicConfig(workspaceId)`**
   - 取得公開設定 (不包含敏感資訊)
   - 僅返回 `channelId` 和 `isConfigured` 狀態
   - 供前端 UI 使用

4. **`delete(workspaceId)`**
   - 刪除 LINE Channel 設定

**錯誤處理**:
- 所有操作都有適當的日誌記錄
- 解密失敗時記錄錯誤但不洩露敏感資訊

---

### 1.3 ⚠️ Person 實體擴充與 Migration (待實作)

**狀態**: 已規劃，待執行

**原因**: Twenty CRM 使用動態元數據系統，Person 實體的擴充需要更深入了解 `WorkspaceEntity` 裝飾器系統和標準欄位 ID 的生成機制。

**已規劃的欄位**:

```typescript
// 待新增至 PersonWorkspaceEntity
@WorkspaceField({
  standardId: '待生成-line-user-id',
  type: FieldMetadataType.TEXT,
  label: msg`LINE User ID`,
  description: msg`LINE Official Account User ID`,
  icon: 'IconBrandLine',
})
@WorkspaceIsNullable()
@WorkspaceIsUnique()
lineUserId: string | null;

@WorkspaceField({
  standardId: '待生成-line-display-name',
  type: FieldMetadataType.TEXT,
  label: msg`LINE Display Name`,
  description: msg`LINE display name`,
  icon: 'IconUser',
})
@WorkspaceIsNullable()
lineDisplayName: string | null;

@WorkspaceField({
  standardId: '待生成-line-profile-picture-url',
  type: FieldMetadataType.TEXT,
  label: msg`LINE Profile Picture`,
  description: msg`LINE profile picture URL`,
  icon: 'IconPhoto',
})
@WorkspaceIsNullable()
lineProfilePictureUrl: string | null;

@WorkspaceField({
  standardId: '待生成-line-status',
  type: FieldMetadataType.TEXT,
  label: msg`LINE Status`,
  description: msg`LINE friendship status: active, blocked, unlinked`,
  icon: 'IconStatusChange',
  defaultValue: 'unlinked',
})
@WorkspaceIsNullable()
lineStatus: 'active' | 'blocked' | 'unlinked' | null;

@WorkspaceField({
  standardId: '待生成-last-line-interaction-at',
  type: FieldMetadataType.DATE_TIME,
  label: msg`Last LINE Interaction`,
  description: msg`Last interaction timestamp with LINE OA`,
  icon: 'IconClock',
})
@WorkspaceIsNullable()
lastLineInteractionAt: Date | null;
```

**Migration 流程 (待執行)**:
```bash
# 步驟 1: 修改 PersonWorkspaceEntity 新增上述欄位
# 步驟 2: 產生 Migration 檔案
npx nx run twenty-server:typeorm migration:generate \
  src/database/typeorm/core/migrations/common/AddLineFieldsToPerson \
  -d src/database/typeorm/core/core.datasource.ts

# 步驟 3: 檢查產生的 Migration SQL
# 步驟 4: 執行 Migration
npx nx run twenty-server:database:migrate
```

**⚠️ 重要提醒**:
- Twenty CRM 的 Person 是 `WorkspaceEntity`，不是標準的 TypeORM Entity
- 需要為每個新欄位生成唯一的 `standardId`
- 可能需要更新 `PERSON_STANDARD_FIELD_IDS` 常數
- Migration 檔案會產生在 `packages/twenty-server/src/database/typeorm/core/migrations/common/`

---

### 1.4 ✅ 環境變數配置

**修改檔案**: `packages/twenty-server/.env.example`

**新增內容**:
```bash
# ———————— LINE Integration ————————
# LINE Official Account (OA) Integration
# Generate encryption key using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# This key must be 64 hex characters (32 bytes)
LINE_CONFIG_ENCRYPTION_KEY=
```

**產生加密金鑰**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**本地開發設定**:
```bash
# 1. 複製 .env.example 為 .env
cd packages/twenty-server
cp .env.example .env

# 2. 產生加密金鑰並填入 .env
echo "LINE_CONFIG_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env
```

**⚠️ 安全提醒**:
- 加密金鑰絕不能 commit 到 Git
- 不同環境 (Dev, Staging, Prod) 應使用不同的加密金鑰
- 生產環境應使用 AWS Secrets Manager / GCP Secret Manager 管理

---

## 📁 Phase 1 已建立的檔案清單

### 模組核心檔案
```
packages/twenty-server/src/modules/line-integration/
├── line-integration.module.ts          # 主模組定義
├── entities/
│   └── line-channel-config.entity.ts   # 資料庫實體
├── services/
│   ├── line-config.service.ts          # 設定管理服務
│   ├── line-encryption.service.ts      # 加密服務
│   ├── line-api.service.ts             # LINE API 客戶端 (骨架)
│   └── line-webhook.service.ts         # Webhook 處理 (骨架)
├── controllers/
│   └── line-webhook.controller.ts      # Webhook 端點 (骨架)
├── guards/
│   └── line-signature.guard.ts         # 簽章驗證 (骨架)
└── resolvers/
    └── line-config.resolver.ts         # GraphQL Resolver (骨架)
```

### 配置檔案
```
packages/twenty-server/.env.example     # 環境變數範本 (已更新)
packages/twenty-server/src/modules/modules.module.ts  # 主模組註冊 (已更新)
```

---

## 🔧 Phase 1 待完成工作

### 1. Person 實體擴充 (高優先)
- [ ] 研究 WorkspaceEntity 標準欄位 ID 生成機制
- [ ] 為 LINE 欄位生成 standardId
- [ ] 修改 `person.workspace-entity.ts`
- [ ] 產生並執行 Migration

### 2. LineConfigResolver 實作 (中優先)
- [ ] 實作 `getLineConfig` Query
- [ ] 實作 `updateLineConfig` Mutation
- [ ] 實作 `testLineConnection` Mutation
- [ ] 實作 `deleteLineConfig` Mutation
- [ ] 從 GraphQL Context 取得 workspaceId

### 3. 其他骨架檔案的完整實作 (Phase 2)
- LineApiService
- LineWebhookController & Service
- LineSignatureGuard

---

## 🧪 測試建議

### 單元測試 (待 Phase 4)

**LineEncryptionService 測試**:
```typescript
describe('LineEncryptionService', () => {
  it('should encrypt and decrypt correctly', () => {
    const service = new LineEncryptionService();
    const plaintext = 'test-secret';
    const encrypted = service.encrypt(plaintext);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should generate different ciphertext for same plaintext', () => {
    const service = new LineEncryptionService();
    const plaintext = 'test-secret';
    const encrypted1 = service.encrypt(plaintext);
    const encrypted2 = service.encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
  });
});
```

**LineConfigService 測試**:
```typescript
describe('LineConfigService', () => {
  it('should create config and encrypt sensitive data', async () => {
    // Mock repository and encryption service
    // Verify encrypted data is stored
  });

  it('should retrieve and decrypt config', async () => {
    // Mock repository with encrypted data
    // Verify decrypted data is returned
  });
});
```

---

## 📚 技術參考

### 相關文件
- [NestJS Modules](https://docs.nestjs.com/modules)
- [TypeORM Entities](https://typeorm.io/entities)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [AES-GCM 加密模式](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

### Twenty CRM 專案特定
- `WorkspaceEntity` 裝飾器: `packages/twenty-server/src/engine/twenty-orm/decorators/workspace-entity.decorator.ts`
- `WorkspaceField` 裝飾器: `packages/twenty-server/src/engine/twenty-orm/decorators/workspace-field.decorator.ts`
- 標準物件 IDs: `packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids.ts`

---

## 🎓 開發者指南

### 如何使用 LineConfigService

```typescript
import { LineConfigService } from 'src/modules/line-integration/services/line-config.service';

@Injectable()
export class ExampleService {
  constructor(
    private readonly lineConfigService: LineConfigService,
  ) {}

  async saveLineConfig(workspaceId: string) {
    await this.lineConfigService.createOrUpdate(workspaceId, {
      channelId: 'YOUR_CHANNEL_ID',
      channelSecret: 'YOUR_CHANNEL_SECRET',
      channelAccessToken: 'YOUR_ACCESS_TOKEN',
    });
  }

  async getConfig(workspaceId: string) {
    // 後端內部使用 - 包含解密後的敏感資料
    const fullConfig = await this.lineConfigService.getDecryptedConfig(workspaceId);

    // 前端使用 - 僅公開資訊
    const publicConfig = await this.lineConfigService.getPublicConfig(workspaceId);
  }
}
```

### 如何產生加密金鑰

**方法 1: 使用 Node.js (推薦)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**方法 2: 使用 LineEncryptionService (開發環境)**
```typescript
import { LineEncryptionService } from './line-encryption.service';
const key = LineEncryptionService.generateKey();
console.log(key);
```

**方法 3: 使用 OpenSSL**
```bash
openssl rand -hex 32
```

---

## ✅ Phase 1 完成檢查清單

- [x] LineIntegrationModule 建立並註冊到主模組
- [x] LineChannelConfigEntity 資料庫實體建立
- [x] LineEncryptionService 實作 (AES-256-GCM)
- [x] LineConfigService 實作 (加密儲存與讀取)
- [x] 環境變數配置 (.env.example 更新)
- [x] 骨架檔案建立 (Controller, Guard, Resolver, 其他 Services)
- [ ] Person 實體擴充 (待下階段完成)
- [ ] Migration 檔案產生與執行 (待下階段完成)

---

## 🚀 下一步: Phase 2

Phase 2 將實作雙向通訊功能：

1. **LineApiService** - LINE Messaging API 客戶端
2. **LineWebhookController & Service** - 接收並處理 Webhook 事件
3. **LineSignatureGuard** - Webhook 簽章驗證與冪等性檢查
4. **Settings UI** - 前端設定介面

---

**文件版本**: 1.0
**最後更新**: 2025-11-17
**作者**: Claude Code
**狀態**: Phase 1 完成，等待 Review
