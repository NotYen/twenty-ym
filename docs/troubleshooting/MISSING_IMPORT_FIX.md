# Cherry-pick 缺少 Import 修復指南

> 最後更新：2026-01-12
>
> 本文件記錄 cherry-pick 後缺少 import 的問題與修復方法

---

## 問題描述

### 受影響的檔案

`packages/twenty-front/src/modules/settings/data-model/object-details/components/SettingsUpdateDataModelObjectAboutForm.tsx`

### 問題來源

在 cherry-pick commit `c4ee77db03`（手動合併開源 bugfix：導航記憶修復 #16918）時，部分相依的 import 未被正確引入。

### 錯誤訊息

TypeScript 編譯時會出現以下錯誤：

```
Cannot find name 'navigationMemorizedUrlState'.
Cannot find name 'isDefined'.
Cannot find name 'computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange'.
```

---

## 缺少的 Imports

### 1. navigationMemorizedUrlState

**使用位置**：第 28-30 行

```typescript
const setNavigationMemorizedUrl = useSetRecoilState(
  navigationMemorizedUrlState,  // ← 未定義
);
```

**正確的 import**：

```typescript
import { navigationMemorizedUrlState } from '@/ui/navigation/states/navigationMemorizedUrlState';
```

### 2. isDefined

**使用位置**：第 103 行

```typescript
if (!isDefined(updatedObjectNamePlural)) {  // ← 未定義
  return;
}
```

**正確的 import**：

```typescript
import { isDefined } from 'twenty-shared/utils';
```

### 3. computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange

**使用位置**：第 107-113 行

```typescript
setNavigationMemorizedUrl((previousNavigationMemorizedUrl) =>
  computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange(  // ← 未定義
    previousNavigationMemorizedUrl,
    objectMetadataItem.namePlural,
    updatedObjectNamePlural,
  ),
);
```

**正確的 import**：

```typescript
import { computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange } from '@/settings/data-model/object-details/utils/computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange.util';
```

---

## 修復方法

### 完整的 import 區塊

將以下 imports 加入檔案開頭：

```typescript
import { useUpdateOneObjectMetadataItem } from '@/object-metadata/hooks/useUpdateOneObjectMetadataItem';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { isObjectMetadataSettingsReadOnly } from '@/object-record/read-only/utils/isObjectMetadataSettingsReadOnly';
import { SettingsDataModelObjectAboutForm } from '@/settings/data-model/objects/forms/components/SettingsDataModelObjectAboutForm';
import {
  type SettingsDataModelObjectAboutFormValues,
  settingsDataModelObjectAboutFormSchema,
} from '@/settings/data-model/validation-schemas/settingsDataModelObjectAboutFormSchema';
import { computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange } from '@/settings/data-model/object-details/utils/computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange.util';
import { navigationMemorizedUrlState } from '@/ui/navigation/states/navigationMemorizedUrlState';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import { SettingsPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { updatedObjectNamePluralState } from '~/pages/settings/data-model/states/updatedObjectNamePluralState';
```

### 需要新增的 3 行

如果只想加入缺少的部分，請在現有 imports 中加入：

```typescript
// 加在其他 @/ imports 附近
import { computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange } from '@/settings/data-model/object-details/utils/computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange.util';
import { navigationMemorizedUrlState } from '@/ui/navigation/states/navigationMemorizedUrlState';

// 加在 twenty-shared imports 附近
import { isDefined } from 'twenty-shared/utils';
```

---

## 驗證修復

修復後執行以下指令確認編譯無錯誤：

```bash
npx nx typecheck twenty-front
```

或者只檢查該檔案：

```bash
npx tsc --noEmit packages/twenty-front/src/modules/settings/data-model/object-details/components/SettingsUpdateDataModelObjectAboutForm.tsx
```

---

## 相關檔案路徑

| 檔案 | 說明 |
|------|------|
| `packages/twenty-front/src/modules/ui/navigation/states/navigationMemorizedUrlState.ts` | 導航記憶 URL 狀態 |
| `packages/twenty-front/src/modules/settings/data-model/object-details/utils/computeUpdatedNavigationMemorizedUrlAfterObjectNamePluralChange.util.ts` | URL 更新工具函式 |
| `packages/twenty-shared/src/utils/isDefined.ts` | isDefined 工具函式 |

---

## 相關 Cherry-pick 記錄

| Commit | PR | 說明 |
|--------|-----|------|
| `c4ee77db03` | #16918 | 導航記憶修復 |

---

## 版本歷史

| 日期 | 版本 | 說明 |
|-----|------|------|
| 2026-01-12 | v1.0 | 初始文件 |


---

## Share Link 功能 Import 錯誤修復

> 最後更新：2026-01-21
>
> 本節記錄 External Share Links 功能開發過程中遇到的 import 錯誤與修復方法

### 問題描述

Docker build 過程中遇到多個 import 錯誤：

1. ✅ **已修復**: `packages/twenty-shared/src/metadata/standard-object-ids.ts` 中 `shareLink` key 重複
2. ✅ **已修復**: `ShareLinkModal.tsx` 中 `ModalHeader` import 錯誤（應使用 `Modal.Header`）
3. ✅ **已修復**: `ExternalSharedContent.tsx` 中 `IconLoader` import 路徑錯誤
4. ✅ **已修復**: `ExternalSharedContent.tsx` 中缺少 `ExternalContentRenderer` import
5. ✅ **已修復**: `SettingsShareLinksTableRow.tsx` 中缺少 `IconEye` 和 `IconEyeOff` import

### 修復內容

#### 1. 移除重複的 shareLink key
**檔案**: `packages/twenty-shared/src/metadata/standard-object-ids.ts`

移除了第 47 行重複的 `shareLink` 定義，保留第 55 行的正確定義。

#### 2. 修正 Modal.Header 使用方式
**檔案**: `packages/twenty-front/src/modules/share-link/components/ShareLinkModal.tsx`

```typescript
// ❌ 錯誤
import { ModalHeader } from '@/ui/layout/modal/components/ModalHeader';
<ModalHeader>...</ModalHeader>

// ✅ 正確
import { Modal } from '@/ui/layout/modal/components/Modal';
<Modal.Header>...</Modal.Header>
```

#### 3. 修正 IconLoader import 路徑
**檔案**: `packages/twenty-front/src/pages/external/ExternalSharedContent.tsx`

```typescript
// ❌ 錯誤
import { IconLoader } from 'twenty-ui';

// ✅ 正確
import { IconLoader } from 'twenty-ui/display';
```

#### 4. 新增 ExternalContentRenderer import
**檔案**: `packages/twenty-front/src/pages/external/ExternalSharedContent.tsx`

```typescript
import { ExternalContentRenderer } from '@/share-link/components/ExternalContentRenderer';
```

#### 5. 新增缺少的 Icon imports
**檔案**: `packages/twenty-front/src/modules/share-link/components/SettingsShareLinksTableRow.tsx`

在程式碼中使用了 `IconEye` 和 `IconEyeOff`，但沒有 import：

```typescript
// ❌ 錯誤（缺少 import）
import {
    IconCopy,
    IconTrash
} from 'twenty-ui/display';

// 但在代碼中使用了
<IconButton Icon={shareLink.isActive ? IconEye : IconEyeOff} />

// ✅ 正確（加入缺少的 imports）
import {
    IconCopy,
    IconEye,
    IconEyeOff,
    IconTrash
} from 'twenty-ui/display';
```

**圖示選擇理由**:
- `IconEye` (啟用): 表示「可見」、「已啟用」
- `IconEyeOff` (停用): 表示「不可見」、「已停用」
- 語義清晰，符合 UI/UX 慣例

### Import 路徑規範

根據專案規範，import 路徑應遵循以下規則：

#### twenty-ui 套件
```typescript
// ✅ 正確：使用子路徑
import { IconShare } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { MOBILE_VIEWPORT } from 'twenty-ui/theme';

// ❌ 錯誤：直接從根路徑 import
import { IconShare } from 'twenty-ui';
```

#### 內部 UI 元件
```typescript
// ✅ 正確：使用 @/ui/... 路徑
import { Modal } from '@/ui/layout/modal/components/Modal';
import { Checkbox } from '@/ui/input/components/Checkbox';

// ❌ 錯誤：使用不存在的路徑
import { ModalHeader } from '@/ui/layout/modal/components/ModalHeader';
```

#### Modal 元件使用
```typescript
// ✅ 正確：使用 Modal.Header
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Content>Content</Modal.Content>
</Modal>

// ❌ 錯誤：使用 ModalHeader
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalHeader>Title</ModalHeader>
</Modal>
```

### 驗證結果

所有修改的檔案已通過 TypeScript 診斷檢查：
- ✅ `SettingsShareLinksTableRow.tsx`: No diagnostics found
- ✅ `ShareLinkModal.tsx`: No diagnostics found
- ✅ `ExternalSharedContent.tsx`: No diagnostics found

### 相關檔案

| 檔案 | 說明 |
|------|------|
| `packages/twenty-front/src/modules/share-link/components/SettingsShareLinksTableRow.tsx` | 分享連結列表行元件 |
| `packages/twenty-front/src/modules/share-link/components/ShareLinkModal.tsx` | 分享連結建立 Modal |
| `packages/twenty-front/src/pages/external/ExternalSharedContent.tsx` | 外部分享內容頁面 |
| `packages/twenty-front/src/modules/share-link/components/ExternalContentRenderer.tsx` | 外部內容渲染器 |
| `packages/twenty-shared/src/metadata/standard-object-ids.ts` | 標準物件 ID 定義 |

---

## 版本歷史

| 日期 | 版本 | 說明 |
|-----|------|------|
| 2026-01-21 | v1.1 | 新增 Share Link 功能 import 錯誤修復 |
| 2026-01-12 | v1.0 | 初始文件 |


---

## Backend 缺少 @nestjs/throttler 套件

> 最後更新：2026-01-21
>
> 本節記錄 backend 啟動失敗，缺少 @nestjs/throttler 套件的問題

### 問題描述

Backend 啟動時出現錯誤：

```
Error: Cannot find module '@nestjs/throttler'
Require stack:
- /app/packages/twenty-server/dist/src/modules/share-link/resolvers/external-share.resolver.js
```

### 原因分析

External Share Links 功能使用了 `@Throttle` decorator 來限制 API 請求頻率（防止暴力破解），但沒有安裝對應的 `@nestjs/throttler` 套件。

### 修復步驟

#### 1. 新增 @nestjs/throttler 依賴

**檔案**: `packages/twenty-server/package.json`

在 dependencies 中加入：

```json
"@nestjs/throttler": "^5.1.2",
```

#### 2. 在 AppModule 中設定 ThrottlerModule

**檔案**: `packages/twenty-server/src/app.module.ts`

加入 import：

```typescript
import { ThrottlerModule } from '@nestjs/throttler';
```

在 `@Module` imports 中加入：

```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60000, // 1 分鐘
    limit: 100, // 100 次請求
  },
]),
```

#### 3. 重新安裝依賴並 build

```bash
# 安裝新依賴
yarn install

# 重新 build Docker images
cd docker/dev-flow/local_build_for_docker
./run-local.sh
```

### Throttle 設定說明

External Share Resolver 使用 `@Throttle` decorator 來限制請求頻率：

```typescript
@Query(() => SharedContentDTO, { nullable: true })
@Throttle({ default: { limit: 100, ttl: 3600000 } }) // 每小時 100 次請求
async getSharedContent(
  @Args('token') token: string,
  @Args('authToken', { nullable: true }) authToken?: string,
): Promise<SharedContentDTO | null>
```

**安全考量**：
- 防止暴力破解分享連結 token
- 限制每小時 100 次請求
- 保護系統資源不被濫用

### 相關檔案

| 檔案 | 說明 |
|------|------|
| `packages/twenty-server/package.json` | 套件依賴定義 |
| `packages/twenty-server/src/app.module.ts` | 應用程式主模組 |
| `packages/twenty-server/src/modules/share-link/resolvers/external-share.resolver.ts` | 使用 Throttle 的 resolver |

---

## Backend ResolverValidationPipe Import 路徑錯誤

> 最後更新：2026-01-21
>
> 本節記錄 backend 啟動失敗，找不到 ResolverValidationPipe 模組的問題

### 問題描述

Backend 啟動時出現錯誤：

```
Error: Cannot find module '../../../engine/api/graphql/workspace-resolver-builder/pipes/resolver-validation.pipe'
Require stack:
- /app/packages/twenty-server/dist/src/modules/share-link/resolvers/external-share.resolver.js
```

### 原因分析

Share Link 功能的 resolver 檔案使用了錯誤的 import 路徑。`ResolverValidationPipe` 的正確位置是：
- ✅ 正確：`src/engine/core-modules/graphql/pipes/resolver-validation.pipe`
- ❌ 錯誤：`src/engine/api/graphql/workspace-resolver-builder/pipes/resolver-validation.pipe`

### 修復步驟

#### 1. 修正 external-share.resolver.ts

**檔案**: `packages/twenty-server/src/modules/share-link/resolvers/external-share.resolver.ts`

```typescript
// ❌ 錯誤
import { ResolverValidationPipe } from 'src/engine/api/graphql/workspace-resolver-builder/pipes/resolver-validation.pipe';

// ✅ 正確
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
```

#### 2. 修正 share-link.resolver.ts

**檔案**: `packages/twenty-server/src/modules/share-link/resolvers/share-link.resolver.ts`

```typescript
// ❌ 錯誤
import { ResolverValidationPipe } from 'src/engine/api/graphql/workspace-resolver-builder/pipes/resolver-validation.pipe';

// ✅ 正確
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
```

### 驗證結果

所有修改的檔案已通過 TypeScript 診斷檢查：
- ✅ `external-share.resolver.ts`: No diagnostics found
- ✅ `share-link.resolver.ts`: No diagnostics found

### 相關檔案

| 檔案 | 說明 |
|------|------|
| `packages/twenty-server/src/modules/share-link/resolvers/external-share.resolver.ts` | 外部分享 resolver |
| `packages/twenty-server/src/modules/share-link/resolvers/share-link.resolver.ts` | 分享連結管理 resolver |
| `packages/twenty-server/src/engine/core-modules/graphql/pipes/resolver-validation.pipe.ts` | ResolverValidationPipe 正確位置 |


---

## ShareLink 架構重新設計 (2026-01-22)

### 問題描述

在實作 External Share Links 功能時，原本使用 `@WorkspaceEntity` (Standard Object) 模式設計 ShareLink，但遇到以下問題：

**錯誤訊息**：
```
Error: No repository found for ShareLinkWorkspaceEntity
at object-metadata-repository.module.js:32
```

**根本原因**：
- `@WorkspaceEntity` 需要先在資料庫中建立 metadata 才能註冊 repository
- 需要執行 `workspace:sync-metadata` 指令
- 造成雞生蛋問題：無法啟動 backend 來執行 sync 指令，但需要 sync 才能啟動 backend

**用戶反饋**：
- "為什麼那麼複雜我就是要讓backend成功執行"
- "還有如果有人pull我的代碼（一起開發的同事）難道也要這樣手動嗎？好不正常喔～很不合理"
- "可是之後如果要run aws環境難道還要這樣手動嗎？"
- "為什麼還要分階段"

### 解決方案：改用 TypeORM Entity 模式

參考 Twenty 原本的核心實體設計（`featureFlag`, `workspace`, `user`），將 ShareLink 重新設計為 TypeORM `@Entity` 在 `core` schema 中。

### 修改的檔案

#### 1. 新增 TypeORM Entity
**檔案**：`packages/twenty-server/src/modules/share-link/entities/share-link.entity.ts`

```typescript
@Entity({ name: 'shareLink', schema: 'core' })
@ObjectType('ShareLink')
export class ShareLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'uuid', unique: true })
  @Field(() => UUIDScalarType)
  token: string;

  @Column({ type: 'uuid' })
  @Field(() => UUIDScalarType)
  workspaceId: string;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: WorkspaceEntity;

  // ... 其他欄位
}
```

**關鍵設計**：
- 使用 `@Entity({ name: 'shareLink', schema: 'core' })` 而非 `@WorkspaceEntity`
- 直接使用 TypeORM decorators (`@Column`, `@ManyToOne`, `@Index`)
- 定義 enum types: `ShareLinkResourceType`, `ShareLinkAccessMode`
- 建立關聯：`workspace` (ManyToOne to WorkspaceEntity), `createdBy` (ManyToOne to User)

#### 2. 更新 Module
**檔案**：`packages/twenty-server/src/modules/share-link/share-link.module.ts`

**變更前**：
```typescript
imports: [
  ObjectMetadataRepositoryModule.forFeature([ShareLinkWorkspaceEntity]),
],
```

**變更後**：
```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareLinkEntity } from './entities/share-link.entity';

imports: [
  TypeOrmModule.forFeature([ShareLinkEntity])
],
```

#### 3. 更新 Repository
**檔案**：`packages/twenty-server/src/modules/share-link/repositories/share-link.repository.ts`

**變更前**：
```typescript
@Injectable()
export class ShareLinkRepository {
  constructor(
    @InjectObjectMetadataRepository(ShareLinkWorkspaceEntity)
    private readonly shareLinkRepository: ShareLinkRepositoryInterface,
  ) {}
}
```

**變更後**：
```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareLinkEntity } from '../entities/share-link.entity';

@Injectable()
export class ShareLinkRepository {
  constructor(
    @InjectRepository(ShareLinkEntity)
    private readonly shareLinkRepository: Repository<ShareLinkEntity>,
  ) {}
}
```

#### 4. 更新 Services
**檔案**：
- `packages/twenty-server/src/modules/share-link/services/share-link.service.ts`
- `packages/twenty-server/src/modules/share-link/services/share-link-cleanup.service.ts`

**變更**：
- 移除 `@InjectObjectMetadataRepository` decorator
- 將所有 `ShareLinkWorkspaceEntity` 類型改為 `ShareLinkEntity`
- 直接注入 `ShareLinkRepository`

#### 5. 建立 TypeORM Migration
**檔案**：`packages/twenty-server/src/database/typeorm/core/migrations/common/1737600000000-createShareLinkTable.ts`

```typescript
export class CreateShareLinkTable1737600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "core"."shareLink_resourceType_enum" AS ENUM (...)`,
    );

    // Create table
    await queryRunner.query(
      `CREATE TABLE "core"."shareLink" (...)`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_SHARE_LINK_TOKEN" ON "core"."shareLink" ("token")`,
    );

    // Add foreign keys
    await queryRunner.query(
      `ALTER TABLE "core"."shareLink" ADD CONSTRAINT "FK_shareLink_workspace" ...`,
    );
  }
}
```

#### 6. 重新啟用 ShareLinkModule
**檔案**：`packages/twenty-server/src/modules/modules.module.ts`

```typescript
import { ShareLinkModule } from 'src/modules/share-link/share-link.module';

@Module({
  imports: [
    // ... 其他 modules
    ShareLinkModule,  // ✅ 重新啟用
  ],
})
export class ModulesModule {}
```

#### 7. 刪除舊檔案
**刪除**：`packages/twenty-server/src/modules/share-link/standard-objects/share-link.workspace-entity.ts`

**原因**：不再使用 WorkspaceEntity 模式

#### 8. 註解 standard-object-ids
**檔案**：`packages/twenty-shared/src/metadata/standard-object-ids.ts`

```typescript
// shareLink: '20202020-...',  // ← 註解掉，因為不再是 Standard Object
```

### 優點

✅ **無需手動 sync-metadata**：TypeORM migration 會自動建立表格
✅ **團隊協作友好**：同事 pull 代碼後直接 `docker compose up` 即可
✅ **AWS 部署簡單**：部署腳本自動執行 migration，無需手動介入
✅ **遵循 Twenty 架構**：參考 `featureFlag`, `workspace`, `user` 等核心實體的設計模式
✅ **不影響現有功能**：ShareLink 是新功能，不會破壞現有的 Standard Objects

### 測試步驟

1. **清除舊的 Docker cache**：
   ```bash
   docker builder prune -af
   docker image prune -af
   ```

2. **執行完整 build**：
   ```bash
   cd docker/dev-flow/local_build_for_docker
   ./run-local.sh
   ```

3. **驗證 migration 執行**：
   - Backend 啟動時會自動執行 migration
   - 檢查 `core.shareLink` 表格是否建立成功

4. **驗證 ShareLinkModule 載入**：
   - Backend 應該成功啟動，無 "No repository found" 錯誤
   - 檢查 logs: `docker compose logs -f backend`

### 參考資料

- **FeatureFlag Entity**: `packages/twenty-server/src/engine/core-modules/feature-flag/feature-flag.entity.ts`
- **Workspace Entity**: `packages/twenty-server/src/engine/core-modules/workspace/workspace.entity.ts`
- **User Entity**: `packages/twenty-server/src/engine/core-modules/user/user.entity.ts`
- **Migration 範例**: `packages/twenty-server/src/database/typeorm/core/migrations/common/1765500000000-createSuperAdminTable.ts`

### 遵守的原則

✅ **參考原本開源的設計架構跟邏輯** - 使用 Twenty 核心實體的 TypeORM 模式
✅ **不影響其他正常執行的功能** - ShareLink 是獨立的新模組
✅ **保留本地所有修改** - 未改動任何現有功能
✅ **保留之前努力優化切換頁面效能（速度）的功能** - 未觸及效能相關代碼


---

## ShareLink 循環依賴問題修復 (2026-01-22)

### 問題描述

Backend 啟動時出現循環依賴錯誤：

```
ReferenceError: Cannot access 'ShareLinkValidationService' before initialization
at get ShareLinkValidationService (/app/packages/twenty-server/dist/src/modules/share-link/services/share-link-validation.service.js:16:9)
at Object.<anonymous> (/app/packages/twenty-server/dist/src/modules/share-link/services/share-link.service.js:226:44)
```

### 原因分析

**循環依賴**（Circular Dependency）：
- `ShareLinkService` import 並注入 `ShareLinkValidationService`
- `ShareLinkValidationService` import 並注入 `ShareLinkService`
- 導致 JavaScript 模組載入時無法初始化

```typescript
// ❌ 循環依賴
// ShareLinkService
import { ShareLinkValidationService } from './share-link-validation.service';
constructor(
  private readonly shareLinkValidationService: ShareLinkValidationService,
) {}

// ShareLinkValidationService
import { ShareLinkService } from './share-link.service';
constructor(
  private readonly shareLinkService: ShareLinkService,
) {}
```

### 解決方案：重構依賴關係

**原則**：打破循環依賴，讓服務層保持單向依賴。

#### 1. ShareLinkService 不再依賴 ShareLinkValidationService

**檔案**: `packages/twenty-server/src/modules/share-link/services/share-link.service.ts`

```typescript
// ✅ 移除循環依賴
import { ShareLinkRepository } from 'src/modules/share-link/repositories/share-link.repository';
import { ShareLinkEntity } from 'src/modules/share-link/entities/share-link.entity';

@Injectable()
export class ShareLinkService {
  constructor(
    private readonly shareLinkRepository: ShareLinkRepository,
    // ❌ 移除：private readonly shareLinkValidationService
  ) {}

  async updateShareLink(input: UpdateShareLinkInput): Promise<ShareLinkData> {
    // ... 更新邏輯

    // ❌ 移除：await this.shareLinkValidationService.clearCache(input.token);
    // ✅ cache 清除移到 resolver 層處理

    return this.mapToShareLinkData(updatedLink);
  }
}
```

#### 2. ShareLinkValidationService 直接使用 Repository

**檔案**: `packages/twenty-server/src/modules/share-link/services/share-link-validation.service.ts`

```typescript
// ✅ 直接使用 Repository，不依賴 ShareLinkService
import { ShareLinkRepository } from 'src/modules/share-link/repositories/share-link.repository';
import { ShareLinkData } from './share-link.service'; // 只 import 類型

@Injectable()
export class ShareLinkValidationService {
  constructor(
    private readonly shareLinkRepository: ShareLinkRepository, // ✅ 直接注入 Repository
    @InjectCacheStorage(CacheStorageNamespace.EngineWorkspace)
    private readonly cacheStorage: CacheStorageService,
  ) {}

  async validateShareLink(token: string): Promise<ShareLinkValidationResult> {
    // ✅ 直接從 Repository 查詢
    const shareLinkEntity = await this.shareLinkRepository.findOne({
      where: { token },
    });

    if (!shareLinkEntity) {
      return {
        isValid: false,
        errorCode: ShareLinkErrorCode.LINK_NOT_FOUND,
        errorMessage: 'Share link not found',
      };
    }

    // 轉換為 ShareLinkData
    const shareLink: ShareLinkData = {
      id: shareLinkEntity.id,
      token: shareLinkEntity.token,
      // ... 其他欄位
    };

    // ... 驗證邏輯
  }
}
```

#### 3. Resolver 層處理 Cache 清除

**檔案**: `packages/twenty-server/src/modules/share-link/resolvers/share-link.resolver.ts`

```typescript
// ✅ Resolver 同時注入兩個 Service
@Resolver()
export class ShareLinkResolver {
  constructor(
    private readonly shareLinkService: ShareLinkService,
    private readonly shareLinkValidationService: ShareLinkValidationService,
  ) {}

  @Mutation(() => ShareLinkDTO)
  async updateShareLink(
    @Args('input') input: UpdateShareLinkInput,
    @AuthWorkspace() workspace: Workspace,
    @AuthUser() user: User,
  ): Promise<ShareLinkDTO> {
    // 1. 更新分享連結
    const shareLink = await this.shareLinkService.updateShareLink({
      token: input.token,
      isActive: input.isActive,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      inactivityExpirationDays: input.inactivityExpirationDays,
      workspaceId: workspace.id,
      userId: user.id,
    });

    // 2. 清除快取（在 Resolver 層處理）
    await this.shareLinkValidationService.clearCache(input.token);

    return this.mapToDTO(shareLink);
  }

  @Mutation(() => Boolean)
  async deleteShareLink(
    @Args('token') token: string,
    @AuthWorkspace() workspace: Workspace,
    @AuthUser() user: User,
  ): Promise<boolean> {
    // 1. 刪除分享連結
    await this.shareLinkService.deleteShareLink({
      token,
      workspaceId: workspace.id,
      userId: user.id,
    });

    // 2. 清除快取（在 Resolver 層處理）
    await this.shareLinkValidationService.clearCache(token);

    return true;
  }
}
```

### 架構改進

**依賴關係圖**：

```
Before (循環依賴):
ShareLinkService ←→ ShareLinkValidationService
        ❌ 循環依賴

After (單向依賴):
ShareLinkResolver
    ↓
    ├─→ ShareLinkService → ShareLinkRepository
    └─→ ShareLinkValidationService → ShareLinkRepository
        ✅ 單向依賴
```

**優點**：
1. ✅ 打破循環依賴，解決初始化問題
2. ✅ 服務層職責更清晰：
   - `ShareLinkService`: 負責業務邏輯（CRUD）
   - `ShareLinkValidationService`: 負責驗證和快取
   - `ShareLinkResolver`: 負責協調兩個服務
3. ✅ 符合單一職責原則（SRP）
4. ✅ 更容易測試（減少 mock 依賴）

### 驗證結果

所有修改的檔案已通過 TypeScript 診斷檢查：
- ✅ `share-link.service.ts`: No diagnostics found
- ✅ `share-link-validation.service.ts`: No diagnostics found
- ✅ `share-link.resolver.ts`: No diagnostics found

### 相關檔案

| 檔案 | 說明 |
|------|------|
| `packages/twenty-server/src/modules/share-link/services/share-link.service.ts` | 移除對 ValidationService 的依賴 |
| `packages/twenty-server/src/modules/share-link/services/share-link-validation.service.ts` | 改為直接使用 Repository |
| `packages/twenty-server/src/modules/share-link/resolvers/share-link.resolver.ts` | 在 Resolver 層協調兩個服務 |

### 學習要點

**如何避免循環依賴**：
1. 服務層保持單向依賴
2. 共用邏輯提取到獨立的 utility 或 repository
3. 在上層（如 Resolver）協調多個服務
4. 使用事件驅動架構（EventEmitter）解耦
5. 必要時使用 `forwardRef()`（但應該是最後手段）

**NestJS 最佳實踐**：
- Repository 層：資料存取
- Service 層：業務邏輯
- Resolver/Controller 層：協調多個服務
- 避免 Service 之間互相依賴
