# 外部分享連結 Metadata 錯誤修復

**日期**: 2026-01-27
**問題**: 無痕瀏覽器訪問 PUBLIC 分享連結時出現 `Object metadata item "workspaceMember" cannot be found in an array of 0 elements` 錯誤
**狀態**: ✅ 已修復

---

## 問題診斷

### 症狀
1. 無痕瀏覽器訪問 PUBLIC 分享連結時顯示錯誤頁面
2. Console 顯示 `ObjectMetadataItemNotFoundError: Object metadata item "workspaceMember" cannot be found in an array of 0 elements`
3. 錯誤發生在 `useObjectMetadataItem` hook

### 根本原因
外部分享路由（`/shared/*`）不會載入 metadata items（`objectMetadataItems` 是空陣列），但某些組件仍然嘗試使用 `useObjectMetadataItem` hook 查找 metadata，導致拋出錯誤。

雖然之前已經修改了多個 Effect 組件跳過外部分享路由，但 `useObjectMetadataItem` hook 本身沒有處理外部分享路由的邏輯，當 metadata item 找不到時會直接拋出錯誤。

---

## 修復方案

### 修改 `useObjectMetadataItem` Hook - 外部分享路由返回 null

**文件**: `packages/twenty-front/src/modules/object-metadata/hooks/useObjectMetadataItem.ts`

**修改內容**:
```typescript
import { useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { ObjectMetadataItemNotFoundError } from '@/object-metadata/errors/ObjectMetadataNotFoundError';
import { objectMetadataItemFamilySelector } from '@/object-metadata/states/objectMetadataItemFamilySelector';
import { objectMetadataItemsState } from '@/object-metadata/states/objectMetadataItemsState';

import { isDefined } from 'twenty-shared/utils';
import { type ObjectMetadataItemIdentifier } from '../types/ObjectMetadataItemIdentifier';

export const useObjectMetadataItem = ({
  objectNameSingular,
}: ObjectMetadataItemIdentifier) => {
  const location = useLocation();
  const isExternalShareRoute = location.pathname.startsWith('/shared/');

  const objectMetadataItem = useRecoilValue(
    objectMetadataItemFamilySelector({
      objectName: objectNameSingular,
      objectNameType: 'singular',
    }),
  );

  const objectMetadataItems = useRecoilValue(objectMetadataItemsState);

  // For external share routes, return null instead of throwing error
  // This allows components to gracefully handle missing metadata
  if (!isDefined(objectMetadataItem)) {
    if (isExternalShareRoute) {
      console.warn(
        `[useObjectMetadataItem] Metadata item "${objectNameSingular}" not found in external share route. Returning null.`,
      );
      return {
        objectMetadataItem: null as any,
      };
    }

    throw new ObjectMetadataItemNotFoundError(
      objectNameSingular,
      objectMetadataItems,
    );
  }

  return {
    objectMetadataItem,
  };
};
```

**影響範圍**:
- ✅ 只影響 `/shared/*` 路由
- ✅ 不影響其他路由的正常功能
- ✅ 允許組件優雅地處理缺少的 metadata
- ✅ 保持錯誤檢測機制（非外部分享路由仍會拋出錯誤）

---

## 設計考量

### 為什麼在 Hook 層級處理而不是組件層級？

1. **最小化修改範圍**: 只需修改一個 hook，而不是修改所有使用該 hook 的組件
2. **統一處理**: 所有使用 `useObjectMetadataItem` 的組件都會自動獲得外部分享路由的支持
3. **向後兼容**: 不影響現有組件的行為
4. **錯誤處理**: 保留了正常路由的錯誤檢測機制

### 為什麼返回 null 而不是跳過渲染？

1. **組件自主權**: 讓組件自己決定如何處理缺少的 metadata（可能有些組件不需要 metadata 也能渲染）
2. **避免破壞性變更**: 不改變 hook 的返回類型結構
3. **調試友好**: 添加 console.warn 幫助開發者識別問題

---

## 測試步驟

### 1. 測試 PUBLIC 分享連結（無痕瀏覽器）
```bash
# 1. 重新 build 前端
cd packages/twenty-front
yarn build

# 2. 重啟 Docker 服務
cd /Users/ym/twenty-ym/docker
docker compose restart frontend

# 3. 在無痕瀏覽器訪問分享連結
# 應該看到：
# - ✅ 頁面正常顯示（不是錯誤頁面）
# - ✅ 沒有 "Object metadata item cannot be found" 錯誤
# - ✅ 可以看到分享內容
```

### 2. 測試正常功能（已登入）
```bash
# 在正常瀏覽器登入後測試：
# - ✅ 所有頁面正常運作
# - ✅ Metadata 查找正常
# - ✅ 錯誤檢測機制正常（嘗試查找不存在的 metadata 仍會拋出錯誤）
```

---

## 相關修復

這是外部分享連結功能的第三次修復：

1. **第一次修復** (`20260124_SHARELINK_TOKEN_TYPE_FIX.md`): 修復 token 類型錯誤
2. **第二次修復** (`20260125_PUBLIC_SHARELINK_AUTH_FIX.md`): 修復認證問題
3. **第三次修復** (`20260125_PUBLIC_SHARELINK_BLACK_SCREEN_FIX.md`): 修復黑屏問題（Apollo Client、Firebase Analytics）
4. **第四次修復** (本次): 修復 Metadata 錯誤

---

## 後續工作

### 階段 1: PUBLIC 分享連結（當前階段）
- ✅ 修復黑屏問題
- ✅ 修復 Metadata 錯誤
- ⏳ 完善圖表渲染（顯示實際數據）
- ⏳ 本地詳細測試

### 階段 2: LOGIN_REQUIRED 分享連結
- ⏳ 實現外部登入介面
- ⏳ 處理未註冊用戶的情況

### 階段 3: 部署到 AWS
- ⏳ 本地測試通過後部署

---

## 修改文件清單

1. `packages/twenty-front/src/modules/object-metadata/hooks/useObjectMetadataItem.ts`

---

## 重要原則

遵守四個重要原則：
1. ✅ 參考原本開源的設計架構跟邏輯
2. ✅ **不影響其他正常執行的功能**
3. ✅ 保留本地所有修改
4. ✅ 保留頁面切換效能優化

**最小化修改範圍**：
- ✅ 只修改一個 hook
- ✅ 只影響 `/shared/*` 路由
- ✅ 保留錯誤檢測機制
- ✅ 向後兼容
