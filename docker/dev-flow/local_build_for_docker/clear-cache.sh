#!/bin/bash
# =============================================================================
# clear-cache.sh - 清除本地環境所有快取
# =============================================================================
#
# 使用時機：
# - 還原資料庫後出現 metadata mismatch
# - 出現 "Could not find flat entity in maps" 錯誤
# - 前端顯示異常或資料不同步
#
# =============================================================================

set -euo pipefail

info() { printf '🔹 %s\n' "$1"; }
success() { printf '✅ %s\n' "$1"; }

echo "🧹 清除本地環境快取..."
echo ""

# 清除 Redis
info "清除 Redis 快取..."
docker exec Y-CRM-redis redis-cli FLUSHALL
success "Redis 快取已清除"

# 重啟 Backend 和 Worker
info "重啟 Backend 和 Worker..."
docker restart Y-CRM-backend Y-CRM-worker
success "服務已重啟"

echo ""
success "快取清除完成！"
echo ""
echo "📋 請記得也清除瀏覽器快取："
echo "   DevTools (F12) → Application → Storage → Clear site data"
echo ""
