# Slide Panel 點擊 Relation Tag 空白 & Dashboard 顯示問題修復

**日期**: 2026-01-13
**狀態**: 已修復

---

## 問題描述

### 問題 1: Slide Panel 點擊 Relation Tag 跳轉空白
- **現象**: 在 Table View 點擊 Relation Tag 開啟 Slide Panel 後，頁面顯示空白
- **影響範圍**: 所有 object 的 Relation Tag 點擊

### 問題 2: Dashboard 顯示奇怪畫面
- **現象**: Dashboard 頁面先顯示一般 record 的 layout（時間軸、任務、備註、附檔），然後消失
- **影響範圍**: 所有 Dashboard 頁面

---

## 根本原因

### 問題 1 根因
效能優化將全域 Apollo `fetchPolicy` 從 `cache-and-network` 改成 `cache-first`，導致當 `isRecordPageEnabled` feature flag 開啟時，slide panel 走 `PageLayoutRecordPageRenderer` 路徑，但這個路徑的複雜初始化流程與 `cache-first` 不相容，cache 沒資料時頁面顯示空白。

### 問題 2 根因
修復問題 1 時，修改了 `useRecordPageLayoutId.ts`，讓 loading 時返回預設 layout ID。但 Dashboard 沒有預設 layout，它的 `pageLayoutId` 存在資料庫 record 中，導致 Dashboard 先顯示錯誤的一般 record layout。

---

## 解決方案

### 修改 1: PageLayoutDispatcher.tsx
讓 Slide Panel (right drawer) 繞過 `PageLayoutRecordPageRenderer`，使用原本穩定的 `RecordShowContainer`。

```typescript
// 在 right drawer (slide panel) 中時，使用原本穩定的 RecordShowContainer
// 避免 PageLayout 初始化時序問題導致空白
const shouldUsePageLayout =
  !isInRightDrawer &&
  (targetRecordIdentifier.targetObjectNameSingular ===
    CoreObjectNameSingular.Dashboard ||
    isRecordPageEnabled);
```

### 修改 2: useRecordPageLayoutId.ts
新增 `OBJECTS_REQUIRING_RECORD_PAGE_LAYOUT_ID` 列表，讓 Dashboard 等 object 等 record 載入後才取得 `pageLayoutId`。

```typescript
// Dashboard 需要從 record 取得 pageLayoutId，沒有預設 layout
const OBJECTS_REQUIRING_RECORD_PAGE_LAYOUT_ID = [
  CoreObjectNameSingular.Dashboard,
];

// Dashboard 等 object 必須等 record 載入後才能取得 pageLayoutId
// 在 loading 時返回 null，避免先顯示錯誤的 layout
if (requiresRecordPageLayoutId) {
  return {
    pageLayoutId: loading ? null : null,
    loading,
  };
}
```

---

## 修改檔案清單

| 檔案 | 修改內容 |
|------|---------|
| `PageLayoutDispatcher.tsx` | 加入 `!isInRightDrawer` 條件判斷 |
| `useRecordPageLayoutId.ts` | 新增 Dashboard 特殊處理邏輯 |
| `PageLayoutRecordPageRenderer.tsx` | 加入 logDebug 和 isDashboard 判斷 |
| `useFindOneRecord.ts` | 加入 `fetchPolicy: 'cache-and-network'` |
| `PageLayoutInitializationQueryEffect.tsx` | 改用 `useLayoutEffect` |
| `ShowPageSubContainer.tsx` | 修改 `renderActiveTabContent()` 處理 |

---

## 效能優化保留

以下效能優化成果**保留不變**：
- 全域 `cache-first` 在 `useApolloFactory.ts`
- Table View 欄位順序同步到 Side Panel（`useFieldListFieldMetadataItems.ts`）
- 頁面切換速度優化

---

## 測試項目

部署後請測試：
1. ✅ Slide Panel 點擊 Relation Tag → 應該正常顯示 record 內容
2. ✅ Dashboard 頁面 → 應該顯示圖表 widgets
3. ✅ Company/Person/Opportunity 主頁面 → 應該正常顯示
4. ✅ 頁面切換速度 → 應該維持優化效果

---

## 相關文件

- `docs/web_performance_ptimization(WPO)/TABLE_SWITCH_OPTIMIZATION_2026_01_12.md`
- `docs/web_performance_ptimization(WPO)/SIDE_PANEL_TAG_NAVIGATION_ANALYSIS.md`
