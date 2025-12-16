# Cherry-pick 進度報告

**時間**: 2025-12-03
**起始點**: fc6b136c2f (PR #16174)
**目標**: 62 個 commits

---

## ✅ 已完成的 Commits（24個）

### 安全修復（1個）
1. ✅ 63afed6400 - Security - add throttle in message resend (#16070)

### Bug 修復（11個）
2. ✅ bf818b7d8d - Fixed sample CSV file generation (#16261)
3. ✅ 3274c18a90 - Fix command menu focus (#16264)
4. ✅ 05b30554c3 - Add back first column shrink on mobile (#16244)
5. ✅ 21c023c6d6 - Fixed create new optimistic (#16257)
6. ✅ 2cdf5ae75b - fix(theme): prevent forced light mode switch after login (#16221)
7. ✅ 1fcb8b464c - fix: move vite plugins into the packages that use them (#16134)
8. ✅ 19fc20173b - fix: lagging issue in ask AI during message streaming (#16201)
9. ✅ 9387680020 - Rollback standard id removal on relation object creation (#16177)
10. ✅ cd699cbda1 - Fix message sync (#16186)
11. ✅ f2cdf8a6e1 - message folder ui enhancement (#16181)
12. ✅ 4ed8c8ed32 - Fix SDK/CreateApp CI changed-files-check (#16249)

### 其他（12個）
13. ✅ 900401c101 - 16248 follow ups (#16262)
14. ✅ 13e283fc3a - Rename roleTargets -> roleTarget (#16247)
15. ✅ 6ea817dd6c - Add base application project yarn release file (#16238)
16. ✅ 269135e8c5 - Add allow same origin to the iFrame widget (#16239)
17. ✅ 5abab1feb2 - Fix yarn lock (#16242)
18. ✅ 79e2602790 - Remove IS_MESSAGE_FOLDER_CONTROL_ENABLED feature flag (#16183)
19. ✅ 7620e1b0a6 - Fix markdown link formatting in CONTRIBUTING.md (#16176)
20. ✅ 23a7611aac - revert to align center as we add an issue on edit mode (#16179)
21. ✅ 9f62188ba6 - Field and object metadata naming does not refer to v2 (#16187)
22. ✅ eedb163131 - Field metadata and object metadata v1 relicas (#16230)
23. ✅ 59f0f6f9db - Release 1.12.0 (#16246)
24. ✅ 2922a1ee5a - Add community Sealos template in self-hosted cloud provider docs (#16235)

---

## ❌ 遇到衝突需要處理（4個）

### 1. 圖表日期格式修復（重要！）
- **Commit**: 0158c6fb3c - fix incorrect date formatting in graph widgets (#16254)
- **衝突原因**: 你的分支可能刪除了一些圖表相關文件
- **影響**: Dashboard 圖表功能
- **建議**: 需要手動解決或跳過

### 2. Board 體驗改進
- **Commit**: 2691222d5f - Improve board experience 🖼️ (#16063)
- **衝突**: RecordBoardColumnHeader.tsx 和 group-by 服務
- **影響**: 看板功能
- **建議**: 需要手動解決

### 3. Command menu 動畫
- **Commit**: b5ec6df62f - Improve command menu animation (#16197)
- **狀態**: 未嘗試

### 4. 手機版記錄頁面
- **Commit**: af23fddfa2 - Move to record page for mobile view (#16195)
- **狀態**: 未嘗試

---

## ⏳ 尚未處理（34個）

### 功能增強（2個）
- 425a3814e9 - feat: Add prominent "Download sample" button to CSV import (#16193)
- eecc7aaed3 - Workspace member permission tab. (#16233)
- ee08060798 - Improve deactivated objects & fields behaviors. (#16090)

### Dashboard 功能（4個）
- 1038efa3dd - [DASHBOARDS] Add cumulative setting for bar chart and line chart (#16248)
- 32f387a966 - [DASHBOARDS] Add prefix and suffix setting to the aggregate chart (#16216)
- a8e7d4dfc3 - unlock relation date fields on dashboards (#16207)
- 4d7965c058 - Augment chart limits and improve padding on bar chart (#16184)
- d39a7e809b - [Dashboards] - fast follows - inverse default value (#16211)

### 翻譯/i18n（14個）
- 5edb5e2d53, aa729a2a0a, 12babba6f6, 9cfcc114de, f880ab086c, 5d4170d4c3
- da7536124e, 670d6ce3ec, c51a4a188d, 4e0545ebc5, 3f08a0c901, dedb191cae
- df20c52293, f2f1204af6

### 重構（3個）
- f248b3f7f4 - refactor: move agent evaluation to background jobs (#16234)
- 1eb2e44058 - Refactor workspace cache service (#16208)
- e498367e2f - Merge twenty-cli into twenty-sdk (#16150)

### 其他（11個）
- 7bf68e5f31 - fixed the horizontal padding on Navbar (#16088)
- 以及其他小修復...

---

## ❌ 絕對不要處理（7個）

### 資料庫遷移（高風險）
- 77409b6eb2 - Migrate viewGroup.fieldMetadataId (#16206)
- ea3c5d2d45 - Migrate role and role target to v2 (#16009)
- 5016c25daa - Remove viewGroup v1 implem (#16178)

### Null Equivalence 系統變更（高風險）
- 68c429a54a - Null equivalence - remove feature flag (#16222)
- 5e00893c37 - Null equivalence - Empty string default value cleaning (#16217)
- 638d4015a1 - Null equivalence - Activate FF for all (#16209)
- 00e970bdf4 - Null - Second command - Cleaning remaining empty values (#16241)

---

## 📊 統計總結

| 狀態 | 數量 | 百分比 |
|------|------|--------|
| ✅ 已完成 | 24 | 38.7% |
| ❌ 遇到衝突 | 4 | 6.5% |
| ⏳ 尚未處理 | 34 | 54.8% |
| ❌ 不要處理 | 7 | - |

---

## 🎯 下一步建議

### 選項 1：跳過衝突，繼續簡單的（推薦）
繼續處理剩下的 34 個簡單 commits：
- 翻譯（14個）- 可批量處理
- Dashboard（5個）- 如果你用 Dashboard
- 功能增強（3個）
- 其他小修復

**預計可完成**: 再 20-25 個 commits

### 選項 2：解決衝突
手動解決 4 個衝突的 commits，但會花更多時間

### 選項 3：到此為止
已經完成 24 個重要的安全修復和 bug 修復，可以先測試

---

## 💡 我的建議

**立即執行**：
1. 批量處理 14 個翻譯 commits（無風險）
2. 處理 3 個功能增強（低風險）
3. 處理 5 個 Dashboard commits（如果你用）

**暫時跳過**：
- 4 個有衝突的 commits（需要手動處理）
- 7 個高風險的資料庫遷移

**總計可達成**: 約 45-50 個 commits（72-80%）

---

你想要：
1. 繼續批量處理簡單的？
2. 解決衝突？
3. 還是先停下來測試目前的 24 個？
