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
