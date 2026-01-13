# Side Panel 欄位排序功能需求

> 最後更新：2026-01-12
>
> 本文件記錄 Side Panel 欄位排序功能需求及相關問題

---

## 功能需求

### 目標
Side Panel（右側詳情面板）中的欄位順序應該與 Table View（表格視圖）的欄位順序保持一致。

### 當前行為
- Table View 中使用者可以自訂欄位順序（拖拽排序）
- Side Panel 中的欄位順序與 Table View **不同步**
- 使用者期望兩者保持一致的欄位顯示順序

### 期望行為
當使用者在 Table View 中調整欄位順序後，Side Panel 中的欄位順序應該自動同步。

---

## 技術分析

### 相關組件

#### Table View 欄位順序
| 檔案 | 說明 |
|------|------|
| `packages/twenty-front/src/modules/views/hooks/useViewFields.ts` | View 欄位管理 |
| `packages/twenty-front/src/modules/views/types/ViewField.ts` | ViewField 類型定義 |
| `packages/twenty-front/src/modules/object-record/record-table/hooks/useRecordTableColumns.ts` | Table 欄位列管理 |

#### Side Panel 欄位顯示
| 檔案 | 說明 |
|------|------|
| `packages/twenty-front/src/modules/object-record/record-show/components/FieldsCard.tsx` | Side Panel 欄位卡片 |
| `packages/twenty-front/src/modules/object-record/record-field-list/components/RecordFieldList.tsx` | 欄位列表渲染 |
| `packages/twenty-front/src/modules/object-record/record-field-list/hooks/useRecordFieldListFields.ts` | 欄位列表資料 |

### 關鍵資料結構

```typescript
// ViewField - 儲存在 View 中的欄位配置
interface ViewField {
  id: string;
  fieldMetadataId: string;
  position: number;  // 欄位排序位置
  size: number;
  isVisible: boolean;
}
```

### 問題點

1. **Side Panel 欄位來源不同**
   - Table View 使用 `ViewField` 的 `position` 排序
   - Side Panel 可能使用 `FieldMetadata` 的順序

2. **View Context 差異**
   - Table View 有明確的 View ID
   - Side Panel 可能沒有關聯到特定 View

---

## 實作方向

### 方案 A：共用 View 欄位順序
讓 Side Panel 讀取當前 View 的 `ViewField` 配置，使用相同的 `position` 排序。

**優點**：
- 確保兩者完全同步
- 維護成本低

**缺點**：
- 需要傳遞 View Context 到 Side Panel
- 可能影響效能

### 方案 B：獨立的 Side Panel 欄位順序
為 Side Panel 建立獨立的欄位順序配置。

**優點**：
- 彈性高，Side Panel 可以有不同的欄位顯示

**缺點**：
- 使用者需要分別設定兩處的順序
- 維護兩套配置

### 建議方案
採用 **方案 A**，因為使用者的期望是兩者一致。

---

## 相關問題

### 1. Tag 跳轉空白問題

在開發此功能時，發現 Side Panel 中的 Relation Tag 點擊跳轉後頁面空白的問題。

**詳細分析**：請參閱 `docs/web_performance_ptimization(WPO)/RELATION_TAG_NAVIGATION_FIX.md`

**問題摘要**：
- 下拉選單可以正常顯示關聯資料
- 點擊 Tag 跳轉後頁面空白
- 與 Apollo Cache 的 Connection 類型 merge 衝突有關

### 2. 效能考量

Side Panel 欄位排序功能曾因效能問題被 revert。

**問題**：
- 新增的排序邏輯導致頁面切換卡頓
- 影響了之前效能優化的成果

**解決方向**：
- 使用 memoization 避免重複計算
- 確保排序邏輯不會觸發不必要的 re-render

---

## 待辦事項

- [ ] 確認 Tag 跳轉空白問題是否已解決
- [ ] 設計欄位順序同步的資料流
- [ ] 實作 Side Panel 讀取 View 欄位配置
- [ ] 效能測試確保不影響頁面切換速度
- [ ] 撰寫單元測試

---

## 相關文件

- `docs/web_performance_ptimization(WPO)/PERFORMANCE_OPTIMIZATION_COMPLETE.md` - 效能優化完整文件
- `docs/web_performance_ptimization(WPO)/RELATION_TAG_NAVIGATION_FIX.md` - Tag 跳轉問題修復
- `docs/web_performance_ptimization(WPO)/core_cause_analysis_report.md` - 核心問題分析

---

## 版本歷史

| 日期 | 版本 | 說明 |
|-----|------|------|
| 2026-01-12 | v1.0 | 初始需求文件 |
