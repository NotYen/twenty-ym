# 資料表勾選記錄欄位總和功能

## 功能說明

在資料表（Record Table）中，當用戶勾選特定記錄時，欄位底部的統計數值會自動切換為「僅計算勾選記錄」的總和。

## 使用情境

1. **預設行為**：不勾選任何記錄時，欄位底部顯示所有記錄的統計值（如：總和、平均值、計數等）
2. **勾選記錄後**：欄位底部顯示僅勾選記錄的統計值，並標示「X selected」提示

## 技術實作

### 修改的檔案

1. `packages/twenty-front/src/modules/object-record/record-table/record-table-footer/components/RecordTableColumnAggregateFooterValue.tsx`
   - 新增顯示「X selected」標示

2. `packages/twenty-front/src/modules/object-record/record-table/record-table-footer/hooks/useAggregateRecordsForRecordTableColumnFooter.tsx`
   - 取得勾選的記錄 ID
   - 在 GraphQL 查詢中加入 `id: { in: selectedRowIds }` 過濾條件
   - 回傳 `hasSelectedRecords` 和 `selectedRecordsCount`

### 邏輯流程

```
用戶勾選記錄
    ↓
selectedRowIdsComponentSelector 更新
    ↓
useAggregateRecordsForRecordTableColumnFooter 重新計算
    ↓
GraphQL 查詢加入 selectedRecordsFilter
    ↓
顯示勾選記錄的統計值 + "X selected" 標示
```

## 多國語系支援

- 「X selected」文案已加入 lingui 翻譯
- 繁體中文翻譯：「已選取 X 筆」

## 注意事項

- 此功能不影響原有的全部記錄統計功能
- 取消勾選後自動恢復顯示全部記錄的統計值
- 支援所有統計類型（COUNT、SUM、AVG、MIN、MAX 等）
