# Firebase Remote Config 整合指南

本文件說明如何使用 Firebase Remote Config 來即時控制功能開關。

---

## 目錄

1. [架構概覽](#1-架構概覽)
2. [Firebase Console 設定](#2-firebase-console-設定)
3. [JSON 格式說明](#3-json-格式說明)
4. [使用範例](#4-使用範例)
5. [前端程式碼使用](#5-前端程式碼使用)
6. [Settings 頁面](#6-settings-頁面)

---

## 1. 架構概覽

使用「關閉列表」(Blocklist) 模式：
- **預設所有功能都開啟**
- **只需要列出要關閉的功能**
- 支援全域關閉 + per workspace 關閉

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Firebase Remote Config                                │
│                      FEATURE_BLOCKLIST 參數                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  {                                                               │   │
│  │    "global": ["IS_AI_ENABLED"],                                  │   │
│  │    "workspaces": {                                               │   │
│  │      "workspace-id": ["IS_DASHBOARD_V2_ENABLED"]                 │   │
│  │    }                                                             │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                              前端讀取
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     useIsFeatureEnabled Hook                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  NOT 在 global 關閉列表                                          │   │
│  │  AND NOT 在該 workspace 關閉列表                                  │   │
│  │  AND 資料庫 Feature Flag 允許                                     │   │
│  │  = 最終結果                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Firebase Console 設定

### 2.1 進入 Remote Config

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案：`ycrm-f738b`
3. 左側選單點擊「Remote Config」

### 2.2 新增參數

點擊「Add parameter」：

| 欄位 | 值 |
|------|-----|
| Parameter name | `FEATURE_BLOCKLIST` |
| Data type | `JSON` |
| Default value | `{"global": [], "workspaces": {}}` |

### 2.3 發布變更

點擊「Publish changes」

---

## 3. JSON 格式說明

### 3.1 基本結構

```json
{
  "global": ["要關閉的功能1", "要關閉的功能2"],
  "workspaces": {
    "workspace-id-1": ["該workspace要關閉的功能"],
    "workspace-id-2": ["功能1", "功能2"]
  }
}
```

### 3.2 支援的功能 Key

| Key | 說明 | 控制範圍 |
|-----|------|---------|
| `IS_AI_ENABLED` | AI 功能（Ask AI、AI Agent） | 所有 AI 入口 |
| `IS_DASHBOARD_V2_ENABLED` | Dashboard V2（Pie/Line/Gauge 圖表） | Dashboard 功能 |
| `IS_SALES_QUOTE_ENABLED` | 報價單功能 | 左側選單、Favorites、Command Menu 搜尋 |
| `IS_APPLICATION_ENABLED` | 應用程式功能 | - |
| `IS_RECORD_PAGE_LAYOUT_ENABLED` | 記錄頁面佈局 | - |
| `IS_WORKFLOW_ENABLED` | Workflow 功能 | - |
| `IS_PAGE_LAYOUT_ENABLED` | 頁面佈局功能 | - |

### 3.3 Workspace IDs

| Workspace | ID |
|-----------|-----|
| Y-CRM | `3be9d202-5461-4881-a6de-4c1f96e4b02d` |
| Calleen公司 | `0c59fbf1-a4aa-4ef4-af68-420780fd6d30` |
| Ryan公司 | `b20b4b4d-397d-468a-a5fc-5bd79353c8b4` |

---

## 4. 使用範例

### 4.1 全部功能開啟（預設）

```json
{
  "global": [],
  "workspaces": {}
}
```

### 4.2 全域關閉 AI 功能

```json
{
  "global": ["IS_AI_ENABLED"],
  "workspaces": {}
}
```

**效果：** 所有 workspace 的 AI 功能都關閉

### 4.3 只關閉特定 Workspace 的 AI

```json
{
  "global": [],
  "workspaces": {
    "0c59fbf1-a4aa-4ef4-af68-420780fd6d30": ["IS_AI_ENABLED"]
  }
}
```

**效果：** 只有 Calleen公司 的 AI 關閉，其他 workspace 正常

### 4.4 複合範例

```json
{
  "global": ["IS_AI_ENABLED"],
  "workspaces": {
    "0c59fbf1-a4aa-4ef4-af68-420780fd6d30": ["IS_DASHBOARD_V2_ENABLED"],
    "b20b4b4d-397d-468a-a5fc-5bd79353c8b4": ["IS_WORKFLOW_ENABLED"]
  }
}
```

**效果：**

| 功能 | Y-CRM | Calleen公司 | Ryan公司 |
|------|-------|------------|---------|
| IS_AI_ENABLED | ❌ | ❌ | ❌ |
| IS_DASHBOARD_V2_ENABLED | ✅ | ❌ | ✅ |
| IS_WORKFLOW_ENABLED | ✅ | ✅ | ❌ |
| 其他功能 | ✅ | ✅ | ✅ |

---

## 5. 前端程式碼使用

### 5.1 使用 useIsFeatureEnabled（推薦）

已經整合 Remote Config + 資料庫 Feature Flag：

```typescript
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { FeatureFlagKey } from '~/generated/graphql';

const MyComponent = () => {
  const isAiEnabled = useIsFeatureEnabled(FeatureFlagKey.IS_AI_ENABLED);

  if (!isAiEnabled) {
    return null; // 功能被關閉
  }

  return <div>AI Feature</div>;
};
```

### 5.2 直接使用 Remote Config

```typescript
import { getRemoteFeatureFlag } from '@/analytics/firebase';

// 檢查全域 + 特定 workspace
const isEnabled = getRemoteFeatureFlag('IS_AI_ENABLED', workspaceId);
```

---

## 6. Settings 頁面

在 Settings > Advanced Settings 可以看到：

1. **Remote Config 連線狀態**
2. **Blocklist（關閉列表）**
   - Global：全域關閉的功能
   - This Workspace：當前 workspace 關閉的功能
3. **Feature Status**：所有功能的最終狀態
4. **Refresh 按鈕**：手動刷新配置

---

## 快速參考

| 操作 | 方式 | 生效時間 |
|------|------|---------|
| 關閉所有 workspace 的某功能 | 加入 `global` 陣列 | 刷新後即時 |
| 關閉特定 workspace 的某功能 | 加入 `workspaces.{id}` 陣列 | 刷新後即時 |
| 開啟功能 | 從陣列中移除 | 刷新後即時 |
| 手動刷新 | Settings > Advanced > Refresh | 即時 |
| 自動刷新 | 每 1 小時 | - |

---

*最後更新：2025-12-24*
