# Y-CRM Docker 本地部署完整指南

## 📋 目錄

- [專案架構](#專案架構)
- [Docker Compose 運作原理](#docker-compose-運作原理)
- [部署步驟](#部署步驟)
- [檔案變更記錄](#檔案變更記錄)
- [問題排查與解決](#問題排查與解決)
- [常用操作指令](#常用操作指令)

---

## 🏗️ 專案架構

### 專案描述

Y-CRM 是基於 Twenty CRM 的開源客戶關係管理系統，採用 NX Monorepo 架構：

```
y-crm/
├── docker/                      # Docker 相關配置
│   ├── docker-compose.yml       # 服務編排配置
│   ├── .env                     # 環境變數配置（本次新增）
│   ├── backend/
│   │   └── Dockerfile          # 後端映像建置檔
│   ├── frontend/
│   │   ├── Dockerfile          # 前端映像建置檔
│   │   ├── nginx.conf          # Nginx 配置
│   │   └── entrypoint.sh       # 前端啟動腳本
│   └── backups/                # 資料庫備份目錄
│       ├── postgres/
│       │   └── db-all.sql      # PostgreSQL 初始化檔（本次新增）
│       └── redis/
│           └── dump.rdb        # Redis 備份檔（本次新增）
├── packages/
│   ├── twenty-server/          # NestJS 後端應用
│   ├── twenty-front/           # React 前端應用
│   ├── twenty-shared/          # 共用程式碼
│   ├── twenty-emails/          # Email 模板
│   └── twenty-ui/              # UI 組件庫
└── package.json                # 根目錄套件配置
```

### 技術棧

- **前端**: React 18 + TypeScript + Recoil + Vite 7.1.12 + Emotion
- **後端**: NestJS + TypeORM + GraphQL (GraphQL Yoga)
- **資料庫**: PostgreSQL 16
- **快取**: Redis 7
- **構建工具**: NX Monorepo + Yarn 4.9.2
- **容器化**: Docker + Docker Compose
- **Web 伺服器**: Nginx 1.27 (前端)

---

## 🐳 Docker Compose 運作原理

### 服務架構

Docker Compose 定義了 6 個服務：

```yaml
services:
  1. postgres          # PostgreSQL 16 資料庫
  2. postgres-seed-once # 一次性資料庫初始化服務
  3. redis             # Redis 7 快取服務
  4. backend           # NestJS 後端 API (端口 8867)
  5. worker            # 背景任務處理器
  6. frontend          # React 前端 + Nginx (端口 8866)
```

### Dockerfile 位置與說明

#### 1. 後端 Dockerfile (`docker/backend/Dockerfile`)

**位置**: `/mnt/d/project/y-crm/docker/backend/Dockerfile`

**多階段建置流程**:

```dockerfile
# 階段 1: deps - 安裝依賴
FROM node:20-bookworm AS deps
- 安裝 Yarn 4.9.2
- 複製 package.json 和相關配置
- 執行 yarn install 安裝依賴 (3959 個套件, 2.2 GiB)

# 階段 2: build - 編譯應用
FROM deps AS build
- 複製源代碼
- 執行 NX 建置: yarn nx build twenty-server --configuration=production
- 編譯 TypeScript (3720 個檔案)

# 階段 3: 最終映像
FROM node:20-bookworm
- 只複製建置產物和生產依賴
- 設置環境變數和工作目錄
- 暴露 8867 端口
- 啟動命令: node dist/src/main.js
```

**最終映像大小**: 1.56 GB

#### 2. 前端 Dockerfile (`docker/frontend/Dockerfile`)

**位置**: `/mnt/d/project/y-crm/docker/frontend/Dockerfile`

**多階段建置流程**:

```dockerfile
# 階段 1: deps - 安裝依賴
FROM node:20-bookworm AS deps
- 安裝 Yarn 4.9.2
- 執行 yarn install

# 階段 2: build - Vite 建置
FROM deps AS build
- 複製源代碼
- 執行 NX 建置: yarn nx build twenty-front --configuration=production
- Vite 編譯輸出到 dist/

# 階段 3: Nginx 運行環境
FROM nginx:1.27-alpine
- 複製 nginx.conf 配置
- 複製 entrypoint.sh 啟動腳本
- 複製前端建置產物到 /usr/share/nginx/html
- 使用 sed 替換 @@SERVER_BASE_URL@@ 為實際後端 URL
- 啟動 Nginx
```

**最終映像大小**: 44.6 MB

### Container 啟動流程

```mermaid
graph TD
    A[docker compose up -d] --> B[創建 Docker 網路]
    B --> C[啟動 PostgreSQL]
    B --> D[啟動 Redis]
    C --> E[執行 postgres-seed-once]
    E --> F{初始化成功?}
    F -->|是| G[啟動 Backend]
    F -->|是| H[啟動 Worker]
    G --> I[啟動 Frontend]
```

**詳細啟動順序**:

1. **PostgreSQL** 啟動並監聽 5432 端口
2. **Redis** 啟動並監聽 6379 端口
3. **postgres-seed-once** 執行資料庫初始化（如果需要）
   - 檢查是否有備份檔案 `/docker-entrypoint-initdb.d/db-all.sql`
   - 如果有則導入，否則跳過
4. **Backend** 等待 postgres 和 redis 啟動後執行
   - 連接資料庫 (PG_DATABASE_URL)
   - 連接 Redis (REDIS_URL)
   - 監聽 NODE_PORT (8867)
5. **Worker** 與 Backend 同時啟動（使用相同映像）
   - 執行背景任務處理
6. **Frontend** 最後啟動
   - Nginx 啟動並監聽 80 端口
   - Docker 映射到主機 8866 端口

---

## 📝 部署步驟

### 前置需求

- Docker Desktop 已安裝並運行
- Windows 11 + WSL2
- 至少 10GB 可用磁碟空間
- 至少 8GB 記憶體

### 步驟 1: 準備環境配置檔案

**建立 `.env` 檔案**

位置: `/mnt/d/project/y-crm/docker/.env`

```bash
# ========================================
# Y-CRM Docker 本地開發環境配置
# ========================================

# ----- 資料庫配置 (PostgreSQL) -----
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=default
POSTGRES_PORT=5432

# ----- Redis 配置 -----
REDIS_PORT=6379

# ----- 後端配置 -----
BACKEND_PORT=8867
BACKEND_PUBLIC_URL=http://localhost:8867
BACKEND_IMAGE_VERSION=dev

# ----- 前端配置 -----
FRONTEND_PORT=8866
FRONTEND_IMAGE_VERSION=dev
VITE_IS_DEBUG_MODE=true
IS_DEBUG_MODE=true

# ----- 應用程式配置 -----
NODE_ENV=development
APP_SECRET=local_development_secret_change_in_production
SIGN_IN_PREFILLED=true

# ----- 內部服務 URL (容器間通訊) -----
PG_DATABASE_URL=postgres://postgres:postgres@postgres:5432/default
REDIS_URL=redis://redis:6379
FRONTEND_URL=http://localhost:8866

# ----- 可選配置 -----
PORT=8867
NODE_PORT=8867
```

**執行指令**:
```bash
cd /mnt/d/project/y-crm/docker
touch .env
# 然後將上述內容寫入 .env
```

### 步驟 2: 準備資料庫備份目錄

```bash
# 創建備份目錄
mkdir -p backups/postgres
mkdir -p backups/redis

# 創建 PostgreSQL 初始化檔案
cat > backups/postgres/db-all.sql << 'EOF'
-- Y-CRM 資料庫初始化檔案
-- 此檔案會在第一次啟動時自動執行

-- 如果您有現有的資料庫備份，請將內容放在這裡
-- 否則系統會自動創建空的資料庫架構
EOF

# 創建空的 Redis 備份檔案
touch backups/redis/dump.rdb
```

### 步驟 3: 建置 Docker 映像

**重要**: 此步驟耗時較長（約 95 分鐘），請耐心等待。

```bash
# 進入 docker 目錄
cd /mnt/d/project/y-crm/docker

# 執行建置（不使用快取）
docker compose build --no-cache
```

**建置過程**:
```
[1/3] 安裝依賴階段
  ├─ Backend: 安裝 3959 個套件 (2.2 GiB) - 約 6 分鐘
  └─ Frontend: 安裝 3959 個套件 (2.2 GiB) - 約 8 分鐘

[2/3] 編譯階段
  ├─ Backend: 編譯 3720 個 TypeScript 檔案 - 約 30 分鐘
  └─ Frontend: Vite 建置 - 約 15 分鐘

[3/3] 映像匯出階段
  ├─ Backend: 匯出映像 (1.56 GB) - 約 20 分鐘
  └─ Frontend: 匯出映像 (44.6 MB) - 約 2 分鐘
```

**檢查建置結果**:
```bash
# 查看建置的映像
docker images | grep -E "twenty-backend|frontend"

# 預期輸出：
# twenty-backend:latest                  <IMAGE_ID>   1.56GB
# y-crm-company-docker-frontend:latest   <IMAGE_ID>   44.6MB
```

### 步驟 4: 初始化資料庫

```bash
# 啟動服務
docker compose up -d

# 等待容器啟動（約 10 秒）
sleep 10

# 檢查容器狀態
docker compose ps

# 執行資料庫初始化
docker compose exec backend npx nx run twenty-server:database:init:prod
```

**初始化過程**:
```
✓ 創建 schema "public"
✓ 創建 schema "core"
✓ 安裝 extension "uuid-ossp"
✓ 安裝 extension "unaccent"
✓ 執行 43 個資料庫遷移
  - 創建 core.keyValuePair 表
  - 創建 core.user 表
  - 創建 core.workspace 表
  - 創建 core.objectMetadata 表
  - 創建 core.fieldMetadata 表
  - ... 等 38 個表
```

**驗證資料庫初始化**:
```bash
# 檢查資料庫表是否創建成功
docker compose exec postgres psql -U postgres -d default -c "\dt core.*" | head -30

# 應該看到 20+ 個表
```

### 步驟 5: 重啟服務

資料庫初始化後，需要重啟後端服務：

```bash
# 完全重啟所有服務
docker compose down
docker compose up -d

# 等待服務啟動（約 15 秒）
sleep 15
```

### 步驟 6: 驗證部署

```bash
# 檢查所有容器狀態
docker compose ps

# 測試前端
curl -I http://localhost:8866
# 預期: HTTP/1.1 200 OK

# 測試後端
curl -I http://localhost:8867/client-config
# 預期: HTTP/1.1 200 OK

# 測試 GraphQL 端點
curl -I http://localhost:8867/graphql
# 預期: HTTP/1.1 200 OK
```

### 步驟 7: 訪問應用

**前端應用**: http://localhost:8866

**後端 API**: http://localhost:8867

**GraphQL Playground**: http://localhost:8867/graphql

---

## 📂 檔案變更記錄

### 新增的檔案

| 檔案路徑 | 用途 | 大小 |
|---------|------|------|
| `docker/.env` | Docker Compose 環境變數配置 | ~1 KB |
| `docker/backups/postgres/db-all.sql` | PostgreSQL 初始化腳本（空檔案） | 0.3 KB |
| `docker/backups/redis/dump.rdb` | Redis 備份檔案（空檔案） | 0 B |

### 修改的檔案

| 檔案路徑 | 修改內容 | 原因 |
|---------|---------|------|
| `docker/.env` | 添加 `NODE_PORT=8867` | 修復後端無法監聽端口的問題 |
| `docker/.env` | 修改 `FRONTEND_URL=http://localhost:8866` | 修復前端跳轉到內部容器名稱的問題 |

### 新增檔案內容詳細說明

#### 1. `docker/.env`

**完整內容**: 見步驟 1

**關鍵配置說明**:

```bash
# 這兩個變數必須同時設置！
PORT=8867          # Docker 使用
NODE_PORT=8867     # Twenty CRM 後端代碼使用

# 後端 URL 配置
BACKEND_PUBLIC_URL=http://localhost:8867  # 外部訪問 URL
PG_DATABASE_URL=postgres://postgres:postgres@postgres:5432/default  # 容器內資料庫 URL
REDIS_URL=redis://redis:6379  # 容器內 Redis URL
```

#### 2. `docker/backups/postgres/db-all.sql`

```sql
-- Y-CRM 資料庫初始化檔案
-- 此檔案會在第一次啟動時自動執行

-- 如果您有現有的資料庫備份，請將內容放在這裡
-- 否則系統會自動創建空的資料庫架構
```

**用途**:
- 如果有現有資料庫備份，可以放在這裡自動導入
- 本次部署使用空檔案，由 `database:init:prod` 命令初始化

---

## 🐛 問題排查與解決

### 問題 1: 後端無法連接 (Connection refused)

**症狀**:
```bash
$ curl http://localhost:8867/graphql
curl: (56) Recv failure: Connection reset by peer
```

**原因分析**:

1. **環境變數錯誤**:
   - 後端代碼使用 `NODE_PORT` 環境變數
   - `.env` 檔案只設置了 `PORT=8867`
   - 導致後端監聽預設端口 3000，而 Docker 映射的是 8867

2. **代碼位置**: `/mnt/d/project/y-crm/packages/twenty-server/src/main.ts:86`
   ```typescript
   await app.listen(twentyConfigService.get('NODE_PORT'));
   ```

3. **配置檔案**: `/mnt/d/project/y-crm/packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts:946`
   ```typescript
   NODE_PORT = 3000;  // 預設值
   ```

**診斷步驟**:

```bash
# 1. 檢查容器是否運行
docker compose ps
# 輸出: Y-CRM-backend Up

# 2. 檢查容器內的環境變數
docker compose exec backend sh -c "env | grep PORT"
# 輸出: PORT=8867 (缺少 NODE_PORT)

# 3. 檢查後端日誌
docker compose logs backend | tail -20
# 輸出: Nest application successfully started (但沒有 listening 訊息)

# 4. 嘗試從容器內部連接
docker compose exec backend sh -c "wget -q -O- http://localhost:8867/client-config"
# 輸出: Connection refused

# 5. 檢查後端監聽的端口
docker compose exec backend sh -c "netstat -tlnp | grep node"
# (netstat 不可用，但推測監聽 3000 而非 8867)
```

**解決方案**:

1. **修改 `.env` 檔案**:
   ```bash
   # 添加 NODE_PORT 環境變數
   echo "NODE_PORT=8867" >> /mnt/d/project/y-crm/docker/.env
   ```

2. **完全重啟 Docker Compose**:
   ```bash
   # 必須完全重啟才能重新載入 .env
   docker compose down
   docker compose up -d
   ```

3. **驗證修復**:
   ```bash
   # 等待 15 秒讓服務啟動
   sleep 15

   # 檢查環境變數
   docker compose exec backend sh -c "env | grep NODE_PORT"
   # 輸出: NODE_PORT=8867 ✓

   # 測試連接
   curl -I http://localhost:8867/client-config
   # 輸出: HTTP/1.1 200 OK ✓
   ```

**經驗教訓**:

- 使用 `docker compose restart` 不會重新載入 `.env` 檔案
- 必須使用 `docker compose down && docker compose up -d`
- Twenty CRM 使用自定義的環境變數名稱 (`NODE_PORT`) 而非標準的 `PORT`

### 問題 2: 資料庫表不存在 (relation does not exist)

**症狀**:
```
[ERROR] [DatabaseConfigDriver] Failed to load config variables from database
error: relation "core.keyValuePair" does not exist
```

**原因**:
- 首次啟動時資料庫架構尚未初始化
- 後端嘗試讀取 `core.keyValuePair` 表但表尚不存在

**解決方案**:

```bash
# 執行資料庫初始化
docker compose exec backend npx nx run twenty-server:database:init:prod

# 初始化完成後重啟後端
docker compose restart backend worker
```

**驗證**:
```bash
# 檢查表是否存在
docker compose exec postgres psql -U postgres -d default -c "\dt core.keyValuePair"
# 應該顯示表的資訊
```

### 問題 3: Docker 建置時間過長

**症狀**:
- 建置時間超過 1.5 小時
- `yarn install` 階段耗時很長

**原因**:
- NX Monorepo 包含大量套件 (3959 個)
- 需要安裝兩次依賴（前端和後端）
- TypeScript 編譯大量檔案 (3720+ 個)

**優化建議**:

1. **使用快取** (後續建置):
   ```bash
   # 不使用 --no-cache 標誌
   docker compose build
   ```

2. **使用多核心建置**:
   ```bash
   # 設置 Docker 使用更多 CPU
   # Docker Desktop -> Settings -> Resources -> CPUs
   ```

3. **調整 Node.js 記憶體**:
   ```dockerfile
   # 在 Dockerfile 中設置
   ENV NODE_OPTIONS="--max-old-space-size=4096"
   ```

### 問題 4: 前端跳轉到 frontend:8866 無法訪問

**症狀**:
```
1. 訪問 http://localhost:8866 顯示登入畫面 1-2 秒
2. 自動跳轉到 http://frontend:8866/welcome
3. 瀏覽器顯示: DNS_PROBE_FINISHED_NXDOMAIN
```

**原因**:
- `FRONTEND_URL=http://frontend:80` 是 Docker 內部容器名稱
- 後端從 `FRONTEND_URL` 解析出 `frontDomain: "frontend"`
- 前端應用使用 `frontDomain` 構建跳轉 URL
- 瀏覽器無法解析 Docker 內部的 `frontend` 主機名

**診斷步驟**:

```bash
# 1. 檢查後端返回的配置
curl -s http://localhost:8867/client-config | grep frontDomain
# 輸出: "frontDomain":"frontend" (錯誤)

# 2. 檢查環境變數
docker compose exec backend sh -c "env | grep FRONTEND_URL"
# 輸出: FRONTEND_URL=http://frontend:80
```

**解決方案**:

1. **修改 `.env` 檔案**:
   ```bash
   # 從
   FRONTEND_URL=http://frontend:80

   # 改為
   FRONTEND_URL=http://localhost:8866
   ```

2. **完全重啟服務**:
   ```bash
   cd /mnt/d/project/y-crm/docker
   docker compose down
   docker compose up -d
   ```

3. **驗證修復**:
   ```bash
   # 等待服務啟動
   sleep 15

   # 檢查 frontDomain
   curl -s http://localhost:8867/client-config | grep frontDomain
   # 輸出: "frontDomain":"localhost" ✓
   ```

4. **清除瀏覽器快取**後重新訪問 http://localhost:8866

**經驗教訓**:
- `FRONTEND_URL` 應該設為瀏覽器可訪問的 URL (`localhost:8866`)
- 而非 Docker 內部的容器名稱 (`frontend:80`)
- Twenty CRM 會將 `FRONTEND_URL` 的 hostname 作為 `frontDomain` 傳給前端

### 常見錯誤與解決方案

| 錯誤訊息 | 原因 | 解決方案 |
|---------|------|---------|
| `Cannot connect to Docker daemon` | Docker Desktop 未啟動 | 啟動 Docker Desktop |
| `port is already allocated` | 端口被占用 | `docker compose down` 或修改 `.env` 中的端口 |
| `no space left on device` | 磁碟空間不足 | 清理 Docker: `docker system prune -a` |
| `manifest unknown` | 映像不存在 | 重新執行 `docker compose build` |
| `502 Bad Gateway` | 後端未啟動或崩潰 | 檢查 `docker compose logs backend` |
| `DNS_PROBE_FINISHED_NXDOMAIN` | FRONTEND_URL 使用內部容器名 | 改為 `http://localhost:8866` |

---

## 💻 常用操作指令

### 服務管理

```bash
# 啟動所有服務
cd /mnt/d/project/y-crm/docker
docker compose up -d

# 停止所有服務
docker compose down

# 重啟特定服務
docker compose restart backend
docker compose restart frontend

# 停止特定服務
docker compose stop backend

# 啟動特定服務
docker compose start backend

# 查看服務狀態
docker compose ps

# 查看服務詳細資訊
docker compose ps -a
```

### 日誌查看

```bash
# 查看所有服務日誌
docker compose logs

# 查看特定服務日誌
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# 實時追蹤日誌
docker compose logs -f backend

# 查看最近 100 行日誌
docker compose logs --tail=100 backend

# 查看帶時間戳的日誌
docker compose logs -t backend
```

### 進入容器

```bash
# 進入 backend 容器
docker compose exec backend sh

# 進入 postgres 容器
docker compose exec postgres sh

# 以 root 身份進入
docker compose exec -u root backend sh

# 執行單個命令
docker compose exec backend env | grep PORT
docker compose exec postgres psql -U postgres -d default
```

### 資料庫操作

```bash
# 連接到 PostgreSQL
docker compose exec postgres psql -U postgres -d default

# 列出所有表
docker compose exec postgres psql -U postgres -d default -c "\dt core.*"

# 執行 SQL 查詢
docker compose exec postgres psql -U postgres -d default -c "SELECT * FROM core.user LIMIT 5;"

# 備份資料庫
docker compose exec postgres pg_dump -U postgres default > backup_$(date +%Y%m%d).sql

# 還原資料庫
docker compose exec -T postgres psql -U postgres default < backup.sql

# 重置資料庫（危險操作！）
docker compose exec backend npx nx run twenty-server:database:reset
```

### 映像管理

```bash
# 查看所有映像
docker images

# 查看 Y-CRM 相關映像
docker images | grep -E "twenty|y-crm"

# 刪除未使用的映像
docker image prune -a

# 重新建置映像
docker compose build --no-cache

# 建置特定服務的映像
docker compose build backend
docker compose build frontend

# 拉取最新的基礎映像
docker compose pull
```

### 清理與維護

```bash
# 停止並刪除所有容器
docker compose down

# 停止並刪除所有容器、網路和卷
docker compose down -v

# 清理所有未使用的 Docker 資源
docker system prune -a --volumes

# 查看 Docker 磁碟使用情況
docker system df

# 清理 build cache
docker builder prune -a
```

### 健康檢查

```bash
# 檢查前端健康狀態
curl -I http://localhost:8866

# 檢查後端健康狀態
curl -I http://localhost:8867/client-config

# 檢查 GraphQL 端點
curl -X POST http://localhost:8867/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# 檢查資料庫連接
docker compose exec backend sh -c "wget -q -O- http://localhost:8867/client-config"

# 檢查所有服務端口
netstat -tlnp | grep -E "8866|8867|5432|6379"
```

### 環境變數管理

```bash
# 查看所有環境變數
docker compose config

# 查看特定服務的環境變數
docker compose exec backend env

# 修改 .env 後重新載入
docker compose down
docker compose up -d

# 檢查環境變數是否生效
docker compose exec backend sh -c "echo \$NODE_PORT"
```

### 性能監控

```bash
# 查看容器資源使用情況
docker stats

# 查看特定容器資源使用
docker stats Y-CRM-backend

# 查看容器進程
docker compose exec backend ps aux

# 查看網路連接
docker compose exec backend netstat -tunlp
```

### 開發模式操作

```bash
# 重新建置並啟動
docker compose up -d --build

# 強制重新創建容器
docker compose up -d --force-recreate

# 在容器中執行 NX 命令
docker compose exec backend npx nx lint twenty-server
docker compose exec backend npx nx test twenty-server

# 安裝新的套件（在容器外）
cd /mnt/d/project/y-crm
yarn add <package-name>
docker compose build backend
docker compose up -d backend
```

---

## 📊 部署時間統計

| 階段 | 耗時 | 備註 |
|-----|------|------|
| 環境準備 | 5 分鐘 | 創建 .env 和備份目錄 |
| Docker 建置 (Backend) | 40 分鐘 | 安裝依賴 + 編譯 |
| Docker 建置 (Frontend) | 25 分鐘 | 安裝依賴 + Vite 建置 |
| 映像匯出 | 30 分鐘 | 匯出兩個映像到 Docker |
| 資料庫初始化 | 2 分鐘 | 執行 43 個遷移 |
| 問題排查與修復 | 20 分鐘 | NODE_PORT 配置問題 |
| **總計** | **約 2 小時** | 首次完整部署 |

---

## 🔍 技術細節

### 網路配置

Docker Compose 自動創建一個名為 `y-crm-company-docker_default` 的網路，所有服務都連接到這個網路。

**容器間通訊**:
- Backend -> Postgres: `postgres:5432`
- Backend -> Redis: `redis:6379`
- Frontend -> Backend: 通過主機 `localhost:8867` (因為前端在瀏覽器執行)

**端口映射**:
```
主機端口 -> 容器端口
8866 -> 80 (frontend)
8867 -> 8867 (backend)
5432 -> 5432 (postgres)
6379 -> 6379 (redis)
```

### 資料持久化

```yaml
volumes:
  postgres-data:    # PostgreSQL 資料
  redis-data:       # Redis 資料
```

**位置**: Docker Desktop 管理的 volumes
**清理**: `docker compose down -v` (會刪除所有資料！)

### 環境變數優先級

1. `docker-compose.yml` 中的 `environment` 區塊（最高優先級）
2. `.env` 檔案
3. Dockerfile 中的 `ENV` 指令
4. 應用程式預設值（最低優先級）

---

## 🎯 最佳實踐

### 開發環境

1. **定期備份資料庫**:
   ```bash
   docker compose exec postgres pg_dump -U postgres default > backup.sql
   ```

2. **使用 Git 忽略 .env**:
   ```gitignore
   docker/.env
   docker/backups/
   ```

3. **定期更新映像**:
   ```bash
   docker compose build --pull
   ```

### 生產環境建議

1. **修改預設密碼**: 更改 `POSTGRES_PASSWORD` 和 `APP_SECRET`
2. **使用 HTTPS**: 配置 SSL 證書
3. **設置防火牆**: 限制對外暴露的端口
4. **定期備份**: 設置自動備份排程
5. **監控**: 使用 Prometheus + Grafana 監控容器

---

## 📚 參考資源

- [Twenty CRM 官方文檔](https://docs.twenty.com/)
- [Docker Compose 文檔](https://docs.docker.com/compose/)
- [NestJS 文檔](https://docs.nestjs.com/)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)

---

## 📝 版本資訊

- **文檔版本**: 1.0.0
- **建立日期**: 2025-12-18
- **專案版本**: Y-CRM (基於 Twenty CRM)
- **Docker Compose 版本**: 2.x
- **測試環境**: Windows 11 + WSL2 + Docker Desktop 29.1.3

---

**撰寫者**: Claude (Anthropic)
**最後更新**: 2025-12-18
