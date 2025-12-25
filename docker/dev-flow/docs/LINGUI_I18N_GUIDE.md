# Lingui 國際化 (i18n) 工作流程指南

## 🔥 核心問題總結（2025-12-25 修復）

### Tab 標題翻譯不生效的根本原因

**問題**：i18n 已正確載入 zh-TW locale（Console 顯示 `[i18n] Activated locale: zh-TW`），但 Tab 標題（Timeline, Tasks, Notes 等）仍顯示英文。

**根本原因**：
1. **兩套渲染系統**：Twenty 有兩套 tab 渲染系統，由 `IS_RECORD_PAGE_LAYOUT_ENABLED` feature flag 控制
   - 舊系統：`RecordShowContainer` → `useRecordShowContainerTabs`
   - 新系統：`PageLayoutRecordPageRenderer` → `PageLayoutTabList` 系列組件
2. Tab title 來自資料庫（PageLayout 系統），不是程式碼中的常量
3. 需要在所有渲染 tab title 的地方加入翻譯

### 解決方案：共用翻譯 Hook

建立 `useTranslateTabTitle` hook，在所有渲染 tab 的地方使用：

```typescript
// packages/twenty-front/src/modules/page-layout/hooks/useTranslateTabTitle.ts
import { useLingui } from '@lingui/react/macro';
import { useCallback } from 'react';

export const useTranslateTabTitle = () => {
  const { t } = useLingui();

  const translateTabTitle = useCallback(
    (title: string): string => {
      const translations: Record<string, string> = {
        Timeline: t`Timeline`,
        Tasks: t`Tasks`,
        Notes: t`Notes`,
        Note: t`Note`,
        Files: t`Files`,
        Emails: t`Emails`,
        Calendar: t`Calendar`,
        Home: t`Home`,
        Fields: t`Fields`,
        Relations: t`Relations`,
      };
      return translations[title] || title;
    },
    [t],
  );

  return { translateTabTitle };
};
```

### 需要修改的檔案清單

| 檔案 | 說明 |
|------|------|
| `useTranslateTabTitle.ts` | 新建共用翻譯 hook |
| `useRecordShowContainerTabs.ts` | 舊系統 tab 翻譯 |
| `PageLayoutTabListVisibleTabs.tsx` | 新系統可見 tab 翻譯 |
| `PageLayoutTabListStaticOverflowDropdown.tsx` | 靜態 overflow dropdown |
| `PageLayoutTabListReorderableOverflowDropdown.tsx` | 可拖拽 overflow dropdown |
| `WidgetRenderer.tsx` | Widget 標題翻譯 |

### 修改範例

**PageLayoutTabListVisibleTabs.tsx**：
```typescript
import { useTranslateTabTitle } from '@/page-layout/hooks/useTranslateTabTitle';

export const PageLayoutTabListVisibleTabs = ({ ... }) => {
  const { translateTabTitle } = useTranslateTabTitle();

  // canReorder 模式
  <PageLayoutTabListReorderableTab
    tab={{ ...tab, title: translateTabTitle(tab.title) }}
    ...
  />

  // 非 reorder 模式
  <TabButton
    title={translateTabTitle(tab.title)}
    ...
  />
};
```

**WidgetRenderer.tsx**：
```typescript
import { useTranslateTabTitle } from '@/page-layout/hooks/useTranslateTabTitle';

export const WidgetRenderer = ({ widget }) => {
  const { translateTabTitle } = useTranslateTabTitle();

  <WidgetCardHeader
    title={translateTabTitle(widget.title)}
    ...
  />
};
```

### 繁體中文翻譯修正

開源版本的 zh-TW.po 有些翻譯是簡體中文用法，需要修正：

| 原翻譯 | 修正後 |
|--------|--------|
| 字段 | 欄位 |

修改 `packages/twenty-front/src/locales/zh-TW.po`：
```po
msgid "Fields"
msgstr "欄位"
```

---

## 概述

Twenty 使用 [Lingui](https://lingui.dev/) 作為國際化框架。翻譯流程涉及三個步驟：

1. **Extract** - 從程式碼中提取需要翻譯的文字
2. **Translate** - 在 .po 檔案中填寫翻譯
3. **Compile** - 編譯成 runtime 可用的格式

## 什麼時候需要執行什麼指令？

| 情境 | 需要執行的指令 |
|------|---------------|
| 新增/修改程式碼中的翻譯文字 | `lingui extract` → 編輯 .po → `lingui compile` |
| 只修改 .po 檔案的翻譯 | `lingui compile` |
| Build Docker image | 自動執行 (Dockerfile 已包含) |
| 本地開發測試翻譯 | `lingui compile` |

## i18n 載入流程（重要！）

### 載入順序

```
1. App.tsx 載入
   ↓
2. initialI18nActivate() 被調用
   - 從 URL 參數讀取 locale (?locale=zh-TW)
   - 從 localStorage 讀取 locale
   - 從瀏覽器 navigator 讀取 locale
   - 如果都沒有，使用 'en'
   ↓
3. 用戶登入後，UserAndViewsProviderEffect 載入用戶資料
   ↓
4. dynamicActivate(workspaceMember.locale) 被調用
   - 從資料庫讀取用戶設定的 locale
   - 載入對應的翻譯檔案
   - 同步到 localStorage（確保下次載入時能正確初始化）
```

### 關鍵檔案

| 檔案 | 作用 |
|------|------|
| `App.tsx` | 調用 `initialI18nActivate()` |
| `initialI18nActivate.ts` | 初始化 i18n，從 URL/localStorage/navigator 讀取 locale |
| `dynamicActivate.ts` | 動態載入翻譯檔案並啟用 |
| `UserAndViewsProviderEffect.tsx` | 用戶登入後，從資料庫讀取 locale 並調用 `dynamicActivate` |
| `useLoadCurrentUser.ts` | 同上，另一個載入用戶資料的 hook |

### 為什麼翻譯可能不生效？

**問題**：翻譯檔案正確，但 UI 顯示英文

**可能原因**：
1. localStorage 沒有設置 locale
2. `dynamicActivate` 沒有被調用
3. 翻譯檔案沒有正確編譯

**調試方法**：
1. 檢查瀏覽器 Console 是否有 i18n 相關錯誤
2. 檢查 localStorage：`localStorage.getItem('locale')`
3. 檢查 HTML lang 屬性：`document.documentElement.lang`
4. 檢查翻譯檔案是否載入：Network tab 搜尋 `zh-TW`

## Tab 標題翻譯架構

### 位置
`packages/twenty-front/src/modules/object-record/record-show/hooks/useRecordShowContainerTabs.ts`

### 實作方式

```typescript
const { t } = useLingui();

// 使用 useCallback 確保 locale 變化時能觸發重新渲染
const translateTabTitle = useCallback(
  (title: string): string => {
    const translations: Record<string, string> = {
      Timeline: t`Timeline`,
      Tasks: t`Tasks`,
      Notes: t`Notes`,
      // ...
    };
    return translations[title] || title;
  },
  [t],  // 關鍵：t 作為依賴，locale 變化時 t 會改變
);
```

### 為什麼這樣設計？

原本的 tab 標題是從 layout 配置中讀取的英文字串（如 `BASE_RECORD_LAYOUT.tabs.timeline.title = 'Timeline'`）。為了支援多國語系，我們：

1. 保留原本的英文 title 作為 key
2. 使用 `translateTabTitle` 函數將英文 key 轉換成翻譯後的文字
3. 翻譯使用 lingui 的 `t` 函數，會根據當前 locale 返回對應翻譯

### 重要：useLingui 的 reactive 機制

**問題**：為什麼 `useLingui` 的 `t` 函數需要加入 `useCallback` 的依賴陣列？

**原因**：當 locale 變化時，`useLingui` 會返回新的 `t` 函數。如果 `translateTabTitle` 沒有將 `t` 作為依賴，它會繼續使用舊的 `t` 函數，導致翻譯不更新。

**正確做法**：
```typescript
// ✅ 正確：t 作為依賴
const translateTabTitle = useCallback(
  (title: string) => translations[title] || title,
  [t],
);

// ❌ 錯誤：沒有依賴，locale 變化時不會更新
const translateTabTitle = (title: string) => translations[title] || title;
```

參考：`useMergeRecordsContainerTabs.ts` 中的實作方式。

## 詳細說明

### 1. lingui extract

```bash
cd packages/twenty-front
npx lingui extract --clean
```

**作用**：掃描程式碼，找出所有使用 `t`、`Trans`、`msg` 等標記的文字，更新 .po 檔案。

**什麼時候用**：
- 新增了 `t\`新文字\`` 或 `<Trans>新文字</Trans>`
- 修改了現有翻譯的英文原文
- 刪除了某些翻譯

### 2. 編輯 .po 檔案

翻譯檔案位置：
- 前端：`packages/twenty-front/src/locales/zh-TW.po`
- 後端：`packages/twenty-server/src/engine/core-modules/i18n/locales/zh-TW.po`

格式：
```po
msgid "English text"
msgstr "繁體中文翻譯"
```

### 3. lingui compile

```bash
cd packages/twenty-front
npx lingui compile
```

**作用**：將 .po 檔案編譯成 .js 檔案，供 runtime 使用。

**什麼時候用**：
- 修改了任何 .po 檔案後
- Build 前確保翻譯生效

## 常見問題

### Q: 翻譯沒有生效，顯示英文或亂碼？

**原因**：沒有執行 `lingui compile`

**解決**：
```bash
cd packages/twenty-front
npx lingui compile
```

### Q: 新增的翻譯文字沒有出現在 .po 檔案？

**原因**：沒有執行 `lingui extract`

**解決**：
```bash
cd packages/twenty-front
npx lingui extract --clean
```

### Q: 程式碼中應該怎麼寫翻譯？

**正確寫法**（英文原文 + .po 翻譯）：
```tsx
// 使用 t 函數
const { t } = useLingui();
const label = t`Timeline`;  // 英文原文

// 使用 Trans 組件
<Trans>Invite your team</Trans>
```

**錯誤寫法**（直接寫中文）：
```tsx
// ❌ 不要這樣寫
const label = t`時間軸`;  // 這會導致其他語言無法翻譯
```

### Q: 翻譯檔案正確但 UI 還是顯示英文？

**2025-12-25 調查記錄**

**症狀**：
- zh-TW.po 翻譯正確
- lingui compile 已執行
- Docker image 已重 build
- 用戶 locale 設定為 zh-TW
- 但 tab 標題仍顯示英文

**調查過程**：
1. 確認編譯後的 JS 檔案中 `translateTabTitle` 函數正確
2. 確認 Docker 容器中有 zh-TW 翻譯檔案
3. 確認資料庫中用戶 locale = 'zh-TW'
4. 發現 `curl http://localhost:8866` 返回 `lang="en"`

**根本原因（已修復）**：

1. **localStorage 同步問題**：`UserAndViewsProviderEffect` 調用 `dynamicActivate(workspaceMember.locale)` 時，沒有同步設置 localStorage。導致每次重新載入頁面時，`initialI18nActivate()` 因為 localStorage 沒有 locale 而使用瀏覽器預設語言（通常是 en）。

2. **useLingui reactive 問題**：`translateTabTitle` 函數沒有將 `t` 作為 `useCallback` 的依賴，導致 locale 變化時翻譯不更新。

**解決方案**：

1. 在 `UserAndViewsProviderEffect.tsx` 和 `useLoadCurrentUser.ts` 中，調用 `dynamicActivate` 後同時設置 localStorage：

```typescript
const userLocale = (workspaceMember.locale as keyof typeof APP_LOCALES) ?? SOURCE_LOCALE;
dynamicActivate(userLocale);

// Sync locale to localStorage
try {
  localStorage.setItem('locale', userLocale);
} catch (error) {
  logDebug('[i18n] Failed to save locale to localStorage:', error);
}
```

2. 在 `useRecordShowContainerTabs.ts` 中，使用 `useCallback` 並將 `t` 作為依賴：

```typescript
const translateTabTitle = useCallback(
  (title: string): string => {
    const translations: Record<string, string> = {
      Timeline: t`Timeline`,
      // ...
    };
    return translations[title] || title;
  },
  [t],  // 關鍵：t 作為依賴
);
```

### Q: 打印 log 應該用什麼方式？

**正確做法**：使用共用的 log 函數

```typescript
import { logDebug } from '~/utils/logDebug';
import { logError } from '~/utils/logError';

// Debug log（只在 IS_DEBUG_MODE=true 時輸出）
logDebug('[i18n] Activated locale:', locale);

// Error log（總是輸出）
logError('[i18n] Failed to load translations:', error);
```

**錯誤做法**：直接使用 console.log

```typescript
// ❌ 不要這樣寫
console.log('[i18n] Activated locale:', locale);
```

## 完整工作流程範例

### 新增翻譯

```bash
# 1. 在程式碼中加入翻譯標記
# const title = t`New Feature`;

# 2. 提取翻譯
cd packages/twenty-front
npx lingui extract --clean

# 3. 編輯 zh-TW.po，找到新增的 msgid 並填寫 msgstr
# msgid "New Feature"
# msgstr "新功能"

# 4. 編譯
npx lingui compile

# 5. 測試確認翻譯生效
```

### Build Docker Image 前

```bash
# 確保翻譯已編譯
cd packages/twenty-front
npx lingui compile

# 然後 build image
cd docker/dev-flow/aws
./build-amd64-images.sh --backend-version xxx --frontend-version xxx --push
```

## 檔案結構

```
packages/twenty-front/
├── src/
│   ├── modules/
│   │   ├── app/components/App.tsx              # 調用 initialI18nActivate
│   │   └── users/
│   │       ├── components/UserAndViewsProviderEffect.tsx  # 調用 dynamicActivate
│   │       └── hooks/useLoadCurrentUser.ts     # 調用 dynamicActivate
│   ├── utils/i18n/
│   │   ├── initialI18nActivate.ts              # 初始化 i18n
│   │   └── dynamicActivate.ts                  # 動態載入翻譯
│   └── locales/
│       ├── zh-TW.po      # 繁體中文翻譯源檔
│       ├── generated/
│       │   └── zh-TW.ts  # 編譯後的檔案 (自動生成)
│       ├── en.po         # 英文
│       └── ...           # 其他語言
└── lingui.config.ts      # Lingui 配置

packages/twenty-server/
└── src/
    └── engine/
        └── core-modules/
            └── i18n/
                └── locales/
                    └── zh-TW.po  # 後端翻譯
```

## 注意事項

1. **不要手動編輯 .js 檔案** - 它們是自動生成的
2. **commit 時要包含 .po 和 .js 檔案** - 確保其他人拉取後翻譯能正常工作
3. **Docker build 會自動 compile** - Dockerfile 已包含 `lingui compile` 步驟
4. **翻譯檔案是編譯進 Docker image 的** - 修改翻譯後需要重新 build image 才會生效

## Docker Build 自動編譯翻譯

### 2025-12-26 修復：後端翻譯在 Docker 中不生效

**問題**：左側選單的 "Workflows" 在 AWS 環境顯示英文，但本地正常顯示 "自動化工作流"。

**根本原因**：
- 左側選單的文字來自 `objectMetadataItem.labelPlural`，這是**後端 API** 返回的資料
- 後端翻譯在 `packages/twenty-server/src/engine/core-modules/i18n/locales/zh-TW.po`
- 後端 Dockerfile 原本**沒有執行 `lingui compile`**，導致翻譯沒有編譯進 image

**解決方案**：在 `docker/backend/Dockerfile` 中加入 lingui compile 步驟：

```dockerfile
# 編譯 i18n 翻譯（確保後端翻譯生效）
RUN cd packages/twenty-server && npx lingui compile

# 構建 twenty-server（production 模式）
RUN yarn nx build twenty-server --configuration=production
```

### Dockerfile 翻譯編譯位置

| Dockerfile | lingui compile 位置 |
|------------|---------------------|
| `docker/frontend/Dockerfile` | 在 `yarn nx build twenty-front` 之前 |
| `docker/backend/Dockerfile` | 在 `yarn nx build twenty-server` 之前 |

這樣不管是本地 build (`run-local.sh`) 還是 AWS build (`build-amd64-images.sh`)，都會自動編譯翻譯。

## 本地驗證翻譯修改

修改翻譯後，需要重新 build Docker image：

```bash
# 方法 1: 完整重 build（較慢）
/Users/ym/twenty-ym/docker/dev-flow/local_build_for_docker/run-local.sh

# 方法 2: 只 build frontend（較快）
cd docker && docker compose build --no-cache frontend && docker compose up -d frontend
```
