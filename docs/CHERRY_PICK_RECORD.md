# Twenty 開源 Cherry-pick 記錄

> 此文件記錄從 Twenty 開源專案 main 分支 cherry-pick 到本地 dev_yen 分支的 commits。
>
> 最後更新時間：2026-01-11
>
> 開源 main 分支最新分析 commit：`20f62e05f5` - fix(search): add support for searching by additional emails, phones, and secondary links (#17034)

---

## 📊 Cherry-pick 統計

| 類別 | 數量 |
|------|------|
| 已 Cherry-pick | 80 個 |
| 添加的依賴檔案 | 7 個 |
| 分析後不建議 Cherry-pick | 54 個 |

---

## ✅ 已 Cherry-pick 的 Commits

### 早期批次（2025-12-03）

| 原始 Commit | PR | 說明 | Cherry-pick 日期 |
|-------------|-----|------|------------------|
| `63afed6400` | #16070 | 🔒 Security - add throttle in message resend | 2025-12-03 |
| `bf818b7d8d` | #16261 | Fixed sample CSV file generation | 2025-12-03 |
| `3274c18a90` | #16264 | Fix command menu focus | 2025-12-03 |
| `05b30554c3` | #16244 | Add back first column shrink on mobile | 2025-12-03 |
| `21c023c6d6` | #16257 | Fixed create new optimistic | 2025-12-03 |
| `2cdf5ae75b` | #16221 | fix(theme): prevent forced light mode switch after login | 2025-12-03 |
| `1fcb8b464c` | #16134 | fix: move vite plugins into the packages that use them | 2025-12-03 |
| `19fc20173b` | #16201 | fix: lagging issue in ask AI during message streaming | 2025-12-03 |
| `9387680020` | #16177 | Rollback standard id removal on relation object creation | 2025-12-03 |
| `cd699cbda1` | #16186 | Fix message sync | 2025-12-03 |
| `f2cdf8a6e1` | #16181 | message folder ui enhancement | 2025-12-03 |
| `4ed8c8ed32` | #16249 | Fix SDK/CreateApp CI changed-files-check | 2025-12-03 |
| `900401c101` | #16262 | 16248 follow ups | 2025-12-03 |
| `13e283fc3a` | #16247 | Rename roleTargets -> roleTarget | 2025-12-03 |
| `6ea817dd6c` | #16238 | Add base application project yarn release file | 2025-12-03 |
| `269135e8c5` | #16239 | Add allow same origin to the iFrame widget | 2025-12-03 |
| `5abab1feb2` | #16242 | Fix yarn lock | 2025-12-03 |
| `79e2602790` | #16183 | Remove IS_MESSAGE_FOLDER_CONTROL_ENABLED feature flag | 2025-12-03 |
| `7620e1b0a6` | #16176 | Fix markdown link formatting in CONTRIBUTING.md | 2025-12-03 |
| `23a7611aac` | #16179 | revert to align center as we add an issue on edit mode | 2025-12-03 |
| `9f62188ba6` | #16187 | Field and object metadata naming does not refer to v2 | 2025-12-03 |
| `eedb163131` | #16230 | Field metadata and object metadata v1 relicas | 2025-12-03 |
| `59f0f6f9db` | #16246 | Release 1.12.0 | 2025-12-03 |
| `2922a1ee5a` | #16235 | Add community Sealos template in self-hosted cloud provider docs | 2025-12-03 |

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
| `dc1bf8dac9` | #16752 | Fix Hide empty groups in List view | 2025-12-26 |
| `08527930d7` | #16789 | Fix visible fields count updates | 2025-12-26 |
| `766822d04b` | #16731 | Fix dashboard drag error | 2025-12-26 |
| `1dbb326fd6` | #16762 | Fix workflow step title transferring | 2025-12-26 |
| `ba76cf4fed` | #16769 | Fix Record label identifier setting | 2025-12-26 |
| `9c49f4ba82` | #16728 | Fix Global workflows not pinned | 2025-12-26 |
| `81918e8720` | #16750 | Increase hover target area for workflow node dots | 2025-12-26 |
| `1d2aba5b22` | #16684 | Make view bar filter dropdown scrollable | 2025-12-26 |
| `9aa77ab991` | #16718 | Fix composite upsert | 2025-12-26 |

### 安全性修復類（2025-12-28）

| 原始 Commit | PR | 說明 | Cherry-pick 日期 |
|-------------|-----|------|------------------|
| `869608327e` | #16748 | 🔒 validator 套件安全更新 | 2025-12-28 |
| `ede261abf4` | #16747 | 🔒 Storybook 安全更新 8.6.14 → 8.6.15 | 2025-12-28 |
| `79998ef8fc` | #16764 | 允許匯入 createdAt/updatedAt 欄位 | 2025-12-28 |
| `65dced14ff` | #16768 | 🔒 API key views 權限修復 + 權限繞過漏洞修復 | 2025-12-28 |
| `c2c8f6e41c` | #16770 | 🔒 防止 API key 建立 UNLISTED views | 2025-12-28 |

### 2025-12-31 批次

| 原始 Commit | PR | 說明 | Cherry-pick 日期 |
|-------------|-----|------|------------------|
| `265345fd69` | #16816 | ⭐ 修復 Redis cache 清除後的無限循環 | 2025-12-31 |
| `e5e5ae8e1d` | #16039 | 修復無效日期和 undefined links 欄位值 | 2025-12-31 |
| `a0491e4755` | #16076 | 修復 PDF 匯出時圖片不顯示 | 2025-12-31 |
| `952dee955c` | #16795 | 修復 AI 聊天時手動滾動會被自動滾動覆蓋 | 2025-12-31 |
| `7400a3051c` | #16821 | Views 小改善 - 刪除 view 時從選單移除 | 2025-12-31 |
| `c020f71ba1` | #16439 | Currency 欄位支援小數位數設定 (0-5 位) | 2025-12-31 |
| `79998ef8fc` | #16764 | 允許匯入 createdAt/updatedAt 欄位 | 2025-12-28 |
| `65dced14ff` | #16768 | 🔒 API key views 權限修復 + 權限繞過漏洞修復 | 2025-12-28 |
| `c2c8f6e41c` | #16770 | 🔒 防止 API key 建立 UNLISTED views | 2025-12-28 |

### 2026-01-06 批次

| 原始 Commit | PR | 說明 | Cherry-pick 日期 |
|-------------|-----|------|------------------|
| `300738e8cb` | #16759 | 修復資料庫事件發送（delete/destroy 操作） | 2026-01-06 |
| `54332746a5` | #16867 | 禁止匯入 Actor type 欄位 | 2026-01-06 |
| `a2872b02ed` | #16732 | 禁止停用系統欄位（deletedAt 改善） | 2026-01-06 |
| `229916def2` | #16879 | 修復 Opportunity Kanban 聚合從 MIN 改為 SUM | 2026-01-06 |
| `61addf8b62` | #16415 | Email body URL 自動轉連結 | 2026-01-06 |

### 2026-01-11 批次

| 原始 Commit | PR | 說明 | Cherry-pick 日期 |
|-------------|-----|------|------------------|
| `a4daead678` | #16672 | 修復 View field 更新不保存（欄位寬度等）| 2026-01-11 |
| `12189b378f` | #16953 | 修復 object 重命名後 activity target 關聯問題 | 2026-01-11 |

### 手動修復（2026-01-06 ~ 2026-01-11）

| 功能 | 參考 PR | 說明 | 修復日期 |
|------|---------|------|----------|
| Widget 底部邊框 | #16856 | 修復 Pinned Tab 最後一個 Widget 不顯示底部邊框（因架構差異無法直接 cherry-pick，手動實作） | 2026-01-06 |
| 圖表 toggle 修復 | #16874 | 修復圖表設定中 toggle 無法點擊的問題（ChartSettings.tsx 加入 closeAnyOpenDropdown、MenuItemToggle.tsx 移除 label htmlFor） | 2026-01-11 |
| Currency Save 按鈕 | #16864 | 修復 Currency 欄位設定頁面 Save 按鈕無法正確追蹤 dirty state（新增 getFieldMetadataItemInitialValues.ts，保留本地 readonly 修改） | 2026-01-11 |

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
| `packages/twenty-front/src/modules/page-layout/widgets/hooks/useIsLastWidgetInTab.ts` | 判斷是否為 Tab 中最後一個 Widget（手動新增） |

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

### `1bc344c6fa` - Dashboard filter parsing (#16782)

| 項目 | 內容 |
|------|------|
| 風險等級 | 🔴 高 |
| 功能說明 | 修復點擊圖表 slice/bar 跳轉時的 filter 解析錯誤 |
| 影響欄位 | CURRENCY、MULTI_SELECT、ADDRESS |

**依賴鏈（需要按順序 cherry-pick 5 個 commits）**：

| 順序 | Commit | PR | 說明 | 檔案數 |
|------|--------|-----|------|--------|
| 1 | `3be3c4e965` | #16013 | 基礎架構：點擊圖表跳轉功能 | 35 |
| 2 | `32a876bbd4` | #16142 | 擴展日期 filter 支援 | 10 |
| 3 | `fa87603fd8` | #16093 | Relation fields groupby | 22 |
| 4 | `0b5be7caa3` | #16544 | ⚠️ Date to Temporal 重構（核心架構變更） | **205** |
| 5 | `1bc344c6fa` | #16782 | 修復 filter parsing bug | 3 |

**總計**：~275 個檔案，~6000+ 行變更

**原因**：
- 本地分支缺少 `buildFilterFromChartBucket.ts` 等基礎檔案
- `#16544` (Date to Temporal) 是核心架構變更，影響整個日期處理（80% 的 app）
- 風險太高，建議等大版本升級時一起處理

**建議**：等大版本升級時一起處理

---

### `0849dda153` - Gmail error handling fixes (#16719)

| 項目 | 內容 |
|------|------|
| 風險等級 | 🟠 中高 |
| 功能說明 | 改善 Gmail 整合的錯誤處理一致性 |

**依賴鏈（需要按順序 cherry-pick 4 個 commits）**：

| 順序 | Commit | PR | 說明 | 檔案數 |
|------|--------|-----|------|--------|
| 1 | `5202e2b2db` | #16094 | 重構 Gmail error handling 架構 | 32 |
| 2 | `2790d5dd93` | #16389 | Message fixes + 更多 logs | 10 |
| 3 | `a83732d7a6` | #16448 | 修復 messaging error parsing | 7 |
| 4 | `0849dda153` | #16719 | Gmail error handling fixes | 5 |

**總計**：~54 個檔案，~820+ 行變更

**原因**：
- 本地分支缺少 `gmail-folders-error-handler.service.ts` 和 `google-email-alias-error-handler.service.ts`
- `#16094` 是架構重構，改變了 Gmail 錯誤處理方式（從 class 注入改為 utility function）
- 需要同步整個依賴鏈才能正常運作

**建議**：如果 Gmail 同步功能正常運作，可以暫緩；等大版本升級時一起處理

---

### 資料庫遷移類（高風險）

以下 commits 涉及資料庫 schema 遷移，絕對不要單獨 cherry-pick：

| Commit | PR | 說明 | 風險等級 |
|--------|-----|------|----------|
| `77409b6eb2` | #16206 | Migrate viewGroup.fieldMetadataId | 🔴 極高 |
| `ea3c5d2d45` | #16009 | Migrate role and role target to v2 | 🔴 極高 |
| `5016c25daa` | #16178 | Remove viewGroup v1 implem | 🔴 極高 |

**原因**：資料庫遷移需要按順序執行，單獨 cherry-pick 會導致 schema 不一致

---

### Null Equivalence 系統變更（高風險）

以下 commits 涉及 Null Equivalence 系統變更，絕對不要單獨 cherry-pick：

| Commit | PR | 說明 | 風險等級 |
|--------|-----|------|----------|
| `68c429a54a` | #16222 | Null equivalence - remove feature flag | 🔴 極高 |
| `5e00893c37` | #16217 | Null equivalence - Empty string default value cleaning | 🔴 極高 |
| `638d4015a1` | #16209 | Null equivalence - Activate FF for all | 🔴 極高 |
| `00e970bdf4` | #16241 | Null - Second command - Cleaning remaining empty values | 🔴 極高 |

**原因**：這是系統級別的資料處理邏輯變更，需要完整的遷移流程

---

### 核心架構變更（2025-12-28 分析）

| Commit | PR | 說明 | 風險等級 | 原因 |
|--------|-----|------|----------|------|
| `0b5be7caa3` | #16544 | Date to Temporal 重構 | 🔴 極高 | 205 個檔案，核心日期處理架構變更 |
| `b27a97f2c5` | #16787 | 強制 @/ alias imports | 🔴 極高 | 706 個檔案，會和所有本地修改衝突 |

---

### Field Widget 系列（依賴鏈複雜）

| Commit | PR | 說明 | 風險等級 | 原因 |
|--------|-----|------|----------|------|
| `9984981e82` | #16714 | Field widget edit relations | 🟠 中高 | 新功能，40 個檔案，依賴鏈複雜 |
| `1324ad1ee3` | #16749 | Edit simple values in Field widget | 🟠 中高 | 依賴 #16714 |
| `06d0ac13c4` | #16781 | Record fields uniqueness across widgets | 🟠 中高 | 依賴 #16714, #16749，67 個檔案 |

---

### Billing 相關（不適用）

| Commit | PR | 說明 | 原因 |
|--------|-----|------|------|
| `bc0ffc98bb` | #16796 | Billing fixes and updates | 沒用 Twenty 的 billing |
| `6a4974e285` | #16801 | Stripe credit limits | 沒用 Twenty 的 billing |
| `b46e9d2e64` | #16797 | AI chat billing error handling | 沒用 Twenty 的 billing |

---

### UX 改善（會覆蓋本地效能優化）

| Commit | PR | 說明 | 風險等級 | 原因 |
|--------|-----|------|----------|------|
| `42ad4630ea` | #16765 | Workflow 自動 focus 標題 | 🔴 高 | 會覆蓋 PageChangeEffect.tsx 的 requestIdleCallback 效能優化 |

---

### 2026-01-06 分析後跳過

| Commit | PR | 說明 | 風險等級 | 原因 |
|--------|-----|------|----------|------|
| `4b34add51c` | #16858 | Fix command menu input | 🟡 中 | 本地版本實作方式不同，無法直接套用 |
| `3b05375419` | #16936 | Fix authContext | 🟡 中 | 本地沒有 `authContext.ts` 檔案 |
| `d6acef24d4` | #16880 | Fix timeline activities display | 🟡 中 | 本地使用傳統 relation，不是 morphRelations 架構 |
| `656a32be73` | #16309 | Fix focus stack in useInlineCell | 🟡 中 | 7 個檔案，風險較高，需要更多測試 |
| `ecd41fc9cb` | #16803 | Reduce complexity on groupBy | 🟡 中 | 需要新增 `ViewGroupVisibleOptionsMax.ts` 檔案 |
| `f069efe361` | #16933 | Fix Enable access to all options | 🟡 中 | 依賴 `ecd41fc9cb`，需要先 cherry-pick 前置 commit |
| `62e496f65d` | #16856 | Widget border fix | 🟡 中 | 架構差異太大，改用手動修復（見上方手動修復區塊） |

---

### i18n 翻譯（自動生成，不需要）

以下 14 個 commits 是 GitHub Actions 自動生成的翻譯，我們有自己的繁中翻譯：

`6547c11862`, `5d6c39ec7e`, `37e59d0cf1`, `2eb8cf9e81`, `1cd413834d`, `781b96e80b`, `17e923b908`, `e3757f300a`, `b1aaf21356`, `67f511bae3`, `3dd858c91e`, `99d5aa2589`, `5003fc4196`, `f9744ef245`

---

### CI/測試/依賴/文件（不影響功能）

以下 commits 是 CI 設定、測試、依賴更新或文件，不影響功能：

| 類型 | Commits |
|------|---------|
| CI 相關 | `66daf69a5d`, `6a31f0667e`, `354c43988d`, `e6491d6a80`, `ea6d497c3b`, `df3d34e16b` |
| 依賴更新 | `cf51baedae`, `5b69173c44` |
| 文件 | `bb73cbc380`, `60897b255a`, `0dec4b9b67`, `4bfc0a79c7`, `0731a616b7`, `57517d687e`, `183d034716` |
| 測試 | `4d5d2233bc` |

---

### 功能說明補充

**Dashboard Filter Parsing (#16782)**：
- 當點擊圖表的某個 slice（圓餅圖）或 bar（長條圖）時，會自動帶入 filter 跳轉到對應的資料列表
- 某些欄位類型的 filter 值傳遞格式錯誤，導致 JSON parse error
- 如果你沒有使用「點擊圖表跳轉」功能，這個 bug 不影響你

**Date to Temporal (#16544)**：
- 把 JavaScript 原生的 `Date` 物件換成新的 `Temporal` API
- 主要修復時區相關的 bug，不是新增功能
- 如果用戶都在同一個時區（台灣），這個修復不是很急迫

**Gmail Error Handling (#16719)**：
- 改善 Gmail 整合的錯誤處理一致性
- 如果你沒有使用 Gmail 同步功能，完全不影響

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
| 2025-12-03 | 初始批次，cherry-pick 24 個 commits（安全修復、bug 修復等）|
| 2025-12-20 | 整理文件，記錄 29 個 cherry-pick commits |
| 2025-12-20 | 新增 `ac89b5aff6` (fastDeepEqual) 和 `b17e45f272` (nav drawer tooltip) |
| 2025-12-26 | 新增 9 個 bugfix commits（#16752, #16789, #16731, #16762, #16769, #16728, #16750, #16684, #16718）|
| 2025-12-26 | 詳細分析 Dashboard Filter (#16782) 和 Gmail Error (#16719) 的依賴鏈，決定暫緩 |
| 2025-12-26 | 整合 `Cherry-pick進度報告_20251203.md`，統一記錄格式 |
| 2025-12-28 | 新增 5 個安全性修復 commits（#16748, #16747, #16764, #16768, #16770）|
| 2025-12-28 | 分析 47 個新 commits，決定跳過 Field Widget 系列、Billing 相關、i18n 翻譯等 |
| 2025-12-28 | 跳過 `42ad4630ea` (Workflow focus) 因為會覆蓋 PageChangeEffect 效能優化 |
| 2026-01-06 | 新增 5 個 bugfix commits（#16759, #16867, #16732, #16879, #16415）|
| 2026-01-06 | 手動修復 Widget 底部邊框（#16856），因架構差異無法直接 cherry-pick |
| 2026-01-06 | 分析並跳過 7 個 commits（#16858, #16936, #16880, #16309, #16803, #16933, #16856）|
| 2026-01-06 | 更新開源 main 分支最新分析 commit 至 `3b05375419` |
| 2026-01-11 | 分析 103 個新 commits（從 3b05375419 到 20f62e05f5）|
| 2026-01-11 | 新增 2 個 bugfix commits（#16672 View field 更新、#16953 activity target 關聯）|
| 2026-01-11 | 手動合併 #16874 圖表 toggle 修復、#16864 Currency Save 按鈕修復（保留本地修改）|
| 2026-01-11 | 跳過 #16886 qs 安全更新（yarn.lock 變更 9000+ 行，建議手動 yarn upgrade express）|
