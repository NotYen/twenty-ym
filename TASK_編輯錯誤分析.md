# Task 編輯錯誤分析

## 🐛 **錯誤現象**

點擊任何 Task 進入編輯時，前端報錯：

```
Yjs was already imported. This breaks constructor checks and will lead to issues!

Uncaught RangeError: Duplicate use of selection JSON ID multiple-node
    at Selection.jsonID
```

## 🔍 **錯誤分析**

### 1. 錯誤來源

**這個錯誤與 workflow 外鍵修改完全無關！**

錯誤來自 **@blocknote/core** 和 **Prosemirror** 的 Rich Text Editor：

- `Yjs was already imported` → Yjs 協作編輯庫被重複導入
- `Duplicate use of selection JSON ID multiple-node` → Prosemirror 的 selection 狀態衝突

### 2. 可能的原因

#### 原因 A：前端熱重載問題
當前您在 **development 模式**（`NODE_ENV=production` 但使用 `nx run twenty-front:start`）：
- Vite 的 HMR（熱模塊替換）可能導致編輯器重複初始化
- React 的 Strict Mode 雙重渲染
- Blocknote 編輯器沒有正確清理舊實例

#### 原因 B：數據結構問題
從代碼分析：
1. `ShowPageActivityContainer` 檢查 `isDefined(activityBodyV2)`
2. 如果 `activityBodyV2` 是空對象 `{}`，`isDefined` 返回 `true`
3. 傳遞給 `ActivityRichTextEditor`
4. 但 `activity.bodyV2.blocknote` 可能是 `undefined`
5. 編輯器初始化失敗或狀態混亂

#### 原因 C：瀏覽器快取問題
- 舊的 JavaScript bundle 與新的 API 不匹配
- Apollo Client 快取損壞

### 3. 數據庫狀態檢查

✅ 檢查了 5 個 Tasks 的數據：
- 數據結構正常
- JSON 格式正確
- 沒有重複的 block IDs
- 沒有 "multiple-node" 字符串

所以**不是資料庫數據問題**。

## 🔧 **解決方案**

### 方案 1：清除瀏覽器快取（最簡單）

1. **硬性重新整理**
   ```
   Chrome/Edge: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
   Firefox: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
   ```

2. **清除 Application Storage**
   ```
   F12 → Application → Storage → Clear site data
   ```

3. **無痕模式測試**
   ```
   開啟無痕視窗測試是否還有問題
   ```

### 方案 2：修復 ShowPageActivityContainer 的檢查邏輯

**問題代碼：**
```typescript
const activityBodyV2 = useRecoilValue(
  recordStoreFamilySelector({
    recordId: targetableObject.id,
    fieldName: 'bodyV2',
  }),
);

if (!isDefined(activityBodyV2)) {
  return <LoadingSkeleton />;
}
```

**修復：**
```typescript
const activityBodyV2 = useRecoilValue(
  recordStoreFamilySelector({
    recordId: targetableObject.id,
    fieldName: 'bodyV2',
  }),
);

// 更嚴格的檢查：必須有 blocknote 或 markdown
const hasValidBody = 
  isDefined(activityBodyV2) && 
  (isDefined(activityBodyV2?.blocknote) || isDefined(activityBodyV2?.markdown));

if (!hasValidBody) {
  return <LoadingSkeleton />;
}
```

### 方案 3：切換到 Production Build

**當前問題：**
- 您設置了 `NODE_ENV=production`
- 但使用 `npx nx run twenty-front:start`（development server）
- 這會導致一些不一致

**建議：**
如果要用 production 模式，應該：
```bash
# 1. 建置生產版本
npx nx build twenty-front

# 2. 使用生產 server 服務靜態文件
# （需要額外配置，或使用 nginx/caddy）
```

或者改回 development 模式：
```bash
# 在 twenty-config.sh 中
export NODE_ENV="development"
```

### 方案 4：檢查 Blocknote 版本衝突

```bash
# 檢查是否有多個 Blocknote 版本
cd /Users/ym/twenty-ym
yarn why @blocknote/core
yarn why @blocknote/react
```

## 🎯 **推薦步驟**

### 立即嘗試（按順序）：

1. **清除瀏覽器快取並硬性重新整理** ⭐ 最可能解決
   - Ctrl/Cmd + Shift + R
   - 清除 Application Storage

2. **如果還是有問題，切換回 development 模式**
   ```bash
   # 修改 twenty-config.sh
   export NODE_ENV="development"
   
   # 重啟
   bash stop-twenty-local.sh
   bash start_all_service_start.sh
   ```

3. **如果還是有問題，應用方案 2 的代碼修復**

## 📊 **與 Workflow 修復的關係**

**完全無關！**

- ✅ Workflow 修復：外鍵 CASCADE → SET_NULL（後端）
- ❌ Task 編輯錯誤：前端 Rich Text Editor 問題

這是兩個完全獨立的問題：
- Workflow 問題已經修復並驗證
- Task 編輯問題是前端編輯器的問題

## 🔬 **技術細節**

### Yjs 重複導入問題

Yjs 是一個協作編輯的 CRDT (Conflict-free Replicated Data Type) 庫。錯誤 "Yjs was already imported" 表示：

1. Vite 的 HMR 可能導致模塊被重複加載
2. 或者有多個編輯器實例同時存在
3. Yjs 的 constructor checks 失敗

### Prosemirror Selection ID 衝突

`multiple-node` 是 Prosemirror 內部的 selection 類型。錯誤 "Duplicate use of selection JSON ID" 表示：

1. 同一個 selection ID 被註冊了兩次
2. 通常是因為編輯器被初始化了兩次
3. 或者舊的編輯器實例沒有被正確清理

## 💡 **結論**

這個問題**不是由 workflow 修改引起的**，而是：
1. 前端開發環境的問題（HMR / Strict Mode）
2. 或者瀏覽器快取問題
3. 或者 ShowPageActivityContainer 的數據檢查邏輯不夠嚴謹

**建議先嘗試清除瀏覽器快取，這通常能解決問題！**

