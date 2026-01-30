#!/bin/bash

# 從 AWS 取得所有資料表的完整 schema 定義
SCHEMA="workspace_3joxkr9ofo5hlxjan164egffx"

TABLES=(
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
echo "從 AWS 取得所有資料表的完整 schema"
echo "=========================================="
echo ""

for TABLE in "${TABLES[@]}"; do
  echo "=========================================="
  echo "資料表: $TABLE"
  echo "=========================================="

  ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
    "docker exec Y-CRM-postgres psql -U postgres -d default -c \"SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = '$SCHEMA' AND table_name = '$TABLE' ORDER BY ordinal_position;\"" 2>&1

  echo ""
done
