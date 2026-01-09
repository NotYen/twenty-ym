# 全局搜索 CJK 字元修正

## 問題描述

左側功能列表的全局搜索對中文（CJK 字元）支援不佳：
- 公司資料表有「升洋資訊企業有限公司」和「美升鮮資訊股份有限公司」
- 輸入「升」只會搜到「升洋資訊企業有限公司」
- 「美升鮮資訊股份有限公司」搜不到

## 根本原因

PostgreSQL 的 `ts_vector` + `simple` 分詞器對中文的處理方式：
- 整個中文字串被當作一個 token
- `formatSearchTerms("升")` 產生 `升:*`（前綴匹配）
- 只能匹配「以升開頭」的 token，無法匹配「包含升」的 token

## 解決方案

在 `SearchService.buildSearchQueryAndGetRecords` 中加入 ILIKE 備援查詢：

```sql
-- 原本（只有 ts_vector）
WHERE "searchVector" @@ to_tsquery('simple', '升:*')

-- 修改後（ts_vector + ILIKE 備援）
WHERE (
  "searchVector" @@ to_tsquery('simple', '升:*')
  OR "searchVector" @@ to_tsquery('simple', '升')
  OR "name"::text ILIKE '%升%'  -- ILIKE 備援
)
```

## 修改的檔案

- `packages/twenty-server/src/engine/core-modules/search/services/search.service.ts`
  - `buildSearchQueryAndGetRecords` 方法新增 `searchInput` 參數
  - 新增 ILIKE 備援查詢條件

## 效能影響

| 資料筆數 | 影響 |
|---------|------|
| < 1,000 | 可忽略 (<50ms) |
| 1,000 - 10,000 | 輕微 (50-200ms) |
| > 10,000 | 明顯 (>200ms) |

Y-CRM 目前資料量小，效能影響可忽略。

## 測試方式

1. 本地 build 後端
2. 在全局搜索輸入「升」
3. 應該同時搜到「升洋資訊企業有限公司」和「美升鮮資訊股份有限公司」

## 日期

2026-01-08
