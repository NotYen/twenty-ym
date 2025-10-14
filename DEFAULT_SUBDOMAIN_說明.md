# DEFAULT_SUBDOMAIN 配置說明

## 📋 原項目設計

### 1. 默認值和定義

```typescript
// packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts

@ConfigVariablesMetadata({
  group: ConfigVariablesGroup.ServerConfig,
  description: 'Default subdomain for the frontend when multi-workspace is enabled',
  type: ConfigVariableType.STRING,
})
@ValidateIf((env) => env.IS_MULTIWORKSPACE_ENABLED)
DEFAULT_SUBDOMAIN = 'app';  // 原項目默認值
```

### 2. 設計意圖

`DEFAULT_SUBDOMAIN` 的作用：

1. **作為默認入口**：當用戶訪問基礎域名（無子域名）時的後備子域名
2. **保留子域名**：這個子域名不能被其他 workspace 使用
3. **錯誤重定向**：當無法識別子域名時，重定向到默認子域名
4. **配置傳遞**：通過 `/client-config` API 傳遞給前端

### 3. 關鍵使用場景

#### 場景 A：判斷是否為默認子域名

```typescript
// domain-manager.service.ts
isDefaultSubdomain(subdomain: string) {
  return subdomain === this.twentyConfigService.get('DEFAULT_SUBDOMAIN');
}

getSubdomainAndDomainFromUrl = (url: string) => {
  // 如果是默認子域名，不返回 subdomain（視為基礎域名）
  return {
    subdomain: isFrontdomain && !this.isDefaultSubdomain(subdomain)
      ? subdomain
      : undefined,
    domain: isFrontdomain ? null : originHostname,
  };
};
```

#### 場景 B：作為後備值

```typescript
// guard-redirect.service.ts
getSubdomainAndCustomDomainFromContext(context: ExecutionContext) {
  const subdomainAndDomainFromReferer = // ... 從 referer 解析
  
  // 如果無法從 referer 解析，使用默認子域名
  return subdomainAndDomainFromReferer?.subdomain
    ? { subdomain: subdomainAndDomainFromReferer.subdomain, ... }
    : { subdomain: this.twentyConfigService.get('DEFAULT_SUBDOMAIN'), ... };
}
```

#### 場景 C：保留子域名檢查

```typescript
// workspace.service.ts
if (this.twentyConfigService.get('DEFAULT_SUBDOMAIN') === newSubdomain) {
  throw new WorkspaceException(
    'Subdomain already taken',
    WorkspaceExceptionCode.SUBDOMAIN_ALREADY_TAKEN,
  );
}
```

#### 場景 D：傳遞給前端

```typescript
// client-config.service.ts
const clientConfig = {
  // ...
  defaultSubdomain: this.twentyConfigService.get('DEFAULT_SUBDOMAIN'),
  frontDomain: this.domainManagerService.getFrontUrl().hostname,
  // ...
};
```

## ✅ 你的配置是否正確？

### 當前配置

```bash
export DEFAULT_SUBDOMAIN="apple"
```

### 驗證邏輯

根據原項目設計，`DEFAULT_SUBDOMAIN` 應該：

1. ✅ **必須是實際存在的 workspace subdomain**
   - 檢查：數據庫中是否有 `subdomain = 'apple'` 的 workspace
   
2. ✅ **不能與其他 workspace subdomain 衝突**
   - `apple` 作為默認子域名被保留
   
3. ✅ **當多租戶啟用時必須設置**
   - `@ValidateIf((env) => env.IS_MULTIWORKSPACE_ENABLED)`

### 你的配置符合邏輯的條件

只要滿足以下條件，`DEFAULT_SUBDOMAIN="apple"` 就是正確的：

1. ✅ 數據庫中存在一個 workspace，其 `subdomain` 欄位值為 `'apple'`
2. ✅ `IS_MULTIWORKSPACE_ENABLED="true"` 已啟用
3. ✅ 環境變數正確傳遞給後端

## ❌ 當前問題

診斷腳本顯示：

```
frontDomain: 118.168.188.27.nip.io
defaultSubdomain: [空]  ← 問題在這裡！
```

**問題原因**：環境變數 `DEFAULT_SUBDOMAIN` 沒有正確傳遞給後端 Node.js 進程

## 🔧 解決方案

### 方案 1：使用改進的啟動腳本（推薦）

```bash
./stop-twenty-local.sh
./一鍵啟動.sh
```

這個腳本使用 `env` 命令確保環境變數正確傳遞：

```bash
env \
    DEFAULT_SUBDOMAIN=${DEFAULT_SUBDOMAIN} \
    IS_MULTIWORKSPACE_ENABLED=${IS_MULTIWORKSPACE_ENABLED} \
    FRONTEND_URL=${FRONTEND_URL} \
    # ... 其他變數
    npx nx run-many -t start -p twenty-server twenty-front
```

### 方案 2：驗證數據庫

確保 workspace 存在：

```sql
-- 查詢 workspace
SELECT id, subdomain, "displayName" FROM core.workspace;

-- 如果沒有 'apple'，更新或創建
UPDATE core.workspace 
SET subdomain = 'apple' 
WHERE id = '你的workspace_id';
```

### 方案 3：檢查配置一致性

確保以下三處配置一致：

1. **配置文件** (`twenty-config.sh`)：
   ```bash
   export DEFAULT_SUBDOMAIN="apple"
   ```

2. **數據庫** (`core.workspace` 表)：
   ```sql
   subdomain = 'apple'
   ```

3. **後端接收** (通過 API 驗證)：
   ```bash
   curl http://localhost:8867/client-config | grep defaultSubdomain
   # 應該返回：\"defaultSubdomain\":\"apple\"
   ```

## 📊 預期的工作流程

### 正確的多租戶流程

1. **用戶訪問基礎域名**
   ```
   http://118.168.188.27.nip.io:8866
   ```

2. **前端檢測**
   - 獲取 `frontDomain = "118.168.188.27.nip.io"`
   - 獲取 `defaultSubdomain = "apple"`
   - 構建默認域名：`apple.118.168.188.27.nip.io`

3. **自動重定向**
   ```
   http://apple.118.168.188.27.nip.io:8866
   ```

4. **後端識別**
   - 解析子域名：`apple`
   - 查找對應的 workspace
   - 返回 workspace 數據

### 錯誤的流程（當前問題）

1. **用戶訪問基礎域名**
   ```
   http://118.168.188.27.nip.io:8866
   ```

2. **前端檢測**
   - 獲取 `frontDomain = "118.168.188.27.nip.io"`
   - 獲取 `defaultSubdomain = ""` ← **空值！**
   - 構建默認域名：`"" + "." + "118.168.188.27.nip.io" = ".118.168.188.27.nip.io"`

3. **錯誤重定向**
   ```
   http://.118.168.188.27.nip.io:8866/welcome  ← 錯誤！
   ```

## 🎯 總結

### ✅ 你的配置邏輯正確

`DEFAULT_SUBDOMAIN="apple"` 完全符合原項目設計，只要：

1. ✅ 數據庫中有 `subdomain='apple'` 的 workspace
2. ✅ 環境變數正確傳遞給後端

### ⚠️ 當前需要解決的問題

**環境變數傳遞問題**：
- 配置文件中：`DEFAULT_SUBDOMAIN="apple"` ✅
- 後端接收到：`defaultSubdomain=""` ❌

**解決步驟**：

1. 停止當前服務：`./stop-twenty-local.sh`
2. 使用新的啟動腳本：`./一鍵啟動.sh`
3. 驗證配置：腳本會自動檢查並顯示結果
4. 如果仍有問題：運行 `./診斷並修復.sh`

### 💡 最佳實踐

1. **保持一致**：`DEFAULT_SUBDOMAIN` 應該與實際的主要 workspace subdomain 一致
2. **使用腳本**：始終用提供的啟動腳本，確保環境變數正確傳遞
3. **驗證配置**：啟動後檢查 `/client-config` API 返回值

