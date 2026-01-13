# Side Panel Tag 跳轉空白問題分析

> 最後更新：2026-01-12
>
> 本文件記錄 Side Panel 中 relation chip 點擊跳轉後頁面空白的問題分析

---

## 問題描述

### 現象
在 Side Panel（右側詳情面板）中，點擊 Relation Tag（關聯標籤）跳轉後頁面空白，但下拉選單可以正常顯示資料。

### 問題行為模式

| 操作 | 下拉選單 | Tag 跳轉 |
|------|---------|---------|
| 人員 → 公司 | ✅ 正常 | ✅ 正常 |
| 人員 → 機會 | ✅ 正常 | ❌ 空白 |
| 公司 → 機會 | ✅ 正常 | ❌ 空白 |
| 機會 → 其他 | ✅ 正常 | ❓ 待確認 |

### 關鍵特徵
- ✅ GraphQL API 正常返回資料
- ✅ 下拉選單可以正常顯示關聯資料
- ❌ 點擊 Tag 跳轉後頁面空白

---

## 技術分析

### 1. 下拉選單 vs Tag 跳轉的資料來源差異

| 功能 | 資料來源 | 說明 |
|------|---------|------|
| 下拉選單顯示 | Recoil Store (`useRecordFieldValue`) | 從當前頁面已載入的資料中取得 |
| Tag 跳轉後顯示 | GraphQL 查詢 (`useFindOneRecord`) | 需要發起新的 API 請求 |

**這解釋了為什麼下拉能顯示但跳轉後空白** - 下拉使用的是已存在於記憶體的資料，而跳轉需要重新查詢和渲染。

### 2. 跳轉流程

```
點擊 RecordChip (Tag)
    ↓
openRecordInCommandMenu({ recordId, objectNameSingular })
    ↓
設定 viewableRecordIdComponentState + viewableRecordNameSingularComponentState
    ↓
navigateCommandMenu() → CommandMenuPages.ViewRecord
    ↓
CommandMenuRouter 渲染 CommandMenuRecordPage
    ↓
PageLayoutDispatcher (根據 feature flag 決定渲染路徑)
    ↓
RecordShowContainer → ShowPageSubContainer
    ↓
renderActiveTabContent() ← 依賴 activeTabId
```

### 3. activeTabId 初始化問題（核心原因）

#### 問題點

1. **`activeTabId` 初始值為 `null`**
   ```typescript
   // activeTabIdComponentState.ts
   export const activeTabIdComponentState = createComponentState<string | null>({
     key: 'activeTabIdComponentState',
     defaultValue: null,  // ← 初始值為 null
   });
   ```

2. **每次跳轉生成新的 componentInstanceId**
   ```typescript
   // ShowPageSubContainer.tsx
   const tabListComponentId = getShowPageTabListComponentId({
     pageId: commandMenuPageComponentInstance?.instanceId,  // ← 每次都是新的 UUID
     targetObjectId: targetRecordIdentifier.id,
   });
   ```

3. **useEffect 設定 activeTabId 的時機**
   ```typescript
   // TabList.tsx
   useEffect(() => {
     setActiveTabId(initialActiveTabId);
   }, [initialActiveTabId, setActiveTabId, onChangeTab]);
   ```

4. **renderActiveTabContent 在 useEffect 前執行**
   ```typescript
   // ShowPageSubContainer.tsx
   const renderActiveTabContent = () => {
     const activeTab = tabs.find((tab) => tab.id === activeTabId);
     if (!activeTab?.cards?.length) return null;  // ← activeTabId 為 null 時返回 null！
     // ...
   };
   ```

#### 競態條件（Race Condition）

```
首次渲染
    ↓
activeTabId = null (初始值)
    ↓
tabs 可能為空或不完整（metadata 尚未載入）
    ↓
renderActiveTabContent() 執行
    ↓
tabs.find((tab) => tab.id === null) → undefined
    ↓
return null → 頁面空白
    ↓
（稍後）useEffect 執行
    ↓
setActiveTabId(initialActiveTabId)
    ↓
（但可能太晚了）
```

### 4. 為什麼某些物件可以但某些不行？

| 因素 | Company | Opportunity |
|------|---------|-------------|
| Metadata 載入速度 | 較快（常用物件） | 可能較慢 |
| tabs 陣列準備時間 | 較早 | 可能較晚 |
| useEffect 執行時機 | tabs 已準備好 | tabs 可能還在載入 |
| 結果 | 正常顯示 | 可能空白 |

---

## 本地與上游程式碼比較

### 完全相同的核心檔案

| 檔案 | 狀態 |
|------|------|
| `CommandMenuRecordPage.tsx` | ✅ 與上游完全相同 |
| `PageLayoutDispatcher.tsx` | ✅ 與上游完全相同 |
| `RecordShowContainer.tsx` | ✅ 與上游完全相同 |
| `TabList.tsx` | ✅ 與上游完全相同 |
| `TabListFromUrlOptionalEffect.tsx` | ✅ 與上游完全相同 |
| `useOpenRecordInCommandMenu.ts` | ✅ 與上游完全相同 |
| `useRecordShowPage.ts` | ✅ 與上游完全相同 |

### 有本地修改但不影響跳轉邏輯的檔案

| 檔案 | 修改內容 | 影響 |
|------|---------|------|
| `ShowPageSubContainer.tsx` | 樣式調整 | ❌ 不影響 |
| `useRecordShowContainerTabs.ts` | 翻譯處理方式 | ❌ 不影響 |
| `SummaryCard.tsx` | 增加 icon 顯示 | ❌ 不影響 |
| `FieldsCard.tsx` | 移除 Context wrapper | ⚠️ 可能需要確認 |
| `useNavigateCommandMenu.ts` | 增加 drag state | ❌ 不影響 |
| `useCommandMenu.ts` | 增加 drag state | ❌ 不影響 |

---

## 排查步驟

### 在瀏覽器 DevTools 中

1. **Console 檢查**
   - 點擊 Tag 跳轉後，查看是否有錯誤訊息
   - 常見錯誤：
     - `"Object name is not defined"`
     - `"Record id is not defined"`
     - `"Command menu page instance id is not defined"`
     - Apollo Cache merge 相關錯誤

2. **Network 檢查**
   - 確認 GraphQL 查詢有發出
   - 確認 Response 有正確資料

3. **React DevTools 檢查**
   - 找到 `ShowPageSubContainer` 組件
   - 查看以下 props：
     - `activeTabId` - 是否為 `null`？
     - `tabs` - 是否為空陣列？
     - `visibleTabs` - 有幾個？

---

## 可能的解決方向

### 方向 1：在 renderActiveTabContent 中增加 fallback

```typescript
const renderActiveTabContent = () => {
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  // 如果找不到 activeTab，使用第一個可見的 tab
  const tabToRender = activeTab || tabs.find((tab) => !tab.hide);
  if (!tabToRender?.cards?.length) return null;
  // ...
};
```

### 方向 2：同步設定 activeTabId（而不是在 useEffect 中）

```typescript
// 在組件初始化時就同步設定 activeTabId
const [activeTabId, setActiveTabId] = useRecoilComponentState(
  activeTabIdComponentState,
  componentInstanceId,
);

// 同步計算並設定
const initialActiveTabId = useMemo(() => {
  const existingTab = visibleTabs.find((tab) => tab.id === activeTabId);
  return existingTab ? activeTabId : visibleTabs[0]?.id;
}, [visibleTabs, activeTabId]);
```

### 方向 3：確認是否為上游 bug

- 搜尋 Twenty GitHub Issues
- 確認是否有人回報類似問題
- 如果是上游問題，可以等待官方修復或提交 PR

---

## 結論

**問題的根本原因是 `activeTabId` 初始化時機與渲染時機不同步**，這是一個競態條件問題。

核心跳轉相關的程式碼與上游完全相同，這可能是上游開源程式碼本身的設計限制或 bug。

建議：
1. 先確認瀏覽器 Console 和 React DevTools 的狀態
2. 如果確認是 activeTabId 問題，可以考慮實作 fallback 邏輯
3. 如果是上游 bug，可以等待官方修復或提交 PR

---

## 相關文件

- `docs/web_performance_ptimization(WPO)/TABLE_SWITCH_OPTIMIZATION_2026_01_12.md` - 資料表切換優化
- `docs/web_performance_ptimization(WPO)/PERFORMANCE_OPTIMIZATION_COMPLETE.md` - 效能優化完整文件
- `docs/features/SIDE_PANEL_FIELD_SORTING.md` - Side Panel 欄位排序需求

---

## 版本歷史

| 日期 | 版本 | 說明 |
|-----|------|------|
| 2026-01-12 | v1.0 | 初始分析 |
