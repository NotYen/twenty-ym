# AWS 系統效能分析指南

## 概述

本文檔說明如何分析 Y-CRM 在 AWS 上的系統效能與運行狀態。

當你說「請幫我分析一下 AWS 環境目前系統效能運行狀態」時，需要執行以下檢查項目。

---

## 快速檢查指令

### 一鍵檢查腳本

SSH 到 AWS 後執行：

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
```

然後執行以下完整檢查：

```bash
echo "=========================================="
echo "Y-CRM AWS 系統效能分析報告"
echo "=========================================="
echo ""

echo "=== 1. 系統資源 ==="
echo "--- 記憶體 ---"
free -h
echo ""
echo "--- 磁碟 ---"
df -h /
echo ""
echo "--- 系統負載 ---"
uptime
echo ""

echo "=== 2. Docker 容器狀態 ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo ""

echo "=== 3. 容器資源使用 ==="
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}'
echo ""

echo "=== 4. CRON Jobs 數量 ==="
CRON_COUNT=$(docker exec Y-CRM-redis redis-cli KEYS 'bull:cron-queue:repeat:*' | wc -l)
echo "CRON Jobs: ${CRON_COUNT} 個"
echo ""

echo "=== 5. Redis 狀態 ==="
docker exec Y-CRM-redis redis-cli INFO memory | grep -E 'used_memory_human|mem_fragmentation_ratio'
docker exec Y-CRM-redis redis-cli INFO stats | grep instantaneous_ops_per_sec
echo ""

echo "=== 6. PostgreSQL 連線數 ==="
docker exec Y-CRM-postgres psql -U postgres -d default -c "SELECT count(*) as total_connections FROM pg_stat_activity;" -t
echo ""

echo "=== 7. 網路回應時間 ==="
echo "healthz:"
curl -s -o /dev/null -w 'Total: %{time_total}s\n' https://y-crm.youngming-mes.com/healthz
echo "GraphQL:"
curl -s -o /dev/null -w 'Total: %{time_total}s\n' https://y-crm.youngming-mes.com/graphql
echo ""

echo "=== 8. 最近錯誤日誌 ==="
docker logs Y-CRM-backend --tail 50 2>&1 | grep -iE 'error|warn|fail' | tail -5 || echo "無錯誤"
echo ""

echo "=========================================="
echo "分析完成"
echo "=========================================="
```

---

## 詳細檢查項目

### 1. 系統資源

```bash
# 記憶體使用
free -h

# 磁碟使用
df -h /

# 系統負載
uptime
```

**健康標準：**
| 指標 | 健康範圍 | 警告範圍 |
|------|---------|---------|
| 記憶體使用率 | < 70% | > 85% |
| 磁碟使用率 | < 70% | > 85% |
| 系統負載 | < 2.0 | > 4.0 |

---

### 2. Docker 容器狀態

```bash
# 查看所有容器
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# 查看容器資源使用
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}'
```

**預期狀態：**
| 容器 | 狀態 | 記憶體 |
|------|------|--------|
| Y-CRM-frontend | Up | < 50MB |
| Y-CRM-backend | Up | 400-600MB |
| Y-CRM-worker | Up | 400-600MB |
| Y-CRM-postgres | Up | 50-200MB |
| Y-CRM-redis | Up | 50-100MB |

---

### 3. CRON Jobs 檢查

```bash
# 總數量
docker exec Y-CRM-redis redis-cli KEYS 'bull:cron-queue:repeat:*' | wc -l

# 按類型統計
docker exec Y-CRM-redis redis-cli KEYS 'bull:cron-queue:repeat:*' | sed 's/:1[0-9]*$//' | sort | uniq -c | sort -rn
```

**說明：**
- 正常數量：800-1500 個
- BullMQ 會預先排程未來的執行時間點
- 每個時間點都是一個獨立的 key

**主要 Job 類型：**
| Job 名稱 | 說明 | 頻率 |
|---------|------|------|
| MessagingMessagesImportCronJob | 郵件同步 | 每 4 分鐘 |
| CalendarEventsImportCronJob | 日曆同步 | 每 4 分鐘 |
| WorkflowCronTriggerCronJob | 工作流觸發 | 每 4 分鐘 |
| CronTriggerCronJob | 一般 CRON | 每 4 分鐘 |

---

### 4. Redis 效能

```bash
# 記憶體使用
docker exec Y-CRM-redis redis-cli INFO memory | grep -E 'used_memory_human|maxmemory_human|mem_fragmentation'

# 操作統計
docker exec Y-CRM-redis redis-cli INFO stats | grep -E 'total_connections|instantaneous_ops'
```

**健康標準：**
| 指標 | 健康範圍 | 說明 |
|------|---------|------|
| used_memory_human | < 500MB | 記憶體使用 |
| mem_fragmentation_ratio | 1.0-1.5 | 碎片率，> 1.5 需注意 |
| instantaneous_ops_per_sec | < 1000 | 每秒操作數 |

---

### 5. PostgreSQL 效能

```bash
# 連線數
docker exec Y-CRM-postgres psql -U postgres -d default -c "SELECT count(*) as total FROM pg_stat_activity;"

# 活躍連線
docker exec Y-CRM-postgres psql -U postgres -d default -c "SELECT count(*) as active FROM pg_stat_activity WHERE state = 'active';"

# 資料庫大小
docker exec Y-CRM-postgres psql -U postgres -d default -c "SELECT pg_size_pretty(pg_database_size('default'));"
```

**健康標準：**
| 指標 | 健康範圍 | 警告範圍 |
|------|---------|---------|
| 總連線數 | < 50 | > 80 |
| 活躍連線 | < 10 | > 20 |

---

### 6. 網路回應時間

```bash
# healthz（健康檢查）
curl -s -o /dev/null -w 'DNS: %{time_namelookup}s | Connect: %{time_connect}s | TLS: %{time_appconnect}s | Total: %{time_total}s\n' https://y-crm.youngming-mes.com/healthz

# GraphQL
curl -s -o /dev/null -w 'DNS: %{time_namelookup}s | Connect: %{time_connect}s | TLS: %{time_appconnect}s | Total: %{time_total}s\n' https://y-crm.youngming-mes.com/graphql
```

**健康標準：**
| 端點 | 健康範圍 | 警告範圍 |
|------|---------|---------|
| healthz | < 100ms | > 500ms |
| GraphQL | < 500ms | > 1000ms |

---

### 7. 錯誤日誌檢查

```bash
# Backend 錯誤
docker logs Y-CRM-backend --tail 100 2>&1 | grep -iE 'error|warn|fail'

# Worker 錯誤
docker logs Y-CRM-worker --tail 100 2>&1 | grep -iE 'error|warn|fail'

# Nginx 錯誤
sudo tail -50 /var/log/nginx/error.log
```

---

### 8. Nginx 效能優化檢查

```bash
# 檢查 Gzip 是否啟用
sudo nginx -T 2>/dev/null | grep -E 'gzip|ssl_session'

# 檢查 Gzip 是否生效
curl -s -I -H "Accept-Encoding: gzip" https://y-crm.youngming-mes.com | grep -i content-encoding
```

**預期結果：**
- `gzip on;` 應該出現
- `content-encoding: gzip` 應該出現

---

## 效能評估標準

### 整體評分標準

| 評分 | 說明 |
|------|------|
| ⭐⭐⭐⭐⭐ | 優秀，無需調整 |
| ⭐⭐⭐⭐☆ | 良好，可選優化 |
| ⭐⭐⭐☆☆ | 一般，建議優化 |
| ⭐⭐☆☆☆ | 較差，需要優化 |
| ⭐☆☆☆☆ | 危險，立即處理 |

### 各項目評分參考

| 項目 | 優秀 | 良好 | 一般 | 較差 |
|------|------|------|------|------|
| 記憶體使用率 | < 50% | 50-70% | 70-85% | > 85% |
| 磁碟使用率 | < 50% | 50-70% | 70-85% | > 85% |
| 系統負載 | < 1.0 | 1.0-2.0 | 2.0-4.0 | > 4.0 |
| healthz 回應 | < 50ms | 50-100ms | 100-500ms | > 500ms |
| Redis 碎片率 | < 1.2 | 1.2-1.5 | 1.5-2.0 | > 2.0 |

---

## AWS 機器升級指南

### 升級步驟（例如 t3.medium → t3.large）

1. **停止 EC2 實例**
   - AWS Console → EC2 → Instances
   - 選擇實例 → Instance state → Stop instance

2. **變更實例類型**
   - Actions → Instance settings → Change instance type
   - 選擇新的實例類型
   - 確認

3. **啟動實例**
   - Instance state → Start instance

4. **驗證服務**
   ```bash
   ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
   docker ps
   curl https://y-crm.youngming-mes.com/healthz
   ```

### 實例類型比較

| 類型 | vCPU | 記憶體 | 價格/小時 | 適用場景 |
|------|------|--------|----------|---------|
| t3.small | 2 | 2GB | $0.0208 | 測試環境 |
| t3.medium | 2 | 4GB | $0.0416 | 小型生產（目前） |
| t3.large | 2 | 8GB | $0.0832 | 中型生產 |
| t3.xlarge | 4 | 16GB | $0.1664 | 大型生產 |

### 注意事項

| 項目 | 說明 |
|------|------|
| **IP 地址** | 使用 Elastic IP 則不變，否則會換新 IP |
| **資料** | EBS 磁碟資料完全保留 |
| **停機時間** | 約 5-10 分鐘 |
| **Docker** | 設定 `restart: unless-stopped`，會自動啟動 |

---

## 常見問題

### Q1: CRON Jobs 數量為什麼這麼多（1000+）？

這是正常的！BullMQ 會預先排程未來的執行時間點，每個時間點都是一個獨立的 Redis key。

### Q2: 什麼時候需要升級機器？

| 指標 | 建議升級 |
|------|---------|
| 記憶體使用率 | 持續 > 80% |
| 系統負載 | 持續 > 2.0 |
| 回應時間 | healthz > 500ms |

### Q3: 如何清理磁碟空間？

```bash
# 清理未使用的 Docker images
docker image prune -af

# 清理 journal logs
sudo journalctl --vacuum-time=7d

# 查看大檔案
sudo du -sh /var/log/*
```

---

## 切換租戶效能分析

### 為什麼切換租戶會比較慢？

切換租戶（不同 subdomain）時會感覺卡頓，這是**正常行為**，原因如下：

#### 1. 不同 subdomain = 不同 origin
```
calleen-company.y-crm.youngming-mes.com
                    ↓
youngming.y-crm.youngming-mes.com  ← 瀏覽器視為不同網站
```

#### 2. 瀏覽器安全機制
- 不同 origin 無法共用快取
- 需要重新載入所有資源

#### 3. 切換時的請求流程
```
1. 重新建立 TLS 連線（~90ms）
2. 載入 HTML（~130ms）
3. 載入 JS bundle（~200ms，有快取會快）
4. 載入 metadata（~500ms，56KB）
5. 載入 GraphQL schema
6. 載入使用者資料
7. 載入列表資料
總計：2-5 秒
```

### 這是正常的嗎？

**是的！** 這是 Twenty 多租戶架構的設計：
- 每個租戶用不同 subdomain
- 瀏覽器安全機制不允許跨 origin 共用資料
- 這是業界標準做法（Slack、Notion 也是這樣）

### 升級機器有用嗎？

**沒有用！** 瓶頸在網路延遲，不是伺服器效能。

---

## CDN 優化方案（未來參考）

如果覺得切換租戶太慢，可以考慮使用 CDN 加速靜態資源。

### 什麼是 CDN？

CDN（內容分發網路）在全球有多個邊緣節點，可以快取靜態資源。

```
目前架構：
用戶（台灣）→ 日本 AWS EC2 → 回應
延遲：~130ms

使用 CDN 後：
用戶（台灣）→ 台灣邊緣節點 → 快取命中 → 回應
延遲：~10-20ms（靜態資源）
```

### 哪些資源可以快取？

| 資源類型 | 可快取？ | 大小 | 說明 |
|---------|---------|------|------|
| **JS Bundle** | ✅ 可以 | ~2-5MB | 檔名有 hash，永久快取 |
| **CSS** | ✅ 可以 | ~200KB | 檔名有 hash |
| **圖片/字型** | ✅ 可以 | ~500KB | 靜態資源 |
| **HTML** | ⚠️ 短期 | ~10KB | 需要較短 TTL |
| **/metadata** | ❌ 不行 | ~56KB | 動態 API，每租戶不同 |
| **/graphql** | ❌ 不行 | 變動 | 動態 API |

**約 70% 的首次載入流量可以快取**

### 預估效能改善

| 場景 | 目前 | 使用 CDN 後 | 改善 |
|------|------|------------|------|
| **首次載入** | 3-5 秒 | 2-3 秒 | 快 40% |
| **切換租戶** | 2-4 秒 | 1-2 秒 | 快 50% |
| **同租戶內切換** | 0.5-1 秒 | 0.3-0.5 秒 | 快 40% |

### 方案比較

| 方案 | 費用 | 效果 | 複雜度 | 建議 |
|------|------|------|--------|------|
| **Cloudflare** | 免費 | 快 40-50% | 低 | ⭐⭐ 推薦 |
| **CloudFront** | $0-50/月 | 快 40-50% | 中 | ⭐ 可考慮 |
| **升級 EC2** | +$30/月 | 無效果 | 低 | ❌ 不建議 |
| **不做改動** | $0 | 維持現狀 | 無 | ✅ 可接受 |

### Cloudflare vs CloudFront

| 項目 | Cloudflare | CloudFront |
|------|------------|------------|
| **費用** | 免費方案夠用 | 免費額度內 $0 |
| **設定複雜度** | 較簡單 | 較複雜 |
| **SSL** | 自動處理 | 需要 ACM |
| **DNS** | 需要轉移 DNS | 不需要 |
| **台灣節點** | 有 | 有 |
| **與 AWS 整合** | 一般 | 優秀 |

### CloudFront 費用估算

#### 免費額度（每月）
- 1TB 資料傳輸
- 10,000,000 HTTP/HTTPS 請求

#### 超出免費額度後
| 項目 | 費用 |
|------|------|
| 資料傳輸（亞太區） | $0.14/GB |
| HTTPS 請求 | $0.0125/10,000 請求 |

#### 使用量估算（100 用戶/天）
```
每月流量 = 100 × 50 × 3MB × 30 = 450GB
每月請求 = 100 × 50 × 20 × 30 = 3,000,000 請求

預估月費：$0（在免費額度內）
```

### CloudFront 設定注意事項

1. **SSL 憑證**
   - 需要用 ACM（AWS Certificate Manager）憑證
   - 必須在 **us-east-1** 區域申請
   - Let's Encrypt 憑證不能直接用

2. **萬用字元域名**
   - 需要申請 `*.y-crm.youngming-mes.com` 的 ACM 憑證
   - 需要 DNS 驗證

3. **快取失效**
   - 部署新版本後需要清除 CloudFront 快取
   - 或者用檔名 hash（目前已有）

4. **WebSocket**
   - GraphQL subscription 用 WebSocket
   - CloudFront 支援，但需要特別設定

### 建議時程

| 階段 | 建議 |
|------|------|
| **短期（現在）** | 不需要做任何改動，目前效能可接受 |
| **中期（如果覺得慢）** | 考慮 Cloudflare（免費、設定簡單、順便解決 SSL 自動續約） |
| **長期（用戶量增加）** | 考慮 CloudFront（與 AWS 整合更好） |

---

## 相關文檔

- [SSL_DNS_設定指南.md](./SSL_DNS_設定指南.md)
- [REDIS_FLUSHALL_CRON_JOBS_問題.md](./troubleshooting/REDIS_FLUSHALL_CRON_JOBS_問題.md)
