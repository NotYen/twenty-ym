# Chart Tooltip Records 功能說明

> 版本：2026-01-05
> 作者：NotYen
> 最後更新：Kiro AI

---

## 功能概述

針對 Dashboard 的所有圖表類型，增強 Tooltip（提示框）的顯示功能：

1. **顯示所有項目**：hover 時顯示所有項目，當前項目高亮
2. **紀錄列表**：顯示該項目對應的實際資料記錄（最多 50 筆）
3. **自動滾動**：切換 hover 項目時自動滾動到對應位置
4. **提示框顯示欄位**：可自訂紀錄列表要顯示哪個欄位
5. **防閃爍快取**：Global Cache 機制防止切換時閃爍

---

## 支援的圖表類型

| GraphType | 中文名稱 | 組件 | Records Hook | 特性 |
|-----------|---------|------|--------------|------|
| `AGGREGATE` | 聚合數字 | `GraphWidgetAggregateChart` | `useAggregateChartRecords` | 顯示所有符合 filter 的紀錄 |
| `GAUGE` | 儀表板 | `GraphWidgetGaugeChart` | `useGaugeChartRecords` | 顯示所有符合 filter 的紀錄 |
| `VERTICAL_BAR` | 垂直長條圖 | `GraphWidgetBarChart` | `useBarChartRecords` | 按分組顯示紀錄 |
| `HORIZONTAL_BAR` | 水平長條圖 | `GraphWidgetBarChart` | `useBarChartRecords` | 按分組顯示紀錄 |
| `LINE` | 折線圖 | `GraphWidgetLineChart` | `useLineChartRecords` | 按分組顯示紀錄 |
| `PIE` | 圓餅圖 | `GraphWidgetPieChart` | `usePieChartSliceRecords` | 按分組顯示紀錄 |

---

## 功能詳細說明

### 1. 顯示所有項目（分組圖表）

**之前**：Tooltip 只顯示 hover 的那一個項目
**現在**：顯示所有項目，hover 的項目會高亮顯示

高亮效果：
- 背景變色（`theme.background.transparent.light`）
- 文字加粗（`semiBold`）
- 顏色加深（`primary` / `secondary`）

### 2. 紀錄列表（Records Section）

在 Tooltip 底部新增「紀錄」區塊，顯示該項目對應的實際資料：

| 設定 | 值 |
|------|-----|
| 最大顯示筆數 | 50 筆 |
| 滾動區域高度 | 160px |
| 快取機制 | Global Cache（防止切換時閃爍）|

### 3. 自動滾動

當 hover 不同項目時，Tooltip 內的項目列表會自動滾動到對應項目。

### 4. 提示框顯示欄位（Tooltip Display Field）

新增設定選項，讓使用者選擇紀錄列表要顯示哪個欄位。

**設定位置**：各圖表設定面板 → 「提示框顯示欄位」

**選項**：
| 選項 | 說明 |
|------|------|
| 預設（名稱） | 顯示 `name` 欄位，沒有的話用物件的 labelIdentifier |
| 其他欄位 | 列出該物件所有非系統、啟用中的欄位 |

**支援的欄位類型**：
- 一般文字欄位
- 複合欄位（fullName → 顯示「名 姓」）
- Email 欄位（顯示 primaryEmail）
- 電話欄位（顯示 primaryPhoneNumber）

---

## 相關檔案

### 核心元件

| 檔案 | 說明 |
|------|------|
| `page-layout/widgets/graph/components/GraphWidgetTooltip.tsx` | Tooltip 主元件（含紀錄列表） |
| `page-layout/widgets/graph/components/GraphWidgetFloatingTooltip.tsx` | 浮動 Tooltip 包裝器 |

### 各圖表 Tooltip 元件

| 圖表類型 | Tooltip 元件 |
|---------|-------------|
| Pie Chart | `graphWidgetPieChart/components/GraphPieChartTooltip.tsx` |
| Bar Chart | `graphWidgetBarChart/components/GraphBarChartTooltip.tsx` |
| Line Chart | `graphWidgetLineChart/components/GraphLineChartTooltip.tsx` |
| Aggregate Chart | `graphWidgetAggregateChart/components/GraphWidgetAggregateChart.tsx` |
| Gauge Chart | `graphWidgetGaugeChart/components/GraphWidgetGaugeChart.tsx` |

### Records Hooks（查詢紀錄）

| 圖表類型 | Hook 檔案 |
|---------|----------|
| Pie Chart | `graphWidgetPieChart/hooks/usePieChartSliceRecords.ts` |
| Bar Chart | `graphWidgetBarChart/hooks/useBarChartRecords.ts` |
| Line Chart | `graphWidgetLineChart/hooks/useLineChartRecords.ts` |
| Aggregate Chart | `graphWidgetAggregateChart/hooks/useAggregateChartRecords.ts` |
| Gauge Chart | `graphWidgetGaugeChart/hooks/useGaugeChartRecords.ts` |

### 設定相關

| 檔案 | 說明 |
|------|------|
| `command-menu/pages/page-layout/constants/settings/TooltipDisplayFieldSetting.ts` | 設定項定義 |
| `command-menu/pages/page-layout/components/dropdown-content/ChartTooltipDisplayFieldSelectionDropdownContent.tsx` | 欄位選擇下拉選單 |

### 各圖表設定檔

| 圖表類型 | 設定檔 |
|---------|-------|
| Pie Chart | `command-menu/pages/page-layout/constants/PieChartSettings.ts` |
| Bar Chart | `command-menu/pages/page-layout/utils/getBarChartSettings.ts` |
| Line Chart | `command-menu/pages/page-layout/constants/LineChartSettings.ts` |
| Aggregate Chart | `command-menu/pages/page-layout/constants/AggregateChartSettings.ts` |
| Gauge Chart | `command-menu/pages/page-layout/constants/GaugeChartSettings.ts` |

### 常數

| 檔案 | 說明 |
|------|------|
| `page-layout/widgets/graph/components/constants/GraphTooltipScrollMaxHeightPx.ts` | 滾動區域高度（160px）|

### 資料類型（含 rawDimensionValue）

| 圖表類型 | 類型定義檔 |
|---------|----------|
| Pie Chart | `graphWidgetPieChart/types/PieChartDataItem.ts` |
| Bar Chart | `graphWidgetBarChart/types/BarChartDataItem.ts` |
| Line Chart | `graphWidgetLineChart/types/LineChartDataPoint.ts` |

### 資料轉換（設置 rawDimensionValue）

| 圖表類型 | 轉換檔案 |
|---------|---------|
| Pie Chart | `graphWidgetPieChart/utils/transformGroupByDataToPieChartData.ts` |
| Bar Chart (1D) | `graphWidgetBarChart/utils/transformOneDimensionalGroupByToBarChartData.ts` |
| Bar Chart (2D) | `graphWidgetBarChart/utils/transformTwoDimensionalGroupByToBarChartData.ts` |
| Line Chart | `graph/utils/transformGroupByDataToLineChartData.ts` |

---

## 技術實作重點

### rawDimensionValue 的重要性

分組圖表（Pie/Bar/Line）需要用 `rawDimensionValue` 來 filter 對應的紀錄：

```typescript
// 資料類型定義
export type BarChartDataItem = BarDatum & {
  to?: string;
  // Raw dimension value for filtering (before formatting)
  rawDimensionValue?: string | number | null;
};
```

**為什麼需要 rawDimensionValue？**
- 顯示值會被格式化（如日期 `2025-12-24` → `2025年12月24日`）
- 查詢 API 需要原始值才能正確 filter
- 不同圖表取得方式不同：
  - **Pie Chart**：`data.find(d => d.id === hoveredDatum.id)?.rawDimensionValue`
  - **Bar Chart**：`(hoveredDatum.data as BarChartDataItem)?.rawDimensionValue`
  - **Line Chart**：`series.data.find(d => d.x === hoveredPointX)?.rawDimensionValue`

### 高亮效果

```typescript
// GraphWidgetTooltip.tsx
<StyledTooltipRow isHighlighted={shouldHighlight && highlightedKey === item.key}>
```

### 自動滾動

```typescript
// GraphWidgetTooltip.tsx
useEffect(() => {
  if (highlightedKey && itemRefs.current.has(highlightedKey)) {
    itemRefs.current.get(highlightedKey)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }
}, [highlightedKey]);
```

### 防閃爍快取

```typescript
// usePieChartSliceRecords.ts（其他 hooks 同理）
const globalSliceCache = new Map<string, CachedSliceData>();

// 優先順序：
// 1. 使用當前項目的快取資料
// 2. Loading 時保持顯示上一次成功的資料
// 3. Loading 且無快取時返回空（不顯示紀錄區塊）
// 4. 載入完成後更新快取
```

### 欄位選擇邏輯

```typescript
// 各 records hook 中
const displayField = configuration?.tooltipDisplayFieldMetadataId
  ? objectMetadataItem?.fields?.find(
      (field) => field.id === configuration.tooltipDisplayFieldMetadataId,
    )
  : objectMetadataItem?.fields?.find((field) => field.name === 'name') ||
    objectMetadataItem?.labelIdentifierFieldMetadata;
```

### Filter 建構邏輯

```typescript
// 分組圖表的 filter 建構
const sliceFilter = useMemo((): RecordGqlOperationFilter | undefined => {
  if (!isDefined(groupByField) || !shouldQuery) {
    return undefined;
  }

  const subFieldName = configuration?.groupBySubFieldName;

  // Handle null/empty values
  if (!isDefined(sliceDimensionValue) || sliceDimensionValue === '') {
    if (subFieldName) {
      return {
        [groupByField.name]: {
          [subFieldName]: { is: 'NULL' },
        },
      };
    }
    return {
      [groupByField.name]: { is: 'NULL' },
    };
  }

  // Handle subfield (e.g., address.city)
  if (subFieldName) {
    return {
      [groupByField.name]: {
        [subFieldName]: { eq: sliceDimensionValue },
      },
    };
  }

  // Handle regular field
  return {
    [groupByField.name]: { eq: sliceDimensionValue },
  };
}, [groupByField, sliceDimensionValue, configuration?.groupBySubFieldName, shouldQuery]);
```

---

## 後端 DTO 修改

各圖表的 Configuration DTO 都需要新增 `tooltipDisplayFieldMetadataId` 欄位：

| DTO 檔案 | 路徑 |
|---------|------|
| PieChartConfiguration | `twenty-server/src/engine/core-modules/page-layout/dtos/pie-chart-configuration.dto.ts` |
| BarChartConfiguration | `twenty-server/src/engine/core-modules/page-layout/dtos/bar-chart-configuration.dto.ts` |
| LineChartConfiguration | `twenty-server/src/engine/core-modules/page-layout/dtos/line-chart-configuration.dto.ts` |
| AggregateChartConfiguration | `twenty-server/src/engine/core-modules/page-layout/dtos/aggregate-chart-configuration.dto.ts` |
| GaugeChartConfiguration | `twenty-server/src/engine/core-modules/page-layout/dtos/gauge-chart-configuration.dto.ts` |

```typescript
// 範例：pie-chart-configuration.dto.ts
@Field(() => String, { nullable: true })
tooltipDisplayFieldMetadataId?: string;
```

---

## 前端 GraphQL Fragment 修改

需要更新 `PageLayoutWidgetFragment` 包含新欄位：

檔案：`packages/twenty-front/src/modules/page-layout/graphql/fragments/pageLayoutWidgetFragment.ts`

```graphql
fragment PageLayoutWidgetFragment on PageLayoutWidget {
  # ... 其他欄位
  configuration {
    ... on PieChartConfiguration {
      tooltipDisplayFieldMetadataId
    }
    ... on BarChartConfiguration {
      tooltipDisplayFieldMetadataId
    }
    ... on LineChartConfiguration {
      tooltipDisplayFieldMetadataId
    }
    ... on AggregateChartConfiguration {
      tooltipDisplayFieldMetadataId
    }
    ... on GaugeChartConfiguration {
      tooltipDisplayFieldMetadataId
    }
  }
}
```

---

## 使用範例

### 情境：商機按階段分布的 Pie Chart

1. 建立 Pie Chart，資料來源選「商機」
2. 分組欄位選「階段」
3. 設定「提示框顯示欄位」：
   - 預設：顯示商機名稱
   - 選「負責人」：顯示負責人姓名
   - 選「金額」：顯示金額

### Tooltip 顯示效果

```
┌─────────────────────────────────┐
│ 階段分布                         │
├─────────────────────────────────┤
│ ● 洽談中      3 (30%)           │
│ ● 報價中      2 (20%)  ← 高亮    │
│ ● 已成交      5 (50%)           │
├─────────────────────────────────┤
│ 紀錄:                           │
│ • 台積電專案                     │  ← 可滾動
│ • 聯發科合作案                   │
├─────────────────────────────────┤
│ 點擊查看資料              →     │
└─────────────────────────────────┘
```

---

## 常見問題排查

### Q1: Tooltip 紀錄顯示全部資料，不是選中的項目

**原因**：`rawDimensionValue` 取得方式錯誤

**檢查點**：
1. 確認資料轉換函數有設置 `rawDimensionValue`
2. 確認 Tooltip 元件正確取得 `rawDimensionValue`：
   - Bar Chart：`(hoveredDatum.data as BarChartDataItem)?.rawDimensionValue`
   - 不要用 `Object.values(d).some()` 這種錯誤方式

### Q2: Tooltip 紀錄列表重疊

**原因**：樣式問題

**檢查點**：
1. `StyledRecordListContainer` 有設置 `max-height` 和 `overflow-y: auto`
2. `StyledRecordListItem` 有設置 `min-height` 和 `line-height`
3. 確認 `GRAPH_TOOLTIP_SCROLL_MAX_HEIGHT_PX` 常數有正確 import

### Q3: 日期格式錯誤（如 "2025年12月24日" 無法查詢）

**原因**：使用格式化後的值去查詢 API

**解決**：使用 `rawDimensionValue`（原始值）而非顯示值

### Q4: Autofix 刪除 import 導致錯誤

**常見被刪除的 import**：
- `GraphWidgetTooltipRecord`
- `GRAPH_TOOLTIP_SCROLL_MAX_HEIGHT_PX`
- `TOOLTIP_DISPLAY_FIELD_SETTING`

**解決**：每次修改後檢查 import 是否完整

---

## 部署注意事項

### 本地測試後部署到 AWS

這次修改都是純前端 UI 變更，部署流程：
1. 執行 `deploy-to-aws.sh` 腳本
2. 腳本會自動執行 `FLUSHALL` + 重啟 + 註冊 CRON jobs

**不需要**：
- ❌ 不需要 `sync-metadata`（沒有修改 Standard Object 或 WorkspaceField）
- ❌ 不需要資料庫遷移

### 新 Workspace 是否有此功能？

**是的**，完全有。原因：
1. Chart Configuration 欄位是定義在 GraphQL schema 和 DTO 中的，所有 workspace 共用
2. 前端 UI 邏輯是全域的，不依賴特定 workspace
3. Records 查詢是動態根據 `objectMetadataItemId` 和 `configuration` 來執行的

---

## 更新紀錄

| 日期 | 版本 | 說明 |
|------|------|------|
| 2026-01-02 | v1.0 | 初版：Pie Chart 紀錄區塊滾動、顯示所有項目、高亮效果 |
| 2026-01-03 | v1.1 | 新增選中項目自動滾動功能 |
| 2026-01-05 | v2.0 | 擴展到所有 6 種圖表類型（Bar/Line/Aggregate/Gauge），修復 rawDimensionValue 取得邏輯 |
| 2026-01-05 | v2.1 | 修復 Bar Chart Tooltip 紀錄不隨選中項目變化的問題，改用從 data prop 查找 rawDimensionValue |

---

## 已知限制

### 堆疊條圖（Stacked Bar Chart）

**限制**：堆疊條圖的 Tooltip 紀錄只能按 X 軸分組顯示，無法區分 Y 軸（series）的紀錄。

**原因**：
- 堆疊條圖是二維的（X 軸 + Y 軸）
- 目前只存了 X 軸的 `rawDimensionValue`
- Y 軸的值是格式化後的顯示值，沒有存原始值

**行為**：
- hover 堆疊的任何 segment，都會顯示該 X 軸分組下的所有紀錄
- 例如：hover「2024-01」的「已成交」segment，會顯示「2024-01」的所有紀錄（包含其他階段）

**未來改進**：
- 需要在 `transformTwoDimensionalGroupByToBarChartData` 中額外存儲 Y 軸的原始值
- 這是一個較大的改動，需要修改資料結構
