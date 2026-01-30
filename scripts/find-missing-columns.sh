#!/bin/bash

# 找出本地環境缺少的欄位
SCHEMA="workspace_3joxkr9ofo5hlxjan164egffx"

# 需要同步的資料表
TABLES=(
  "company"
  "person"
  "opportunity"
  "task"
  "note"
  "attachment"
  "messageChannel"
  "timelineActivity"
  "workflow"
  "workflowRun"
  "workflowVersion"
  "favorite"
  "_pet"
  "_rocket"
  "_surveyResult"
)

echo "=========================================="
echo "找出本地環境缺少的欄位"
echo "=========================================="
echo ""

for TABLE in "${TABLES[@]}"; do
  echo "資料表: $TABLE"
  echo "------------------------------------------"

  # 取得 AWS 的所有欄位
  AWS_COLUMNS=$(ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
    "docker exec Y-CRM-postgres psql -U postgres -d default -t -c \"SELECT column_name FROM information_schema.columns WHERE table_schema = '$SCHEMA' AND table_name = '$TABLE' ORDER BY ordinal_position;\"" 2>/dev/null | tr -d ' ')

  # 取得本地的所有欄位
  LOCAL_COLUMNS=$(docker compose -f docker/docker-compose.yml exec -T postgres psql -U postgres -d default -t -c \
    "SELECT column_name FROM information_schema.columns WHERE table_schema = '$SCHEMA' AND table_name = '$TABLE' ORDER BY ordinal_position;" 2>/dev/null | tr -d ' ')

  # 找出 AWS 有但本地沒有的欄位
  MISSING_COLUMNS=""
  while IFS= read -r col; do
    if [ -n "$col" ] && ! echo "$LOCAL_COLUMNS" | grep -q "^${col}$"; then
      MISSING_COLUMNS="${MISSING_COLUMNS}${col}\n"
    fi
  done <<< "$AWS_COLUMNS"

  if [ -n "$MISSING_COLUMNS" ]; then
    echo "  ❌ 本地缺少的欄位:"
    echo -e "$MISSING_COLUMNS" | sed 's/^/     - /'
  else
    echo "  ✅ 沒有缺少欄位"
  fi

  # 找出本地有但 AWS 沒有的欄位
  EXTRA_COLUMNS=""
  while IFS= read -r col; do
    if [ -n "$col" ] && ! echo "$AWS_COLUMNS" | grep -q "^${col}$"; then
      EXTRA_COLUMNS="${EXTRA_COLUMNS}${col}\n"
    fi
  done <<< "$LOCAL_COLUMNS"

  if [ -n "$EXTRA_COLUMNS" ]; then
    echo "  ⚠️  本地多出的欄位:"
    echo -e "$EXTRA_COLUMNS" | sed 's/^/     + /'
  fi

  echo ""
done

echo "=========================================="
echo "檢查完成"
echo "=========================================="
