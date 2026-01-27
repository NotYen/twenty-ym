# AWS 監控系統總覽

## 概述

本文檔整合 Y-CRM 在 AWS 上的所有監控系統，包括自訂監控、CloudWatch、外部監控等，確保系統穩定運行並即時通知異常。

**設定完成日期**：2026-01-27

---

## 監控架構

Y-CRM 採用三層監控架構，全面覆蓋系統健康狀態：

```
┌─────────────────────────────────────────────────────────────┐
│                    第一層：自訂監控（Lark 通知）                │
│  - SSL 憑證到期監控（每週一 06:00）                            │
│  - 系統資源監控（每天 06:00）                                  │
│  - 記憶體、磁碟、容器狀態、Docker 空間                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 第二層：AWS CloudWatch（免費）                 │
│  - CPU 使用率                                                 │
│  - 網路流入/流出                                              │
│  - 自動收集，無需設定                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                第三層：外部監控（UptimeRobot）                 │
│  - 網站可用性監控（每 5 分鐘）                                 │
│  - Email 通知                                                 │
│  - 零效能影響                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 第一層：自訂監控（Lark 通知）

### 1. SSL 憑證監控

自動監控 SSL 憑證到期日，在到期前 15 天開始透過 Lark 發送提醒。

| 項目 | 說明 |
|------|------|
| **監控腳本** | `/opt/ssl-monitor/check-ssl-lark.sh` |
| **檢查頻率** | 每週一早上 06:00 (UTC+8) |
| **通知方式** | Lark Webhook |
| **Lark Webhook** | `https://open.larksuite.com/open-apis/bot/v2/hook/0058c3ec-acab-4d43-ad5e-b4647d0c7478` |
| **提醒時間** | 到期前 15 天 |
| **日誌位置** | `/var/log/ssl-monitor.log` |
| **Cron Job** | `/etc/cron.d/ssl-monitor` |

#### 憑證資訊

- **域名**：`y-crm.youngming-mes.com`、`*.y-crm.youngming-mes.com`
- **憑證類型**：Let's Encrypt（免費）
- **憑證到期日**：2026-04-01
- **剩餘天數**：64 天（截至 2026-01-27）

#### 通知等級

| 剩餘天數 | 顏色 | 圖示 | 說明 |
|---------|------|------|------|
| > 15 天 | - | - | 不發送通知 |
| 8-15 天 | 🟡 黃色 | ⏰ | 提醒：請準備續約 |
| 4-7 天 | 🟠 橙色 | ⚠️ | 警告：請盡快續約 |
| ≤ 3 天 | 🔴 紅色 | 🚨 | 緊急：立即續約！ |

#### 手動檢查

```bash
# SSH 到 AWS
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185

# 手動執行檢查
sudo /opt/ssl-monitor/check-ssl-lark.sh

# 查看日誌
sudo tail -20 /var/log/ssl-monitor.log
```

#### 詳細文件

參考：`docs/features/AWS_SSL_DNS_設定指南.md`

---

### 2. 系統資源監控

自動監控系統關鍵資源，發現問題時立即透過 Lark 通知。

| 項目 | 說明 |
|------|------|
| **監控腳本** | `/opt/system-monitor/check-system-lark.sh` |
| **檢查頻率** | 每天早上 06:00 (UTC+8) |
| **通知方式** | Lark Webhook |
| **Lark Webhook** | `https://open.larksuite.com/open-apis/bot/v2/hook/858a8764-595c-438f-bc87-0e7e892b3440` |
| **日誌位置** | `/var/log/system-monitor.log` |
| **Cron Job** | `/etc/cron.d/system-monitor` |

#### 監控項目

| 監控項目 | 警告門檻 | 影響 | 優先級 |
|---------|---------|------|--------|
| 🔴 **記憶體使用率** | > 85% | 系統變慢或當機 | 緊急 |
| 🔴 **磁碟使用率** | > 85% | 無法寫入資料 | 緊急 |
| 🔴 **容器異常停止** | > 0 個 | 服務中斷 | 緊急 |
| 🟡 **Docker 可回收空間** | > 8 GB | 建議清理 | 一般 |

#### 通知等級

| 情況 | 顏色 | 圖示 | 說明 |
|------|------|------|------|
| 記憶體/磁碟 > 85% 或容器停止 | 🔴 紅色 | 🚨 | 緊急警告 - 立即處理 |
| Docker 可回收 > 8 GB | 🟠 橙色 | ⚠️ | 建議清理 - 有空處理 |
| 一切正常 | - | - | 不發送通知 |

#### 手動檢查

```bash
# SSH 到 AWS
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185

# 手動執行檢查
sudo /opt/system-monitor/check-system-lark.sh

# 查看日誌
sudo tail -50 /var/log/system-monitor.log
```

#### 詳細文件

參考：`docs/features/AWS_系統監控指南.md`

---

## 第二層：AWS CloudWatch（免費）

AWS 自動提供的基本監控，無需額外設定。

### 監控項目

| 項目 | 說明 | 費用 |
|------|------|------|
| **CPU 使用率** | EC2 實例 CPU 使用百分比 | 免費 |
| **網路流入** | 進入 EC2 的網路流量 | 免費 |
| **網路流出** | 離開 EC2 的網路流量 | 免費 |

### 查看方式

1. 前往 AWS Console → CloudWatch
2. 點擊左側 Dashboards
3. 選擇你建立的 Dashboard
4. 查看即時圖表

### 特點

- ✅ 完全免費（基本監控）
- ✅ 自動收集，無需設定
- ✅ 5 分鐘更新一次
- ✅ 可設定警報（需額外設定）

---

## 第三層：外部監控（UptimeRobot）

從外部監控網站可用性，確保用戶可以正常訪問。

### 監控資訊

| 項目 | 說明 |
|------|------|
| **服務** | UptimeRobot（免費版） |
| **監控 URL** | `https://y-crm.youngming-mes.com` |
| **檢查頻率** | 每 5 分鐘 |
| **通知方式** | Email |
| **免費額度** | 50 個監控 |

### 設定步驟

1. 前往 [UptimeRobot](https://uptimerobot.com/) 註冊帳號（免費）
2. 點擊 Add New Monitor
3. 填寫資訊：
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Y-CRM Production`
   - URL: `https://y-crm.youngming-mes.com`
   - Monitoring Interval: `5 minutes`
4. 點擊 Create Monitor
5. 設定 Email 通知（預設已啟用）

### 特點

- ✅ 完全免費（50 個監控額度）
- ✅ 零效能影響（外部監控）
- ✅ 不會拖慢系統速度
- ✅ 不影響用戶體驗
- ✅ 每 5 分鐘檢查一次
- ✅ Email 即時通知

### 通知內容

當網站無法訪問時，UptimeRobot 會發送 Email：

```
Subject: Y-CRM Production is DOWN

Your monitor "Y-CRM Production" is DOWN.
URL: https://y-crm.youngming-mes.com
Reason: Connection timeout
Time: 2026-01-27 10:30:00 UTC
```

---

## 監控覆蓋率分析

### 完整覆蓋的監控項目

| 監控項目 | 監控方式 | 檢查頻率 | 通知方式 |
|---------|---------|---------|---------|
| ✅ SSL 憑證到期 | 自訂腳本 | 每週一 06:00 | Lark |
| ✅ 記憶體使用率 | 自訂腳本 | 每天 06:00 | Lark |
| ✅ 磁碟使用率 | 自訂腳本 | 每天 06:00 | Lark |
| ✅ 容器狀態 | 自訂腳本 | 每天 06:00 | Lark |
| ✅ Docker 空間 | 自訂腳本 | 每天 06:00 | Lark |
| ✅ CPU 使用率 | CloudWatch | 每 5 分鐘 | Dashboard |
| ✅ 網路流量 | CloudWatch | 每 5 分鐘 | Dashboard |
| ✅ 網站可用性 | UptimeRobot | 每 5 分鐘 | Email |

### 不需要監控的項目

| 項目 | 原因 |
|------|------|
| CRON Jobs 數量 | 已經很穩定，不需要監控 |
| API 效能 | 已經優化過，表現良好 |
| 資料庫連線數 | 正常運作中，不需要監控 |

---

## 效能影響分析

### 自訂監控（極低影響）

| 監控 | 執行頻率 | 執行時間 | 系統負載增加 |
|------|---------|---------|-------------|
| SSL 監控 | 每週 1 次 | < 3 秒 | < 0.0001% |
| 系統監控 | 每天 1 次 | < 3 秒 | < 0.001% |
| **總計** | - | < 6 秒/天 | < 0.001% |

### CloudWatch（零影響）

- AWS 自動收集，不佔用 EC2 資源
- 完全免費，無額外費用

### UptimeRobot（零影響）

- 外部監控，不佔用 AWS 資源
- 完全免費，無額外費用
- 不會拖慢系統速度
- 不影響用戶體驗

### 結論

✅ 所有監控系統加起來，系統負載增加 < 0.001%
✅ 完全不會影響用戶體驗
✅ 完全不會拖慢系統速度

---

## 費用分析

| 監控系統 | 費用 | 說明 |
|---------|------|------|
| SSL 監控 | 免費 | 自訂腳本 |
| 系統監控 | 免費 | 自訂腳本 |
| CloudWatch 基本監控 | 免費 | AWS 提供 |
| UptimeRobot | 免費 | 50 個監控額度 |
| **總計** | **$0/月** | 完全免費 |

---

## 監控時間表

| 時間 | 監控項目 | 說明 |
|------|---------|------|
| **每週一 06:00 (UTC+8)** | SSL 憑證檢查 | 到期前 15 天開始通知 |
| **每天 06:00 (UTC+8)** | 系統資源檢查 | 記憶體、磁碟、容器、Docker |
| **每 5 分鐘** | CloudWatch 更新 | CPU、網路流量 |
| **每 5 分鐘** | UptimeRobot 檢查 | 網站可用性 |

---

## 手動檢查指令

### SSL 憑證狀態

```bash
# SSH 到 AWS
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185

# 查看憑證資訊
sudo certbot certificates

# 手動執行 SSL 監控
sudo /opt/ssl-monitor/check-ssl-lark.sh

# 查看 SSL 監控日誌
sudo tail -20 /var/log/ssl-monitor.log
```

### 系統資源狀態

```bash
# SSH 到 AWS
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185

# 手動執行系統監控
sudo /opt/system-monitor/check-system-lark.sh

# 查看系統監控日誌
sudo tail -50 /var/log/system-monitor.log

# 查看記憶體使用率
free -h

# 查看磁碟使用率
df -h

# 查看容器狀態
docker ps -a

# 查看 Docker 空間
docker system df
```

### CloudWatch 查看

1. 前往 AWS Console → CloudWatch
2. 點擊左側 Dashboards
3. 選擇你的 Dashboard
4. 查看即時圖表

### UptimeRobot 查看

1. 前往 [UptimeRobot Dashboard](https://uptimerobot.com/dashboard)
2. 查看監控狀態
3. 查看歷史記錄

---

## 通知範例

### SSL 憑證提醒（Lark）

```
⏰ SSL 憑證監控 - 提醒

📋 憑證資訊
域名: y-crm.youngming-mes.com, *.y-crm.youngming-mes.com
到期日: 2026-04-01
剩餘天數: 12 天

⚠️ 請在 2026-03-15 之前更新 SSL 憑證

📖 完整續約步驟（10 步驟）：
1. SSH 連線到 AWS
2. 執行 Certbot 續約指令
3. 設定第一個 DNS TXT 記錄
...

詳細文件: docs/features/AWS_SSL_DNS_設定指南.md
```

### 系統資源警告（Lark）

```
🚨 系統監控 - 緊急警告

📊 系統狀態
🔴 記憶體使用率過高: 87% (建議 < 85%)

📈 詳細資訊
- 記憶體使用率: 87%
- 磁碟使用率: 45%
- 異常容器數: 0
- Docker 可回收: 5 GB

🔧 記憶體過高解決方案:
1. 重啟 Backend 和 Worker 容器
```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
cd /home/ubuntu
docker compose -f docker-compose.aws.yml restart backend worker
```

詳細文件: docs/features/AWS_系統監控指南.md
```

### 網站無法訪問（Email）

```
Subject: Y-CRM Production is DOWN

Your monitor "Y-CRM Production" is DOWN.
URL: https://y-crm.youngming-mes.com
Reason: Connection timeout
Time: 2026-01-27 10:30:00 UTC

Please check your server immediately.
```

---

## 故障排除

### SSL 監控沒有執行

```bash
# 檢查 Cron Job 設定
cat /etc/cron.d/ssl-monitor

# 確認 Cron 服務運行中
sudo systemctl status cron

# 手動執行測試
sudo /opt/ssl-monitor/check-ssl-lark.sh
```

### 系統監控沒有執行

```bash
# 檢查 Cron Job 設定
cat /etc/cron.d/system-monitor

# 確認 Cron 服務運行中
sudo systemctl status cron

# 手動執行測試
sudo /opt/system-monitor/check-system-lark.sh
```

### Lark 通知沒有收到

1. 確認 Webhook URL 正確
2. 手動執行腳本測試
3. 查看日誌檔案確認是否有錯誤
4. 確認 Lark 群組機器人沒有被移除

### UptimeRobot 沒有通知

1. 確認 Email 設定正確
2. 檢查垃圾郵件資料夾
3. 確認監控狀態為 Active

---

## 未來擴展建議

### 可選的進階監控（需評估必要性）

| 監控項目 | 工具 | 費用 | 說明 |
|---------|------|------|------|
| 應用程式效能監控 (APM) | New Relic / Datadog | 付費 | 追蹤 API 效能、錯誤率 |
| 日誌聚合 | ELK Stack / Loki | 免費/付費 | 集中管理所有日誌 |
| 資料庫效能監控 | pganalyze | 付費 | PostgreSQL 深度分析 |
| 安全監控 | AWS GuardDuty | 付費 | 偵測異常活動 |

### 建議

目前的監控系統已經足夠，除非遇到以下情況才需要擴展：

- 用戶數量 > 1000
- 每日 API 請求 > 100 萬次
- 需要深度效能分析
- 需要符合特定合規要求

---

## 相關檔案

### 文件

- SSL 和 DNS 設定：`docs/features/AWS_SSL_DNS_設定指南.md`
- 系統監控詳細說明：`docs/features/AWS_系統監控指南.md`
- 開發規則：`.kiro/steering/rules.md`

### AWS 上的檔案

- SSL 監控腳本：`/opt/ssl-monitor/check-ssl-lark.sh`
- SSL 監控 Cron：`/etc/cron.d/ssl-monitor`
- SSL 監控日誌：`/var/log/ssl-monitor.log`
- 系統監控腳本：`/opt/system-monitor/check-system-lark.sh`
- 系統監控 Cron：`/etc/cron.d/system-monitor`
- 系統監控日誌：`/var/log/system-monitor.log`

---

## 總結

✅ **三層監控架構**：自訂監控 + CloudWatch + 外部監控
✅ **全面覆蓋**：SSL、系統資源、CPU、網路、網站可用性
✅ **即時通知**：Lark + Email，發現問題立即通知
✅ **零費用**：所有監控完全免費
✅ **極低影響**：系統負載增加 < 0.001%，不影響用戶體驗
✅ **自動恢復**：AWS 重啟後自動恢復，無需手動設定
✅ **完整文件**：每個監控都有詳細的設定和故障排除指南

**監控系統已於 2026-01-27 設定完成，全面保障 Y-CRM 穩定運行！**
