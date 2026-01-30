#!/bin/bash

# 詳細比對 AWS 和本地環境所有欄位的屬性
SCHEMA="workspace_3joxkr9ofo5hlxjan164egffx"

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
echo "詳細比對所有資料表的欄位屬性"
echo "=========================================="
echo ""

for TABLE in "${TABLES[@]}"; do
  echo "=========================================="
  echo "資料表: $TABLE"
  echo "=========================================="

  # 取得 AWS 的欄位定義
  AWS_SCHEMA=$(ssh -i ~/.ssh/y-crm-aws-key.pem ubuntu@52.195.151.185 \
    "docker exec Y-CRM-postgres psql -U postgres -d default -t -A -F'|' -c \"SELECT column_name, data_type, is_nullable, COALESCE(column_default, 'NULL') FROM information_schema.columns WHERE table_schema = '$SCHEMA' AND table_name = '$TABLE' ORDER BY ordinal_position;\"" 2>/dev/null)

  # 取得本地的欄位定義
  LOCAL_SCHEMA=$(docker compose -f docker/docker-compose.yml exec -T postgres psql -U postgres -d default -t -A -F'|' -c \
    "SELECT column_name, data_type, is_nullable, COALESCE(column_default, 'NULL') FROM information_schema.columns WHERE table_schema = '$SCHEMA' AND table_name = '$TABLE' ORDER BY ordinal_position;" 2>/dev/null)

  if [ -z "$AWS_SCHEMA" ]; then
    echo "  ⚠️  AWS 環境沒有此資料表"
    echo ""
    continue
  fi

  if [ -z "$LOCAL_SCHEMA" ]; then
    echo "  ⚠️  本地環境沒有此資料表"
    echo ""
    continue
  fi

  # 比對每個欄位
  HAS_DIFF=false
  while IFS='|' read -r col_name data_type is_null col_default; do
    if [ -z "$col_name" ]; then continue; fi

    # 在本地 schema 中查找相同欄位
    LOCAL_COL=$(echo "$LOCAL_SCHEMA" | grep "^${col_name}|")

    if [ -z "$LOCAL_COL" ]; then
      echo "  ❌ 本地缺少欄位: $col_name"
      HAS_DIFF=true
    else
      LOCAL_DATA_TYPE=$(echo "$LOCAL_COL" | cut -d'|' -f2)
      LOCAL_IS_NULL=$(echo "$LOCAL_COL" | cut -d'|' -f3)
      LOCAL_DEFAULT=$(echo "$LOCAL_COL" | cut -d'|' -f4)

      # 比對屬性
      if [ "$is_null" != "$LOCAL_IS_NULL" ]; then
        echo "  ⚠️  欄位 $col_name 的 nullable 不一致:"
        echo "      AWS: is_nullable=$is_null"
        echo "      本地: is_nullable=$LOCAL_IS_NULL"
        HAS_DIFF=true
      fi

      if [ "$col_default" != "$LOCAL_DEFAULT" ] && [ "$col_default" != "NULL" ] && [ "$LOCAL_DEFAULT" != "NULL" ]; then
        # 忽略一些常見的等價 default 值差異
        if ! [[ ("$col_default" == "''::text" && "$LOCAL_DEFAULT" == "") || \
                ("$col_default" == "" && "$LOCAL_DEFAULT" == "''::text") || \
                ("$col_default" =~ "uuid_generate_v4()" && "$LOCAL_DEFAULT" =~ "uuid_generate_v4()") ]]; then
          echo "  ⚠️  欄位 $col_name 的 default 不一致:"
          echo "      AWS: $col_default"
          echo "      本地: $LOCAL_DEFAULT"
          HAS_DIFF=true
        fi
      fi
    fi
  done <<< "$AWS_SCHEMA"

  # 檢查本地多出的欄位
  while IFS='|' read -r col_name data_type is_null col_default; do
    if [ -z "$col_name" ]; then continue; fi

    AWS_COL=$(echo "$AWS_SCHEMA" | grep "^${col_name}|")
    if [ -z "$AWS_COL" ]; then
      echo "  ℹ️  本地多出欄位: $col_name (保留)"
      HAS_DIFF=true
    fi
  done <<< "$LOCAL_SCHEMA"

  if [ "$HAS_DIFF" = false ]; then
    echo "  ✅ 所有欄位屬性一致"
  fi

  echo ""
done

echo "=========================================="
echo "檢查完成"
echo "=========================================="
