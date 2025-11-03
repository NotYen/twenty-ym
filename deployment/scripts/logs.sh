#!/bin/bash
# ==========================================
# Twenty CRM 日誌查看腳本
# ==========================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 如果沒有參數，顯示所有服務
if [ $# -eq 0 ]; then
    echo "📋 Twenty CRM 日誌（所有服務）"
    echo "按 Ctrl+C 退出"
    echo ""
    docker compose logs -f --tail=50
else
    echo "📋 Twenty CRM 日誌 ($1)"
    echo "按 Ctrl+C 退出"
    echo ""
    docker compose logs -f --tail=50 "$1"
fi
