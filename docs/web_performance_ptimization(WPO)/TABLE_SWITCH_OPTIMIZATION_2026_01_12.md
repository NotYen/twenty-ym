# 資料表切換效能優化（2026-01-12）

> 最後更新：2026-01-12
>
> 本文件記錄資料表切換效能優化的分析與修復

---

## 問題描述

### 現象
當資料表內容較多時（例如 48 筆以上），在資料表之間切換會出現卡頓現象。

### 關鍵發現
- **第一次載入**：較不卡頓
- **第二次以後（使用 cache）**：明顯卡頓
- **刪除記錄後切換再返回**：出現空白列

### 使用者期望
1. 不管是第一次還是第 N 次進入，都要維持相同的切換速度
2. 任何 CRUD 操作都不會有錯誤（系統穩定性）
3. 目標效能：頁面切換 300-400ms

---

## 問題分析

### 1. 第二次切換卡頓原因

#### 根本原因：Apollo Cache + Selector O(N²) 複雜度

當使用 `cache-first` 策略時，第二次切換：
1. Apollo Cache 直接返回資料（不發網路請求）
2. 但前端需要處理大量 Recoil state 更新
3. `recordIndexAllRecordIdsComponentSelector` 使用 `reduce + spread` 造成 O(N²) 複雜度

#### 效能瓶頸分析

```
第二次切換流程：
    ↓
triggerInitialRecordTableDataLoad
    ↓
清空迴圈：for (0 to oldRecordCount) × 2 個 set    ← 瓶頸 1：2N 次 state 更新
    ↓
recordIndexAllRecordIdsComponentSelector            ← 瓶頸 2：O(N²) array spread
    ↓
loadRecordsToVirtualRows                            ← 瓶頸 3：2N+1 次 state 更新
```

### 2. 刪除記錄後空白列原因

#### 根本原因：舊索引狀態未正確清除

當刪除記錄後切換頁面再返回：
1. `recordIndexAllRecordIds` 可能被樂觀更新（optimistic update）
2. 使用 `oldRecordIds.length` 判斷時，值已經是更新後的數量
3. 清除條件 `oldRecordCount > newRecordCount` 為 false
4. `recordIdByRealIndex[N]` 的舊值沒有被清除
5. 返回時這些殘留的狀態導致空白列

---

## 已實施的優化

### 優化 1：移除不必要的清空迴圈 ✅

**問題**：原本的清空邏輯會執行 2N 次 set 操作

**解決方案**：只清除超出新記錄數量的索引

**修改檔案**：
`packages/twenty-front/src/modules/object-record/record-table/virtualization/hooks/useTriggerInitialRecordTableDataLoad.ts`

```typescript
// 修改前：清空所有索引（2N 次 set）
for (let index = 0; index < oldRecordCount; index++) {
  set(dataLoadingStatusByRealIndexCallbackState({ realIndex: index }), null);
  set(recordIdByRealIndexCallbackState({ realIndex: index }), null);
}

// 修改後：只清除超出部分（最多 M 次 set，M = oldCount - newCount）
if (previousTotalCount > newRecordCount) {
  for (let index = newRecordCount; index < previousTotalCount; index++) {
    set(dataLoadingStatusByRealIndexCallbackState({ realIndex: index }), null);
    set(recordIdByRealIndexCallbackState({ realIndex: index }), null);
  }
}
```

### 優化 2：Selector O(N²) 改為 O(N) ✅

**問題**：使用 `reduce + spread` 造成 O(N²) 複雜度

**解決方案**：使用 `map + flat()` 改為 O(N) 複雜度

**修改檔案**：
`packages/twenty-front/src/modules/object-record/record-index/states/selectors/recordIndexAllRecordIdsComponentSelector.ts`

```typescript
// 修改前：O(N²) 複雜度
const allRowIds = recordGroupIds.reduce<string[]>((acc, recordGroupId) => {
  const rowIds = get(
    recordIndexRecordIdsByGroupComponentFamilyState.atomFamily({
      instanceId,
      familyKey: recordGroupId,
    }),
  );
  return [...acc, ...rowIds];  // ← 每次都複製整個陣列
}, []);

// 修改後：O(N) 複雜度
const allRowIds = recordGroupIds.map((recordGroupId) =>
  get(
    recordIndexRecordIdsByGroupComponentFamilyState.atomFamily({
      instanceId,
      familyKey: recordGroupId,
    }),
  ),
);
return allRowIds.flat();  // ← flat() 是 O(N)
```

### 優化 3：修復刪除後空白列 ✅

**問題**：使用 `recordIndexAllRecordIds.length` 判斷舊記錄數量會被樂觀更新影響

**解決方案**：使用 `totalNumberOfRecordsToVirtualize` 的舊值作為參考

**修改檔案**：
`packages/twenty-front/src/modules/object-record/record-table/virtualization/hooks/useTriggerInitialRecordTableDataLoad.ts`

```typescript
// 修改前：使用 recordIndexAllRecordIds（可能被樂觀更新）
const oldRecordIds = getSnapshotValue(snapshot, recordIndexAllRecordIdsSelector);
const oldRecordCount = oldRecordIds.length;

// 修改後：使用 totalNumberOfRecordsToVirtualize（只在此函式中更新）
const previousTotalCount = getSnapshotValue(
  snapshot,
  totalNumberOfRecordsToVirtualizeCallbackState,
) ?? 0;
```

---

## 修改的檔案清單

| 檔案 | 修改內容 |
|------|---------|
| `useTriggerInitialRecordTableDataLoad.ts` | 優化清空邏輯、修復空白列 |
| `recordIndexAllRecordIdsComponentSelector.ts` | O(N²) → O(N) |
| `useResetVirtualizedRowTreadmill.ts` | 加入 diff 檢查（之前已優化） |

---

## 測試清單

### 效能測試
- [ ] 第一次進入頁面：切換時間 ≤ 400ms
- [ ] 第二次進入頁面：切換時間 ≤ 400ms
- [ ] 大量資料（100+ 筆）：切換時間 ≤ 500ms

### 功能測試
- [ ] 刪除底部記錄（如 48, 49）→ 切換頁面 → 返回 → 無空白列
- [ ] 刪除中間記錄 → 切換頁面 → 返回 → 無空白列
- [ ] 新增記錄 → 即時反映
- [ ] 編輯記錄 → 即時反映
- [ ] 刪除記錄 → 即時反映

### 穩定性測試
- [ ] 連續快速切換頁面 10 次：無錯誤、無空白
- [ ] 長時間使用（1 小時）：效能不退化

---

## 相關文件

- `docs/web_performance_ptimization(WPO)/PERFORMANCE_OPTIMIZATION_COMPLETE.md` - 效能優化完整文件
- `docs/web_performance_ptimization(WPO)/RELATION_TAG_NAVIGATION_FIX.md` - Tag 跳轉問題修復
- `docs/features/SIDE_PANEL_FIELD_SORTING.md` - Side Panel 欄位排序需求

---

## 版本歷史

| 日期 | 版本 | 說明 |
|-----|------|------|
| 2026-01-12 | v1.0 | 初始分析與優化 |
