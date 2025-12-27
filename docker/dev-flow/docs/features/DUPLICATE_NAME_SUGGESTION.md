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

### 3. 鍵盤導航
- `↑` / `↓` 鍵：在建議項目間移動
- `Enter` 鍵：
  - 有選中項目時：跳轉到該記錄
  - 無選中項目時：顯示確認對話框
- `Esc` 鍵：取消輸入

### 4. 確認對話框
- 當有重複建議時按 Enter，會彈出確認對話框
- 用戶可選擇「仍要建立」或「取消」

### 5. 快速跳轉
- 點擊建議項目可直接跳轉到該記錄
- 跳轉時會取消當前輸入（不儲存）

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
