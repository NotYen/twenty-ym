# 本地 Docker 測試指南

## ⚠️ 重要說明

此配置完全獨立，不會影響你現有運行的服務！

```
現有服務（繼續運行）:
├── 前端: localhost:8866
├── 後端: localhost:8867  
├── PostgreSQL: localhost:5432
└── Redis: localhost:6379

Docker 測試環境（獨立）:
├── 前端+後端: localhost:19000
├── PostgreSQL: 容器內部 (不對外)
├── Redis: 容器內部 (不對外)
└── Worker: 容器內部
```

## 📋 前置條件

在開始之前，你需要先構建映像：

```bash
# 1. 調整 Docker Desktop 記憶體到 8GB
#    Docker Desktop → Settings → Resources → Memory: 8GB

# 2. 構建映像（約 15-20 分鐘）
cd /Users/ym/twenty-ym
docker build -f packages/twenty-docker/twenty/Dockerfile \
  -t twenty-zh-tw:latest .
```

## 🚀 啟動測試環境

```bash
# 進入目錄
cd /Users/ym/twenty-ym/deployment

# 啟動測試環境
docker compose -f docker-compose.local-test.yml up -d

# 查看狀態
docker compose -f docker-compose.local-test.yml ps

# 查看日誌
docker compose -f docker-compose.local-test.yml logs -f
```

## 🔍 測試訪問

```bash
# 1. 健康檢查
curl http://localhost:19000/healthz

# 2. 瀏覽器訪問
open http://localhost:19000

# 3. 你會看到 Twenty CRM 登入頁面（中文界面）
```

## 🛑 停止測試環境

```bash
# 停止並刪除容器
docker compose -f docker-compose.local-test.yml down

# 如果要刪除測試數據
docker compose -f docker-compose.local-test.yml down -v
rm -rf ./local-test/data/
```

## ✅ 確認不影響現有服務

```bash
# 測試前檢查
lsof -iTCP:8866 -sTCP:LISTEN  # 現有前端
lsof -iTCP:8867 -sTCP:LISTEN  # 現有後端

# 啟動 Docker 後再檢查
lsof -iTCP:8866 -sTCP:LISTEN  # 應該還在
lsof -iTCP:8867 -sTCP:LISTEN  # 應該還在
lsof -iTCP:19000 -sTCP:LISTEN # Docker 的新端口

# 三個端口應該都有服務在監聽
```

## 🎯 測試成功後

如果 Docker 測試環境運行正常：

1. 映像已經構建好了（twenty-zh-tw:latest）
2. 可以推送到 Docker Hub
3. 在 AWS 上直接拉取使用

## ⚠️ 注意事項

- 這是測試環境，使用獨立的數據庫
- 如果要恢復真實數據，需要另外操作
- 測試完記得停止容器釋放資源
