# Docker Desktop 安裝與設定步驟 (Windows)

> 資料存放於 D 槽

---

## 步驟 1：下載 Docker Desktop

- 網址: https://www.docker.com/products/docker-desktop/
- 選擇 Windows 版本下載

---

## 步驟 2：安裝 Docker Desktop

1. 雙擊下載的 `.exe` 安裝檔
2. 使用預設設定安裝
3. 安裝完成後會提示重開機
4. 重開機

---

## 步驟 3：重開機後 - 啟動 Docker Desktop

1. 開機後 Docker Desktop 可能會自動啟動
2. 如果沒有，從開始選單啟動 Docker Desktop
3. 等待 Docker 啟動完成 (右下角圖示變綠色)

---

## 步驟 4：驗證 Docker 是否正常運作

開啟 PowerShell (一般模式即可)，執行：

```powershell
docker --version
docker run hello-world
```

如果看到 "Hello from Docker!" 表示安裝成功

---

## 步驟 5：設定 WSL 記憶體 (建議)

Docker 建構大型專案時需要足夠記憶體，建議先設定：

1. 開啟 PowerShell，執行：
   ```powershell
   notepad $env:USERPROFILE\.wslconfig
   ```

2. 輸入以下內容（根據你的系統記憶體調整，建議設定為總記憶體的 60-70%）：
   ```ini
   [wsl2]
   memory=10GB
   swap=4GB
   ```

3. 儲存後執行：
   ```powershell
   wsl --shutdown
   ```

4. 重新啟動 Docker Desktop

---

## 步驟 6：將 Docker 資料移到 D 槽 (節省 C 槽空間)

使用 Docker Desktop 內建設定來搬移資料位置 (官方支援的方法)：

1. 開啟 Docker Desktop
2. 點擊右上角齒輪圖示 (Settings)
3. 左側選單選擇 **Resources → Advanced**
4. 找到 **"Disk image location"** (磁碟映像位置)
   - 預設路徑通常是: `C:\Users\你的用戶名\AppData\Local\Docker\wsl`
5. 點擊 **"Browse"** 按鈕，選擇新位置：`D:\Docker`
6. 點擊 **"Apply & Restart"**
   - Docker Desktop 會自動將資料搬移到新位置
   - 這個過程可能需要幾分鐘，取決於資料量大小
7. 等待 Docker Desktop 重新啟動完成

---

## 步驟 7：驗證資料已移到 D 槽

1. 檢查 `D:\Docker` 資料夾，應該有 `DockerDesktopWSL` 資料夾

2. 在 PowerShell 執行驗證：
   ```powershell
   docker --version
   docker run hello-world
   ```
   如果看到 "Hello from Docker!" 表示搬移成功

---

# 啟動 Y-CRM 專案

## 環境變數設定

確保 `docker/.env` 檔案包含以下內容：

```env
# PostgreSQL 設定
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=default
POSTGRES_PORT=5432

# Redis 設定
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# Backend 設定
BACKEND_PORT=8867
NODE_PORT=8867
BACKEND_PUBLIC_URL=http://localhost:8867
SERVER_URL=http://localhost:8867

# Frontend 設定
FRONTEND_PORT=8866
FRONTEND_URL=http://localhost:8866

# 其他設定
NODE_ENV=development
APP_SECRET=change_me_local_dev_secret_key_32chars
IS_DEBUG_MODE=true
SIGN_IN_PREFILLED=true
STORAGE_TYPE=local

# 資料庫連線 (Twenty 使用 URL 格式)
PG_DATABASE_URL=postgres://postgres:postgres123@postgres:5432/default
```

---

## 首次啟動

```powershell
# 切換到 docker 目錄
cd D:\Project\YCRM_PROJECT\Y-CRM\docker

# 建構並啟動所有服務 (首次會需要較長時間)
docker-compose up -d --build
```

---

## 首次啟動後 - 資料庫初始化

首次啟動時資料庫是空的，需要執行遷移：

```powershell
# 建立 core schema
docker exec -it Y-CRM-postgres psql -U postgres -d default -c "CREATE SCHEMA IF NOT EXISTS core;"

# 執行資料庫遷移
docker exec -it Y-CRM-backend npx typeorm migration:run -d dist/src/database/typeorm/core/core.datasource

# 重啟 backend 和 worker
docker restart Y-CRM-backend Y-CRM-worker
```

---

## 訪問位置

| 服務 | URL |
|------|-----|
| Frontend (使用者介面) | http://localhost:8866 |
| Backend API (GraphQL) | http://localhost:8867/graphql |
| Backend API (REST) | http://localhost:8867/rest/* |

---

## 常用指令

```powershell
# 查看容器狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 停止所有服務
docker-compose down

# 重新啟動
docker-compose up -d

# 重新建構並啟動
docker-compose up -d --build
```

---

# 常見問題排解

## Q1: WSL 相關錯誤？

確保 Windows 功能已啟用：
- 控制台 → 程式和功能 → 開啟或關閉 Windows 功能
- 勾選「Windows 子系統 Linux 版」
- 勾選「虛擬機器平台」

---

## Q2: Docker Desktop 啟動很慢？

第一次啟動需要初始化 WSL2，可能需要幾分鐘

---

## Q3: 權限不足錯誤？

確保使用「系統管理員」身分執行 PowerShell

---

## Q4: 建構時出現 `cannot allocate memory`？

WSL 記憶體不足，需要設定 `.wslconfig`：

```powershell
notepad $env:USERPROFILE\.wslconfig
```

內容：
```ini
[wsl2]
memory=10GB
swap=4GB
```

儲存後執行：
```powershell
wsl --shutdown
```

然後重新啟動 Docker Desktop

---

## Q5: Backend 無法連接資料庫 (`ECONNREFUSED 127.0.0.1:5432`)？

確保 `.env` 檔案中使用正確的資料庫連線格式：

```env
PG_DATABASE_URL=postgres://postgres:postgres123@postgres:5432/default
```

注意：必須使用 `postgres` (容器名稱) 而非 `localhost` 或 `127.0.0.1`

---

## Q6: 資料庫錯誤 `relation "core.xxx" does not exist`？

資料庫需要初始化，執行：

```powershell
# 建立 schema
docker exec -it Y-CRM-postgres psql -U postgres -d default -c "CREATE SCHEMA IF NOT EXISTS core;"

# 執行遷移
docker exec -it Y-CRM-backend npx typeorm migration:run -d dist/src/database/typeorm/core/core.datasource

# 重啟服務
docker restart Y-CRM-backend Y-CRM-worker
```

---

## Q7: `localhost:8867` 無法連線？

確保 `.env` 檔案中有設定 `NODE_PORT`：

```env
NODE_PORT=8867
```

Twenty 使用 `NODE_PORT` 而非 `BACKEND_PORT` 作為監聽端口

---

## Q8: 訪問 `localhost:8867` 顯示 404？

這是正常的！Backend 是 API 服務器，根路徑沒有內容。

- 使用者介面請訪問: http://localhost:8866
- API 端點在: http://localhost:8867/graphql

---

## Q9: 手動遷移 WSL 發行版失敗？

不建議手動使用 `wsl --export` / `wsl --import` 遷移 Docker 發行版，因為 Docker Desktop 重啟後會覆蓋設定。

請使用 Docker Desktop 內建的 **Settings → Resources → Disk image location** 功能。

---

# 更新日誌

| 日期 | 更新內容 |
|------|----------|
| 2024-12-17 | 初版建立 |
| 2024-12-18 | 新增 WSL 記憶體設定、資料庫初始化步驟、問題排解 |
