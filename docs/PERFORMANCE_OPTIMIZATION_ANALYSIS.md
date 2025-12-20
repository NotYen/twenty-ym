# 頁面切換效能優化分析報告（修正版）

> 分析日期：2025-12-20
>
> 針對「左側功能列表（公司、人員切換）比其他功能點擊 lag 多一點」的問題進行深入分析

---

## ⚠️ 重要更正

之前的分析有誤！Twenty 是一個成熟的開源專案，他們的架構選擇是經過深思熟慮的：

1. **Recoil selectorFamily 已有快取機制** - 不是每次都執行 O(n) 查找
2. **React.memo 不是萬能藥** - 過度使用反而會降低效能
3. **Twenty 團隊的設計是合理的** - 不應該輕易質疑

---

## 📊 真正的效能瓶頸分析

### 1. 頁面切換的完整流程

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
    ↓
Table 虛擬化渲染
```

### 2. 可能的效能瓶頸點

#### 2.1 網路請求 (最可能的瓶頸)

```typescript
// useFindManyRecords.ts
const { data, loading, error, fetchMore, refetch } =
  useQuery<RecordGqlOperationFindManyResult>(findManyRecordsQuery, {
    fetchPolicy: fetchPolicy,  // 預設是 cache-first
    // ...
  });
```

**分析**：
- 你已經將 `fetchPolicy` 改為 `cache-first`
- 但首次載入某個 object 時，cache 是空的，仍需要網路請求
- 切換到不同 object 時，如果該 object 的資料不在 cache 中，會有延遲

**驗證方式**：
- 開啟 Chrome DevTools → Network tab
- 切換頁面時觀察是否有 GraphQL 請求
- 檢查請求時間

#### 2.2 虛擬化初始化 (可能的瓶頸)

```typescript
// useTriggerInitialRecordTableDataLoad.ts
const triggerInitialRecordTableDataLoad = useRecoilCallback(
  ({ snapshot, set }) =>
    async ({ shouldScrollToStart = true } = {}) => {
      // 重置很多狀態
      resetTableFocuses();
      resetVirtualizedRowTreadmill();

      // 清除舊的 index mapping
      for (const [index] of currentRecordIds.entries()) {
        set(dataLoadingStatusByRealIndexCallbackState({ realIndex: index }), null);
        set(recordIdByRealIndexCallbackState({ realIndex: index }), null);
      }

      // 發起查詢
      const { records, totalCount } = await findManyRecordsLazy();

      // 更新 store
      upsertRecordsInStore(records);
      loadRecordsToVirtualRows({ records, startingRealIndex: 0 });
      // ...
    }
);
```

**分析**：
- 每次切換 object 都會重置整個虛擬化狀態
- 清除舊的 index mapping 是 O(n) 操作
- `findManyRecordsLazy()` 是 async 操作，會有等待時間

#### 2.3 View 切換檢測 (可能的瓶頸)

```typescript
// RecordTableVirtualizedInitialDataLoadEffect.tsx
useEffect(() => {
  if ((currentView?.id ?? null) !== lastContextStoreVirtualizedViewId) {
    // View 變更 → 觸發重新載入
    await triggerInitialRecordTableDataLoad();
  } else if (queryIdentifier !== lastRecordTableQueryIdentifier) {
    // Query 變更 → 觸發重新載入
    await triggerInitialRecordTableDataLoad();
  }
  // ...
}, [/* 很多依賴 */]);
```

**分析**：
- 切換 object 時，`currentView` 和 `queryIdentifier` 都會變更
- 這會觸發 `triggerInitialRecordTableDataLoad`
- 即使資料在 cache 中，仍會執行重置和重新載入流程

---

## 🔍 建議的診斷步驟

### 步驟 1：確認是否是網路請求造成的延遲

1. 開啟 Chrome DevTools → Network tab
2. 篩選 `graphql` 請求
3. 切換「公司」→「人員」
4. 觀察：
   - 是否有新的 GraphQL 請求？
   - 請求時間是多少？
   - 如果再次切換回「公司」，是否還有請求？（應該沒有，因為 cache-first）

### 步驟 2：確認是否是 React 渲染造成的延遲

1. 開啟 React DevTools → Profiler tab
2. 點擊 Record
3. 切換頁面
4. 停止 Record
5. 觀察：
   - 哪些組件渲染時間最長？
   - 是否有不必要的重新渲染？

### 步驟 3：確認是否是虛擬化重置造成的延遲

在 `useTriggerInitialRecordTableDataLoad.ts` 中添加 console.time：

```typescript
const triggerInitialRecordTableDataLoad = useRecoilCallback(
  ({ snapshot, set }) =>
    async ({ shouldScrollToStart = true } = {}) => {
      console.time('triggerInitialRecordTableDataLoad');

      console.time('resetTableFocuses');
      resetTableFocuses();
      console.timeEnd('resetTableFocuses');

      console.time('findManyRecordsLazy');
      const { records, totalCount } = await findManyRecordsLazy();
      console.timeEnd('findManyRecordsLazy');

      console.time('upsertRecordsInStore');
      upsertRecordsInStore(records);
      console.timeEnd('upsertRecordsInStore');

      console.timeEnd('triggerInitialRecordTableDataLoad');
      // ...
    }
);
```

---

## 📋 可能的優化方向（需要先診斷確認）

### 如果是網路請求造成的延遲

1. **預載入常用 object 的資料**
   - 在 app 初始化時，預先載入 Company、Person 等常用 object 的資料
   - 這樣切換時就能直接從 cache 讀取

2. **使用 Apollo Client 的 `prefetch`**
   - 在 hover Navigation Item 時預先載入資料

### 如果是虛擬化重置造成的延遲

1. **優化 index mapping 清除邏輯**
   - 使用 batch update 而不是逐個清除

2. **保留部分虛擬化狀態**
   - 如果只是切換 object，不需要完全重置所有狀態

### 如果是 React 渲染造成的延遲

1. **使用 React.memo**（但要謹慎）
2. **使用 useMemo/useCallback**（但要謹慎）

---

## 🔍 Twenty 開源相關 Issues

由於我無法直接訪問 GitHub，建議你搜尋以下關鍵字：

- `performance`
- `slow`
- `lag`
- `navigation`
- `table loading`
- `virtualization`

可能相關的 PR：
- `#16419` - Improved table flash on reload（已 cherry-pick）
- `#16322` - Fix Timeline blinking（已存在）
- `#15655` - Fix scroll to start when resize columns（已存在）

---

## 📝 結論

頁面切換的 lag 最可能的原因是：

1. **網路請求** - 首次載入某個 object 時需要 API call
2. **虛擬化重置** - 每次切換都會重置整個虛擬化狀態
3. **View 初始化** - 需要重新計算 filter、sort 等

**不太可能是**：
- Recoil selector 查找效率（已有快取）
- React 組件渲染效率（Twenty 的架構是合理的）

建議先進行診斷步驟，確認真正的瓶頸點後再進行優化。
