# Workspace Schema 映射機制說明

**日期**：2026-01-27
**問題**：本地恢復 AWS 備份後，無法登入，報錯 `column workspaceMember.searchVector does not exist`

---

## 核心概念：Workspace ID 到 Schema 名稱的映射

Twenty 使用 **UUID to Base36** 轉換來生成 workspace schema 名稱。

### 映射邏輯

```typescript
// 位置：packages/twenty-shared/src/utils/uuidToBase36.ts
export const uuidToBase36 = (uuid: string): string => {
  const hexString = uuid.replace(/-/g, '');        // 1. 移除連字號
  const base10Number = BigInt('0x' + hexString);   // 2. Hex 轉 BigInt
  const base36String = base10Number.toString(36);  // 3. 轉 Base36
  return base36String;
};

// 位置：packages/twenty-server/src/engine/workspace-datasource/utils/get-workspace-schema-name.util.ts
export const getWorkspaceSchemaName = (workspaceId: string): string => {
  return `workspace_${uuidToBase36(workspaceId)}`;
};
```

### 實際範例

| Workspace | UUID (core.workspace.id) | Schema 名稱 |
|-----------|-------------------------|-------------|
| Y-CRM (youngming) | `3be9d202-5461-4881-a6de-4c1f96e4b02d` | `workspace_3joxkr9ofo5hlxjan164egffx` |
| Calleen公司 | `43a9f4b1-b6d2-4833-ba18-7c3f87830e5c` | `workspace_1g99wpzrdddsuiagn4k5gsecx` |
| HOPET | `61ceaecb-434b-4891-8195-d173f8fd8a29` | `workspace_2c96vz4nsg10zwua9xejof4m` |

---

## 如何驗證映射

### 方法 1：使用 Node.js

```bash
node -e "
const uuid = '3be9d202-5461-4881-a6de-4c1f96e4b02d';
const hexString = uuid.replace(/-/g, '');
const base10Number = BigInt('0x' + hexString);
const base36String = base10Number.toString(36);
console.log('Schema:', 'workspace_' + base36String);
"
```

### 方法 2：查詢資料庫

```sql
-- 列出所有 workspace 和預期的 schema 名稱
SELECT
  w.subdomain,
  w."displayName",
  w.id as workspace_uuid,
  'workspace_' || LOWER(
    -- PostgreSQL 沒有內建 Base36 轉換，需要用程式碼驗證
  ) as expected_schema
FROM core.workspace w
ORDER BY w.subdomain;

-- 列出實際存在的 schema
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name LIKE 'workspace_%'
ORDER BY schema_name;
```

---

## 常見問題

### Q1: 為什麼 `core.workspace` 的 ID 和 schema 名稱看起來不一樣？

**A**: 因為 schema 名稱使用 **Base36 編碼**，而 `core.workspace.id` 是標準的 **UUID 格式**（帶連字號）。

- UUID: `3be9d202-5461-4881-a6de-4c1f96e4b02d`
- Hex (移除連字號): `3be9d20254614881a6de4c1f96e4b02d`
- Base36: `3joxkr9ofo5hlxjan164egffx`
- Schema: `workspace_3joxkr9ofo5hlxjan164egffx`

### Q2: 如何找到某個 workspace 對應的 schema？

**A**: 使用 `getWorkspaceSchemaName` 函數或手動轉換：

```typescript
import { uuidToBase36 } from 'twenty-shared/utils';

const workspaceId = '3be9d202-5461-4881-a6de-4c1f96e4b02d';
const schemaName = `workspace_${uuidToBase36(workspaceId)}`;
console.log(schemaName); // workspace_3joxkr9ofo5hlxjan164egffx
```

### Q3: 為什麼不直接用 UUID 作為 schema 名稱？

**A**: Base36 編碼的優點：
1. **更短**：32 字元 hex → 25 字元 base36
2. **URL 友善**：只包含 0-9 和 a-z
3. **PostgreSQL 相容**：schema 名稱有長度限制

---

## 本次問題分析

### 問題現象

用戶 `notyenyu@gmail.com` 登入時報錯：
```
column workspaceMember.searchVector does not exist
```

錯誤發生在 `workspace_3joxkr9ofo5hlxjan164egffx` (Y-CRM workspace)

### 根本原因

1. 從 AWS 恢復資料庫備份到本地
2. Y-CRM workspace 的 `workspaceMember` 表缺少 `searchVector` 欄位
3. AWS 環境正常（有 `searchVector` 欄位）
4. 可能是備份時該欄位尚未建立，或恢復過程中遺失

### 解決方案

手動新增 `searchVector` 欄位：

```sql
ALTER TABLE workspace_3joxkr9ofo5hlxjan164egffx."workspaceMember"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple'::regconfig,
    (((COALESCE(unaccent_immutable("nameFirstName"), ''::text) || ' '::text) ||
      COALESCE(unaccent_immutable("nameLastName"), ''::text)) || ' '::text) ||
    COALESCE(unaccent_immutable("userEmail"), ''::text)
  )
) STORED;

CREATE INDEX IF NOT EXISTS "IDX_e47451872f70c8f187a6b460ac7"
ON workspace_3joxkr9ofo5hlxjan164egffx."workspaceMember"
USING gin ("searchVector");
```

### 後續步驟

1. ✅ 新增 `searchVector` 欄位
2. ✅ 清除 Redis cache: `docker compose exec redis redis-cli FLUSHALL`
3. ✅ 重啟服務: `docker compose restart backend worker`
4. ✅ 重新註冊 CRON jobs: `docker compose exec backend yarn command:prod cron:register:all`

---

## 檢查所有 workspace 的 searchVector 欄位

```bash
# 檢查所有 workspace 的 workspaceMember.searchVector
for schema in $(docker compose exec postgres psql -U postgres -d default -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace_%' ORDER BY schema_name;"); do
  schema=$(echo $schema | tr -d ' ')
  if [ ! -z "$schema" ]; then
    result=$(docker compose exec postgres psql -U postgres -d default -t -c "SELECT column_name FROM information_schema.columns WHERE table_schema = '$schema' AND table_name = 'workspaceMember' AND column_name = 'searchVector';" 2>&1)
    if echo "$result" | grep -q "searchVector"; then
      echo "✅ $schema: searchVector 存在"
    else
      echo "❌ $schema: searchVector 不存在"
    fi
  fi
done
```

---

## 參考資料

- **映射函數位置**：
  - `packages/twenty-shared/src/utils/uuidToBase36.ts`
  - `packages/twenty-server/src/engine/workspace-datasource/utils/get-workspace-schema-name.util.ts`

- **使用範例**：
  - `packages/twenty-server/src/modules/calendar/calendar-event-import-manager/crons/jobs/*.ts`
  - `packages/twenty-server/src/modules/messaging/message-import-manager/crons/jobs/*.ts`

---

**最後更新**：2026-01-27
**維護者**：Kiro AI Assistant
