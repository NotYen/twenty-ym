#!/bin/bash

# ==========================================
# Twenty CRM: 全面檢查缺失字段
# ==========================================
# 功能：
# - 比對後端代碼定義與數據庫元數據
# - 找出所有缺失的標準字段
# - 不執行任何修改，僅生成報告
# ==========================================

set -e

echo "🔍 Twenty CRM: 全面檢查缺失字段"
echo "==========================================="
echo ""

# 加載配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/twenty-config.sh"

# 創建報告文件
REPORT_FILE="missing_fields_report_$(date +%Y%m%d_%H%M%S).txt"
echo "📋 報告文件: $REPORT_FILE"
echo ""

# 1. 獲取所有標準對象
echo "1️⃣  獲取所有標準對象..."
STANDARD_OBJECTS=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
SELECT \"nameSingular\"
FROM core.\"objectMetadata\"
WHERE \"isCustom\" = false
  AND \"workspaceId\" = (SELECT id FROM core.workspace LIMIT 1)
ORDER BY \"nameSingular\";
" | tr -d ' ')

OBJECT_COUNT=$(echo "$STANDARD_OBJECTS" | wc -l | tr -d ' ')
echo "   ✅ 找到 $OBJECT_COUNT 個標準對象"
echo ""

# 初始化報告
cat > "$REPORT_FILE" <<EOF
================================================================
Twenty CRM - 缺失字段檢查報告
================================================================
生成時間: $(date)
數據庫: ${POSTGRES_DB}
Workspace: $(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "SELECT id FROM core.workspace LIMIT 1;" | tr -d ' ')
================================================================

檢查對象總數: $OBJECT_COUNT

EOF

# 2. 檢查每個對象的字段
echo "2️⃣  檢查每個對象的字段定義..."
echo ""

TOTAL_MISSING=0
OBJECTS_WITH_ISSUES=0

for obj in $STANDARD_OBJECTS; do
    # 跳過空行
    if [ -z "$obj" ]; then
        continue
    fi

    echo "   📦 檢查: $obj"

    # 獲取後端定義的字段數量（從 standard-field-ids.ts）
    EXPECTED_FIELDS=$(grep -A 50 "export const $(echo $obj | tr '[:lower:]' '[:upper:]')_STANDARD_FIELD_IDS" packages/twenty-server/src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids.ts 2>/dev/null | grep ":" | grep -v "export\|const\|as const" | wc -l | tr -d ' ' || echo "0")

    # 獲取數據庫中的字段數量
    ACTUAL_FIELDS=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
    SELECT COUNT(*)
    FROM core.\"fieldMetadata\" fm
    JOIN core.\"objectMetadata\" om ON fm.\"objectMetadataId\" = om.id
    WHERE om.\"nameSingular\" = '$obj'
      AND fm.\"isCustom\" = false;
    " | tr -d ' ')

    # 比較
    if [ "$EXPECTED_FIELDS" -gt "0" ] && [ "$ACTUAL_FIELDS" -lt "$EXPECTED_FIELDS" ]; then
        MISSING=$((EXPECTED_FIELDS - ACTUAL_FIELDS))
        TOTAL_MISSING=$((TOTAL_MISSING + MISSING))
        OBJECTS_WITH_ISSUES=$((OBJECTS_WITH_ISSUES + 1))

        echo "      ⚠️  缺少 $MISSING 個字段 (預期: $EXPECTED_FIELDS, 實際: $ACTUAL_FIELDS)"

        # 寫入報告
        cat >> "$REPORT_FILE" <<EOF

----------------------------------------------------------------
對象: $obj
----------------------------------------------------------------
預期字段數: $EXPECTED_FIELDS
實際字段數: $ACTUAL_FIELDS
缺失字段數: $MISSING

數據庫中的字段:
EOF

        # 列出數據庫中的字段
        PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "
        SELECT '  - ' || fm.name || ' (' || fm.type || ')'
        FROM core.\"fieldMetadata\" fm
        JOIN core.\"objectMetadata\" om ON fm.\"objectMetadataId\" = om.id
        WHERE om.\"nameSingular\" = '$obj'
          AND fm.\"isCustom\" = false
        ORDER BY fm.name;
        " >> "$REPORT_FILE"

    elif [ "$EXPECTED_FIELDS" -eq "0" ]; then
        echo "      ℹ️  無法在 standard-field-ids.ts 中找到定義 (可能是自定義對象)"
    else
        echo "      ✅ 字段完整 ($ACTUAL_FIELDS/$EXPECTED_FIELDS)"
    fi
done

echo ""

# 3. 生成總結
cat >> "$REPORT_FILE" <<EOF

================================================================
檢查總結
================================================================
檢查對象總數: $OBJECT_COUNT
有問題的對象: $OBJECTS_WITH_ISSUES
缺失字段總數: $TOTAL_MISSING

EOF

if [ "$OBJECTS_WITH_ISSUES" -gt 0 ]; then
    cat >> "$REPORT_FILE" <<EOF
⚠️  發現缺失字段！

建議操作:
1. 查看詳細報告: cat $REPORT_FILE
2. 對於每個缺失字段，檢查後端 *.workspace-entity.ts 定義
3. 運行 workspace:sync-metadata 或手動添加缺失字段

注意:
- 某些字段可能是在新版本中添加的，需要手動同步
- 確保不影響現有數據和功能
- 建議先在測試環境中驗證
EOF
else
    cat >> "$REPORT_FILE" <<EOF
✅ 所有標準對象的字段定義都是完整的！

EOF
fi

echo "================================================================"
echo "檢查完成！"
echo "================================================================"
echo ""
echo "📊 檢查結果："
echo "   - 檢查對象: $OBJECT_COUNT 個"
echo "   - 有問題的對象: $OBJECTS_WITH_ISSUES 個"
echo "   - 缺失字段總數: $TOTAL_MISSING 個"
echo ""

if [ "$OBJECTS_WITH_ISSUES" -gt 0 ]; then
    echo "⚠️  發現缺失字段！"
    echo ""
    echo "📋 詳細報告已保存到: $REPORT_FILE"
    echo ""
    echo "💡 下一步建議："
    echo "   1. 查看報告: cat $REPORT_FILE"
    echo "   2. 對於關鍵字段，參考 fix_attachment_fileCategory.sh 創建修復腳本"
    echo "   3. 運行 workspace:sync-metadata 嘗試自動同步"
    echo ""
else
    echo "✅ 所有字段定義完整，無需修復！"
    echo ""
fi

