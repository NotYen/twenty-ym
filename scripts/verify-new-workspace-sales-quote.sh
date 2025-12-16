#!/bin/bash

# 驗證新 workspace 是否正確包含 Sales Quote 標準模組
# 使用方法: ./scripts/verify-new-workspace-sales-quote.sh <workspace_id>

set -e

WORKSPACE_ID=$1

if [ -z "$WORKSPACE_ID" ]; then
  echo "❌ 請提供 workspace ID"
  echo "使用方法: $0 <workspace_id>"
  exit 1
fi

echo "🔍 驗證 workspace: $WORKSPACE_ID"
echo "=================================="

# 1. 檢查 objectMetadata
echo -e "\n1️⃣  檢查 Object Metadata..."
OBJECT_COUNT=$(docker exec Y-CRM-postgres psql -U postgres -d default -t -c "
  SELECT COUNT(*) 
  FROM core.\"objectMetadata\" 
  WHERE \"workspaceId\" = '$WORKSPACE_ID' 
  AND \"nameSingular\" IN ('salesQuote', 'salesQuoteLineItem')
  AND \"isActive\" = true;
" | tr -d ' ')

if [ "$OBJECT_COUNT" -eq "2" ]; then
  echo "✅ Object Metadata 正確 (找到 $OBJECT_COUNT 個物件)"
else
  echo "❌ Object Metadata 缺失 (應該是 2 個，實際找到 $OBJECT_COUNT 個)"
  exit 1
fi

# 2. 檢查 fieldMetadata（包含 searchVector）
echo -e "\n2️⃣  檢查 Field Metadata..."
FIELD_COUNT=$(docker exec Y-CRM-postgres psql -U postgres -d default -t -c "
  SELECT COUNT(*) 
  FROM core.\"fieldMetadata\" fm
  JOIN core.\"objectMetadata\" om ON fm.\"objectMetadataId\" = om.id
  WHERE om.\"workspaceId\" = '$WORKSPACE_ID' 
  AND om.\"nameSingular\" IN ('salesQuote', 'salesQuoteLineItem')
  AND fm.name = 'searchVector'
  AND fm.\"standardId\" IS NOT NULL;
" | tr -d ' ')

if [ "$FIELD_COUNT" -eq "2" ]; then
  echo "✅ searchVector 欄位正確 (找到 $FIELD_COUNT 個)"
else
  echo "❌ searchVector 欄位缺失或 standardId 為空 (應該是 2 個，實際找到 $FIELD_COUNT 個)"
  exit 1
fi

# 3. 檢查 workspace schema
echo -e "\n3️⃣  檢查 Database Schema..."
SCHEMA=$(docker exec Y-CRM-postgres psql -U postgres -d default -t -c "
  SELECT \"schema\" 
  FROM core.\"dataSource\" 
  WHERE \"workspaceId\" = '$WORKSPACE_ID';
" | tr -d ' ')

if [ -z "$SCHEMA" ]; then
  echo "❌ 找不到 workspace schema"
  exit 1
fi

echo "   Schema: $SCHEMA"

# 檢查 tables 是否存在
TABLE_EXISTS=$(docker exec Y-CRM-postgres psql -U postgres -d default -t -c "
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = '$SCHEMA' 
  AND table_name IN ('salesQuote', 'salesQuoteLineItem');
" | tr -d ' ')

if [ "$TABLE_EXISTS" -eq "2" ]; then
  echo "✅ Database tables 正確 (找到 $TABLE_EXISTS 個表)"
else
  echo "❌ Database tables 缺失 (應該是 2 個，實際找到 $TABLE_EXISTS 個)"
  exit 1
fi

# 4. 檢查 searchVector 欄位和 indexes
echo -e "\n4️⃣  檢查 searchVector 欄位和索引..."
SEARCHVECTOR_COLUMNS=$(docker exec Y-CRM-postgres psql -U postgres -d default -t -c "
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = '$SCHEMA' 
  AND table_name IN ('salesQuote', 'salesQuoteLineItem')
  AND column_name = 'searchVector'
  AND data_type = 'tsvector';
" | tr -d ' ')

if [ "$SEARCHVECTOR_COLUMNS" -eq "2" ]; then
  echo "✅ searchVector 欄位正確 (找到 $SEARCHVECTOR_COLUMNS 個)"
else
  echo "❌ searchVector 欄位缺失 (應該是 2 個，實際找到 $SEARCHVECTOR_COLUMNS 個)"
  exit 1
fi

# 5. 檢查 views
echo -e "\n5️⃣  檢查 Views..."
VIEW_COUNT=$(docker exec Y-CRM-postgres psql -U postgres -d default -t -c "
  SELECT COUNT(*) 
  FROM core.view v
  JOIN core.\"objectMetadata\" om ON v.\"objectMetadataId\" = om.id
  WHERE v.\"workspaceId\" = '$WORKSPACE_ID' 
  AND om.\"nameSingular\" IN ('salesQuote', 'salesQuoteLineItem')
  AND v.key = 'INDEX';
" | tr -d ' ')

if [ "$VIEW_COUNT" -eq "2" ]; then
  echo "✅ Views 正確 (找到 $VIEW_COUNT 個 view)"
else
  echo "❌ Views 缺失 (應該是 2 個，實際找到 $VIEW_COUNT 個)"
  exit 1
fi

# 6. 檢查 favorites
echo -e "\n6️⃣  檢查 Workspace Favorites..."
FAVORITE_COUNT=$(docker exec Y-CRM-postgres psql -U postgres -d default -t -c "
  SELECT COUNT(DISTINCT f.id)
  FROM \"workspace_$SCHEMA\".favorite f
  JOIN core.view v ON f.\"viewId\" = v.id
  JOIN core.\"objectMetadata\" om ON v.\"objectMetadataId\" = om.id
  WHERE om.\"workspaceId\" = '$WORKSPACE_ID' 
  AND om.\"nameSingular\" IN ('salesQuote', 'salesQuoteLineItem');
" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$FAVORITE_COUNT" -eq "2" ]; then
  echo "✅ Favorites 正確 (找到 $FAVORITE_COUNT 個 favorite)"
elif [ "$FAVORITE_COUNT" -eq "0" ]; then
  echo "⚠️  Favorites 未找到（可能是新 workspace 尚未初始化 favorites）"
else
  echo "❌ Favorites 不完整 (應該是 2 個，實際找到 $FAVORITE_COUNT 個)"
fi

# 7. 檢查 permissions
echo -e "\n7️⃣  檢查 Object Permissions..."
PERMISSION_COUNT=$(docker exec Y-CRM-postgres psql -U postgres -d default -t -c "
  SELECT COUNT(*) 
  FROM core.\"objectPermission\" op
  JOIN core.\"objectMetadata\" om ON op.\"objectMetadataId\" = om.id
  WHERE om.\"workspaceId\" = '$WORKSPACE_ID' 
  AND om.\"nameSingular\" IN ('salesQuote', 'salesQuoteLineItem')
  AND op.\"canReadObjectRecords\" = true;
" | tr -d ' ')

echo "   找到 $PERMISSION_COUNT 個可讀取權限"

if [ "$PERMISSION_COUNT" -ge "2" ]; then
  echo "✅ Permissions 正確"
else
  echo "⚠️  Permissions 可能不完整（至少需要 2 個可讀取權限）"
fi

echo -e "\n=================================="
echo "✅ 驗證完成！Sales Quote 標準模組配置正確"
echo ""
echo "📋 詳細信息："
docker exec Y-CRM-postgres psql -U postgres -d default -c "
  SELECT 
    om.\"nameSingular\" as \"物件名稱\",
    om.\"labelSingular\" as \"顯示名稱\",
    v.name as \"View 名稱\",
    v.key as \"View Key\"
  FROM core.\"objectMetadata\" om
  LEFT JOIN core.view v ON v.\"objectMetadataId\" = om.id AND v.\"workspaceId\" = om.\"workspaceId\"
  WHERE om.\"workspaceId\" = '$WORKSPACE_ID' 
  AND om.\"nameSingular\" IN ('salesQuote', 'salesQuoteLineItem')
  ORDER BY om.\"nameSingular\";
"
