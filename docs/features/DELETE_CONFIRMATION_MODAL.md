# 刪除記錄確認彈窗功能

## 功能說明

在資料表中刪除記錄時，會先跳出確認彈窗，防止用戶誤刪除資料。

## 顯示邏輯

| 選取數量 | 彈窗內容 |
|---------|---------|
| = 1 筆 | 您確定要刪除「{記錄名稱}」嗎？它可以從命令菜單中恢復。 |
| > 1 筆 | 您確定要刪除選中的多筆記錄嗎？它們可以從命令菜單中恢復。 |

### 記錄名稱顯示規則

- **一般物件**：顯示 label identifier 欄位的值（如公司名稱、機會名稱）
- **人員物件**：顯示 First name + Last name（如「王小明」）
- **無名稱**：顯示「Untitled」

## 相關檔案

- `packages/twenty-front/src/modules/action-menu/actions/record-actions/single-record/components/DeleteSingleRecordAction.tsx` - 單筆刪除
- `packages/twenty-front/src/modules/action-menu/actions/record-actions/multiple-records/components/DeleteMultipleRecordsAction.tsx` - 多筆刪除

## 多國語系

已完成繁體中文翻譯，翻譯檔案位於：
- `packages/twenty-front/src/locales/zh-TW.po`

## 實作日期

2024-12-28
