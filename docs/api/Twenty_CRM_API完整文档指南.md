# Twenty CRM API 完整文档指南

> **本指南仅用于查看和理解 API，不会修改任何系统代码**

生成时间: 2025-10-29

---

## 目录

1. [如何查看 GraphQL API](#1-如何查看-graphql-api)
2. [GraphQL Playground 使用指南](#2-graphql-playground-使用指南)
3. [核心 API 结构说明](#3-核心-api-结构说明)
4. [常用 API 调用示例](#4-常用-api-调用示例)
5. [认证方式](#5-认证方式)
6. [API 文档导出方法](#6-api-文档导出方法)

---

## 1. 如何查看 GraphQL API

### 方法一：使用内置 GraphQL Playground（推荐）

Twenty CRM 内置了 GraphQL Playground，启动服务器后访问：

```
http://localhost:8867/graphql
```

在 Playground 中，您可以：
- ✅ 查看完整的 Schema 文档（右侧 DOCS 标签）
- ✅ 自动补全和语法高亮
- ✅ 查看每个字段的类型和说明
- ✅ 直接测试 API 调用
- ✅ 查看 Introspection 查询结果

### 方法二：使用 GraphQL Introspection 查询

在 GraphQL Playground 中执行以下查询，可以获取完整的 Schema 信息：

```graphql
query IntrospectionQuery {
  __schema {
    queryType {
      name
      fields {
        name
        description
        type {
          name
          kind
        }
        args {
          name
          description
          type {
            name
            kind
          }
        }
      }
    }
    mutationType {
      name
      fields {
        name
        description
        type {
          name
          kind
        }
        args {
          name
          description
          type {
            name
            kind
          }
        }
      }
    }
    types {
      name
      kind
      description
      fields {
        name
        description
        type {
          name
          kind
        }
      }
    }
  }
}
```

### 方法三：查看源代码中的 Resolver 定义

Twenty CRM 的 GraphQL API 定义位置：

```
packages/twenty-server/src/engine/core-modules/
├── auth/auth.resolver.ts           # 认证相关 API
├── user/user.resolver.ts           # 用户管理 API
├── workspace/workspace.resolver.ts # 工作区管理 API
├── billing/billing.resolver.ts     # 计费相关 API
└── ... (其他模块)
```

---

## 2. GraphQL Playground 使用指南

### 启动服务器

```bash
# 在项目根目录
yarn nx run twenty-server:start

# 或者使用您的自定义脚本
./start_all_service_start.sh
```

### 访问 Playground

打开浏览器访问: `http://localhost:8867/graphql`

### 查看 Schema 文档

1. 点击右侧 **DOCS** 标签
2. 浏览 **Query** 和 **Mutation** 操作
3. 点击任何类型查看详细字段说明

### 自动补全功能

在编辑器中输入时：
- 按 `Ctrl + Space` 触发自动补全
- 按 `Ctrl + Enter` 执行查询

### 示例：查看当前用户信息

```graphql
query GetCurrentUser {
  currentUser {
    id
    email
    firstName
    lastName
    avatarUrl
    locale
    workspaces {
      id
      name
      logo
    }
  }
}
```

---

## 3. 核心 API 结构说明

### API 架构概览

Twenty CRM 使用**双层 GraphQL 架构**：

```
/graphql     → 工作区数据 API（动态生成，基于对象元数据）
/metadata    → 元数据管理 API（管理对象和字段定义）
```

### 3.1 工作区数据 API (`/graphql`)

这是**动态生成**的 API，基于工作区的对象元数据自动创建 CRUD 操作。

**查询模式：**
```graphql
# 查询单个记录
query {
  <objectNameSingular>(filter: { id: { eq: "..." } }) {
    id
    <field1>
    <field2>
  }
}

# 查询多个记录
query {
  <objectNamePlural>(
    filter: { <field>: { eq: "value" } }
    orderBy: [{ <field>: AscNullsFirst }]
    limit: 10
  ) {
    edges {
      node {
        id
        <fields>
      }
    }
  }
}

# 创建记录
mutation {
  create<ObjectName>(data: { <field>: "value" }) {
    id
    <fields>
  }
}

# 更新记录
mutation {
  update<ObjectName>(id: "...", data: { <field>: "value" }) {
    id
    <fields>
  }
}

# 删除记录
mutation {
  delete<ObjectName>(id: "...") {
    id
  }
}
```

**标准对象示例：**

```graphql
# Person (人员)
query {
  people(filter: { name: { firstName: { eq: "John" } } }) {
    edges {
      node {
        id
        name {
          firstName
          lastName
        }
        email
        phone
        company {
          id
          name
        }
      }
    }
  }
}

# Company (公司)
query {
  companies(limit: 10) {
    edges {
      node {
        id
        name
        domainName
        employees
        address {
          addressStreet1
          addressCity
        }
        people {
          edges {
            node {
              id
              name {
                firstName
                lastName
              }
            }
          }
        }
      }
    }
  }
}

# Opportunity (商机)
query {
  opportunities {
    edges {
      node {
        id
        name
        amount {
          amountMicros
          currencyCode
        }
        stage
        closeDate
        company {
          id
          name
        }
      }
    }
  }
}
```

### 3.2 元数据管理 API (`/metadata`)

用于管理对象和字段的定义（需要管理员权限）。

```graphql
# 查询所有对象元数据
query {
  objects {
    edges {
      node {
        id
        nameSingular
        namePlural
        labelSingular
        labelPlural
        description
        icon
        isCustom
        fields {
          edges {
            node {
              id
              name
              label
              type
              description
            }
          }
        }
      }
    }
  }
}

# 创建自定义对象
mutation {
  createOneObject(
    input: {
      object: {
        nameSingular: "product"
        namePlural: "products"
        labelSingular: "Product"
        labelPlural: "Products"
        description: "Product catalog"
        icon: "IconShoppingCart"
      }
    }
  ) {
    id
    nameSingular
  }
}

# 创建字段
mutation {
  createOneField(
    input: {
      field: {
        objectMetadataId: "..."
        name: "price"
        label: "Price"
        type: CURRENCY
        description: "Product price"
      }
    }
  ) {
    id
    name
    type
  }
}
```

### 3.3 核心 API (Core GraphQL)

定义在 `packages/twenty-server/src/engine/core-modules/` 中。

**主要模块：**

#### 认证 API (`auth.resolver.ts`)
```graphql
# 当前用户信息
query {
  currentUser {
    id
    email
    firstName
    lastName
    avatarUrl
    supportUserHash
    canImpersonate
    workspaces {
      id
      name
    }
  }
}

# 当前工作区
query {
  currentWorkspace {
    id
    name
    logo
    domainName
    subdomain
    allowImpersonation
  }
}

# 登出
mutation {
  signOut
}

# 验证 Token
query {
  validateToken {
    isValid
  }
}
```

#### 用户管理 API (`user.resolver.ts`)
```graphql
# 更新用户信息
mutation {
  updateUser(data: { firstName: "John", lastName: "Doe" }) {
    id
    firstName
    lastName
  }
}

# 上传用户头像
mutation {
  uploadUserAvatar(file: Upload!) {
    id
    avatarUrl
  }
}

# 删除用户账号
mutation {
  deleteUser {
    id
  }
}
```

#### 工作区管理 API (`workspace.resolver.ts`)
```graphql
# 更新工作区
mutation {
  updateWorkspace(data: { name: "New Name", logo: "..." }) {
    id
    name
    logo
  }
}

# 上传工作区 Logo
mutation {
  uploadWorkspaceLogo(file: Upload!) {
    id
    logo
  }
}

# 删除工作区
mutation {
  deleteWorkspace {
    id
  }
}
```

#### 计费 API (`billing.resolver.ts`)
```graphql
# 获取计费信息
query {
  billingPortalSession {
    url
  }
}

# 获取订阅信息
query {
  currentWorkspace {
    subscriptionStatus
    currentBillingSubscription {
      id
      status
      interval
    }
  }
}
```

---

## 4. 常用 API 调用示例

### 4.1 认证流程

```bash
# 1. 使用邮箱密码登录（通过 REST API）
curl -X POST http://localhost:8867/auth/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# 返回：
{
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}

# 2. 使用 Token 调用 GraphQL API
curl -X POST http://localhost:8867/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "query": "query { currentUser { id email } }"
  }'
```

### 4.2 数据查询示例

```graphql
# 查询人员列表（带分页和过滤）
query GetPeople {
  people(
    filter: {
      or: [
        { name: { firstName: { ilike: "%john%" } } }
        { email: { ilike: "%john%" } }
      ]
    }
    orderBy: [{ createdAt: DescNullsLast }]
    first: 20
    after: "cursor..."
  ) {
    edges {
      node {
        id
        name {
          firstName
          lastName
        }
        email
        phone
        company {
          id
          name
        }
        createdAt
        updatedAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

### 4.3 数据创建示例

```graphql
# 创建新人员
mutation CreatePerson {
  createPerson(
    data: {
      name: { firstName: "John", lastName: "Doe" }
      email: "john.doe@example.com"
      phone: "+1234567890"
      companyId: "company-uuid-here"
    }
  ) {
    id
    name {
      firstName
      lastName
    }
    email
    company {
      id
      name
    }
    createdAt
  }
}
```

### 4.4 数据更新示例

```graphql
# 更新人员信息
mutation UpdatePerson {
  updatePerson(
    id: "person-uuid-here"
    data: {
      name: { firstName: "Jane" }
      email: "jane.doe@example.com"
    }
  ) {
    id
    name {
      firstName
      lastName
    }
    email
    updatedAt
  }
}
```

### 4.5 关联查询示例

```graphql
# 查询公司及其所有人员和商机
query GetCompanyDetails {
  company(filter: { id: { eq: "company-uuid-here" } }) {
    id
    name
    domainName
    employees

    # 关联的人员
    people {
      edges {
        node {
          id
          name {
            firstName
            lastName
          }
          email
          position
        }
      }
    }

    # 关联的商机
    opportunities {
      edges {
        node {
          id
          name
          amount {
            amountMicros
            currencyCode
          }
          stage
          closeDate
        }
      }
    }
  }
}
```

---

## 5. 认证方式

### 5.1 JWT Bearer Token（推荐用于前端）

```javascript
// JavaScript/TypeScript 示例
const token = 'eyJhbGc...'; // 从登录接口获取

fetch('http://localhost:8867/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: `
      query {
        currentUser {
          id
          email
        }
      }
    `
  })
});
```

### 5.2 API Key（推荐用于服务端集成）

```bash
# 创建 API Key（在 UI 中或通过 API）
# 然后使用 API Key 调用

curl -X POST http://localhost:8867/graphql \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key-here" \
  -d '{
    "query": "query { companies { edges { node { id name } } } }"
  }'
```

---

## 6. API 文档导出方法

### 方法一：使用 GraphQL Introspection 导出 Schema

在 GraphQL Playground 中执行：

```graphql
# 获取完整 Schema
{
  __schema {
    types {
      name
      kind
      description
      fields {
        name
        description
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
        args {
          name
          description
          type {
            name
            kind
          }
        }
      }
    }
  }
}
```

将结果保存为 JSON 文件。

### 方法二：使用浏览器开发者工具

1. 打开 GraphQL Playground (`http://localhost:8867/graphql`)
2. 打开浏览器开发者工具 (F12)
3. 切换到 Network 标签
4. 在 Playground 中执行任何查询
5. 查看请求/响应格式

### 方法三：查看已生成的 Schema（如果可用）

```bash
# 检查是否有缓存的 Schema
# Twenty CRM 会将生成的 Schema 缓存在 Redis 中
# 您可以通过 Redis CLI 查看：

redis-cli
> KEYS *graphql*
> GET workspace:<workspace-id>:graphql:typedefs:<version>
```

---

## 7. 重要的字段类型说明

### 7.1 复合类型

```graphql
# FullName - 姓名
type FullName {
  firstName: String!
  lastName: String!
}

# Address - 地址
type Address {
  addressStreet1: String
  addressStreet2: String
  addressCity: String
  addressState: String
  addressCountry: String
  addressPostcode: String
}

# Currency - 货币金额
type Currency {
  amountMicros: Float!  # 金额（微单位，1美元 = 1,000,000）
  currencyCode: String! # 货币代码（如 USD, EUR, CNY）
}

# Links - 链接
type Links {
  primaryLinkLabel: String
  primaryLinkUrl: String
  secondaryLinks: JSON
}
```

### 7.2 过滤器类型

```graphql
# 字符串过滤器
type StringFilter {
  eq: String       # 等于
  neq: String      # 不等于
  in: [String!]    # 在列表中
  like: String     # 模糊匹配（大小写敏感）
  ilike: String    # 模糊匹配（忽略大小写）
  startsWith: String
  endsWith: String
}

# 数字过滤器
type NumberFilter {
  eq: Float
  neq: Float
  gt: Float        # 大于
  gte: Float       # 大于等于
  lt: Float        # 小于
  lte: Float       # 小于等于
  in: [Float!]
}

# 日期过滤器
type DateFilter {
  eq: DateTime
  neq: DateTime
  gt: DateTime
  gte: DateTime
  lt: DateTime
  lte: DateTime
}
```

### 7.3 排序方式

```graphql
enum OrderByDirection {
  AscNullsFirst
  AscNullsLast
  DescNullsFirst
  DescNullsLast
}

# 使用示例
query {
  people(orderBy: [{ createdAt: DescNullsLast }]) {
    edges {
      node {
        id
        name { firstName lastName }
      }
    }
  }
}
```

---

## 8. 实用技巧

### 8.1 使用 Fragment 简化查询

```graphql
# 定义 Fragment
fragment PersonBasicInfo on Person {
  id
  name {
    firstName
    lastName
  }
  email
  phone
}

# 使用 Fragment
query {
  people {
    edges {
      node {
        ...PersonBasicInfo
        company {
          id
          name
        }
      }
    }
  }
}
```

### 8.2 使用变量

```graphql
# 定义变量
query GetPerson($personId: ID!) {
  person(filter: { id: { eq: $personId } }) {
    id
    name {
      firstName
      lastName
    }
  }
}

# 在 Query Variables 中传入：
{
  "personId": "uuid-here"
}
```

### 8.3 批量操作

```graphql
# Twenty CRM 支持在一个请求中执行多个操作
mutation BatchOperations {
  person1: createPerson(data: { name: { firstName: "John" } }) {
    id
  }
  person2: createPerson(data: { name: { firstName: "Jane" } }) {
    id
  }
  company: createCompany(data: { name: "Acme Corp" }) {
    id
  }
}
```

---

## 9. 错误处理

### 常见错误代码

```typescript
// Twenty CRM 的错误代码枚举
enum ErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}
```

### 错误响应格式

```json
{
  "errors": [
    {
      "message": "Forbidden",
      "extensions": {
        "code": "FORBIDDEN"
      },
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["currentUser"]
    }
  ],
  "data": null
}
```

---

## 10. 参考资源

### Twenty CRM 源代码结构

```
packages/twenty-server/src/
├── engine/
│   ├── core-modules/          # 核心模块（认证、用户、工作区等）
│   │   ├── auth/
│   │   │   └── auth.resolver.ts
│   │   ├── user/
│   │   │   └── user.resolver.ts
│   │   └── workspace/
│   │       └── workspace.resolver.ts
│   │
│   └── api/
│       └── graphql/           # GraphQL Schema 生成器
│           ├── workspace-schema.factory.ts
│           └── workspace-schema-builder/
│
├── metadata-modules/          # 元数据管理
│   └── object-metadata/
│
└── workspace-manager/
    └── workspace-sync-metadata/
        └── standard-objects/  # 标准对象定义
```

### 在线资源

- **GraphQL 官方文档**: https://graphql.org/
- **GraphQL Playground**: 自带文档浏览功能
- **Twenty CRM 官方文档**: https://twenty.com/developers

---

## 总结

✅ **推荐的 API 查看方式（按优先级）：**

1. **使用 GraphQL Playground** - 最直观，自动文档，实时测试
2. **使用 Introspection 查询** - 获取完整 Schema JSON
3. **查看源代码 Resolver** - 了解实现细节

🔒 **安全提示：**
- 本文档只用于查看和理解 API
- 不会修改任何系统代码
- 遵循 Twenty CRM 的原始设计架构

📝 **下一步：**
- 启动服务器
- 访问 `http://localhost:8867/graphql`
- 在 Playground 中浏览和测试 API

---

**文档版本**: 1.0
**最后更新**: 2025-10-29
**适用于**: Twenty CRM (基于您当前的代码库)

