@echo off
REM ==========================================
REM Twenty CRM 本地開發模式啟動腳本
REM ==========================================
REM 用於在本地啟動開發伺服器，連接到 Docker 的資料庫
REM ==========================================

echo.
echo ========================================
echo  Twenty CRM - 本地開發模式
echo ========================================
echo.

REM 檢查 Docker 容器是否運行
echo [1/4] 檢查 Docker 資料庫和 Redis...
docker ps | findstr "twenty-db-test" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Docker 資料庫容器未運行
    echo 正在啟動 Docker 資料庫和 Redis...
    echo.
    docker-compose -f deployment/docker-compose.local-test.yml up -d db-test redis-test
    echo.
    echo ⏳ 等待資料庫啟動...
    timeout /t 5 /nobreak >nul
    echo ✅ 資料庫已啟動
) else (
    echo ✅ Docker 資料庫和 Redis 正在運行
)
echo.

REM 停止 Docker 中的 server（避免端口衝突）
echo [2/4] 停止 Docker 中的 Twenty Server（避免端口衝突）...
docker-compose -f deployment/docker-compose.local-test.yml stop server-test worker-test >nul 2>&1
echo ✅ 已停止 Docker Server
echo.

REM 設置環境變數（指向 .env.local）
echo [3/4] 設置環境變數...
set NODE_ENV=development
echo ✅ 環境變數已設置
echo.

REM 啟動本地開發伺服器
echo [4/4] 啟動本地開發伺服器...
echo.
echo ========================================
echo  🚀 啟動中...
echo ========================================
echo.
echo 📝 說明：
echo    - 後端伺服器: http://localhost:3000
echo    - 前端應用:   http://localhost:3001
echo    - 資料庫:     localhost:15432 (Docker)
echo    - Redis:      localhost:16379 (Docker)
echo.
echo 💡 提示：
echo    - 程式碼修改會自動重新載入（Hot Reload）
echo    - 按 Ctrl+C 可以停止伺服器
echo.
echo ========================================
echo.

REM 啟動開發伺服器
yarn dev:local

echo.
echo ========================================
echo 👋 本地開發模式已停止
echo ========================================
echo.
pause
