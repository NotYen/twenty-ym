#!/bin/bash

# 比較 AWS 和本地環境的所有資料表欄位
SCHEMA="workspace_3joxkr9ofo5hlxjan164egffx"

# 需要檢查的核心資料表（排除 view 相關和舊的 _salesquote）
TABLES=(
  "company"
  "person"
  "opportunity"
  "task"
  "note"
  "attachment"
  "workspaceMember"
  "salesQuote"
  "salesQuoteLineItem"
  "message"
  "messageChannel"
  "messageThread"
  "messageParticipant"
  "calendarEvent"
  "calendarChannel"
  "connectedAccount"
  "timelineActivity"
  "workflow"
  "workflowRun"
  "workflowVersion"
  "dashboard"
  "favorite"
  "blocklist"
  "_pet"
  "_rocket"
  "_surveyResult"
  "_yeJiMuBiao"
)

echo "=========================================="
echo "比較 AWS 和本地環境的資料表欄位"
echo "=========================================="
echo ""

for TABLE in "${TABLES[@]}"; do
  echo "檢查資料表: $TABLE"
  echo "------------------------------------------"

  # 取得 AWS 欄位數量
  AWS_COUNT=$(ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
    "docker exec Y-CRM-postgres psql -U postgres -d default -t -c \"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '$SCHEMA' AND table_name = '$TABLE';\"" 2>/dev/null | tr -d ' ')

  # 取得本地欄位數量
  LOCAL_COUNT=$(docker compose -f docker/docker-compose.yml exec -T postgres psql -U postgres -d default -t -c \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '$SCHEMA' AND table_name = '$TABLE';" 2>/dev/null | tr -d ' ')

  if [ -z "$AWS_COUNT" ] || [ "$AWS_COUNT" = "0" ]; then
    echo "  ⚠️  AWS 環境沒有此資料表"
  elif [ -z "$LOCAL_COUNT" ] || [ "$LOCAL_COUNT" = "0" ]; then
    echo "  ⚠️  本地環境沒有此資料表"
  elif [ "$AWS_COUNT" != "$LOCAL_COUNT" ]; then
    echo "  ❌ 欄位數量不一致: AWS=$AWS_COUNT, 本地=$LOCAL_COUNT"
    echo "     需要同步！"
  else
    echo "  ✅ 欄位數量一致: $AWS_COUNT 個欄位"
  fi

  echo ""
done

echo "=========================================="
echo "檢查完成"
echo "=========================================="
