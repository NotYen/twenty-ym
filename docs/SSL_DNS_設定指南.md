# SSL 與 DNS 設定指南

## 概述

本文檔說明 Y-CRM 在 AWS 上使用真實域名 + SSL 的設定方式。

- **域名**：`y-crm.youngming-mes.com`
- **萬用字元**：`*.y-crm.youngming-mes.com`（支援多租戶）
- **SSL 憑證**：Let's Encrypt（免費）
- **憑證到期日**：2026-04-01
- **建議更新時間**：2026-03-15 之前

---

## DNS 設定

### 必要的 DNS 記錄

在 DNS 後台設定以下記錄：

| 主機名 | 類型 | 值 | 說明 |
|--------|------|-----|------|
| `y-crm` | A | `52.195.151.185` | 主域名 |
| `*.y-crm` | A | `52.195.151.185` | 萬用字元（多租戶用） |

### 驗證 DNS 設定

```bash
# 驗證主域名
dig A y-crm.youngming-mes.com +short
# 應該顯示：52.195.151.185

# 驗證萬用字元
dig A app.y-crm.youngming-mes.com +short
# 應該顯示：52.195.151.185
```

---

## SSL 憑證

### 憑證位置（AWS 上）

```
/etc/letsencrypt/live/y-crm.youngming-mes.com/fullchain.pem  # 憑證
/etc/letsencrypt/live/y-crm.youngming-mes.com/privkey.pem    # 私鑰
```

### 查看憑證狀態

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
sudo certbot certificates
```

---

## SSL 憑證更新步驟（每 3 個月）

⚠️ **重要**：憑證到期日 2026-04-01，建議在 2026-03-15 之前更新。

### 步驟 1：SSH 到 AWS

```bash
ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185
```

### 步驟 2：執行 Certbot

```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d "y-crm.youngming-mes.com" \
  -d "*.y-crm.youngming-mes.com"
```

### 步驟 3：更新 DNS TXT 記錄

Certbot 會顯示類似訊息：
```
Please deploy a DNS TXT record under the name:
_acme-challenge.y-crm.youngming-mes.com.

with the following value:
xxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ 先不要按 Enter！**

1. 去 DNS 後台
2. 找到或新增 `_acme-challenge.y-crm` 的 TXT 記錄
3. 填入 Certbot 顯示的值
4. 等待 DNS 生效

### 步驟 4：驗證 DNS 生效

開另一個終端機視窗：
```bash
dig TXT _acme-challenge.y-crm.youngming-mes.com @8.8.8.8 +short
dig TXT _acme-challenge.y-crm.youngming-mes.com @1.1.1.1 +short
dig TXT _acme-challenge.y-crm.youngming-mes.com @168.95.1.1 +short
```

確認所有 DNS 都顯示正確的值後，回到 SSH 視窗按 Enter。

**注意**：Certbot 會要求兩個 TXT 值（因為申請兩個域名），第一個設定完按 Enter 後會顯示第二個，兩個都要設定。

### 步驟 5：重新載入 Nginx

```bash
sudo systemctl reload nginx
```

### 步驟 6：驗證憑證更新成功

```bash
sudo certbot certificates
```

### ⚠️ 重要提醒

**SSL 更新時不需要重啟 Docker！**

只需要：
1. 執行 certbot 取得新憑證
2. 更新 DNS TXT 記錄
3. `sudo systemctl reload nginx`

Nginx 會自動載入新憑證，Docker 容器完全不受影響。

---

## Nginx 配置

### 配置檔位置

```
/etc/nginx/sites-available/y-crm-ssl
/etc/nginx/sites-enabled/y-crm-ssl  # symlink
```

### 配置內容

```nginx
# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name y-crm.youngming-mes.com *.y-crm.youngming-mes.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name y-crm.youngming-mes.com *.y-crm.youngming-mes.com;

    # SSL 證書
    ssl_certificate /etc/letsencrypt/live/y-crm.youngming-mes.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/y-crm.youngming-mes.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:8866;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # GraphQL（支援 WebSocket）
    location /graphql {
        proxy_pass http://127.0.0.1:8867/graphql;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 其他 API
    location ~ ^/(rest|metadata|healthz|client-config|auth|files|verify|reset-password|invite) {
        proxy_pass http://127.0.0.1:8867;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 啟用配置

```bash
sudo ln -s /etc/nginx/sites-available/y-crm-ssl /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Nginx 效能優化

### 已啟用的優化項目

| 優化項目 | 說明 | 效果 |
|---------|------|------|
| **SSL Session Cache** | TLS 握手重用 | 減少連線時間 |
| **HTTP/1.1 Keepalive** | 連線重用 | 減少建立連線開銷 |
| **Gzip 壓縮** | 壓縮傳輸內容 | 減少 50-70% 傳輸量 |

### 效能對比

| 指標 | 優化前 | 優化後 |
|------|--------|--------|
| HTTPS 回應時間 | 270ms | 45ms |
| 改善幅度 | - | 快 6 倍 |

### 優化配置（已套用在 AWS）

```nginx
# SSL 優化
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# Gzip 壓縮
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_types text/plain text/css text/xml application/json application/javascript application/xml application/xml+rss text/javascript;

# HTTP/1.1 Keepalive（在每個 location block 中）
proxy_http_version 1.1;
proxy_set_header Connection "";
```

### 這些優化是業界標準嗎？

**是的！** 這些都是 Nginx 官方推薦的最佳實踐：
- SSL Session Cache：Netflix、Cloudflare、AWS 都使用
- Gzip：所有主流網站都啟用
- Keepalive：減少 TCP 連線開銷的標準做法

### 換付費 SSL 還需要這些優化嗎？

**需要！** SSL 憑證類型（免費/付費）跟效能優化是兩回事：
- 付費 SSL 的差別只在於保險金額、驗證等級、客服支援
- 效能優化跟憑證類型無關，都需要做

### Gzip 會造成快取問題嗎？

**不會！** Gzip 只是壓縮傳輸內容，不會快取資料：
- API 資料：每次都是即時查詢
- 前端檔案：檔名有 hash，部署新版本自動更新

---

## 多租戶 URL 對應

| 網址 | 行為 |
|------|------|
| `https://y-crm.youngming-mes.com` | 重導到預設 workspace (app) |
| `https://app.y-crm.youngming-mes.com` | 預設 workspace |
| `https://workspace1.y-crm.youngming-mes.com` | workspace1 |
| `https://任何名稱.y-crm.youngming-mes.com` | 對應的 workspace |

---

## 故障排除

### 憑證過期

```bash
# 檢查憑證狀態
sudo certbot certificates

# 如果過期，重新申請（按照上面的更新步驟）
```

### Nginx 無法啟動

```bash
# 檢查配置語法
sudo nginx -t

# 查看錯誤日誌
sudo tail -f /var/log/nginx/error.log
```

### DNS TXT 記錄不生效

- 確認 DNS 後台設定正確
- 等待 5-10 分鐘讓 DNS 傳播
- 用不同 DNS 伺服器查詢：
  ```bash
  dig TXT _acme-challenge.y-crm.youngming-mes.com @8.8.8.8 +short
  dig TXT _acme-challenge.y-crm.youngming-mes.com @1.1.1.1 +short
  dig TXT _acme-challenge.y-crm.youngming-mes.com @168.95.1.1 +short
  ```

---

---

## 系統架構說明

### 為什麼無法用 IP:8866 直接訪問？

設定 SSL 後，Docker 端口只綁定 localhost：
```
Y-CRM-frontend   127.0.0.1:8866->80/tcp    ← 只綁定 localhost
Y-CRM-backend    127.0.0.1:8867->8867/tcp  ← 只綁定 localhost
```

這是**故意的設計**：
1. 強制所有流量走 HTTPS（安全）
2. 避免繞過 Nginx 直接訪問（不安全）

### 訪問方式

| 方式 | 可以嗎？ |
|------|---------|
| `https://y-crm.youngming-mes.com` | ✅ 可以 |
| `http://52.195.151.185:8866` | ❌ 不行（Connection refused） |
| `http://52.195.151.185:8867` | ❌ 不行（Connection refused） |

### 各服務是否受域名/HTTPS 變更影響？

| 服務 | 受影響嗎？ | 說明 |
|------|-----------|------|
| **Frontend** | ❌ 不受影響 | 只是靜態檔案，透過 Nginx 提供 |
| **Backend** | ❌ 不受影響 | 內部用 localhost，環境變數已更新 |
| **Worker** | ❌ 不受影響 | 用 Redis 內部通訊，不走 HTTP |
| **Redis** | ❌ 不受影響 | 內部通訊，不涉及域名 |
| **PostgreSQL** | ❌ 不受影響 | 內部通訊，不涉及域名 |
| **CRON Jobs** | ❌ 不受影響 | 透過 Redis BullMQ，不走 HTTP |

### 架構圖

```
用戶瀏覽器
    │
    ▼ HTTPS (443)
┌─────────────────────────────────────────┐
│  Nginx (SSL 終止)                        │
│  - SSL 憑證                              │
│  - Gzip 壓縮                             │
│  - 反向代理                              │
└─────────────────────────────────────────┘
    │                    │
    ▼ HTTP (8866)        ▼ HTTP (8867)
┌──────────┐        ┌──────────┐
│ Frontend │        │ Backend  │
│ (React)  │        │ (NestJS) │
└──────────┘        └──────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         ┌───────┐  ┌───────┐  ┌──────────┐
         │ Redis │  │Postgres│  │  Worker  │
         │(BullMQ)│  │  (DB)  │  │(CRON Jobs)│
         └───────┘  └───────┘  └──────────┘
              │                      │
              └──────────────────────┘
                   Redis 內部通訊
```

**重點**：所有內部通訊都用 Docker 網路，不走外部 HTTP/HTTPS，所以域名變更不會影響 Worker、CRON Jobs 等背景服務。

---

## 日常部署流程

### 改 code 後的部署步驟

**只需要執行兩個腳本，不需要手動操作 Nginx 或 SSL！**

```bash
# 1. 建立新的 Docker image
cd /Users/ym/twenty-ym
./docker/dev-flow/aws/build-amd64-images.sh --push

# 2. 部署到 AWS
./docker/dev-flow/aws/deploy-to-aws.sh \
  --backend-tag <你剛才建立的 backend tag> \
  --frontend-tag <你剛才建立的 frontend tag>
```

### deploy-to-aws.sh 會自動執行的事項

1. 更新 `docker-compose.aws.yml` 中的 image tag
2. 上傳 `docker-compose.aws.yml` 到 AWS
3. 上傳 `.env` 到 AWS
4. Pull 新的 Docker image
5. 重啟所有容器
6. 執行資料庫 migration
7. 同步 workspace metadata
8. 清除 Redis cache
9. 重新註冊 CRON jobs
10. **自動清理未使用的 Docker images**（釋放磁碟空間）

### 什麼時候需要手動操作？

| 情況 | 需要手動操作 |
|------|-------------|
| 改 code 後部署 | ❌ 不需要，執行腳本即可 |
| SSL 憑證到期（每 3 個月） | ✅ 需要，參考上面的更新步驟 |
| 修改 Nginx 配置 | ✅ 需要 SSH 到 AWS 修改 |
| 修改 DNS 設定 | ✅ 需要到 DNS 後台修改 |

---

## 常見問題 FAQ

### Q1: 開發新需求後 build image 部署到 AWS 還需要做 Nginx/SSL 設定嗎？

**不需要！**

日常部署只需要執行兩個腳本：
```bash
./docker/dev-flow/aws/build-amd64-images.sh --push
./docker/dev-flow/aws/deploy-to-aws.sh --backend-tag xxx --frontend-tag xxx
```

原因：
- Nginx 和 SSL 設定是在 AWS 主機上的系統層級
- Docker 容器是應用層級
- 兩者是分開的，部署新 image 只會更新 Docker 容器，不會影響 Nginx/SSL

### Q2: 如果域名換成 GoDaddy 需要重新綁定嗎？

要看你換的是什麼：

| 情況 | 需要做的事 |
|------|-----------|
| **只換 DNS 服務商**（域名不變） | 只需要在 GoDaddy 重新設定 A Record，SSL 不用動 |
| **換新域名** | 需要重新申請 SSL + 修改 Nginx + 修改 env.aws |

#### 情況 A：只換 DNS 服務商到 GoDaddy（域名不變）

1. 在 GoDaddy 設定：
   - `y-crm` → A Record → `52.195.151.185`
   - `*.y-crm` → A Record → `52.195.151.185`
2. 等 DNS 生效（可能需要幾小時）
3. 完成！SSL 和 Nginx 都不用動

#### 情況 B：換新域名（例如 `crm.newdomain.com`）

需要重做以下步驟：

1. **DNS 設定**：在新的 DNS 後台設定 A Record
2. **SSL 憑證**：重新執行 certbot 申請新域名的憑證
3. **Nginx 配置**：修改 `/etc/nginx/sites-available/y-crm-ssl` 中的 `server_name`
4. **env.aws**：修改所有 URL（FRONTEND_URL、BACKEND_URL 等）
5. **重新部署**：執行 build + deploy 腳本

### Q3: SSL 更新時需要重啟 Docker 嗎？

**不需要！**

SSL 憑證更新只需要：
```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d "y-crm.youngming-mes.com" \
  -d "*.y-crm.youngming-mes.com"
# 設定 DNS TXT 記錄...
sudo systemctl reload nginx
```

Nginx reload 會自動載入新憑證，Docker 容器完全不受影響。

### Q4: 可以設定 SSL 自動續約嗎？

目前使用的是**手動模式**（`--manual`），每 3 個月需要手動更新。

#### 為什麼不能自動續約？

因為萬用字元憑證（`*.y-crm.youngming-mes.com`）必須用 DNS 驗證，而 Hinet DNS 沒有提供 API 讓 Certbot 自動更新 TXT 記錄。

#### 自動續約的方案

| 方案 | 說明 | 費用 |
|------|------|------|
| **Cloudflare DNS**（推薦） | 把 DNS 換到 Cloudflare，用 `certbot-dns-cloudflare` plugin 自動續約 | 免費 |
| **AWS Route 53** | 用 `certbot-dns-route53` plugin 自動續約 | ~$0.5/月 |
| **GoDaddy** | 有非官方 plugin，但不太穩定 | 域名費用 |
| **買付費 SSL** | GoDaddy 等服務商有賣 SSL 憑證 | ~$70-100/年 |

#### Cloudflare 自動續約設定步驟（未來參考）

1. 在 Cloudflare 註冊帳號（免費）
2. 把 `youngming-mes.com` 的 DNS 轉移到 Cloudflare
3. 在 AWS 安裝 plugin：
   ```bash
   sudo apt install python3-certbot-dns-cloudflare
   ```
4. 建立 Cloudflare API token 設定檔
5. 執行自動續約指令：
   ```bash
   sudo certbot certonly --dns-cloudflare \
     --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
     -d "y-crm.youngming-mes.com" \
     -d "*.y-crm.youngming-mes.com"
   ```
6. Certbot 會自動設定 cron job 每天檢查並續約

#### 目前建議

繼續用手動更新，每 3 個月花 10 分鐘。如果覺得麻煩，再考慮換到 Cloudflare。

---

## 相關檔案

- 環境變數：`docker/dev-flow/aws/env.aws`
- Docker Compose：`docker/dev-flow/aws/docker-compose.aws.yml`
- 建立 image 腳本：`docker/dev-flow/aws/build-amd64-images.sh`
- 部署腳本：`docker/dev-flow/aws/deploy-to-aws.sh`

---

## build-amd64-images.sh 使用說明

```bash
# 基本用法（會提示輸入版本號）
./docker/dev-flow/aws/build-amd64-images.sh

# 指定版本號並自動 push
./docker/dev-flow/aws/build-amd64-images.sh \
  --backend-version backend-20260101-v1-amd64 \
  --frontend-version frontend-20260101-v1-amd64 \
  --push

# 使用本地環境變數建立
./docker/dev-flow/aws/build-amd64-images.sh --env-source local
```

### 參數說明

| 參數 | 說明 | 預設值 |
|------|------|--------|
| `--backend-version` | Backend image tag | `backend-YYYYMMDD-v1-amd64` |
| `--frontend-version` | Frontend image tag | `frontend-YYYYMMDD-v1-amd64` |
| `--push` | 建立後自動 push 到 Docker Hub | 不 push |
| `--env-source` | 使用哪個 env 檔案 (`aws` 或 `local`) | `aws` |

---

## deploy-to-aws.sh 使用說明

```bash
# 基本用法
./docker/dev-flow/aws/deploy-to-aws.sh \
  --backend-tag backend-20260101-v1-amd64 \
  --frontend-tag frontend-20260101-v1-amd64

# 指定不同的 AWS 主機
./docker/dev-flow/aws/deploy-to-aws.sh \
  --backend-tag backend-20260101-v1-amd64 \
  --frontend-tag frontend-20260101-v1-amd64 \
  --aws-ip 1.2.3.4
```

### 參數說明

| 參數 | 說明 | 預設值 |
|------|------|--------|
| `--backend-tag` | Backend image tag（必填） | - |
| `--frontend-tag` | Frontend image tag（必填） | - |
| `--aws-ip` | AWS 主機 IP | `52.195.151.185` |
| `--aws-user` | SSH 使用者 | `ubuntu` |
| `--ssh-key` | SSH 私鑰路徑 | `~/.ssh/y-crm-aws-key.pem` |
