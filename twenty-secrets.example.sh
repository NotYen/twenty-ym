#!/bin/bash

# ==========================================
# Twenty CRM 敏感資訊配置範例
# ==========================================
# 此文件為範例，不包含真實的 API Keys
# 使用方式：
#   1. 複製此文件：cp twenty-secrets.example.sh twenty-secrets.sh
#   2. 編輯 twenty-secrets.sh，填入真實的 API Keys
#   3. twenty-secrets.sh 已在 .gitignore 中，不會被 commit
# ==========================================

# ==========================================
# AI 服務 API Keys
# ==========================================

# OpenAI API Key（主要推薦）
# 取得方式：https://platform.openai.com/api-keys
# 格式：sk-proj-xxxxxxxxxx
export OPENAI_API_KEY="your-openai-api-key-here"

# Anthropic Claude API Key（備用）
# 取得方式：https://console.anthropic.com/settings/keys
# 格式：sk-ant-api03-xxxxxxxxxx
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# xAI Grok API Key（備用）
# 取得方式：https://console.x.ai/
# 格式：xai-xxxxxxxxxx
export XAI_API_KEY=""

# ==========================================
# OpenAI Compatible API（如 Groq, Ollama）
# ==========================================

# Groq API 配置
# 註：Groq 免費模型不支援 JSON Schema，目前無法用於 Twenty CRM 的 AI 功能
# export OPENAI_COMPATIBLE_BASE_URL="https://api.groq.com/openai/v1"
# export OPENAI_COMPATIBLE_API_KEY="your-groq-api-key-here"
# export OPENAI_COMPATIBLE_MODEL_NAMES="llama-3.3-70b-versatile,llama-3.1-8b-instant"

# ==========================================
# 其他敏感配置（如需要）
# ==========================================

# 如果需要覆蓋資料庫密碼
# export POSTGRES_PASSWORD="your-password"

# 如果需要覆蓋應用密鑰
# export APP_SECRET="your-app-secret"

# ==========================================
# 使用說明
# ==========================================
echo "✅ AI API Keys 已載入（從 twenty-secrets.sh）"

