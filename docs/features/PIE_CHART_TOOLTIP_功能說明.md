# Chart Tooltip Records 功能說明

> 版本：2026-01-10
> 作者：NotYen
> 最後更新：Kiro AI

---

## ⚠️ 重要：Twenty 後端 Filter 限制

### 限制說明

**Twenty 後端 `GraphqlQueryFilterFieldParser` 只處理 filter 物件的第一個 operator！**

```typescript
// 後端程式碼位置：
// packages/twenty-server/src/engine/api/graphql/graphql-query-runner/graphql-query-parsers/graphql-query-filter/graphql-query-filter-field.parser.ts

const [[operator, value]] = Object.entries(filterValue);
// ⚠️ 只取第一個 operator！後面的會被忽略！
```

### 錯誤範例

```typescript
// ❌ 錯誤：lte 會被忽略，只有 gte 生效
{
  yuJiJieDanRiQi: {
    gte: "2026-07-01",
    lte: "2026-09-30"
  }
}
// 實際效果：查詢所有 >= 2026-07-01 的記錄（累加效果）
```

### 正確範例

```typescript
// ✅ 正確：用 and 組合兩個獨立的 filter
{
  and: [
    { yuJiJieDanRiQi: { gte: "2026-07-01" } },
    { yuJiJieDanRiQi: { lte: "2026-09-30" } }
  ]
}
// 實際效果：查詢 2026-07-01 ~ 2026-09-30 之間的記錄
```

### 影響範圍

這個限制影響所有需要**範圍查詢**的場景：
- 日期範圍（gte + lte）
- 數字範圍（gt + lt）
- 任何需要多個 operator 的查詢

### 解決方案

使用 `buildDateRangeFilter` 工具函數（位於 `graph/utils/buildDateRangeFilter.ts`），它會自動處理這個限制。

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
| 2026-01-09 | v2.2 | 堆疊條圖 Y 軸區分功能：hover segment 時精確顯示該 X+Y 軸分組的紀錄 |
| 2026-01-10 | v2.3 | 修復日期欄位範圍查詢問題：後端只處理第一個 operator，改用 and 組合 gte/lte |

---

## 堆疊條圖 Y 軸區分功能（v2.2 新增）

### 功能說明

**之前**：hover 堆疊條圖的任何 segment → 顯示該 X 軸分組下的**所有紀錄**

**現在**：hover 堆疊條圖的 segment → 顯示該 X 軸 + Y 軸分組下的**精確紀錄**

### 使用範例

假設有一個堆疊條圖：
- X 軸：月份（2024-01, 2024-02, ...）
- Y 軸：階段（洽談中、報價中、已成交）

**之前**：hover「2024-01」的「已成交」segment → 顯示 2024-01 的所有商機（包含洽談中、報價中）

**現在**：hover「2024-01」的「已成交」segment → 只顯示 2024-01 且階段為「已成交」的商機

### 技術實作

#### 1. 資料類型擴展

```typescript
// BarChartDataItem.ts
export type BarChartDataItem = BarDatum & {
  to?: string;
  rawDimensionValue?: string | number | null;
  // 新增：每個 series 的原始值 map
  rawSeriesValues?: Record<string, string | number | null>;
};
```

#### 2. 資料轉換修改

```typescript
// transformTwoDimensionalGroupByToBarChartData.ts
// 存儲 Y 軸原始值
const rawYValue = dimensionValues[1] ?? null;

if (!dataMap.has(xValue)) {
  dataMap.set(xValue, {
    [indexByKey]: xValue,
    rawDimensionValue,
    rawSeriesValues: {},  // 新增
  });
}

const dataItem = dataMap.get(xValue)!;
dataItem[yValue] = aggregateValue;
// 新增：存儲該 series 的原始值
if (dataItem.rawSeriesValues) {
  dataItem.rawSeriesValues[yValue] = rawYValue;
}
```

#### 3. Hook 擴展

```typescript
// useBarChartRecords.ts
type UseBarChartRecordsProps = {
  objectMetadataItemId: string;
  configuration: BarChartConfiguration;
  barDimensionValue: string | number | null | undefined;
  barSeriesValue?: string | number | null | undefined;  // 新增
  enabled?: boolean;
};

// 在 combinedFilter 中加入 Y 軸 filter
if (isDefined(barSeriesValue) && isDefined(secondaryGroupByField)) {
  filters.push({
    [secondaryGroupByField.name]: { eq: barSeriesValue },
  });
}
```

#### 4. Tooltip 元件修改

```typescript
// GraphBarChartTooltip.tsx
// 取得 hover 的 series key（格式化後的 Y 軸值）
const hoveredSeriesKey = hoveredDatum?.id ? String(hoveredDatum.id) : undefined;
// 從 rawSeriesValues map 取得原始 Y 軸值
const hoveredSeriesRawValue = hoveredSeriesKey
  ? hoveredDataItem?.rawSeriesValues?.[hoveredSeriesKey]
  : undefined;

// 傳遞給 Hook
const { records, totalCount } = useBarChartRecords({
  // ...
  barSeriesValue: hoveredSeriesRawValue,  // 新增
});
```

### 修改的檔案

| 檔案 | 修改內容 |
|------|---------|
| `graphWidgetBarChart/types/BarChartDataItem.ts` | 新增 `rawSeriesValues` 欄位 |
| `graphWidgetBarChart/utils/transformTwoDimensionalGroupByToBarChartData.ts` | 存儲每個 series 的原始 Y 軸值 |
| `graphWidgetBarChart/hooks/useBarChartRecords.ts` | 新增 `barSeriesValue` 參數，支援 Y 軸 filter |
| `graphWidgetBarChart/components/GraphBarChartTooltip.tsx` | 傳遞 hover 的 series 原始值 |

### 向後相容性

- ✅ 一維條圖不受影響（`rawSeriesValues` 是 optional）
- ✅ 現有的 Pie Chart、Line Chart 不受影響
- ✅ 沒有 secondary axis 的圖表會自動 fallback 到只用 X 軸 filter
- ✅ 快取 key 已更新，包含 series value 以區分不同 segment

---

## 已知限制

### ~~堆疊條圖（Stacked Bar Chart）~~ ✅ 已解決（v2.2）

~~**限制**：堆疊條圖的 Tooltip 紀錄只能按 X 軸分組顯示，無法區分 Y 軸（series）的紀錄。~~

**已解決**：v2.2 版本新增 `rawSeriesValues` 欄位，現在 hover 堆疊條圖的 segment 時會精確顯示該 X+Y 軸分組的紀錄。

詳見上方「堆疊條圖 Y 軸區分功能（v2.2 新增）」章節。

---

## 日期欄位範圍查詢修復（v2.3 新增）

### 問題描述

當圖表使用日期欄位作為分組軸（如按季度分組），hover tooltip 時顯示的紀錄數量錯誤，呈現「累加」效果：
- Q4：6 筆 ✓
- Q3：10 筆 ✗（應該是 4 筆）
- Q2：更多筆...

### 根本原因

後端 `GraphqlQueryFilterFieldParser` 只處理 filter 物件的**第一個 operator**：

```typescript
// 後端程式碼
const [[operator, value]] = Object.entries(filterValue);
// 只取第一個！
```

當前端傳送 `{ gte: "2026-07-01", lte: "2026-09-30" }` 時，後端只處理 `gte`，導致查詢變成「大於等於 Q3 開始日期」的所有記錄。

### 解決方案

修改 `buildDateRangeFilter` 函數，將 `gte` 和 `lte` 分開成兩個 filter，用 `and` 組合：

```typescript
// 之前（錯誤）
return {
  [fieldName]: {
    gte: dateRange.start,
    lte: dateRange.end,
  },
};

// 之後（正確）
const gteFilter = { [fieldName]: { gte: dateRange.start } };
const lteFilter = { [fieldName]: { lte: dateRange.end } };
return {
  and: [gteFilter, lteFilter],
};
```

### 日期格式

後端 `DateScalarType` 期望的格式是 `yyyy-MM-dd`（如 `2026-07-01`），不需要時間部分。

### 修改的檔案

| 檔案 | 修改內容 |
|------|---------|
| `graph/utils/buildDateRangeFilter.ts` | 新增檔案，統一處理日期範圍 filter 建構 |
| `graphWidgetBarChart/hooks/useBarChartRecords.ts` | 使用 `buildDateRangeFilter`，支援日期粒度 |
| `graphWidgetPieChart/hooks/usePieChartSliceRecords.ts` | 使用 `buildDateRangeFilter`，支援日期粒度 |
| `graphWidgetLineChart/hooks/useLineChartRecords.ts` | 使用 `buildDateRangeFilter`，支援日期粒度 |

### 支援的日期粒度

| 粒度 | 範例輸入 | 輸出範圍 |
|------|---------|---------|
| DAY | `2026-01-15T00:00:00.000Z` | `2026-01-15` ~ `2026-01-15` |
| WEEK | `2026-01-06T00:00:00.000Z` | `2026-01-06` ~ `2026-01-12` |
| MONTH | `2026-01-01T00:00:00.000Z` | `2026-01-01` ~ `2026-01-31` |
| QUARTER | `2026-07-01T00:00:00.000Z` | `2026-07-01` ~ `2026-09-30` |
| YEAR | `2026-01-01T00:00:00.000Z` | `2026-01-01` ~ `2026-12-31` |

### 向後相容性

- ✅ 非日期欄位不受影響（返回 `undefined`，使用預設 `eq` filter）
- ✅ 沒有日期粒度的圖表不受影響
- ✅ Pie Chart、Line Chart 同樣受益於此修復
