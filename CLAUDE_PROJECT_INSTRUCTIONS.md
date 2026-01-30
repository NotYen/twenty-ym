# Y-CRM 專案 - Claude Project Custom Instructions

> 這是給 Claude Projects 使用的精簡版指南。完整版在專案的 `.kiro/steering/y-crm-expert-guide.md`

## 🎯 核心原則（必須遵守）

1. ✅ **參考原本開源的設計架構跟邏輯** - Twenty 是高品質的開源項目
2. ✅ **不影響其他正常執行的功能** - 確保穩定性
3. ✅ **保留本地所有修改** - 包括服務、bugfix、新功能、繁中文案、Line@功能
4. ✅ **保留效能優化** - 頁面切換速度優化不能被破壞

## 🏗️ 專案架構速查

**技術棧**：
- 前端：React 18 + TypeScript + Vite + Recoil + Apollo Client
- 後端：NestJS + TypeORM + GraphQL + PostgreSQL + Redis
- 任務隊列：BullMQ + @nestjs/schedule

**Monorepo 結構**：
```
packages/
├── twenty-front/    # 前端（React）
├── twenty-server/   # 後端（NestJS）
├── twenty-shared/   # 共用程式碼
└── twenty-ui/       # UI 組件庫
```

## 🚨 常見問題速查

### Import 問題（最常見）
- 檢查檔案路徑是否正確
- 檢查 Module 是否已註冊
- 檢查 Entity 是否在 `TypeOrmModule.forFeature()` 中

### Entity 與 DB Schema 不一致
- Entity `@Column` 類型必須與 DB schema 一致
- Migration 後要同步更新 Entity 定義

### Redis FLUSHALL 後 CRON Jobs 消失
```bash
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
sleep 10
docker exec Y-CRM-backend yarn command:prod cron:register:all
```

### Metadata 同步
**需要 sync-metadata**：新增 Object/欄位、修改類型、修改 label（程式碼）
**不需要**：修改前端 UI、修改 API 邏輯、直接改 DB label（SQL）

```bash
docker exec Y-CRM-backend npx nx run twenty-server:command workspace:sync-metadata
docker exec Y-CRM-redis redis-cli FLUSHALL
docker restart Y-CRM-backend Y-CRM-worker
```

## 📋 快速參考

### 修改類型與所需操作

| 修改類型 | Build | sync-metadata | 清 Cache |
|---------|-------|---------------|---------|
| 新增 Object/欄位 | ✅ | ✅ | ✅ |
| 修改 label（程式碼） | ✅ | ✅ | ✅ |
| 修改 label（SQL） | ❌ | ❌ | ✅ |
| 修改前端 UI | ✅ | ❌ | ❌ |

### Commit 格式
```
[Type] 詳細描述（繁體中文）
```
Type: Fix, Hotfix, Add, Modify, Change, Clean, Disable, Remove, Upgrade, Revert

### i18n 翻譯
```typescript
// ✅ 正確
import { t } from '@lingui/core/macro';
const label = t`English text`;

// ❌ 錯誤
const label = "中文文字";
```

### Debug Log
```typescript
// ✅ 正確
import { logDebug } from '~/utils/logDebug';
logDebug('Message', data);

// ❌ 禁止
console.log('Message', data);
```

## 🔧 診斷命令

```bash
# 檢查服務
docker ps

# 檢查死元組
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -c \
  "SELECT relname, n_dead_tup FROM pg_stat_user_tables WHERE n_dead_tup > 0;"

# 檢查 CRON jobs
docker exec Y-CRM-redis redis-cli KEYS 'bull:cron-queue:repeat:*' | wc -l

# 清理死元組
VACUUM ANALYZE workspace_xxx.workflow;
```

## 📚 完整文檔位置

- 完整專家指南：`.kiro/steering/y-crm-expert-guide.md`
- 開發規則：`.kiro/steering/rules.md`
- 技術入門：`docs/技術入門指南.md`
- 專案結構：`docs/Guides/Twenty_專案結構指南.md`
- 效能優化：`docs/web_performance_ptimization(WPO)/PERFORMANCE_OPTIMIZATION_COMPLETE.md`
- Cherry-pick 記錄：`docs/CHERRY_PICK_RECORD.md`

---

**使用建議**：
- 在 Claude 中快速諮詢問題時，這個精簡版就夠用
- 需要深入了解時，參考專案中的完整文檔
- 實際寫程式碼時，在 Kiro 中使用完整版指南
