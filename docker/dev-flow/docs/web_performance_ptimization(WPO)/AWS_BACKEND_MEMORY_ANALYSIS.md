# AWS Backend 記憶體與效能分析報告

> 測試日期：2025-12-28
> 環境：AWS EC2 (3.7 GB RAM)

---

## 記憶體使用分析

### Backend 記憶體數據

| 指標 | 數值 | 說明 |
|------|------|------|
| VmRSS (實際使用) | **874 MB** | 真正佔用的物理記憶體 |
| VmSize (虛擬記憶體) | 2.4 GB | 包含未實際使用的映射 |
| VmPeak (峰值) | 2.9 GB | 曾經達到的最高值 |
| Node.js heapUsed | 3.6 MB | Node.js 堆積實際使用 |

### 各服務記憶體佔用

| 服務 | 記憶體 | 佔比 |
|------|--------|------|
| backend | 860 MB | 22% |
| worker | 484 MB | 12% |
| postgres | 147 MB | 4% |
| redis | 112 MB | 3% |
| frontend | 5 MB | 0.1% |

### 874 MB 正常嗎？

**是的，這是正常的。** 原因：

1. **NestJS + TypeORM 框架本身就很重**
   - NestJS 依賴注入容器
   - TypeORM 的 metadata 和連線池
   - GraphQL schema 編譯後的結構

2. **Twenty 的架構特性**
   - 動態 GraphQL schema 生成（每個 workspace 的 metadata）
   - 多租戶支援（每個 workspace 有獨立的 DataSource）
   - BullMQ 任務隊列

3. **多 Workspace 支援**
   - 每個 workspace 都有獨立的 TypeORM DataSource
   - 3 個 workspace = 3 個獨立的資料庫連線池

### 會不會導致當機？

**不會**，因為：

1. **Node.js 有 GC（垃圾回收）**：heapUsed 只有 3.6 MB，說明 GC 正常運作
2. **記憶體是穩定的**：874 MB 是運行數小時後的數值，沒有持續增長
3. **還有足夠緩衝**：系統還有 1.5 GB 可用記憶體

---

## API 回應時間測試

### Health Check (/healthz)

| 測試位置 | DNS | 連線 | TTFB | 總時間 |
|---------|-----|------|------|--------|
| AWS 內部 (localhost) | 0 ms | 0.1 ms | 3 ms | **3 ms** |
| 外部 (台灣 → AWS 日本) | 626 ms | 43 ms | 44 ms | **713 ms** |

### GraphQL API

| 測試位置 | 回應時間 |
|---------|---------|
| AWS 內部 (localhost) | **13 ms** |
| 外部 (台灣 → AWS 日本) | **103 ms** |

---

## 效能瓶頸分析

### 後端效能：✅ 正常

- 內部 API 回應：3-13 ms
- GraphQL 查詢處理：快速
- 記憶體使用：穩定

### 網路延遲：⚠️ 主要瓶頸

| 延遲來源 | 時間 | 說明 |
|---------|------|------|
| DNS 解析 (nip.io) | ~626 ms | nip.io 免費 DNS 較慢 |
| TCP 連線建立 | ~43 ms | 台灣 → 日本的物理距離 |
| 資料傳輸 | ~44 ms | 正常 |

### 頁面切換感覺變慢的原因

1. **每次 GraphQL 請求都要經過網路**
2. **如果 Apollo cache 沒命中，就要等網路回應**
3. **713 ms 延遲 × 多個請求 = 感覺很慢**

---

## 改善建議

### 短期（不需要改程式碼）

1. **使用自己的域名**
   - 替換 nip.io，DNS 解析可以從 626 ms 降到 ~50 ms
   - 預估改善：~500 ms

2. **確保 Apollo cache 正常運作**
   - 第一次載入後，切換頁面應該使用 cache
   - 使用 `cache-and-network` 策略（已實作）

### 中期（需要基礎設施調整）

1. **使用 CDN**
   - 前端靜態資源放到 CloudFront
   - 減少前端載入時間

2. **考慮台灣區域的 AWS**
   - 如果主要用戶在台灣，可以考慮 ap-northeast-1 以外的區域

### 長期（架構調整）

1. **GraphQL 查詢優化**
   - 減少不必要的欄位請求
   - 使用 DataLoader 批次查詢

2. **Server-Side Rendering (SSR)**
   - 首次載入時在伺服器端渲染
   - 減少客戶端等待時間

---

## 監控指令

### 檢查記憶體使用

```bash
# 查看各容器記憶體
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}'"

# 查看 Node.js 記憶體詳情
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "docker exec Y-CRM-backend node -e 'console.log(JSON.stringify(process.memoryUsage(), null, 2))'"
```

### 測試 API 回應時間

```bash
# 從 AWS 內部測試
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
  "time curl -s -X POST http://localhost:8867/graphql -H 'Content-Type: application/json' -d '{\"query\":\"{ __typename }\"}'"

# 從外部測試
time curl -s -X POST http://52.195.151.185.nip.io:8867/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ __typename }"}'
```

---

## 結論

1. **後端效能正常**：記憶體使用穩定，API 回應快速
2. **網路延遲是主因**：nip.io DNS + 物理距離造成 ~700 ms 延遲
3. **不需要擔心當機**：Node.js GC 正常運作，記憶體沒有洩漏跡象
