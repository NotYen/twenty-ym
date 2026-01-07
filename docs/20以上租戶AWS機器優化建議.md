# 20 以上租戶 AWS 機器優化建議

> 最後更新：2024-12-29
> 基於 Twenty 開源專案的多租戶架構分析

---

## 目前 AWS 主機狀況（2024-12-29 檢測）

### 硬體規格

| 項目 | 規格 |
|------|------|
| CPU | Intel Xeon Platinum 8259CL @ 2.50GHz |
| CPU 核心 | **2 核心** |
| 記憶體 | **3.7 GB** |
| 磁碟 | 58 GB（已用 13 GB，22%） |
| 運行時間 | 47 天 |

### 目前資源使用

| 容器 | CPU | 記憶體 | 記憶體佔比 |
|------|-----|--------|-----------|
| Backend | 0.06% | **1.04 GB** | 27.76% |
| Worker | 0.18% | **542 MB** | 14.12% |
| PostgreSQL | 0.69% | 103 MB | 2.68% |
| Redis | 0.70% | 115 MB | 2.98% |
| Frontend | 0.00% | 5 MB | 0.14% |
| **總計** | ~1.6% | **~1.8 GB** | **~48%** |

### 結論

- ✅ CPU 目前很充裕（負載 0.24）
- ⚠️ 記憶體是瓶頸（剩餘 1.1 GB）
- 🔴 **20 租戶同時使用會很卡**

---

## Twenty 多租戶架構說明

### 架構特點

Twenty 採用「**共享程式碼 + 資料隔離**」的多租戶架構：

1. **單一 Backend 實例** 服務所有租戶
2. **PostgreSQL Schema 隔離** - 每個 workspace 有獨立的 schema
3. **連線池共享** - 多租戶共用資料庫連線池
4. **Redis 快取共享** - metadata、GraphQL schema 等共用快取

### 資源消耗模式

| 項目 | 消耗方式 |
|------|----------|
| 記憶體 | 每個活躍用戶增加 GraphQL 連線、快取 |
| CPU | 查詢、聚合運算、背景任務 |
| 資料庫連線 | 每個並發請求佔用連線 |
| Redis | metadata 快取、BullMQ 任務佇列 |

---

## Twenty 內建的效能優化機制

### 1. PostgreSQL 連線池共享

```typescript
// packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts

PG_ENABLE_POOL_SHARING = true      // 啟用連線池共享（預設開啟）
PG_POOL_MAX_CONNECTIONS = 10       // 每個 pool 最大連線數
PG_POOL_IDLE_TIMEOUT_MS = 600000   // 閒置超時 10 分鐘
PG_POOL_ALLOW_EXIT_ON_IDLE = true  // 允許閒置連線退出
```

**原理**：多個租戶共享同一個連線池，而不是每個租戶建立獨立連線。

### 2. 快取策略

```typescript
CACHE_STORAGE_TTL = 604800  // 7 天快取 TTL（秒）
```

快取內容包括：
- Object metadata
- GraphQL schema
- Feature flags
- 翻譯資料

### 3. BullMQ 任務清理

```typescript
// 自動清理機制
removeOnComplete: { age: 24 * 3600, count: 100 }  // 24 小時或 100 筆
removeOnFail: { age: 7 * 24 * 3600, count: 1000 } // 7 天或 1000 筆
```

---

## 建議的環境變數優化

在 `env.aws` 中新增以下設定：

```bash
# ============================================
# PostgreSQL 連線池優化（20+ 租戶建議）
# ============================================
PG_ENABLE_POOL_SHARING=true
PG_POOL_MAX_CONNECTIONS=20          # 預設 10，20 租戶建議調高
PG_POOL_IDLE_TIMEOUT_MS=300000      # 5 分鐘閒置超時（預設 10 分鐘）
PG_POOL_ALLOW_EXIT_ON_IDLE=true

# ============================================
# 快取優化
# ============================================
CACHE_STORAGE_TTL=604800            # 7 天（預設值）

# ============================================
# 效能監控（可選）
# ============================================
# 降低 Sentry 取樣率以減少效能開銷
SENTRY_TRACES_SAMPLE_RATE=0
SENTRY_PROFILES_SAMPLE_RATE=0
```

---

## 硬體升級建議

### 租戶數 vs 建議規格

| 租戶數 | CPU | 記憶體 | AWS 實例類型 | 預估月費 (USD) |
|--------|-----|--------|-------------|---------------|
| 1-5 | 2 核 | 4 GB | t3.medium | ~$30 |
| 5-10 | 2 核 | 8 GB | t3.large | ~$60 |
| **10-20** | **4 核** | **16 GB** | **t3.xlarge** | **~$120** |
| 20-50 | 8 核 | 32 GB | t3.2xlarge | ~$240 |

### 20 租戶建議配置

```
AWS 實例：t3.xlarge
- vCPU: 4
- 記憶體: 16 GB
- 網路: 最高 5 Gbps
- 預估月費: ~$120 USD
```

---

## 進階架構建議（50+ 租戶）

當租戶數超過 50 或有高可用需求時，建議分離服務：

### 架構圖

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (ALB/NLB)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │ Backend 1 │  │ Backend 2 │  │ Backend 3 │
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │  AWS RDS  │  │ElastiCache│  │  Worker   │
        │(PostgreSQL)│  │  (Redis)  │  │ (獨立)    │
        └───────────┘  └───────────┘  └───────────┘
```

### 分離服務的好處

| 服務 | AWS 服務 | 好處 |
|------|----------|------|
| PostgreSQL | RDS | 自動備份、Multi-AZ、效能監控 |
| Redis | ElastiCache | 自動故障轉移、叢集模式 |
| Backend | ECS/EKS | 水平擴展、自動伸縮 |
| Worker | 獨立 ECS Task | 不影響 API 回應時間 |

### 預估成本（50+ 租戶）

| 服務 | 規格 | 預估月費 (USD) |
|------|------|---------------|
| RDS PostgreSQL | db.t3.large | ~$100 |
| ElastiCache Redis | cache.t3.medium | ~$50 |
| ECS Backend x2 | 2 vCPU / 4 GB | ~$120 |
| ECS Worker x1 | 1 vCPU / 2 GB | ~$30 |
| ALB | - | ~$20 |
| **總計** | - | **~$320** |

---

## 監控指令

### 檢查目前資源使用

```bash
# SSH 連線
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185

# 系統負載
uptime

# 記憶體使用
free -h

# Docker 容器資源
docker stats --no-stream

# PostgreSQL 連線數
docker exec Y-CRM-postgres psql -U postgres -d default -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Redis 記憶體
docker exec Y-CRM-redis redis-cli INFO memory | grep used_memory_human

# Redis Keys 數量
docker exec Y-CRM-redis redis-cli DBSIZE
```

### 效能警示閾值

| 指標 | 警示閾值 | 危險閾值 |
|------|----------|----------|
| CPU 使用率 | > 70% | > 90% |
| 記憶體使用率 | > 80% | > 95% |
| PostgreSQL 連線數 | > 80 | > 95 |
| Redis 記憶體 | > 500 MB | > 1 GB |
| 系統負載 | > 核心數 | > 核心數 x 2 |

---

## 升級步驟

### 方案 A：原地升級實例類型

1. 在 AWS Console 停止 EC2 實例
2. 變更實例類型（例如 t3.medium → t3.xlarge）
3. 啟動實例
4. 驗證服務正常

```bash
# 驗證服務
docker compose -f docker-compose.aws.yml ps
docker compose -f docker-compose.aws.yml logs -f backend
```

### 方案 B：遷移到新實例

1. 建立新的 EC2 實例（較大規格）
2. 安裝 Docker 環境
3. 備份並遷移 PostgreSQL 資料
4. 部署應用程式
5. 更新 DNS/IP 指向
6. 驗證後關閉舊實例

---

## 總結

| 目前狀況 | 建議行動 |
|----------|----------|
| 2 核 / 3.7 GB | 升級到 4 核 / 16 GB |
| 無連線池優化設定 | 新增 `PG_POOL_*` 環境變數 |
| 單機部署 | 20+ 租戶考慮分離服務 |

**立即可做**：
1. 新增環境變數優化設定
2. 升級 EC2 實例類型

**未來規劃**：
1. 分離 PostgreSQL 到 RDS
2. 分離 Redis 到 ElastiCache
3. Backend 水平擴展
