# Super Admin 管理功能

## 功能概述

Super Admin 是一個全域角色，擁有此角色的用戶可以存取所有工作區的「進階設定 (Advanced Settings)」頁面。

## 設計架構

### 方案：全域 Super Admin

- **Primary Super Admin**：硬編碼為 `notyenyu@gmail.com`，不存在資料庫中
- **其他 Super Admin**：由 Primary 授權，儲存在 `core.super_admin` 表

### 權限邏輯

```
用戶登入
  ↓
檢查 email 是否為 Primary Super Admin (硬編碼)
  ↓ 是 → 顯示 Advanced Settings
  ↓ 否
檢查 email 是否在 core.super_admin 表中
  ↓ 是 → 顯示 Advanced Settings
  ↓ 否 → 隱藏 Advanced Settings
```

---

## 檔案結構

### 後端 (packages/twenty-server)

```
src/engine/core-modules/super-admin/
├── dtos/
│   ├── add-super-admin.input.ts      # 新增 Super Admin 輸入
│   ├── remove-super-admin.input.ts   # 移除 Super Admin 輸入
│   └── super-admin.dto.ts            # Super Admin DTO
├── super-admin.entity.ts             # 資料庫 Entity
├── super-admin.module.ts             # NestJS Module
├── super-admin.resolver.ts           # GraphQL Resolver
└── super-admin.service.ts            # 業務邏輯
```

### 前端 (packages/twenty-front)

```
src/modules/settings/super-admin/
├── components/
│   ├── SuperAdminManagement.tsx           # 管理介面主組件
│   └── SuperAdminMemberPickerDropdown.tsx # 成員選擇器
├── graphql/
│   ├── mutations/
│   │   ├── addSuperAdmin.ts
│   │   └── removeSuperAdmin.ts
│   └── queries/
│       ├── checkIsSuperAdmin.ts
│       └── getSuperAdmins.ts
└── hooks/
    ├── useAddSuperAdmin.ts
    ├── useCheckIsSuperAdmin.ts
    ├── useRemoveSuperAdmin.ts
    └── useSuperAdmins.ts
```

### Migration

```
src/database/typeorm/core/migrations/common/
└── 1765500000000-createSuperAdminTable.ts
```

---

## 資料庫結構

### core.super_admin 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| userEmail | TEXT | 用戶 Email (唯一索引) |
| grantedBy | TEXT | 授權者 Email |
| grantedAt | TIMESTAMPTZ | 授權時間 |
| createdAt | TIMESTAMPTZ | 建立時間 |
| updatedAt | TIMESTAMPTZ | 更新時間 |

---

## GraphQL API

### Queries

```graphql
# 檢查當前用戶是否為 Super Admin
query CheckIsSuperAdmin {
  checkIsSuperAdmin  # Boolean
}

# 檢查當前用戶是否為 Primary Super Admin
query CheckIsPrimarySuperAdmin {
  checkIsPrimarySuperAdmin  # Boolean
}

# 取得所有 Super Admin 列表
query GetSuperAdmins {
  getSuperAdmins {
    id
    userEmail
    grantedBy
    grantedAt
    isPrimary
    createdAt
    updatedAt
  }
}
```

### Mutations

```graphql
# 新增 Super Admin (僅 Primary 可執行)
mutation AddSuperAdmin($input: AddSuperAdminInput!) {
  addSuperAdmin(input: $input) {
    id
    userEmail
    grantedBy
    grantedAt
    isPrimary
  }
}

# 移除 Super Admin (僅 Primary 可執行)
mutation RemoveSuperAdmin($input: RemoveSuperAdminInput!) {
  removeSuperAdmin(input: $input)  # Boolean
}
```

---

## 部署步驟

### 1. 執行 Migration

```bash
# 本地
docker compose exec backend npx typeorm migration:run -d ./src/database/typeorm/core/core.datasource.ts

# AWS (deploy-to-aws.sh 會自動執行 yarn database:migrate:prod)
```

### 2. 清除 Redis Cache (因為新增了 GraphQL schema)

```bash
docker exec Y-CRM-redis redis-cli FLUSHALL
docker compose restart backend worker
sleep 10
docker compose exec backend yarn command:prod cron:register:all
```

---

## 使用方式

1. 使用 `notyenyu@gmail.com` 登入
2. 進入 Settings → Advanced Settings
3. 滾動到底部找到「Super Admin Management」區塊
4. 點擊「Add Super Admin」按鈕
5. 從成員選擇器中選擇要授權的成員
6. 確認後該成員即可存取 Advanced Settings

---

## 注意事項

- Primary Super Admin (`notyenyu@gmail.com`) 無法被移除
- 只有 Primary Super Admin 可以新增/移除其他 Super Admin
- 其他 Super Admin 只能查看列表，無法進行管理操作
- Super Admin 是跨工作區的全域角色
