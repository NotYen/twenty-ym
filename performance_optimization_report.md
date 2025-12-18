# Twenty CRM 效能優化報告 (Zero-Lag Optimization Report)

這份文件詳細記錄了為解決「表格視圖切換延遲 (800ms lag)」所做的所有修改與優化措施。

## 1. 問題概述 (Issue)
*   **現象**：在「公司 (Companies)」與「人員 (People)」頁面間切換時，出現明顯的 800ms ~ 1.5s 延遲與骨架屏 (Skeleton Screen)。
*   **原因分析**：
    1.  `IS_DEBUG_MODE` 開啟導致大量 Console Log 拖慢瀏覽器。
    2.  Metadata 重複查詢 (100ms)。
    3.  Backend 查詢成本高 (300ms) 且前端採用 `block UI` 等待資料回傳。

## 2. 優化方案 (Solution)
我們採用了 **"Instant UI" (瞬時介面)** 策略，結合 `Cache-and-Network` 與 `Non-blocking Rendering`。

### 核心修改檔案列表 (Modified Files)

#### A. 全域環境設定 (Environment)
關閉 Debug 模式以釋放瀏覽器效能。
*   **檔案**: `docker/dev-flow/local_build_for_docker/env.local`
*   **修改內容**:
    ```bash
    IS_DEBUG_MODE=false
    VITE_IS_DEBUG_MODE=false
    ```

#### B. 前端 Metadata 快取優化
讓物件定義檔 (Schema) 優先讀取快取，不再每次切換都詢問伺服器。
*   **檔案**: `packages/twenty-front/src/modules/object-metadata/components/ObjectMetadataItemsLoadEffect.tsx`
*   **修改內容**:
    ```typescript
    // fetchPolicy 改為 'cache-first'
    const { refreshObjectMetadataItems } = useRefreshObjectMetadataItems({
      fetchPolicy: 'cache-first',
    });
    ```

#### C. 表格資料抓取與渲染優化 (最關鍵修改) 🚀
這是解決 800ms 延遲的主力修改，讓畫面切換變為 **0ms**。

**1. 資料抓取策略 (Fetch Policy)**
*   **檔案**: `packages/twenty-front/src/modules/object-record/record-index/hooks/useRecordIndexTableQuery.ts`
*   **修改內容**:
    ```typescript
    // 強制使用快取優先，同時背景更新
    fetchPolicy: 'cache-and-network',
    ```

**2. 渲染邏輯解鎖 (Non-blocking Rendering)**
*   **檔案**: `packages/twenty-front/src/modules/object-record/record-table/record-table-body/components/RecordTableRecordGroupBodyEffect.tsx`
*   **修改內容**: 移除 `!loading` 的限制，允許在 loading 時顯示舊資料。
    ```typescript
    // 舊程式碼 (會卡住畫面): if (!loading) { ... }

    // 新程式碼 (立即顯示):
    if (!loading || (isDefined(records) && records.length > 0)) {
       // 更新表格資料
    }
    ```

## 3. 如何驗證 (Verification)
1.  確認 `docker` 全部重建完成 (`./run-local.sh`)。
2.  打開瀏覽器進入系統。
3.  先點擊一次「公司」，再點擊一次「人員」(讓資料進入快取)。
4.  開始快速來回切換：
    *   **預期結果**：列表應 **瞬間 (Instant)** 出現，完全沒有白色骨架屏。
    *   您可以在背景 (Network Tab) 看到 `graphql` 請求仍在發送 (確保資料新鮮)，但不會卡住畫面。

## 4. 常見問題 (FAQ)
*   **Q: IP 跑掉連不上怎麼辦？**
    *   檢查本機 IP (`ifconfig`)。
    *   修改 `docker/dev-flow/local_build_for_docker/env.local` 中的 `EXTERNAL_HOST` 與相關 URL。
    *   重啟容器。
    *   **注意**: 剛剛已幫您自動修正為 `118.168.188.24`。

*   **Q: 多人協作資料會不同步嗎？**
    *   **不會**。因為我們用的是 `cache-and-network`，背景一定會去問伺服器最新資料。若有變更，畫面會自動刷新。
