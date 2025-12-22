# Twenty 開源 Cherry-pick 記錄

> 此文件記錄從 Twenty 開源專案 main 分支 cherry-pick 到本地 dev_yen 分支的 commits。
>
> 最後更新時間：2025-12-20
>
> 開源 main 分支最新 commit：`9c49f4ba82` - Fix Global workflows not pinned (#16728)

---

## 📊 Cherry-pick 統計

| 類別 | 數量 |
|------|------|
| 已 Cherry-pick | 29 個 |
| 添加的依賴檔案 | 5 個 |
| 分析後不建議 Cherry-pick | 1 個 |

---

## ✅ 已 Cherry-pick 的 Commits

### 效能優化類

| 原始 Commit | PR | 說明 | Cherry-pick 日期 |
|-------------|-----|------|------------------|
| `cee63c6eb5` | #16419 | ⭐ Improved table flash on reload | 2025-12-18 |
| `533f6a95ac` | #16391 | Workflow statuses update - use cache instead of web sockets | 2025-12-18 |
| `9815adf983` | #16523 | Fixed Apollo cache bug | 2025-12-18 |
| `ac89b5aff6` | #16398 | ⭐ Improve object record changed performances (fastDeepEqual) | 2025-12-20 |

### UI/UX Bugfix 類

| 原始 Commit | PR | 說明 | Cherry-pick 日期 |
|-------------|-----|------|------------------|
| `05c0a5184d` | #16603 | Fix Links, Array, Emails, Phones inputs | 2025-12-18 |
| `e68f99e5d0` | #16622 | Fix drag and drop in dropdown | 2025-12-18 |
| `cdf859ef63` | #16658 | Fix text overflow in view picker | 2025-12-18 |
| `b2590ec147` | #16643 | Fix/close filter by enter | 2025-12-18 |
| `ddce32aa52` | #16490 | Fix overflow text with tooltip | 2025-12-18 |
| `023efc088c` | #15825 | Fixed immediate UI update after Enter | 2025-12-18 |
| `7f0761707b` | #16424 | Fix is empty filter for numbers | 2025-12-18 |
| `b06fdb1bf3` | #16478 | Fix action menu modals rendering | 2025-12-18 |
| `f63ffc1b48` | #16140 | Currency input field fix | 2025-12-18 |
| `71f5e6832c` | #16465 | Forbid default value removal for select | 2025-12-18 |
| `12cea6c515` | #16450 | Fix CSV export format | 2025-12-18 |
| `31f2b5a56b` | #16442 | Fix fetch more notes | 2025-12-18 |
| `b4e9679514` | #16502 | Fix raw json field display | 2025-12-18 |
| `5632e9f5c5` | #16471 | Fixed workflow filter initialization | 2025-12-18 |
| `8599bbe602` | #16120 | Fix legend toggle for charts | 2025-12-18 |
| `d98860adf8` | #16446 | Fix file preview modal full screen | 2025-12-18 |
| `754fa66b25` | #16382 | Fix switch view type from Layout | 2025-12-18 |
| `984d3a1273` | #16665 | Fixed command menu and main container layout | 2025-12-18 |
| `701132ef05` | #16661 | Fix command menu input text color | 2025-12-18 |
| `b17e45f272` | #16455 | Wrap nav drawer with overflowing text with tooltip | 2025-12-20 |

### 已存在於分支中（無需 Cherry-pick）

| 原始 Commit | PR | 說明 | 本地對應 Commit |
|-------------|-----|------|-----------------|
| `b5ec6df62f` | #16197 | Improve command menu animation | `29f160e78d` |
| `61a469cff8` | #16322 | Fix Timeline blinking | `d02255737f` |
| `982964efbf` | #15655 | Fix scroll to start when resize columns | `39ea1cc421` |

---

## 📁 添加的依賴檔案

為了讓 cherry-pick 的 commits 正常運作，額外添加了以下檔案：

| 檔案/資料夾 | 說明 |
|-------------|------|
| `packages/twenty-front/src/modules/ui/layout/resizable-panel/` | 整個資料夾 - ResizablePanel 組件 |
| `packages/twenty-front/src/modules/command-menu/components/CommandMenuWidthEffect.tsx` | Command Menu 寬度效果組件 |
| `packages/twenty-front/src/modules/command-menu/states/commandMenuWidthState.ts` | Command Menu 寬度狀態 |
| `packages/twenty-front/src/utils/recoil/localStorageEffect.ts` | Recoil localStorage 效果 |
| `packages/twenty-front/src/modules/views/hooks/internal/useHasFiltersInQueryParams.ts` | 檢查 URL 參數中的 filters |
| `packages/twenty-front/src/modules/views/schemas/` | 整個資料夾 - Views schemas |

---

## ❌ 分析後不建議 Cherry-pick 的 Commits

### `1607aebcc6` - Deprecate object metadata maps (#16080)

| 項目 | 內容 |
|------|------|
| 風險等級 | 🔴 極高 |
| 檔案變更 | 281 個檔案 |
| 新增/刪除 | +6,499 / -6,616 行 |

**原因**：
- 這是架構級別的重構，將 `ObjectMetadataItemWithFieldMaps` 改為 `FlatObjectMetadata`
- 涉及核心 API 層、metadata 處理、workspace 模組
- 刪除了整個 `workspace-health` 模組
- 衝突風險極高，難以單獨 cherry-pick

**建議**：等到需要大版本升級時再一起處理

---

## 🔍 待評估的 Commits

以下是可能有價值但尚未詳細評估的 commits：

| Commit | PR | 說明 | 備註 |
|--------|-----|------|------|
| `2691222d5f` | #16063 | Improve board experience | Kanban 視圖優化，有後端衝突 |

---

## 📝 本地自訂修改

以下是本地分支的自訂修改（非 cherry-pick）：

| Commit | 說明 |
|--------|------|
| `b98cc765cb` | Fine tune 切換頁面 call api or read cache 機制 PART III |
| `6f5c86e0b2` | Fine tune 切換頁面 call api or read cache 機制 PART II |
| `e4b1f70ca5` | Fine tune 切換頁面 call api or read cache 機制 |
| `729ee60fa3` | Bugreport function (Sentry.io) + UI bugfix |
| 其他 | 多租戶功能、繁中文案、workspace_config 等 |

---

## 🔧 Apollo Client 設定變更

| 項目 | 原始值 | 修改後 |
|------|--------|--------|
| fetchPolicy | `cache-and-network` | `cache-first` |
| 骨架屏行數 | 80 | 30 |

**檔案**：
- `packages/twenty-front/src/modules/apollo/hooks/useApolloFactory.ts`
- `packages/twenty-front/src/modules/object-record/record-table/record-table-body/components/RecordTableBodyLoading.tsx`

---

## 📌 如何使用此文件

1. **查看已 cherry-pick 的 commits**：檢查「已 Cherry-pick 的 Commits」區塊
2. **評估新的 commits**：
   ```bash
   # 查看 main 分支最新 commits
   git log main --oneline -50

   # 查看特定 commit 詳情
   git show <commit-hash> --stat
   ```
3. **Cherry-pick 新的 commit**：
   ```bash
   git cherry-pick <commit-hash> --no-commit
   # 解決衝突後
   git add .
   git commit -m "Cherry-pick: <描述> (#PR號)"
   ```
4. **更新此文件**：每次 cherry-pick 後請更新此文件

---

## 📅 更新歷史

| 日期 | 更新內容 |
|------|----------|
| 2025-12-20 | 初始建立，記錄 29 個 cherry-pick commits |
| 2025-12-20 | 新增 `ac89b5aff6` (fastDeepEqual) 和 `b17e45f272` (nav drawer tooltip) |
