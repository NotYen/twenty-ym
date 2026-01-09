# Twenty 頁面切換效能優化完整文件

> 最後更新：2025-12-21
>
> 本文件整合所有效能優化分析與進度，供後續優化參考

---

## 目錄

1. [效能狀況總覽](#效能狀況總覽)
2. [頁面切換完整流程](#頁面切換完整流程)
3. [已完成的優化](#已完成的優化)
4. [失敗的方案記錄](#失敗的方案記錄)
5. [效能瓶頸深度分析](#效能瓶頸深度分析)
6. [待實作的優化方案](#待實作的優化方案)
7. [關鍵架構理解](#關鍵架構理解)
8. [相關檔案清單](#相關檔案清單)
9. [診斷工具與方法](#診斷工具與方法)
10. [注意事項](#注意事項)

---

## 效能狀況總覽

| 環境 | 資料筆數 | INP | 備註 |
|-----|---------|-----|------|
| 官方 Demo | 5 筆 | ~235ms | 資料量太少，不具參考性 |
| 用戶環境（優化前） | 48 筆 | ~500-600ms | 60 筆初始載入 |
| 用戶環境（優化後） | 48 筆 | ~300-400ms | 30 筆初始載入 |
| **目標** | - | **150-250ms** | 還需優化 100-150ms |

**關鍵發現**：
- 分頁模式下，不管總資料量是 500 還是 1000 筆，頁面切換 INP 應維持在 300-400ms
- 主要瓶頸是 React 渲染（~200-300ms），而非網路請求

---

## 頁面切換完整流程

```
點擊 Navigation Item (公司 → 人員)
    ↓
React Router 導航到新 URL
    ↓
RecordIndexPage 重新渲染
    ↓
RecordIndexContainerGater 初始化
    ↓
useRecordIndexTableQuery 執行
    ↓
useFindManyRecords 發起 GraphQL 查詢
    ↓
Apollo Client 檢查 cache
    ↓
[cache-first] 如果有 cache → 直接返回
[cache-first] 如果沒有 cache → 發起網路請求
    ↓
RecordTableVirtualizedInitialDataLoadEffect 觸發
    ↓
triggerInitialRecordTableDataLoad 執行
    │
    ├── resetTableFocuses()
    ├── resetVirtualizedRowTreadmill()  ← 設置 200 個 state
    ├── 清除舊資料 for loop             ← 設置 2×N 個 state
    ├── findManyRecordsLazy()           ← Apollo 查詢
    ├── upsertRecordsInStore()          ← 設置 N 個 state
    └── loadRecordsToVirtualRows()      ← 設置 2N+1 個 state
    ↓
Table 虛擬化渲染                        ← 主要瓶頸：810 個 Recoil 訂閱
```

---

## 已完成的優化

### 優化 1：fastDeepEqual 替換 isDeeplyEqual ✅

**檔案**：`packages/twenty-front/src/modules/object-record/record-store/hooks/useUpsertRecordsInStore.ts`

**效果**：比較速度提升 3-5 倍

```typescript
// 修改前
import { isDeeplyEqual } from '~/utils/isDeeplyEqual';
if (!isDeeplyEqual(currentRecord, record)) { ... }

// 修改後
import { fastDeepEqual } from 'twenty-shared/utils';
if (!fastDeepEqual(currentRecord, record)) { ... }
```

### 優化 2：useResetVirtualizedRowTreadmill 加入 diff 檢查 ✅

**檔案**：`packages/twenty-front/src/modules/object-record/record-table/virtualization/hooks/useResetVirtualizedRowTreadmill.ts`

**效果**：只有當值不同時才設置 state，避免不必要的更新

```typescript
// 新增的 diff 檢查邏輯
const currentRealIndex = getSnapshotValue(
  snapshot,
  realIndexByVirtualIndexCallbackState({ virtualIndex }),
);

if (currentRealIndex !== realIndex) {
  set(realIndexByVirtualIndexCallbackState({ virtualIndex }), realIndex);
}
```

### 優化 3：初始載入從 60 筆改為 30 筆 ✅

**檔案**：`packages/twenty-shared/src/constants/QueryDefaultLimitRecords.ts`

**效果**：INP 從 ~500-600ms 降到 ~300-400ms

```typescript
// 修改前
export const QUERY_DEFAULT_LIMIT_RECORDS = 60;

// 修改後
export const QUERY_DEFAULT_LIMIT_RECORDS = 30;
```

**副作用**：滾動時會看到 Skeleton（正常設計行為，因為資料量 48 筆 > 30 筆初始載入）

---

## 失敗的方案記錄

### 方案 A：合併 Recoil Callback ❌

**嘗試**：將 `upsertRecordsInStore` 和 `loadRecordsToVirtualRows` 內聯到同一個 callback

**結果**：造成頁面切換時資料不顯示的 bug

**原因**：破壞了資料流的同步性。這兩個函數必須按順序執行，且中間的 state 更新需要被 React 處理

**教訓**：不要試圖合併有依賴關係的 Recoil callback

### 方案 B：移除 resetVirtualizedRowTreadmill ❌

**嘗試**：跳過虛擬化行的重置步驟

**結果**：所有頁面空白

**原因**：`realIndexByVirtualIndex` 沒有初始化，導致 `RecordTableRowVirtualizedContainer` 中 `realIndex` 為 null，所有虛擬行 return null

**教訓**：`resetVirtualizedRowTreadmill` 是必要的初始化步驟，不能省略

### 方案 C：startTransition 包裝資料載入 ❌

**嘗試**：使用 React 18 的 `startTransition` 包裝資料載入邏輯

**結果**：所有頁面空白

**原因**：`totalNumberOfRecordsToVirtualize` 先設置（高優先級），但 `dataLoadingStatus` 和 `recordIdByRealIndex` 被延遲（低優先級），導致渲染時資料還沒準備好

**教訓**：Twenty 的虛擬化架構依賴多個 state 的同步更新，不能使用 `startTransition` 拆分

---

## 效能瓶頸深度分析

### 資料載入流程耗時分解

| 階段 | 耗時估計 | 說明 |
|------|---------|------|
| `resetVirtualizedRowTreadmill` | ~50-100ms | 設置 200 個 state（已加 diff 檢查優化） |
| 清除舊資料 for loop | ~20-50ms | 設置 2×N 個 state |
| `findManyRecordsLazy` | ~50ms | Apollo 查詢（有 cache 時更快） |
| `upsertRecordsInStore` | ~30-50ms | 設置 N 個 state（已用 fastDeepEqual） |
| `loadRecordsToVirtualRows` | ~30-50ms | 設置 2N+1 個 state |
| **React 渲染** | **~200-300ms** | **主要瓶頸** - 810 個 Recoil 訂閱 |

### Recoil 訂閱數量分析（30 行 × 10 欄位）

**每行（Row）訂閱：17 個**

| 組件 | 訂閱數 | 訂閱的 State |
|-----|-------|-------------|
| RecordTableRowVirtualizedContainer | 2 | `realIndexByVirtualIndex`, `totalNumberOfRecordsToVirtualize` |
| RecordTableRowVirtualizedRouterLevel1 | 1 | `lowDetailsActivated` |
| RecordTableRowVirtualizedRouterLevel2 | 1 | `dataLoadingStatusByRealIndex` |
| RecordTableRowVirtualizedFullData | 3 | `isFocused`, `isRowFocusActive`, `recordIdByRealIndex` |
| RecordTableDraggableTr | 1 | `isSecondaryDragged` |
| RecordTableTr | 9 | 見下方詳細 |

**每 Cell 訂閱：1 個**
- `recordStoreFieldValueSelector`

**總計：30 × 17 + 30 × 10 = 810 個訂閱**

### RecordTableTr 的 9 個訂閱詳解

```typescript
// 1. currentRowSelected - 必要（勾選狀態）
useRecoilComponentFamilyValue(isRowSelectedComponentFamilyState, recordId);

// 2. isActive - 必要（當前行是否 active）
useRecoilComponentFamilyValue(isRecordTableRowActiveComponentFamilyState, focusIndex);

// 3. isNextRowActive - 用於計算 isNextRowActiveOrFocused（邊框樣式）
useRecoilComponentFamilyValue(isRecordTableRowActiveComponentFamilyState, focusIndex + 1);

// 4. nextRecordId - 用於判斷下一行是否是 group 的第一行
useRecoilComponentFamilyValue(recordIdByRealIndexComponentFamilyState, { realIndex: focusIndex + 1 });

// 5. isNextRecordIdFirstOfGroup - 用於計算 isNextRowActiveOrFocused
useRecoilComponentFamilyValue(isRecordIdFirstOfGroupComponentFamilySelector, { recordId: nextRecordId ?? '' });

// 6. isFocused - 必要（當前行是否 focused）
useRecoilComponentFamilyValue(isRecordTableRowFocusedComponentFamilyState, focusIndex);

// 7. isRowFocusActive - 全局 state，每行都訂閱（可優化）
useRecoilComponentValue(isRecordTableRowFocusActiveComponentState);

// 8. isNextRowFocused - 用於計算 isNextRowActiveOrFocused
useRecoilComponentFamilyValue(isRecordTableRowFocusedComponentFamilyState, focusIndex + 1);

// 9. isRecordReadOnly - 必要（權限檢查）
useIsRecordReadOnly({ recordId, objectMetadataId });
```

---

## 待實作的優化方案

### 方案 1：提升全局 State 到父組件（風險：低）

**目標**：將每行都重複訂閱的全局 state 提升到父組件，通過 props 傳遞

**可優化的全局 State**：
1. `totalNumberOfRecordsToVirtualize` - 在 `RecordTableRowVirtualizedContainer` 中每行訂閱
2. `lowDetailsActivated` - 在 `RecordTableRowVirtualizedRouterLevel1` 中每行訂閱

**預估改善**：減少 ~60 個訂閱，INP 改善 20-40ms

**需要修改的檔案**：
- `packages/twenty-front/src/modules/object-record/record-table/components/RecordTableNoRecordGroupRows.tsx`
- `packages/twenty-front/src/modules/object-record/record-table/virtualization/components/RecordTableRowVirtualizedContainer.tsx`
- `packages/twenty-front/src/modules/object-record/record-table/virtualization/components/RecordTableRowVirtualizedRouterLevel1.tsx`

**實作方式**：
```typescript
// RecordTableNoRecordGroupRows.tsx - 父組件讀取一次
const totalCount = useRecoilComponentValue(totalNumberOfRecordsToVirtualizeComponentState);
const lowDetails = useRecoilComponentValue(lowDetailsActivatedComponentState);

// 通過 props 傳給子組件
<RecordTableRowVirtualizedContainer
  totalNumberOfRecordsToVirtualize={totalCount}
  lowDetailsActivated={lowDetails}
/>
```

**潛在 Side Effects**：
- 當 `lowDetailsActivated` 變化時（滾動時），父組件重渲染會導致所有子組件重渲染
- 但重渲染次數與當前相同，只是少了 Recoil 訂閱開銷

### 方案 2：合併 isNextRowActiveOrFocused 計算到 Selector（風險：中）

**目標**：將 `RecordTableTr` 中用於計算 `isNextRowActiveOrFocused` 的 4 個訂閱合併為 1 個 selector

**當前訂閱**：
- `isNextRowActive`
- `nextRecordId`
- `isNextRecordIdFirstOfGroup`
- `isNextRowFocused`

**預估改善**：減少 ~90 個訂閱

**潛在 Side Effects**：
- 需要正確處理 Twenty 的 ComponentState 系統（帶 componentId）
- Selector 依賴多個 atom，任一變化都會觸發重計算
- 可能破壞現有的快取機制

### 方案 3：延遲非關鍵訂閱（風險：低）

**目標**：在初始渲染時不訂閱 focus/active 相關的 state，只在用戶互動後才訂閱

**可延遲的訂閱**：
- `isRecordTableRowFocused`
- `isRecordTableRowActive`
- `isNextRowFocused`
- `isNextRowActive`

**預估改善**：初始渲染時減少 ~120 個訂閱

**潛在 Side Effects**：
- Focus 樣式可能延遲顯示
- 需要避免違反 React Hooks 規則（不能條件調用 hooks）
- 實作複雜度較高

---

## 關鍵架構理解

### 渲染條件鏈（重要！）

```
RecordTableNoRecordGroupRows
  └── 根據 totalNumberOfRecordsToVirtualize 決定渲染多少個 RecordTableRowVirtualizedContainer

RecordTableRowVirtualizedContainer (virtualIndex)
  ├── 讀取 realIndexByVirtualIndex[virtualIndex] → realIndex
  ├── 如果 realIndex === null || realIndex >= totalCount → return null
  └── 渲染 RecordTableRowVirtualizedRouterLevel1(realIndex)

RecordTableRowVirtualizedRouterLevel1 (realIndex)
  ├── 如果 lowDetailsActivated → Skeleton（快速滾動時顯示）
  └── 渲染 RecordTableRowVirtualizedRouterLevel2(realIndex)

RecordTableRowVirtualizedRouterLevel2 (realIndex)
  ├── 讀取 dataLoadingStatus[realIndex]
  ├── 如果 dataLoadingStatus === null → Skeleton（資料載入中）
  └── 渲染 RecordTableRowVirtualizedFullData(realIndex)

RecordTableRowVirtualizedFullData (realIndex)
  ├── 讀取 recordIdByRealIndex[realIndex] → recordId
  ├── 如果 recordId === undefined → Skeleton
  └── 渲染 RecordTableDraggableTr(recordId) → 讀取 recordStoreFamilyState[recordId]
```

### 關鍵 State 依賴關係

| State | 設置時機 | 讀取位置 | 說明 |
|-------|---------|---------|------|
| `totalNumberOfRecordsToVirtualize` | triggerInitial 中 | RecordTableNoRecordGroupRows | 決定渲染多少行 |
| `realIndexByVirtualIndex[virtualIndex]` | resetVirtualizedRowTreadmill | RecordTableRowVirtualizedContainer | 虛擬索引 → 真實索引映射 |
| `lowDetailsActivated` | 滾動時設置 | RecordTableRowVirtualizedRouterLevel1 | 快速滾動時顯示 Skeleton |
| `dataLoadingStatus[realIndex]` | loadRecordsToVirtualRows | RecordTableRowVirtualizedRouterLevel2 | 資料載入狀態 |
| `recordIdByRealIndex[realIndex]` | loadRecordsToVirtualRows | RecordTableRowVirtualizedFullData | 真實索引 → recordId 映射 |
| `recordStoreFamilyState[recordId]` | upsertRecordsInStore | Cell 組件 | 實際的 record 資料 |

### 資料流同步性要求

這些 state 必須按順序設置，否則會導致渲染問題：

1. `resetVirtualizedRowTreadmill` → 初始化 `realIndexByVirtualIndex`
2. `totalNumberOfRecordsToVirtualize` → 決定渲染行數
3. `upsertRecordsInStore` → 將 record 存入 store
4. `loadRecordsToVirtualRows` → 設置 `dataLoadingStatus` 和 `recordIdByRealIndex`

如果順序錯誤或使用 `startTransition` 拆分，會導致：
- 渲染時 `realIndexByVirtualIndex` 還沒初始化 → 空白
- 渲染時 `dataLoadingStatus` 還是 null → 顯示 Skeleton
- 渲染時 `recordIdByRealIndex` 還沒設置 → 顯示 Skeleton

---

## 相關檔案清單

### 核心載入邏輯

| 檔案 | 說明 |
|-----|------|
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/hooks/useTriggerInitialRecordTableDataLoad.ts` | 頁面切換時的資料載入入口 |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/hooks/useResetVirtualizedRowTreadmill.ts` | 重置虛擬化行映射 |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/hooks/useLoadRecordsToVirtualRows.ts` | 將 records 載入虛擬行 |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/hooks/useTriggerFetchPages.ts` | 滾動時載入更多資料 |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/components/RecordTableVirtualizedInitialDataLoadEffect.tsx` | 觸發初始載入的 Effect |

### Record Store

| 檔案 | 說明 |
|-----|------|
| `packages/twenty-front/src/modules/object-record/record-store/hooks/useUpsertRecordsInStore.ts` | 將 records 存入 Recoil store |
| `packages/twenty-front/src/modules/object-record/record-store/states/recordStoreFamilyState.ts` | Record 的 Recoil atom |
| `packages/twenty-front/src/modules/object-record/record-store/states/selectors/recordStoreFieldValueSelector.ts` | 讀取單一欄位值的 selector |
| `packages/twenty-front/src/modules/object-record/record-store/hooks/useRecordFieldValue.tsx` | Cell 讀取欄位值的 hook |

### 虛擬化組件

| 檔案 | 說明 |
|-----|------|
| `packages/twenty-front/src/modules/object-record/record-table/components/RecordTableNoRecordGroupRows.tsx` | 渲染虛擬行的父組件 |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/components/RecordTableRowVirtualizedContainer.tsx` | 虛擬行容器（virtualIndex → realIndex） |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/components/RecordTableRowVirtualizedRouterLevel1.tsx` | Low Details Mode 判斷 |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/components/RecordTableRowVirtualizedRouterLevel2.tsx` | 資料載入狀態判斷 |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/components/RecordTableRowVirtualizedFullData.tsx` | 完整資料渲染 |

### 行組件

| 檔案 | 說明 |
|-----|------|
| `packages/twenty-front/src/modules/object-record/record-table/record-table-row/components/RecordTableTr.tsx` | 行組件（9 個 Recoil 訂閱） |
| `packages/twenty-front/src/modules/object-record/record-table/record-table-row/components/RecordTableDraggableTr.tsx` | 可拖拽的行包裝 |
| `packages/twenty-front/src/modules/object-record/record-table/record-table-row/components/RecordTableFieldsCells.tsx` | 渲染所有 Cell |

### Cell 組件

| 檔案 | 說明 |
|-----|------|
| `packages/twenty-front/src/modules/object-record/record-table/record-table-cell/components/RecordTableCell.tsx` | Cell 組件 |
| `packages/twenty-front/src/modules/object-record/record-table/record-table-cell/components/RecordTableCellWrapper.tsx` | Cell Context 包裝 |
| `packages/twenty-front/src/modules/object-record/record-field/ui/components/FieldDisplay.tsx` | 欄位顯示組件 |

### 常數設定

| 檔案 | 說明 |
|-----|------|
| `packages/twenty-shared/src/constants/QueryDefaultLimitRecords.ts` | 初始載入筆數（已改為 30） |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/constants/NumberOfVirtualizedRows.ts` | 虛擬化行數上限（200） |

---

## 診斷工具與方法

### 方法 1：Chrome DevTools Network Tab

1. 開啟 Chrome DevTools → Network tab
2. 篩選 `graphql` 請求
3. 切換「公司」→「人員」
4. 觀察：
   - 是否有新的 GraphQL 請求？
   - 請求時間是多少？
   - 如果再次切換回「公司」，是否還有請求？（應該沒有，因為 cache-first）

### 方法 2：React DevTools Profiler

1. 開啟 React DevTools → Profiler tab
2. 點擊 Record
3. 切換頁面
4. 停止 Record
5. 觀察：
   - 哪些組件渲染時間最長？
   - 是否有不必要的重新渲染？

### 方法 3：Console.time 診斷

在 `useTriggerInitialRecordTableDataLoad.ts` 中添加：

```typescript
const triggerInitialRecordTableDataLoad = useRecoilCallback(
  ({ snapshot, set }) =>
    async ({ shouldScrollToStart = true } = {}) => {
      console.time('triggerInitialRecordTableDataLoad');

      console.time('resetTableFocuses');
      resetTableFocuses();
      console.timeEnd('resetTableFocuses');

      console.time('resetVirtualizedRowTreadmill');
      resetVirtualizedRowTreadmill();
      console.timeEnd('resetVirtualizedRowTreadmill');

      console.time('clearOldData');
      for (const [index] of currentRecordIds.entries()) {
        set(dataLoadingStatusByRealIndexCallbackState({ realIndex: index }), null);
        set(recordIdByRealIndexCallbackState({ realIndex: index }), null);
      }
      console.timeEnd('clearOldData');

      console.time('findManyRecordsLazy');
      const { records, totalCount } = await findManyRecordsLazy();
      console.timeEnd('findManyRecordsLazy');

      console.time('upsertRecordsInStore');
      upsertRecordsInStore(records);
      console.timeEnd('upsertRecordsInStore');

      console.time('loadRecordsToVirtualRows');
      loadRecordsToVirtualRows({ records, startingRealIndex: 0 });
      console.timeEnd('loadRecordsToVirtualRows');

      console.timeEnd('triggerInitialRecordTableDataLoad');
      // ...
    }
);
```

### 方法 4：Web Vitals INP 測量

使用 Chrome DevTools → Performance tab → 勾選 Web Vitals
或使用 web-vitals 套件：

```typescript
import { onINP } from 'web-vitals';
onINP(console.log);
```

---

## 注意事項

### 開發原則

1. **不要質疑 Twenty 開源的設計** - 他們是優秀的研發團隊，架構選擇是經過深思熟慮的
2. **遵守三原則**：
   - ✅ 參考原本開源的設計架構跟邏輯
   - ✅ 不影響其他正常執行的功能
   - ✅ 保留本地所有修改
3. **先深度 trace code 再修改** - 確認不會有 side effects
4. **遇到問題不要直接回滾** - 要找出原因並修復

### 技術注意事項

1. **Recoil selectorFamily 已有快取機制** - 不是每次都執行查找
2. **React.memo 不是萬能藥** - 過度使用反而會降低效能
3. **資料流同步性很重要** - 不要用 `startTransition` 拆分相關的 state 更新
4. **ComponentState 系統** - Twenty 的 Recoil state 帶有 componentId，修改時要注意

### 測試環境

- 測試時使用生產環境 build（`yarn build`）
- 不要打印 console.log（會影響效能測量）
- 使用真實資料量測試（至少 30-50 筆）

---

## 版本歷史

| 日期 | 版本 | 說明 |
|-----|------|------|
| 2025-12-20 | v1.0 | 初始分析 |
| 2025-12-21 | v2.0 | 完成 3 項優化，INP 從 500-600ms 降到 300-400ms |
| 2025-12-21 | v2.1 | 修復刪除資料後空白行問題（同步遠程開源重構） |

---

## 刪除資料後空白行問題修復記錄

### 問題描述

刪除 2 筆資料後，下滑時發現有空白行（有 checkbox 但沒有資料）。

### 根本原因

用戶已經 cherry-pick 了 `#16419 Improved table flash on reload`（commit `cee63c6eb5`），但遠程開源在這之後又做了進一步的重構：

1. 將 `objectOperationsState`（全局）改為 `objectOperationsByObjectNameSingularFamilyState`（按 objectNameSingular 分組）
2. 簡化了 `RecordTableVirtualizedDataChangedEffect` 的邏輯
3. 簡化了 `useResetVirtualizationBecauseDataChanged` 的邏輯
4. 移除了 `objectMetadataItemId` 檢查（因為 family state 已經按 objectNameSingular 分組）

### 修改的檔案清單

#### 新增檔案
- `packages/twenty-front/src/modules/object-record/states/objectOperationsByObjectNameSingularFamilyState.ts`

#### 刪除檔案
- `packages/twenty-front/src/modules/object-record/states/objectOperationsComponentState.ts`

#### 修改檔案（核心）
| 檔案 | 修改內容 |
|-----|---------|
| `useRegisterObjectOperation.ts` | 參數從 `objectMetadataItem` 改為 `objectNameSingular`，使用新的 family state |
| `RecordTableVirtualizedDataChangedEffect.tsx` | 移除複雜的 filter/sort 檢查邏輯，直接調用 `resetVirtualizationBecauseDataChanged(lastObjectOperation)` |
| `useResetVirtualizationBecauseDataChanged.ts` | 新增 `tableHasAnyFilterOrSortComponentSelector` 和 `recordIndexAllRecordIdsSelector` 依賴，根據操作類型決定是否重置 |
| `lastObjectOperationThatResettedVirtualizationComponentState.ts` | 更新 import 路徑 |

#### 修改檔案（調用處）
| 檔案 | 修改內容 |
|-----|---------|
| `useDeleteOneRecord.ts` | `registerObjectOperation(objectNameSingular, {...})` |
| `useCreateOneRecord.ts` | `registerObjectOperation(objectNameSingular, {...})` |
| `useUpdateOneRecord.ts` | `registerObjectOperation(objectNameSingular, {...})`，result 新增 `updatedRecord` |
| `useDestroyOneRecord.ts` | `registerObjectOperation(objectMetadataItem.nameSingular, {...})` |
| `useDestroyManyRecords.ts` | `registerObjectOperation(objectNameSingular, {...})` |
| `useRestoreManyRecords.ts` | `registerObjectOperation(objectMetadataItem.nameSingular, {...})` |
| `useCreateManyRecords.ts` | `registerObjectOperation(objectNameSingular, {...})` |
| `useBatchCreateManyRecords.ts` | `registerObjectOperation(objectNameSingular, {...})` |
| `useDeleteManyRecords.ts` | `registerObjectOperation(objectNameSingular, {...})` |
| `useIncrementalDestroyManyRecords.ts` | `registerObjectOperation(objectNameSingular, {...})` |
| `useIncrementalDeleteManyRecords.ts` | `registerObjectOperation(objectNameSingular, {...})` |
| `useMergeManyRecords.ts` | `registerObjectOperation(objectNameSingular, {...})` |
| `useUpdateOneRecordV2.ts` | `registerObjectOperation(objectMetadataItem.nameSingular, {...})`，result 新增 `updatedRecord` |
| `useStopWorkflowRun.ts` | `registerObjectOperation('workflowRun', {...})`，移除 `useObjectMetadataItem` |

### 架構變更說明

#### 舊架構（本地）
```
objectOperationsState (全局 array)
  └── 每個 operation 包含 objectMetadataItemId
  └── RecordTableVirtualizedDataChangedEffect 需要檢查 objectMetadataItemId 是否匹配
```

#### 新架構（遠程）
```
objectOperationsByObjectNameSingularFamilyState (family state)
  └── 按 objectNameSingular 分組
  └── RecordTableVirtualizedDataChangedEffect 直接訂閱對應的 objectNameSingular
  └── 不需要額外檢查，因為已經是分組的
```

### 新架構的優點

1. **更精確的訂閱**：每個 table 只訂閱自己 objectNameSingular 的 operations
2. **更簡潔的邏輯**：不需要在 Effect 中過濾 objectMetadataItemId
3. **更好的效能**：減少不必要的 re-render（其他 object 的操作不會觸發）

### 驗證方式

1. Build 成功：`npx nx build twenty-front --skip-nx-cache`
2. 刪除資料後下滑，不再出現空白行
3. 其他 CRUD 操作正常運作

---

## 後續優化建議

如果需要進一步優化到 150-250ms，建議優先嘗試：

1. **方案 1（提升全局 State）** - 風險最低，預估改善 20-40ms
2. **方案 3（延遲非關鍵訂閱）** - 風險低，對初始渲染有幫助
3. **方案 2（合併 Selector）** - 風險中等，需要更多測試

每個方案實作前，請先：
1. 完整讀取相關檔案
2. 列出具體修改內容
3. 分析潛在 side effects
4. 在開發環境測試
5. 在生產環境測量 INP
