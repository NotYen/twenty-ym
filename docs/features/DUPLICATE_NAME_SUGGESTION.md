# 重複名稱建議功能

## 功能概述

當用戶在輸入記錄名稱（標題欄位）時，系統會即時搜尋資料庫中是否有相似的記錄，並顯示重複建議提示，幫助用戶避免建立重複資料。

## 適用場景

- 資料表中的標題欄位（第一欄）
- 記錄詳情頁的標題欄位
- 支援 Text 和 FullName 兩種欄位類型

## 功能特性

### 1. 即時搜尋
- 輸入時自動搜尋相似記錄
- 使用 150ms debounce 避免頻繁請求
- 最多顯示 5 筆建議

### 2. 視覺警告
- 當偵測到可能重複時，輸入框邊框變為橘色
- 提供明顯的視覺提示

### 3. 鍵盤操作
- `Enter` 鍵：
  - 名稱完全相同時：顯示確認對話框
  - 名稱有差異時：直接儲存
- `Esc` 鍵：取消輸入

### 4. 確認對話框（2026-01-08 更新）
- **只有名稱完全相同時**才會彈出確認對話框
- 忽略大小寫和前後空格進行比對
- 用戶可選擇「仍要建立」或「取消」

### 5. 快速跳轉
- 點擊建議項目可直接跳轉到該記錄
- 跳轉時會取消當前輸入（不儲存）

## 彈窗顯示 vs 儲存阻擋邏輯（2026-01-08 更新）

| 判斷條件 | 彈窗顯示 | 按 Enter 能否直接儲存 |
|---------|---------|---------------------|
| 有任何一個字相似 | ✅ 顯示提醒 | - |
| 名稱完全相同 | - | ❌ 要先確認 |
| 名稱有一點不同 | - | ✅ 直接儲存 |

### 範例

假設資料庫中已有「Android App」：

| 輸入內容 | 彈窗顯示 | 按 Enter 行為 |
|---------|---------|--------------|
| iOS App | ✅ 顯示（"App" 相似） | ✅ 直接儲存 |
| Android App | ✅ 顯示 | ❌ 彈出確認對話框 |
| android app | ✅ 顯示 | ❌ 彈出確認對話框（忽略大小寫） |
| Android | ✅ 顯示（"Android" 相似） | ✅ 直接儲存 |

## 技術實作

### 檔案結構

```
packages/twenty-front/src/modules/object-record/
├── record-field/ui/meta-types/input/
│   ├── hooks/
│   │   └── useDuplicateNameSuggestion.ts      # 重複搜尋 hook
│   └── components/
│       ├── DuplicateNameSuggestionDropdown.tsx # 下拉選單 UI
│       ├── TextFieldInputWithDuplicateSuggestion.tsx
│       └── FullNameFieldInputWithDuplicateSuggestion.tsx
└── record-title-cell/components/
    ├── RecordTitleCellTextFieldInput.tsx       # 標題欄位（已整合）
    └── RecordTitleFullNameFieldInput.tsx       # FullName 標題欄位（已整合）
```

### 核心 Hook: useDuplicateNameSuggestion

```typescript
const { suggestions, isOpen, closeSuggestions, hasSuggestions } =
  useDuplicateNameSuggestion({
    objectNameSingular: 'company',
    searchValue: '台積電',
    excludeRecordId: currentRecordId,  // 排除當前記錄
    enabled: true,
  });
```

### 使用的 Twenty 原生功能

- `useObjectRecordSearchRecords` - 搜尋記錄
- `useOpenRecordInCommandMenu` - 跳轉到記錄
- `ConfirmationModal` - 確認對話框
- `@floating-ui/react` - 下拉選單定位

## 翻譯文案

| 英文 | 繁體中文 |
|------|----------|
| Possible duplicate records | 可能重複的記錄 |
| Click to view | 點擊查看 |
| Possible duplicate detected | 偵測到可能重複的資料 |
| Similar records were found. Are you sure you want to create a new record? | 發現相似的記錄。確定要建立新記錄嗎？ |
| Create anyway | 仍要建立 |
| Untitled | 無標題 |

## 效能考量

- 使用 `useDebouncedCallback` (150ms) 避免頻繁 API 請求
- 使用 `fetchPolicy: 'cache-first'` 優先使用快取
- 只在 `isLabelIdentifier === true` 時啟用，不影響其他欄位

## 注意事項

- 此功能只在標題欄位（labelIdentifier）啟用
- 不會阻擋用戶建立記錄，只是提供建議
- 搜尋是模糊匹配，可能會有誤報

---

## 2024-12-28 修復記錄

### 問題 1: `useState is not defined` Runtime 錯誤

**原因：**
- `RecordTitleCellTextFieldInput.tsx` 和 `RecordTitleFullNameFieldInput.tsx` 使用了 `useState` 但忘記 import

**修復：**
- 在兩個檔案的 import 中加入 `useState`

### 問題 2: twenty-ui 中使用 lingui 導致 Runtime 錯誤

**原因：**
- `Chip.tsx` 中使用了 `{t\`Untitled\`}`，但 `twenty-ui` 是獨立的 UI 庫，沒有 lingui 配置

**修復：**
- 在 `Chip.tsx` 新增 `untitledLabel` prop，預設值為 `'Untitled'`
- 在 `LinkChip.tsx` 和 `MultipleAvatarChip.tsx` 傳遞此 prop
- 在 `RecordChip.tsx` 中使用 `t\`Untitled\`` 傳入翻譯後的文字

### 問題 3: 人員（FullName）點擊重複提示後仍儲存

**原因：**
- `RecordTitleFullNameFieldInput.tsx` 的 `handleClickOutside` 沒有排除 dropdown 的點擊

**修復：**
- 在 `handleClickOutside` 中檢查 `data-globally-prevent-click-outside` 屬性，如果點擊的是 dropdown 則不觸發儲存


---

## 2026-01-08 修改記錄

### 移除 Enter 鍵跳轉功能

**原本行為：**
- 按 Enter 時，如果有選中的建議項目，會跳轉到該記錄
- 這導致輸入完全相同名稱時，按 Enter 會直接跳轉而不是顯示確認對話框

**修改後行為：**
- 按 Enter 只會執行「儲存」或「顯示確認對話框」
- 用戶如果想跳轉到已存在的記錄，需要點擊建議項目中的「點擊查看」

**修改的檔案：**
- `TextFieldInputWithDuplicateSuggestion.tsx` - 移除 selectedIndex 和 handleSelectSuggestion
- `FullNameFieldInputWithDuplicateSuggestion.tsx` - 移除 selectedIndex 和 handleSelectSuggestion
- `RecordTitleCellTextFieldInput.tsx` - 移除 selectedIndex 和 handleSelectSuggestion
- `RecordTitleFullNameFieldInput.tsx` - 移除 selectedIndex
- `DuplicateNameSuggestionDropdown.tsx` - 將 selectedIndex 和 onSelectedIndexChange 改為可選 props

---

## 2026-01-27 修復記錄

### 問題：Slide Panel（Command Menu）中重複名稱建議功能失效

**現象：**
- 在表格視圖中編輯標題欄位時，重複名稱建議功能正常運作
- 但在側邊滑動面板（Slide Panel / Command Menu）中編輯標題時，重複建議不會顯示

**根本原因：**
- `CommandMenuRecordInfo.tsx` 中的 `FieldContext.Provider` 設定了 `isLabelIdentifier: false`
- `useDuplicateNameSuggestion` hook 只在 `isLabelIdentifier === true` 時啟用
- 因此 slide panel 中的重複建議功能被禁用

**修復：**
- 修改 `CommandMenuRecordInfo.tsx` 第 82 行
- 將 `isLabelIdentifier: false` 改為 `isLabelIdentifier: true`

**修改的檔案：**
```
packages/twenty-front/src/modules/command-menu/components/CommandMenuRecordInfo.tsx
```

**修改前：**
```typescript
<FieldContext.Provider
  value={{
    recordId: objectRecordId,
    isLabelIdentifier: false,  // ❌ 禁用了重複建議功能
    fieldDefinition,
    ...
  }}
>
```

**修改後：**
```typescript
<FieldContext.Provider
  value={{
    recordId: objectRecordId,
    isLabelIdentifier: true,   // ✅ 啟用重複建議功能
    fieldDefinition,
    ...
  }}
>
```

**驗證方式：**
1. 開啟任一 Person 或 Company 記錄的側邊面板
2. 編輯標題欄位（聯絡人姓名或公司名稱）
3. 輸入與現有記錄相似的名稱
4. 確認重複建議下拉選單正常顯示
