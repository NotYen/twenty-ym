# 頁面切換效能優化分析報告

> 分析日期：2025-12-20
>
> 針對「左側功能列表（公司、人員切換）比其他功能點擊 lag 多一點」的問題進行深入分析

---

## 📊 目前架構分析

### 1. Object Metadata 載入機制

```
objectMetadataItemsState (Recoil State)
    ↓
objectMetadataItemFamilySelector (Selector Family)
    ↓
useObjectMetadataItem (Hook)
```

**現況**：
- `objectMetadataItemsState` 是一個全域 Recoil state，儲存所有 object metadata
- `objectMetadataItemFamilySelector` 使用 `selectorFamily` 根據 objectName 查找對應的 metadata
- 每次查找都會遍歷整個 `objectMetadataItems` 陣列 (O(n) 複雜度)

**問題**：
- 當有多個 object 時，每次切換頁面都需要遍歷陣列查找
- 沒有使用 Map 結構進行 O(1) 查找

---

### 2. Navigation Drawer 渲染流程

```
NavigationDrawerSectionForObjectMetadataItems
    ↓
NavigationDrawerItemForObjectMetadataItem (每個 object 一個)
    ↓
NavigationDrawerItem
```

**現況**：
- `NavigationDrawerSectionForObjectMetadataItems` 使用 `useMemo` 對 objectMetadataItems 進行排序
- `NavigationDrawerItemForObjectMetadataItem` **沒有使用 `React.memo`**
- 每次 state 變更都會重新渲染所有 navigation items

---

### 3. 頁面切換流程

```
點擊 Navigation Item
    ↓
React Router 導航
    ↓
RecordIndexPage 渲染
    ↓
RecordIndexContainerGater 渲染
    ↓
RecordIndexContainer 渲染
    ↓
RecordTableWithWrappers 渲染
```

**現況**：
- `RecordIndexContainerGater` 每次都會重新計算 `fieldDefinitionByFieldMetadataItemId` 等衍生狀態
- `RecordTableWithWrappers` 沒有使用 `useCallback` 包裝 handler 函數
- 沒有使用 `useMemo` 或 `React.memo` 優化渲染

---

## 🔧 優化建議

### 優化 1：預載入常用 Object 的 Metadata

**現況問題**：
- 目前 metadata 是在 app 初始化時一次性載入
- 但 selector 查找是 O(n) 複雜度

**建議方案**：

```typescript
// 新增 objectMetadataItemByNameSingularState
export const objectMetadataItemByNameSingularState = selector<
  Map<string, ObjectMetadataItem>
>({
  key: 'objectMetadataItemByNameSingularState',
  get: ({ get }) => {
    const objectMetadataItems = get(objectMetadataItemsState);
    return new Map(
      objectMetadataItems.map((item) => [item.nameSingular, item])
    );
  },
});
```

**效益**：
- 查找複雜度從 O(n) 降為 O(1)
- 只在 objectMetadataItems 變更時重新計算 Map

**風險**：低
**影響範圍**：需要修改 `useObjectMetadataItem` hook

---

### 優化 2：使用 React.memo 優化組件渲染

**現況問題**：
- `NavigationDrawerItemForObjectMetadataItem` 沒有使用 memo
- 任何 parent state 變更都會導致所有 navigation items 重新渲染

**建議方案**：

```typescript
// NavigationDrawerItemForObjectMetadataItem.tsx
import { memo } from 'react';

export const NavigationDrawerItemForObjectMetadataItem = memo(
  ({ objectMetadataItem }: NavigationDrawerItemForObjectMetadataItemProps) => {
    // ... 現有邏輯
  }
);
```

**需要 memo 的組件清單**：
| 組件 | 優先級 | 原因 |
|------|--------|------|
| `NavigationDrawerItemForObjectMetadataItem` | 高 | 每個 object 一個，數量多 |
| `NavigationDrawerItem` | 高 | 基礎組件，使用頻繁 |
| `RecordIndexContainer` | 中 | 頁面主容器 |
| `RecordTableWithWrappers` | 中 | Table 容器 |

**效益**：
- 減少不必要的重新渲染
- 提升 Navigation Drawer 的響應速度

**風險**：低
**影響範圍**：需要確保 props 是穩定的引用

---

### 優化 3：減少不必要的 Re-render

#### 3.1 使用 useCallback 包裝 Handler

**現況問題**：
```typescript
// RecordTableWithWrappers.tsx
const handleSelectAllRows = () => {
  selectAllRows();
};
// 每次渲染都會創建新的函數引用
```

**建議方案**：
```typescript
const handleSelectAllRows = useCallback(() => {
  selectAllRows();
}, [selectAllRows]);
```

#### 3.2 使用 useMemo 緩存衍生狀態

**現況問題**：
```typescript
// RecordIndexContainerGater.tsx
const {
  fieldDefinitionByFieldMetadataItemId,
  fieldMetadataItemByFieldMetadataItemId,
  // ...
} = useRecordIndexFieldMetadataDerivedStates(objectMetadataItem, recordIndexId);
// 每次渲染都會重新計算
```

**建議方案**：
確保 `useRecordIndexFieldMetadataDerivedStates` 內部使用 `useMemo`

#### 3.3 避免在 render 中創建新物件

**現況問題**：
```typescript
// RecordIndexContainerGater.tsx
<RecordIndexContextProvider
  value={{
    objectPermissionsByObjectMetadataId,
    recordIndexId,
    // ... 每次渲染都創建新物件
  }}
>
```

**建議方案**：
```typescript
const contextValue = useMemo(() => ({
  objectPermissionsByObjectMetadataId,
  recordIndexId,
  // ...
}), [objectPermissionsByObjectMetadataId, recordIndexId, /* ... */]);

<RecordIndexContextProvider value={contextValue}>
```

---

## 📋 實施優先級

| 優化項目 | 優先級 | 預估效益 | 實施難度 | 風險 |
|----------|--------|----------|----------|------|
| Metadata Map 查找優化 | 🔴 高 | 高 | 低 | 低 |
| NavigationDrawerItem memo | 🔴 高 | 高 | 低 | 低 |
| Context value useMemo | 🟡 中 | 中 | 低 | 低 |
| Handler useCallback | 🟡 中 | 中 | 低 | 低 |
| RecordIndexContainer memo | 🟢 低 | 低 | 中 | 中 |

---

## ⚠️ 注意事項

1. **React.memo 的正確使用**：
   - 確保 props 是穩定的引用
   - 對於 object/array props，需要在 parent 使用 useMemo
   - 對於 function props，需要在 parent 使用 useCallback

2. **useMemo/useCallback 的依賴陣列**：
   - 確保依賴陣列完整
   - 避免過度優化（簡單計算不需要 useMemo）

3. **測試驗證**：
   - 使用 React DevTools Profiler 驗證優化效果
   - 確保功能正常運作

---

## 🔍 開源參考

Twenty 開源專案中已有的效能優化：

| Commit | PR | 說明 | 狀態 |
|--------|-----|------|------|
| `cee63c6eb5` | #16419 | Improved table flash on reload | ✅ 已 cherry-pick |
| `ac89b5aff6` | #16398 | fastDeepEqual 效能優化 | ✅ 已 cherry-pick |
| `61a469cff8` | #16322 | Fix Timeline blinking | ✅ 已存在 |
| `1607aebcc6` | #16080 | Deprecate object metadata maps | ❌ 風險太高 |

---

## 📝 下一步行動

1. **立即可做**（風險低）：
   - 為 `NavigationDrawerItemForObjectMetadataItem` 添加 `React.memo`
   - 為 `NavigationDrawerItem` 添加 `React.memo`

2. **需要評估**（需要更多測試）：
   - 新增 `objectMetadataItemByNameSingularState` Map selector
   - 優化 `RecordIndexContainerGater` 的 context value

3. **長期考慮**：
   - 等待 Twenty 開源的 flat entity 重構完成後再整體升級
