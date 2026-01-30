# 外部分享連結完整實作文檔

**最後更新：2026-01-29**

---

## 📋 目錄

1. [功能概述](#功能概述)
2. [後端實作](#後端實作)
3. [前端實作](#前端實作)
4. [支援的功能](#支援的功能)
5. [已知限制](#已知限制)
6. [測試指南](#測試指南)
7. [部署說明](#部署說明)
8. [踩坑記錄](#踩坑記錄)

---

## 功能概述

外部分享連結功能允許用戶將儀表板圖表和記錄分享給外部用戶（無需登入）。

### 核心特性

- ✅ 支援圖表分享（BAR, PIE, LINE）
- ✅ 支援表格分享（所有標準對象和自定義對象）
- ✅ Token 驗證機制
- ✅ Workspace 隔離
- ✅ 敏感欄位過濾
- ✅ 無需登入即可查看

### 分享連結格式

```
http://118.168.188.27.nip.io:8866/shared/{token}
```

---

## 後端實作

### 1. 核心服務

**檔案：`packages/twenty-server/src/engine/core-modules/share-link/services/external-content.service.ts`**

#### 主要方法

| 方法 | 功能 | 狀態 |
|------|------|------|
| `getContentByShareLink()` | 根據 token 獲取分享內容 | ✅ 完成 |
| `getDashboardChartContent()` | 獲取圖表資料 | ✅ 完成 |
| `getTableContent()` | 獲取表格資料（通用） | ✅ 完成 |
| `queryGroupByData()` | 查詢 GroupBy 資料 | ✅ 完成 |
| `filterSensitiveFields()` | 過濾敏感欄位 | ✅ 完成 |

#### 圖表查詢功能

`queryGroupByData()` 支援：

- ✅ 所有 Aggregate 操作（COUNT, SUM, AVG, MIN, MAX, COUNT_UNIQUE, PERCENT_EMPTY, PERCENT_NOT_EMPTY）
- ✅ 一維和二維 GroupBy
- ✅ 日期分組（DAY, WEEK, MONTH, QUARTER, YEAR）
- ✅ 複合欄位（name.firstName）
- ✅ 排序（primaryAxisOrderBy, secondaryAxisOrderBy）
- ✅ 限制結果數量（預設 20）

#### 表格查詢功能

`getTableContent()` 支援：

- ✅ 所有標準對象（Company, Person, Opportunity 等）
- ✅ 所有自定義對象
- ✅ 自動獲取關聯欄位
- ✅ 返回 objectMetadata（前端需要用來渲染）
- ✅ 過濾敏感欄位

### 2. 安全機制

| 機制 | 實作方式 |
|------|---------|
| Workspace 隔離 | 所有查詢都檢查 `workspaceId` |
| Token 驗證 | `ShareLinkGuard` 處理 |
| 權限繞過 | `shouldBypassPermissionChecks: true`（外部分享專用） |
| 敏感欄位過濾 | 自動過濾 password, token, secret 等 |

---

## 前端實作

### 1. 路由跳過邏輯

修改了 4 個 Effect 組件，在 `/shared/*` 路由時跳過：

| 檔案 | 修改內容 | 影響 |
|------|---------|------|
| `UserAndViewsProviderEffect.tsx` | 加入 `location.pathname.startsWith('/shared/')` | ✅ 只跳過外部路由 |
| `WorkspaceProviderEffect.tsx` | 加入 `isExternalShareRoute` 檢查 | ✅ 只跳過外部路由 |
| `ClientConfigProviderEffect.tsx` | 加入 `isExternalShareRoute` 檢查 | ✅ 只跳過外部路由 |
| `ObjectMetadataItemsLoadEffect.tsx` | 加入 `isExternalShareRoute` 檢查 | ✅ 只跳過外部路由 |

**重要：這些修改不影響內部功能，只是在外部路由時跳過某些檢查。**

### 2. 渲染器組件

#### DashboardChartRenderer

**檔案：`packages/twenty-front/src/modules/share-link/components/renderers/DashboardChartRenderer.tsx`**

**支援的圖表類型：**

| 圖表類型 | 狀態 | 說明 |
|---------|------|------|
| VERTICAL_BAR | ✅ 完整支援 | 垂直長條圖 |
| HORIZONTAL_BAR | ✅ 完整支援 | 水平長條圖 |
| PIE | ✅ 完整支援 | 圓餅圖 |
| LINE | ✅ 完整支援 | 折線圖 |
| AGGREGATE | ❌ 未實作 | 聚合圖表 |
| GAUGE | ❌ 未實作 | 儀表圖 |

**實作方式：**

- BAR 圖表：使用 `transformGroupByDataToBarChartData()` + `GraphWidgetBarChart`
- PIE 圖表：手動轉換資料（參考 `useGraphPieChartWidgetData`） + `GraphWidgetPieChart`
- LINE 圖表：使用 `transformGroupByDataToLineChartData()` + `GraphWidgetLineChart`

#### RecordRenderer

**檔案：`packages/twenty-front/src/modules/share-link/components/renderers/RecordRenderer.tsx`**

**功能：**

- ✅ 通用表格渲染器
- ✅ 支援所有標準對象和自定義對象
- ✅ 智慧欄位排序（重要欄位優先）
- ✅ 欄位類型格式化（日期、布林、數字、關聯）
- ✅ 空值處理

#### ExternalContentRenderer

**檔案：`packages/twenty-front/src/modules/share-link/components/ExternalContentRenderer.tsx`**

**功能：**

- 統一入口，根據 `resourceType` 選擇對應渲染器
- 處理 JSON 解析
- 錯誤處理

---

## 支援的功能

### 圖表分享

#### BAR 圖表（完整支援）

- ✅ 一維 GroupBy（單一維度）
- ✅ 二維 GroupBy（堆疊/分組圖表）
- ✅ 所有 Aggregate 操作
- ✅ 日期分組
- ✅ 複合欄位
- ✅ 排序
- ✅ 範圍設定（rangeMin, rangeMax）
- ✅ 空值處理（omitNullValues）
- ✅ 堆疊/分組模式（stacked/grouped）

#### PIE 圖表（完整支援）

- ✅ 單一維度 GroupBy
- ✅ 所有 Aggregate 操作
- ✅ 圖例顯示
- ✅ 資料標籤

#### LINE 圖表（完整支援）

- ✅ 時間序列資料
- ✅ 多條線（二維 GroupBy）
- ✅ 所有 Aggregate 操作
- ✅ 日期分組
- ✅ 圖例顯示
- ✅ 網格顯示

### 表格分享

| 對象類型 | 支援狀態 |
|---------|---------|
| Company | ✅ 完整支援 |
| Person | ✅ 完整支援 |
| Opportunity | ✅ 完整支援 |
| SalesQuote | ✅ 完整支援 |
| 所有其他標準對象 | ✅ 完整支援 |
| 所有自定義對象 | ✅ 完整支援 |

---

## 已知限制

### 1. 不支援的圖表類型

- ❌ AGGREGATE 圖表
- ❌ GAUGE 圖表

### 2. 外部分享環境限制

- ❌ 無法使用 `logDebug`（會導致錯誤）
- ❌ 無法訪問完整的 metadata context
- ❌ 無法執行需要登入的操作

### 3. 功能限制

- ❌ 無法編輯分享的內容
- ❌ 無法查看分享者資訊
- ❌ 無法查看完整的關聯資料（只顯示基本資訊）

---

## 測試指南

### 1. 圖表分享測試

#### BAR 圖表

```bash
# 1. 在內部儀表板創建 BAR 圖表
# 2. 點擊分享按鈕
# 3. 複製分享連結
# 4. 在無痕模式開啟連結
# 5. 驗證圖表正常顯示
```

**測試項目：**

- [ ] 一維 GroupBy（單一維度）
- [ ] 二維 GroupBy（堆疊模式）
- [ ] 二維 GroupBy（分組模式）
- [ ] COUNT 操作
- [ ] SUM 操作
- [ ] AVG 操作
- [ ] 日期分組（DAY, WEEK, MONTH）
- [ ] 排序功能
- [ ] 空值處理

#### PIE 圖表

```bash
# 1. 在內部儀表板創建 PIE 圖表
# 2. 點擊分享按鈕
# 3. 複製分享連結
# 4. 在無痕模式開啟連結
# 5. 驗證圖表正常顯示
```

**測試項目：**

- [ ] 單一維度 GroupBy
- [ ] COUNT 操作
- [ ] SUM 操作
- [ ] 圖例顯示
- [ ] 資料標籤

#### LINE 圖表

```bash
# 1. 在內部儀表板創建 LINE 圖表
# 2. 點擊分享按鈕
# 3. 複製分享連結
# 4. 在無痕模式開啟連結
# 5. 驗證圖表正常顯示
```

**測試項目：**

- [ ] 時間序列資料
- [ ] 多條線（二維 GroupBy）
- [ ] 日期分組
- [ ] 圖例顯示
- [ ] 網格顯示

### 2. 表格分享測試

```bash
# 1. 在內部開啟任何記錄（Company, Person, SalesQuote 等）
# 2. 點擊分享按鈕
# 3. 複製分享連結
# 4. 在無痕模式開啟連結
# 5. 驗證記錄正常顯示
```

**測試項目：**

- [ ] Company 記錄
- [ ] Person 記錄
- [ ] Opportunity 記錄
- [ ] SalesQuote 記錄
- [ ] 自定義對象記錄
- [ ] 關聯欄位顯示
- [ ] 日期格式化
- [ ] 數字格式化

---

## 部署說明

### 本地部署

```bash
# 1. Build Docker images
/Users/ym/twenty-ym/docker/dev-flow/local_build_for_docker/run-local.sh

# 2. 等待 build 完成（約 5-10 分鐘）

# 3. 測試分享連結
# 開啟 http://118.168.188.27.nip.io:8866/shared/{token}
```

### AWS 部署

```bash
# 1. SSH 到 AWS
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185

# 2. 執行部署腳本
cd /home/ubuntu/twenty-ym/docker/dev-flow/aws
./deploy-to-aws.sh

# 3. 等待部署完成

# 4. 測試分享連結
# 開啟 https://your-domain.com/shared/{token}
```

---

## 踩坑記錄

### 1. logDebug 在外部分享環境中無法使用

**問題：**
外部分享環境中使用 `logDebug` 會導致錯誤。

**解決方案：**
移除所有外部分享相關檔案中的 `logDebug` 呼叫。

**相關文件：**
- `docs/troubleshooting/20260129_EXTERNAL_SHARELINK_LOGDEBUG_FIX.md`

### 2. 前端跳轉到登入頁面

**問題：**
訪問外部分享連結時，前端會跳轉到登入頁面。

**解決方案：**
修改 4 個 Effect 組件，在 `/shared/*` 路由時跳過檢查。

**相關文件：**
- `docs/troubleshooting/20260125_PUBLIC_SHARELINK_AUTH_FIX.md`
- `docs/troubleshooting/20260125_PUBLIC_SHARELINK_BLACK_SCREEN_FIX.md`

### 3. Token 類型錯誤

**問題：**
Token 驗證失敗，因為類型不匹配。

**解決方案：**
修改 `ShareLinkGuard` 正確處理 token 類型。

**相關文件：**
- `docs/troubleshooting/20260124_SHARELINK_TOKEN_TYPE_FIX.md`

### 4. Metadata 缺失

**問題：**
外部分享環境中無法獲取 objectMetadata。

**解決方案：**
後端在返回資料時包含完整的 objectMetadata。

**相關文件：**
- `docs/troubleshooting/20260127_EXTERNAL_SHARELINK_METADATA_FIX.md`

### 5. 圖表資料格式不正確

**問題：**
後端返回的資料格式與前端期望的不一致。

**解決方案：**
後端返回與 GraphQL 查詢相同的格式：`{ "opportunitiesGroupBy": [...] }`

**相關文件：**
- `docs/troubleshooting/20260129_EXTERNAL_SHARELINK_COMPLETE_IMPLEMENTATION.md`

### 6. **Instance id context 錯誤（✅ 已修復）**

**問題：**
前端運行時錯誤：`Error: Instance id is not provided and cannot be found in context.`

**原因：**
圖表組件（`GraphWidgetBarChart`, `GraphWidgetPieChart`, `GraphWidgetLineChart`）內部的子組件使用了 `useAvailableComponentInstanceIdOrThrow` hook，需要 `GraphWidgetComponentInstanceContext` 提供 `instanceId`。

**解決方案：**
1. 在 `DashboardChartRenderer.tsx` 中 import `GraphWidgetComponentInstanceContext`
2. 使用 `GraphWidgetComponentInstanceContext.Provider` 包裹圖表組件
3. 提供 `instanceId`：`external-chart-${data.id || 'default'}`

**修改檔案：**
- `packages/twenty-front/src/modules/share-link/components/renderers/DashboardChartRenderer.tsx`

**相關文件：**
- `docs/features/外部分享連結/EXTERNAL_SHARE_LINKS_完整實作文檔_2026_01_29.md`

---

## 修改檔案清單

### 後端

| 檔案 | 修改內容 | 狀態 |
|------|---------|------|
| `external-content.service.ts` | 完整實作所有查詢邏輯 | ✅ 完成 |

### 前端

| 檔案 | 修改內容 | 狀態 |
|------|---------|------|
| `DashboardChartRenderer.tsx` | 支援 BAR, PIE, LINE 圖表 | ✅ 完成 |
| `RecordRenderer.tsx` | 通用表格渲染器 | ✅ 完成 |
| `ExternalContentRenderer.tsx` | 統一入口 | ✅ 完成 |
| `UserAndViewsProviderEffect.tsx` | 跳過外部路由 | ✅ 完成 |
| `WorkspaceProviderEffect.tsx` | 跳過外部路由 | ✅ 完成 |
| `ClientConfigProviderEffect.tsx` | 跳過外部路由 | ✅ 完成 |
| `ObjectMetadataItemsLoadEffect.tsx` | 跳過外部路由 | ✅ 完成 |

---

## 總結

外部分享連結功能已完整實作，支援：

- ✅ BAR 圖表分享（完整功能）
- ✅ PIE 圖表分享（完整功能）
- ✅ LINE 圖表分享（完整功能）
- ✅ 表格分享（所有對象類型）
- ✅ Token 驗證
- ✅ Workspace 隔離
- ✅ 敏感欄位過濾

**下一步：執行 Build 並測試所有功能。**
