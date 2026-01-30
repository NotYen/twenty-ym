# 外部分享連結完整需求分析

**日期**: 2025-01-29
**狀態**: 需求確認

---

## 🎯 完整需求

### 1. 表格分享

#### 範圍
- ✅ **所有標準表格**（左側功能列表中的所有表格）
  - Company
  - Person
  - Opportunity
  - Task
  - Note
  - SalesQuote
  - ... 等所有標準對象

- ✅ **用戶自定義表格**（數據模型中新增的表格）
  - 用戶可以在「數據模型」中新增自定義對象
  - 這些自定義表格也要支援分享

#### 當前狀態
- ⚠️ **只實作了 3 個特定表格**：Company, Person, SalesQuote
- ❌ **不支援其他標準表格**
- ❌ **不支援用戶自定義表格**

#### 需要改進
需要實作**通用的表格分享邏輯**，而不是針對每個表格寫一個 renderer。

---

### 2. 圖表分享

#### 範圍
- ✅ **所有圖表類型**
  - BAR (VERTICAL / HORIZONTAL)
  - PIE
  - LINE
  - AGGREGATE
  - GAUGE

- ✅ **所有配置**
  - GroupBy（一維、二維）
  - Aggregate Operations（COUNT, SUM, AVG, MIN, MAX）
  - Filter（rangeMin, rangeMax, omitNullValues）
  - 日期分組（DAY, WEEK, MONTH, QUARTER, YEAR）
  - 堆疊/分組模式（STACKED / GROUPED）
  - 排序（primaryAxisOrderBy, secondaryAxisOrderBy）

#### 關鍵要求
> **「儀表板怎樣顯示，分享連結圖表就怎樣顯示」**

這意味著：
1. ✅ 所有 filter 都要保留
2. ✅ 所有 groupBy 配置都要保留
3. ✅ 所有 aggregate 配置都要保留
4. ✅ 所有顯示配置都要保留（顏色、標籤、軸標題等）
5. ✅ 資料要完全一致

#### 當前狀態
- ⚠️ 只實作了基礎查詢邏輯
- ❌ 沒有完整支援所有配置
- ❌ 堆疊圖表無法正確顯示

#### 需要完善
不只是 `queryGroupByData()` 方法，還需要：
1. 完整的 GroupBy 查詢邏輯（支援所有配置）
2. Filter 邏輯（rangeMin, rangeMax, omitNullValues）
3. 日期處理邏輯（dateGranularity, 填充間隙）
4. 排序邏輯（orderBy）
5. 二維 GroupBy 支援（堆疊/分組）

---

## 🔍 深入分析

### 圖表配置的完整性

讓我們看看一個完整的圖表配置包含什麼：

```typescript
interface BarChartConfiguration {
  // 圖表類型
  graphType: 'VERTICAL_BAR' | 'HORIZONTAL_BAR';

  // Primary Axis (X 軸)
  primaryAxisGroupByFieldMetadataId: string;
  primaryAxisGroupBySubFieldName?: string;
  primaryAxisDateGranularity?: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  primaryAxisOrderBy?: 'ASC' | 'DESC';

  // Secondary Axis (Y 軸 - 用於堆疊圖)
  secondaryAxisGroupByFieldMetadataId?: string;
  secondaryAxisGroupBySubFieldName?: string;
  secondaryAxisGroupByDateGranularity?: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  secondaryAxisOrderBy?: 'ASC' | 'DESC';

  // Aggregate
  aggregateOperation: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_UNIQUE' | 'PERCENT_EMPTY' | 'PERCENT_NOT_EMPTY';
  aggregateFieldMetadataId?: string;

  // Filter
  rangeMin?: number;
  rangeMax?: number;
  omitNullValues?: boolean;

  // 顯示配置
  groupMode?: 'STACKED' | 'GROUPED';
  color?: string;
  displayDataLabel?: boolean;
  axisNameDisplay?: 'X' | 'Y' | 'BOTH' | 'NONE';
  isCumulative?: boolean;
}
```

**關鍵發現**：
- 配置非常複雜
- 包含多個維度的設定
- 需要完整支援所有配置

---

## 🏗️ 正確的實作方案

### 方案：完整複製內部邏輯

#### 核心理念
> **「後端執行與前端完全相同的查詢邏輯，返回原始 GroupBy 結果」**

#### 為什麼這樣做？

**Twenty 內部的流程**：
```
useGraphWidgetGroupByQuery (GraphQL 查詢)
  ├─ 構建查詢變數（包含所有配置）
  ├─ 執行 GroupBy 查詢
  └─ 返回原始 groupByData
      ↓
transformGroupByDataToBarChartData (前端轉換)
  ├─ 過濾資料（rangeMin, rangeMax, omitNullValues）
  ├─ 填充日期間隙（如果是日期欄位）
  ├─ 轉換為 Nivo 格式
  └─ 返回 { data, indexBy, keys, series }
      ↓
GraphWidgetBarChart (顯示)
```

**外部分享的流程**：
```
後端：executeGroupByQuery (替代 GraphQL 查詢)
  ├─ 構建查詢變數（包含所有配置）← 與內部相同
  ├─ 執行 GroupBy 查詢
  └─ 返回原始 groupByData ← 格式與內部相同
      ↓
前端：transformGroupByDataToBarChartData (使用 Twenty 內部邏輯)
  ├─ 過濾資料
  ├─ 填充日期間隙
  ├─ 轉換為 Nivo 格式
  └─ 返回 { data, indexBy, keys, series }
      ↓
GraphWidgetBarChart (使用 Twenty 內部組件)
```

---

## 📝 需要實作的內容

### 1. 表格分享 - 通用邏輯

**當前問題**：
```typescript
// ❌ 當前實作：針對每個表格寫一個方法
private async getCompanyContent() { ... }
private async getPersonContent() { ... }
private async getSalesQuoteContent() { ... }
```

**正確實作**：
```typescript
// ✅ 通用邏輯：支援所有表格
private async getTableContent(
  resourceType: string,  // 'COMPANY' | 'PERSON' | 'CUSTOM_OBJECT_XXX'
  resourceId: string,
  workspaceId: string,
): Promise<any> {
  // 1. 根據 resourceType 獲取 objectMetadata
  const objectMetadata = await this.getObjectMetadataByResourceType(
    resourceType,
    workspaceId,
  );

  // 2. 查詢資料
  const repository = await this.twentyORMGlobalManager.getRepositoryForWorkspace(
    workspaceId,
    objectMetadata.nameSingular,
    { shouldBypassPermissionChecks: true },
  );

  const record = await repository.findOne({
    where: { id: resourceId },
    // 自動載入所有關聯
    relations: this.getRelationsForObject(objectMetadata),
  });

  // 3. 過濾敏感欄位（通用邏輯）
  return this.filterSensitiveFields(record, objectMetadata);
}
```

---

### 2. 圖表分享 - 完整查詢邏輯

**需要實作的方法**：

#### 2.1 主查詢方法
```typescript
/**
 * 查詢原始 GroupBy 資料
 * 執行與前端 useGraphWidgetGroupByQuery 完全相同的邏輯
 */
private async queryGroupByData(
  objectMetadataId: string,
  configuration: BarChartConfiguration,
  workspaceId: string,
): Promise<Record<string, GroupByRawResult[]>> {
  // 1. 獲取 objectMetadata 和相關 fields
  const { objectMetadata, primaryGroupByField, secondaryGroupByField, aggregateField }
    = await this.getChartMetadata(objectMetadataId, configuration, workspaceId);

  // 2. 構建查詢變數（與前端 generateGroupByQueryVariablesFromChartConfiguration 相同）
  const queryVariables = this.generateGroupByQueryVariables({
    objectMetadata,
    configuration,
    primaryGroupByField,
    secondaryGroupByField,
    aggregateField,
  });

  // 3. 執行 GroupBy 查詢
  const rawResults = await this.executeGroupByQuery(
    objectMetadata,
    queryVariables,
    workspaceId,
  );

  // 4. 返回原始結果（格式與 GraphQL 查詢結果相同）
  return {
    [`${objectMetadata.nameSingular}GroupBy`]: rawResults,
  };
}
```

#### 2.2 查詢變數構建
```typescript
/**
 * 構建 GroupBy 查詢變數
 * 與前端 generateGroupByQueryVariablesFromChartConfiguration 邏輯相同
 */
private generateGroupByQueryVariables(params: {
  objectMetadata: ObjectMetadataEntity;
  configuration: BarChartConfiguration;
  primaryGroupByField: FieldMetadataEntity;
  secondaryGroupByField?: FieldMetadataEntity;
  aggregateField?: FieldMetadataEntity;
}): GroupByQueryVariables {
  const { configuration, primaryGroupByField, secondaryGroupByField } = params;

  return {
    // Primary GroupBy
    groupBy: [
      {
        fieldName: primaryGroupByField.name,
        // 如果是日期欄位，需要指定 granularity
        dateGranularity: this.isDateField(primaryGroupByField)
          ? configuration.primaryAxisDateGranularity
          : undefined,
        // 如果是複合欄位（如 name.firstName），需要指定 subFieldName
        subFieldName: configuration.primaryAxisGroupBySubFieldName,
      },
      // Secondary GroupBy（如果有）
      ...(secondaryGroupByField ? [{
        fieldName: secondaryGroupByField.name,
        dateGranularity: this.isDateField(secondaryGroupByField)
          ? configuration.secondaryAxisGroupByDateGranularity
          : undefined,
        subFieldName: configuration.secondaryAxisGroupBySubFieldName,
      }] : []),
    ],

    // Aggregate Operations
    aggregateOperations: this.buildAggregateOperations(
      configuration.aggregateOperation,
      params.aggregateField,
    ),

    // Order By
    orderBy: this.buildOrderBy(configuration),

    // Limit
    limit: 20,
  };
}
```

#### 2.3 執行查詢
```typescript
/**
 * 執行 GroupBy 查詢
 * 使用 TypeORM QueryBuilder 構建查詢
 */
private async executeGroupByQuery(
  objectMetadata: ObjectMetadataEntity,
  queryVariables: GroupByQueryVariables,
  workspaceId: string,
): Promise<GroupByRawResult[]> {
  const repository = await this.twentyORMGlobalManager.getRepositoryForWorkspace(
    workspaceId,
    objectMetadata.nameSingular,
    { shouldBypassPermissionChecks: true },
  );

  const queryBuilder = repository.createQueryBuilder(objectMetadata.nameSingular);

  // 1. 添加 GroupBy
  queryVariables.groupBy.forEach((groupBy, index) => {
    const expression = this.buildGroupByExpression(
      groupBy.fieldName,
      groupBy.dateGranularity,
      groupBy.subFieldName,
      objectMetadata.nameSingular,
    );

    if (index === 0) {
      queryBuilder.select(expression, `dimension${index + 1}`);
      queryBuilder.groupBy(expression);
    } else {
      queryBuilder.addSelect(expression, `dimension${index + 1}`);
      queryBuilder.addGroupBy(expression);
    }
  });

  // 2. 添加 Aggregate Operations
  Object.entries(queryVariables.aggregateOperations).forEach(([key, expression]) => {
    queryBuilder.addSelect(expression, key);
  });

  // 3. 添加 Order By
  if (queryVariables.orderBy) {
    queryBuilder.orderBy(queryVariables.orderBy.field, queryVariables.orderBy.direction);
  }

  // 4. 添加 Limit
  queryBuilder.limit(queryVariables.limit);

  // 5. 執行查詢
  const results = await queryBuilder.getRawMany();

  // 6. 轉換為 GroupByRawResult 格式
  return results.map((row) => ({
    groupByDimensionValues: queryVariables.groupBy.map((_, index) =>
      row[`dimension${index + 1}`]
    ),
    // Aggregate 結果
    count: row.count || 0,
    sum: row.sum !== undefined ? { [queryVariables.aggregateField]: row.sum } : undefined,
    avg: row.avg !== undefined ? { [queryVariables.aggregateField]: row.avg } : undefined,
    min: row.min !== undefined ? { [queryVariables.aggregateField]: row.min } : undefined,
    max: row.max !== undefined ? { [queryVariables.aggregateField]: row.max } : undefined,
  }));
}
```

---


## 🔒 安全性與獨立性

### 安全性要求

1. **Token 驗證**:
   - ✅ 每個分享連結都有唯一的 token
   - ✅ Token 無法被猜測
   - ✅ Token 過期機制

2. **Workspace 隔離**:
   - ✅ 嚴格檢查 workspaceId
   - ✅ 防止跨 workspace 訪問
   - ✅ 每個查詢都要驗證 workspace

3. **資料過濾**:
   - ✅ 只返回安全的公開欄位
   - ✅ 排除敏感資訊
   - ✅ 通用的過濾邏輯（適用所有表格）

4. **權限檢查**:
   - ✅ 驗證 shareLink 是否存在
   - ✅ 驗證 shareLink 是否過期
   - ✅ 驗證 resourceType 是否匹配

### 獨立性要求

1. **資料獨立**:
   - ✅ 分享是「快照」，不是即時資料
   - ✅ 修改原始資料不影響分享連結
   - ✅ 刪除原始資料不影響分享連結（可選）

2. **配置獨立**:
   - ✅ 分享時儲存完整的配置
   - ✅ 修改原始圖表配置不影響分享連結

3. **生命週期獨立**:
   - ✅ 可設定過期時間
   - ✅ 過期後自動失效
   - ✅ 可手動撤銷分享

---

## 📊 完整的資料流程

### 表格分享流程

```
User 點擊「分享」表格
  ↓
後端：創建 ShareLink
  ├─ resourceType: 'COMPANY' | 'PERSON' | 'CUSTOM_OBJECT_XXX'
  ├─ resourceId: record.id
  ├─ isPublic: true/false
  ├─ expiresAt: Date
  └─ token: UUID
  ↓
外部用戶訪問 /external/{token}
  ↓
後端：驗證 token → 查詢資料
  ├─ 根據 resourceType 獲取 objectMetadata
  ├─ 查詢記錄（包含關聯）
  └─ 過濾敏感欄位
  ↓
前端：渲染表格
  └─ 使用通用的 RecordRenderer
```

### 圖表分享流程

```
User 點擊「分享」圖表
  ↓
後端：創建 ShareLink
  ├─ resourceType: 'DASHBOARD_CHART'
  ├─ resourceId: widget.id
  ├─ isPublic: true/false
  ├─ expiresAt: Date
  └─ token: UUID
  ↓
外部用戶訪問 /external/{token}
  ↓
後端：驗證 token → 查詢圖表資料
  ├─ 獲取 widget 配置
  ├─ 執行 GroupBy 查詢（包含所有 filter、groupBy、aggregate）
  └─ 返回原始 groupByData
  ↓
前端：轉換並渲染圖表
  ├─ 使用 transformGroupByDataToBarChartData (Twenty 內部邏輯)
  └─ 使用 GraphWidgetBarChart (Twenty 內部組件)
```

---

## ✅ 完整的實作清單

### 1. 表格分享 - 通用化

#### 後端
- [ ] 實作 `getTableContent()` 通用方法
- [ ] 實作 `getObjectMetadataByResourceType()` 方法
- [ ] 實作 `filterSensitiveFields()` 通用過濾邏輯
- [ ] 實作 `getRelationsForObject()` 自動載入關聯
- [ ] 支援所有標準對象
- [ ] 支援用戶自定義對象

#### 前端
- [ ] 實作通用的 `RecordRenderer` 組件
- [ ] 自動根據 objectMetadata 渲染欄位
- [ ] 支援所有欄位類型

---

### 2. 圖表分享 - 完整邏輯

#### 後端
- [ ] 實作 `queryGroupByData()` 主方法
- [ ] 實作 `getChartMetadata()` 獲取圖表元數據
- [ ] 實作 `generateGroupByQueryVariables()` 構建查詢變數
- [ ] 實作 `executeGroupByQuery()` 執行查詢
- [ ] 實作 `buildGroupByExpression()` 構建 GroupBy 表達式
  - [ ] 支援日期分組（DAY, WEEK, MONTH, QUARTER, YEAR）
  - [ ] 支援複合欄位（name.firstName）
  - [ ] 支援所有欄位類型
- [ ] 實作 `buildAggregateOperations()` 構建 Aggregate 表達式
  - [ ] COUNT
  - [ ] SUM
  - [ ] AVG
  - [ ] MIN
  - [ ] MAX
  - [ ] COUNT_UNIQUE
  - [ ] PERCENT_EMPTY
  - [ ] PERCENT_NOT_EMPTY
- [ ] 實作 `buildOrderBy()` 構建排序
- [ ] 支援一維 GroupBy
- [ ] 支援二維 GroupBy（堆疊/分組）

#### 前端
- [ ] 修改 `DashboardChartRenderer.tsx`
- [ ] 使用 `transformGroupByDataToBarChartData`
- [ ] 使用 `GraphWidgetBarChart`
- [ ] 支援所有圖表類型
  - [ ] BAR (VERTICAL / HORIZONTAL)
  - [ ] PIE
  - [ ] LINE
  - [ ] AGGREGATE
  - [ ] GAUGE
- [ ] 支援所有配置
  - [ ] groupMode (STACKED / GROUPED)
  - [ ] filter (rangeMin, rangeMax, omitNullValues)
  - [ ] 日期分組
  - [ ] 排序
  - [ ] 顯示配置（顏色、標籤等）

---

### 3. 安全性與獨立性

- [ ] Token 驗證
- [ ] Workspace 隔離
- [ ] 資料過濾
- [ ] 過期機制
- [ ] 訪問記錄
- [ ] 撤銷功能

---

## 🧪 測試計畫

### 表格分享測試

#### 標準對象
- [ ] Company
- [ ] Person
- [ ] Opportunity
- [ ] Task
- [ ] Note
- [ ] SalesQuote
- [ ] ... 所有標準對象

#### 自定義對象
- [ ] 創建自定義對象
- [ ] 測試分享
- [ ] 驗證資料正確

#### 欄位類型
- [ ] TEXT
- [ ] NUMBER
- [ ] DATE
- [ ] SELECT
- [ ] MULTI_SELECT
- [ ] BOOLEAN
- [ ] RELATION
- [ ] ... 所有欄位類型

---

### 圖表分享測試

#### 圖表類型
- [ ] VERTICAL_BAR
- [ ] HORIZONTAL_BAR
- [ ] PIE
- [ ] LINE
- [ ] AGGREGATE
- [ ] GAUGE

#### GroupBy 配置
- [ ] 一維 GroupBy
- [ ] 二維 GroupBy (STACKED)
- [ ] 二維 GroupBy (GROUPED)
- [ ] 日期分組（所有粒度）
- [ ] 複合欄位

#### Aggregate Operations
- [ ] COUNT
- [ ] SUM
- [ ] AVG
- [ ] MIN
- [ ] MAX
- [ ] COUNT_UNIQUE
- [ ] PERCENT_EMPTY
- [ ] PERCENT_NOT_EMPTY

#### Filter
- [ ] rangeMin
- [ ] rangeMax
- [ ] omitNullValues
- [ ] 組合 filter

#### 顯示配置
- [ ] 顏色
- [ ] 標籤
- [ ] 軸標題
- [ ] 累積模式

---

## 📅 實作時程（修正版）

### Day 1: 表格分享通用化（4-6 小時）
- 實作通用的 `getTableContent()` 方法
- 實作通用的 `RecordRenderer` 組件
- 測試所有標準對象
- 測試自定義對象

### Day 2: 圖表分享 - 後端邏輯（6-8 小時）
- 實作 `queryGroupByData()` 主方法
- 實作 `generateGroupByQueryVariables()`
- 實作 `executeGroupByQuery()`
- 實作所有輔助方法
- 測試所有配置

### Day 3: 圖表分享 - 前端整合（4-6 小時）
- 修改 `DashboardChartRenderer.tsx`
- 支援所有圖表類型
- 測試所有配置
- 整合測試

### Day 4: 安全性與優化（2-4 小時）
- 完善安全性檢查
- 效能優化
- 文檔更新
- 部署

**總計**: 16-24 小時（約 2-3 天）

---

## 🎯 成功標準

### 功能完整性
- ✅ 支援**所有**表格（標準 + 自定義）
- ✅ 支援**所有**圖表類型
- ✅ 支援**所有**配置
- ✅ **「儀表板怎樣顯示，分享連結就怎樣顯示」**

### 安全性
- ✅ Token 驗證
- ✅ Workspace 隔離
- ✅ 資料過濾
- ✅ 過期機制

### 獨立性
- ✅ 資料獨立（快照）
- ✅ 配置獨立
- ✅ 生命週期獨立

### 程式碼品質
- ✅ 通用邏輯（不針對特定對象）
- ✅ 零重複邏輯（複用 Twenty 內部邏輯）
- ✅ 不修改 Twenty 內部檔案
- ✅ 保留所有本地修改

---

## 🎉 總結

### 你的要求完全正確！

1. **表格分享**：
   - ❌ 不是只有 Company, Person, SalesQuote
   - ✅ 是**所有表格**（標準 + 自定義）
   - ✅ 需要通用邏輯

2. **圖表分享**：
   - ❌ 不是只完善 `queryGroupByData()` 方法
   - ✅ 需要完整的查詢邏輯（支援所有配置）
   - ✅ **「儀表板怎樣顯示，分享連結就怎樣顯示」**
   - ✅ 包含：filter, groupBy, aggregate, 日期分組, 堆疊/分組, 排序等

3. **安全性與獨立性**：
   - ✅ Token 驗證
   - ✅ Workspace 隔離
   - ✅ 資料過濾
   - ✅ 快照機制（獨立性）

### 實作工作量
- 比我原本估計的要多
- 但架構和方向是正確的
- 預計 2-3 天完成

明天早上我們可以開始實作！🎯

---

**文檔版本**: v4.0 (完整需求版)
**最後更新**: 2025-01-29
**作者**: Kiro AI Assistant
**審核狀態**: 待用戶確認


---

## ⚠️ 重要原則（必須遵守）

### 四個核心原則

#### 1. ✅ 參考原本開源的設計架構跟邏輯
- **Twenty 是高品質的開源項目**
- 所有實作都要參考 Twenty 內部的設計
- 使用相同的模式和架構
- 不自己發明新的做法

**具體做法**：
- 圖表查詢：參考 `useGraphWidgetGroupByQuery` 的邏輯
- 資料轉換：使用 `transformGroupByDataToBarChartData`（不修改）
- 圖表顯示：使用 `GraphWidgetBarChart`（不修改）
- 表格顯示：參考 `RecordTable` 的模式

---

#### 2. ✅ 不影響其他正常執行的功能
- **確保穩定性**
- 所有修改都在獨立的模組中（`share-link` 模組）
- 不修改 Twenty 內部的任何檔案
- 不修改共用的邏輯

**具體做法**：
- ❌ 不修改：`packages/twenty-front/src/modules/page-layout/widgets/graph/**`
- ❌ 不修改：`packages/twenty-front/src/modules/object-record/**`
- ❌ 不修改：`packages/twenty-server/src/engine/core-modules/object-record/**`
- ✅ 只修改：`packages/twenty-server/src/engine/core-modules/share-link/**`
- ✅ 只修改：`packages/twenty-front/src/modules/share-link/**`
- ✅ 只修改：`packages/twenty-front/src/pages/external/**`

---

#### 3. ✅ 保留本地所有修改
- **包括服務、bugfix、新功能、繁中文案、資料庫資料、Line@ 功能**
- 不覆蓋任何本地修改
- 不刪除任何本地功能
- 不修改任何本地配置

**具體做法**：
- 使用 Git 檢查：確保不影響現有檔案
- 測試所有功能：確保所有功能正常運行
- 檢查資料庫：確保資料完整
- 檢查翻譯：確保繁中文案正常

**需要保留的功能**：
- ✅ Line@ 整合功能
- ✅ 報價單功能
- ✅ 所有 bugfix
- ✅ 所有新功能
- ✅ 繁中翻譯
- ✅ 資料庫資料
- ✅ 所有本地配置

---

#### 4. ✅ 保留之前努力優化切換頁面效能（速度）的功能
- **不能破壞效能優化**
- 外部分享不影響內部效能
- 查詢要高效
- 不增加系統負載

**具體做法**：
- 外部分享使用獨立的查詢邏輯
- 不影響內部的快取機制
- 不影響內部的查詢優化
- 限制查詢數量（最多 20 個分組）
- 可選：為外部分享添加快取（Redis）

**效能要求**：
- 外部分享查詢時間 < 2 秒
- 不影響內部頁面切換速度
- 不增加資料庫負載
- 不增加記憶體使用

---

## 🛡️ 實作守則

### 檔案修改規則

#### ✅ 可以修改的檔案
```
packages/twenty-server/src/engine/core-modules/share-link/
  ├── share-link.module.ts
  ├── services/
  │   ├── share-link.service.ts
  │   └── external-content.service.ts
  └── controllers/
      └── external-content.controller.ts

packages/twenty-front/src/modules/share-link/
  └── components/
      └── renderers/
          ├── DashboardChartRenderer.tsx
          ├── RecordRenderer.tsx (新增)
          └── ...

packages/twenty-front/src/pages/external/
  └── ExternalSharedContent.tsx
```

#### ❌ 不能修改的檔案
```
packages/twenty-front/src/modules/page-layout/widgets/graph/**
packages/twenty-front/src/modules/object-record/**
packages/twenty-server/src/engine/core-modules/object-record/**
packages/twenty-server/src/engine/metadata-modules/**
... 所有 Twenty 內部檔案
```

---

### 程式碼規則

#### ✅ 正確的做法
```typescript
// ✅ 使用 Twenty 內部的邏輯（import 使用，不修改）
import { transformGroupByDataToBarChartData } from '@/page-layout/widgets/graph/graphWidgetBarChart/utils/transformGroupByDataToBarChartData';
import { GraphWidgetBarChart } from '@/page-layout/widgets/graph/graphWidgetBarChart/components/GraphWidgetBarChart';

// ✅ 在自己的模組中實作邏輯
// packages/twenty-server/src/engine/core-modules/share-link/services/external-content.service.ts
private async queryGroupByData() {
  // 參考 Twenty 內部邏輯，但在自己的模組中實作
}
```

#### ❌ 錯誤的做法
```typescript
// ❌ 修改 Twenty 內部檔案
// packages/twenty-front/src/modules/page-layout/widgets/graph/graphWidgetBarChart/utils/transformGroupByDataToBarChartData.ts
export const transformGroupByDataToBarChartData = () => {
  // 修改內部邏輯 ← 錯誤！
}

// ❌ 複製並修改內部邏輯
// packages/twenty-front/src/modules/share-link/utils/myTransformLogic.ts
export const myTransformGroupByDataToBarChartData = () => {
  // 複製內部邏輯並修改 ← 錯誤！應該直接使用內部邏輯
}
```

---

### 測試規則

#### 必須測試的項目

1. **功能測試**：
   - ✅ 外部分享功能正常
   - ✅ 所有現有功能正常

2. **效能測試**：
   - ✅ 內部頁面切換速度不變
   - ✅ 外部分享查詢時間 < 2 秒

3. **資料完整性測試**：
   - ✅ 資料庫資料完整
   - ✅ 翻譯檔案完整
   - ✅ Line@ 功能正常

4. **回歸測試**：
   - ✅ 所有 bugfix 仍然有效
   - ✅ 所有新功能仍然正常
   - ✅ 報價單功能正常

---

### Git 提交規則

#### Commit Message 格式
```bash
[Add] 新增外部分享連結功能 - 支援所有表格和圖表

詳細說明：
- 新增通用的表格分享邏輯
- 新增完整的圖表分享邏輯
- 支援所有標準對象和自定義對象
- 支援所有圖表類型和配置
- 不影響 Twenty 內部邏輯
- 保留所有本地修改
- 保留效能優化
```

#### 提交前檢查清單
- [ ] 沒有修改 Twenty 內部檔案
- [ ] 所有測試通過
- [ ] 效能測試通過
- [ ] 本地功能正常（Line@、報價單等）
- [ ] 翻譯檔案完整
- [ ] 資料庫資料完整
- [ ] 程式碼符合規範
- [ ] 文檔更新完成

---

## 📊 影響範圍分析

### 新增的檔案（不影響現有系統）
```
packages/twenty-server/src/engine/core-modules/share-link/
  ├── share-link.module.ts (已存在，擴展)
  ├── services/
  │   ├── share-link.service.ts (已存在，擴展)
  │   └── external-content.service.ts (已存在，擴展)
  └── controllers/
      └── external-content.controller.ts (已存在，擴展)

packages/twenty-front/src/modules/share-link/
  └── components/
      └── renderers/
          ├── DashboardChartRenderer.tsx (已存在，擴展)
          └── RecordRenderer.tsx (新增)

packages/twenty-front/src/pages/external/
  └── ExternalSharedContent.tsx (已存在，擴展)
```

### 修改的檔案（最小化修改）
```
packages/twenty-server/src/engine/core-modules/share-link/services/external-content.service.ts
  ├── 新增 queryGroupByData() 方法
  ├── 新增 getTableContent() 方法
  └── 擴展現有方法

packages/twenty-front/src/modules/share-link/components/renderers/DashboardChartRenderer.tsx
  ├── 使用 transformGroupByDataToBarChartData
  └── 使用 GraphWidgetBarChart

packages/twenty-front/src/pages/external/ExternalSharedContent.tsx
  └── 新增通用的 RecordRenderer
```

### 不修改的檔案（確保穩定性）
```
packages/twenty-front/src/modules/page-layout/widgets/graph/** (所有檔案)
packages/twenty-front/src/modules/object-record/** (所有檔案)
packages/twenty-server/src/engine/core-modules/object-record/** (所有檔案)
packages/twenty-server/src/engine/metadata-modules/** (所有檔案)
... 所有 Twenty 內部檔案
... 所有本地修改的檔案（Line@、報價單等）
```

---

## 🎯 最終確認

### 實作前確認清單
- [ ] 理解 Twenty 內部的設計架構
- [ ] 確認不修改 Twenty 內部檔案
- [ ] 確認不影響現有功能
- [ ] 確認保留所有本地修改
- [ ] 確認保留效能優化
- [ ] 準備好測試計畫
- [ ] 準備好回滾方案

### 實作中確認清單
- [ ] 每個功能都參考 Twenty 內部邏輯
- [ ] 每個修改都在獨立模組中
- [ ] 每個功能都有測試
- [ ] 每個提交都有清晰的說明

### 實作後確認清單
- [ ] 所有測試通過
- [ ] 效能測試通過
- [ ] 本地功能正常
- [ ] 翻譯檔案完整
- [ ] 資料庫資料完整
- [ ] 文檔更新完成
- [ ] 部署文檔更新完成

---

## 🎉 總結

### 核心原則（再次強調）
1. ✅ **參考原本開源的設計架構跟邏輯** - Twenty 是高品質的開源項目
2. ✅ **不影響其他正常執行的功能** - 確保穩定性
3. ✅ **保留本地所有修改** - 包括服務、bugfix、新功能、繁中文案、資料庫資料、Line@ 功能
4. ✅ **保留之前努力優化切換頁面效能（速度）的功能**

### 實作策略
- **參考，不修改** - 使用 Twenty 內部邏輯，但不修改它們
- **獨立模組** - 所有修改都在 `share-link` 模組中
- **最小影響** - 只新增功能，不修改現有功能
- **完整測試** - 確保所有功能正常

### 成功標準
- ✅ 外部分享功能完整
- ✅ 所有現有功能正常
- ✅ 效能不受影響
- ✅ 本地修改完整保留
- ✅ Twenty 架構完整保留

**明天早上我們開始實作時，會嚴格遵守這些原則！** 🎯

---

**文檔版本**: v5.0 (加入核心原則)
**最後更新**: 2025-01-29
**作者**: Kiro AI Assistant
**審核狀態**: 待用戶確認

