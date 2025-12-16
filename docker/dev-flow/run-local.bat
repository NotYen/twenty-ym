@echo off
setlocal

:: ==========================================
:: Twenty CRM Local Development Script
:: ==========================================
:: This script automates the setup and startup of the local dev environment.
:: It replaces the need for manual file copying and docker commands.
::
:: Author: Antigravity
:: ==========================================

:: Directory setup
:: Set the directory where this script is located
set "SCRIPT_DIR=%~dp0"

:: Set the Docker root directory (one level up from script)
set "DOCKER_DIR=%SCRIPT_DIR%.."

:: Define source and target environment files
:: We look for env.local in the user's specific path first
set "ENV_LOCAL_SOURCE=%DOCKER_DIR%\dev-local\env.local"
set "ENV_TARGET=%DOCKER_DIR%\.env"

echo ===================================================
echo   Twenty CRM Local Dev Tool
echo ===================================================
echo Script Location: %SCRIPT_DIR%
echo Docker Root:     %DOCKER_DIR%
echo Config Source:   %ENV_LOCAL_SOURCE%
echo ---------------------------------------------------
echo Workflow:
echo 1. Check if source config exists
echo 2. Copy env.local to .env
echo 3. Build and Start Docker Services
echo ===================================================
echo.

:: 1. Check Source File Existence
if not exist "%ENV_LOCAL_SOURCE%" (
    echo [WARN] Primary config not found at: %ENV_LOCAL_SOURCE%
    echo Search fallback: %DOCKER_DIR%\env.local

    if exist "%DOCKER_DIR%\env.local" (
        set "ENV_LOCAL_SOURCE=%DOCKER_DIR%\env.local"
        echo [INFO] Fallback config found.
    ) else (
        echo [ERROR] No configuration file found!
        echo Please ensure 'docker\dev-local\env.local' exists.
        pause
        exit /b 1
    )
)

:: 2. User Confirmation
set /p "CHOICE=Start build and services? (Y/N) [Default: Y]: "
if /i "%CHOICE%"=="N" (
    echo Operation cancelled by user.
    pause
    exit /b 0
)

echo.
echo [Step 1/3] Applying environment variables...
echo Copying "%ENV_LOCAL_SOURCE%" to "%ENV_TARGET%"
copy /y "%ENV_LOCAL_SOURCE%" "%ENV_TARGET%" > nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to copy file. Please check file permissions.
    pause
    exit /b 1
)
echo [OK] Environment variables applied.

echo.
echo [Step 2/3] Switching directory...
cd /d "%DOCKER_DIR%"
echo Current Directory: %CD%

echo.
echo [Step 3/3] Running Docker Compose...
echo Command: docker compose up -d --build
echo (This may take a few minutes...)
echo ---------------------------------------------------

docker compose up -d --build

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Docker command failed.
    echo Please make sure Docker Desktop is running.
    echo Check if ports 8866/8867 are already in use.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo [SUCCESS] Services are running in the background!
echo ===================================================
echo Next Steps:
echo 1. Wait a moment for DB and Server to initialize.
echo 2. Check status with: docker compose ps
echo 3. Access Frontend:   http://localhost:8866
echo.
echo To stop services run: docker compose down
echo ===================================================
pause
