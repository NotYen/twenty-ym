#!/bin/bash

# ==========================================
# Twenty CRM 统一配置文件
# ==========================================
# 只需要修改这个文件，所有配置都会自动更新

# 獲取腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ==========================================
# 外部访问 IP 或域名（重要！）
# ==========================================
# 使用 nip.io 魔法 DNS 服务，无需真实域名即可实现多租户
# 格式: IP.nip.io 会自动解析到对应的 IP 地址
# 支持子域名: workspace1.118.168.188.27.nip.io
export EXTERNAL_HOST="118.168.188.27.nip.io"
# 生产环境时再改为真实域名: export EXTERNAL_HOST="your-domain.com"

# ==========================================
# 端口配置
# ==========================================
export FRONTEND_PORT=8866
export BACKEND_PORT=8867
export POSTGRES_PORT=5432
export REDIS_PORT=6379

# PostgreSQL 憑證
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD="postgres"
export POSTGRES_DB="default"

# ==========================================
# 自动生成的 URL（不要手动修改）
# ==========================================
export FRONTEND_URL="http://${EXTERNAL_HOST}:${FRONTEND_PORT}"
export BACKEND_URL="http://${EXTERNAL_HOST}:${BACKEND_PORT}"
export POSTGRES_URL="postgres://postgres:postgres@localhost:${POSTGRES_PORT}/default"
export REDIS_URL="redis://localhost:${REDIS_PORT}"

# ==========================================
# 应用配置
# ==========================================
export APP_SECRET="replace_me_with_a_random_string"
# ==========================================
# 開發環境設定
#export NODE_ENV="development"
#export IS_DEBUG_MODE="true" # Recoil Debug Observer 開關：true 會顯示 recoil state log（會導致卡頓）
#export VITE_IS_DEBUG_MODE="true"
# ==========================================

# ==========================================
# Production 環境設定
export NODE_ENV="production" #development 开发环境 production 生产环境
export IS_DEBUG_MODE="false" # Recoil Debug Observer 開關：true 會顯示 recoil state log（會導致卡頓）
export VITE_IS_DEBUG_MODE="true" # 前端除錯開關：true 會在瀏覽器 Console 顯示 debug log
# ==========================================

export SIGN_IN_PREFILLED="false" # true 预填登入信息 false 不预填登入信息

# ==========================================
# 多租户配置（Multi-Workspace）
# ==========================================
# 启用多 Workspace 模式
# true = 多租户模式（SaaS 场景，通过子域名区分不同 workspace）
# false = 单租户模式（单一 workspace，适合企业内部使用）
export IS_MULTIWORKSPACE_ENABLED="false"

# 限制只有超级管理员可以创建新 Workspace
# false = 任何人都可以创建
# true = 只有超级管理员可以创建（推荐用于 SaaS 场景）
export IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS="true"

# 默认子域名（仅在多租户模式下使用，单租户模式下无效）
# 注意：DEFAULT_SUBDOMAIN 不应该与任何真实 workspace 的 subdomain 相同
# 它仅用于从基础 URL 跳转到默认 workspace
export DEFAULT_SUBDOMAIN="app"

# ==========================================
# 计费配置（Billing）
# ==========================================
# 禁用计费功能（开发环境）
export IS_BILLING_ENABLED="false"
# 提供一个占位符 API Key 防止启动失败（billing 已禁用，不会实际使用）
export BILLING_STRIPE_API_KEY="sk_test_placeholder_key_for_development"
export BILLING_STRIPE_BASE_PLAN_PRODUCT_ID="prod_placeholder"

# ==========================================
# 邮件配置（SMTP）
# ==========================================
# 邮件驱动: LOGGER (仅记录日志) 或 SMTP (实际发送)
export EMAIL_DRIVER="SMTP"

# Gmail SMTP 设置
export EMAIL_SMTP_HOST="smtp.gmail.com"
export EMAIL_SMTP_PORT="587"
export EMAIL_SMTP_USER="notyenyu@gmail.com"
export EMAIL_SMTP_PASSWORD="sjieffbmlhdyoyqk"
export EMAIL_FROM_ADDRESS="notyenyu@gmail.com"
export EMAIL_FROM_NAME="Twenty_CRM"

# ==========================================
# Google OAuth 配置（Gmail 和 Calendar 整合）
# ==========================================

# ⚠️ 重要：請先按照 Google_OAuth_配置指南.md 在 Google Cloud Console 創建 OAuth 憑證
#
# 啟用 Gmail 整合（用戶可在 Twenty 中查看 Gmail 郵件）
export MESSAGING_PROVIDER_GMAIL_ENABLED="true"

# 啟用 Google Calendar 整合（用戶可在 Twenty 中查看 Google Calendar）
export CALENDAR_PROVIDER_GOOGLE_ENABLED="true"

# Google OAuth 憑證（從 Google Cloud Console 獲取）
# 1. 訪問 https://console.cloud.google.com/apis/credentials
# 2. 創建 OAuth 2.0 客戶端 ID
# 3. 複製 Client ID 和 Client Secret 到下面
export AUTH_GOOGLE_CLIENT_ID="84795211297-sgo99e598e7vjg8gqhfqfk43fr41obdq.apps.googleusercontent.com"
export AUTH_GOOGLE_CLIENT_SECRET="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"

# Google OAuth 回調 URL（根據您的 EXTERNAL_HOST 和 BACKEND_PORT 自動生成）
# ⚠️ 請確保這些 URL 與 Google Cloud Console 中的「授權的重定向 URI」完全一致
export AUTH_GOOGLE_CALLBACK_URL="${BACKEND_URL}/auth/google/redirect"
export AUTH_GOOGLE_APIS_CALLBACK_URL="${BACKEND_URL}/auth/google-apis/get-access-token"

# 可選：啟用 Google SSO 登入（如果需要 Google 帳號登入功能）
# export AUTH_GOOGLE_ENABLED="false"

# ==========================================
# AI 服務配置
# ==========================================
# ⚠️ API Keys 已移至 twenty-secrets.sh（不會 commit 到 Git）
# ⚠️ 如果 twenty-secrets.sh 存在，會自動載入

# 載入敏感資訊（API Keys）
if [ -f "${SCRIPT_DIR}/twenty-secrets.sh" ]; then
    source "${SCRIPT_DIR}/twenty-secrets.sh"
else
    echo "⚠️  警告：twenty-secrets.sh 不存在"
    echo "   請創建該文件並配置 API Keys"
    echo "   參考：twenty-secrets.example.sh"
fi

# 說明：
# - GPT-4o Mini：成本低、速度快、品質好
# - 完整支援 JSON Schema, Function Calling
# - Twenty CRM 官方推薦
# - 可用模型：gpt-4o, gpt-4o-mini, gpt-4-turbo
# - API Keys 配置位置：twenty-secrets.sh


# ==========================================
# 显示配置信息
# ==========================================
if [ "$1" = "--show" ]; then
    echo "==================================="
    echo "Twenty CRM 配置信息"
    echo "==================================="
    echo "外部主机: ${EXTERNAL_HOST}"
    echo "前端地址: ${FRONTEND_URL}"
    echo "后端地址: ${BACKEND_URL}"
    echo "==================================="
fi

