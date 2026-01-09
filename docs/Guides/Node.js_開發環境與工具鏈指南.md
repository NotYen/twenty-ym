# Node.js 開發環境與工具鏈指南

本文件說明 Node.js 生態系的核心概念，包含運行環境、套件管理、專案結構，以及 Monorepo 架構下的開發流程。

---

## 目錄

1. [Node.js 是什麼？](#1-nodejs-是什麼)
2. [三個核心指令：node、npm、npx](#2-三個核心指令nodenpmmpx)
3. [專案結構：package.json 與 node_modules](#3-專案結構packagejson-與-node_modules)
4. [建置產物：dist 資料夾](#4-建置產物dist-資料夾)
5. [Monorepo 架構：Nx 工具鏈](#5-monorepo-架構nx-工具鏈)
6. [前端 vs 後端：React + Vite 與 NestJS 對比](#6-前端-vs-後端react--vite-與-nestjs-對比)
7. [總結對照表](#7-總結對照表)

---

## 1. Node.js 是什麼？

### 核心概念

**Node.js 是 JavaScript 的運行環境（Runtime）**，讓 JavaScript 可以在伺服器端執行，而不只是在瀏覽器中。

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   傳統 JavaScript                    Node.js 出現後                 │
│   ─────────────────                  ──────────────                 │
│                                                                     │
│   只能在瀏覽器執行         →         可以在任何地方執行              │
│   (Chrome, Firefox...)              (伺服器、命令列、桌面應用)       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 與 .NET 的類比

| 概念 | .NET | Node.js |
|------|------|---------|
| 運行環境 | .NET Runtime | Node.js |
| 程式語言 | C# | JavaScript / TypeScript |
| 套件管理器 | NuGet | npm / yarn |
| 套件倉庫 | nuget.org | npmjs.com |

### 安裝 Node.js 後會得到什麼？

安裝 Node.js 後，你的電腦會有三個指令可用：

```
Node.js 安裝包
     │
     ├── node     ← JavaScript 執行器
     ├── npm      ← 套件管理器（Node Package Manager）
     └── npx      ← 套件執行器（Node Package eXecute）
```

---

## 2. 三個核心指令：node、npm、npx

### 總覽

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   指令        角色              做什麼                              │
│   ────        ────              ──────                              │
│                                                                     │
│   node        執行器            執行 JavaScript 檔案                │
│   npm         管理器            安裝/移除/更新套件                   │
│   npx         執行器            執行 node_modules 裡的套件指令       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.1 node - 執行 JavaScript 檔案

`node` 是 JavaScript 的執行器，用來執行 `.js` 檔案。

```powershell
# 執行一個 JavaScript 檔案
node app.js
node dist/src/main.js
node server.js
```

**使用時機**：執行你自己寫的（或編譯後的）JavaScript 程式。

### 2.2 npm - 套件管理器

`npm`（Node Package Manager）負責管理專案的依賴套件。

```powershell
# 套件管理
npm install              # 安裝 package.json 裡定義的所有依賴
npm install lodash       # 安裝特定套件
npm uninstall lodash     # 移除套件
npm update               # 更新套件

# 執行 scripts
npm run start            # 執行 package.json 裡 scripts.start 定義的指令
npm run build            # 執行 package.json 裡 scripts.build 定義的指令
```

**使用時機**：安裝依賴、執行 package.json 裡定義的 scripts。

### 2.3 npx - 套件執行器

`npx`（Node Package eXecute）用來執行 `node_modules/.bin/` 裡的指令。

```powershell
# 執行已安裝的套件指令
npx nx build twenty-server    # 執行 nx 套件
npx typeorm migration:run     # 執行 typeorm 套件
npx ts-node script.ts         # 執行 ts-node 套件

# 等價於（但更簡潔）
.\node_modules\.bin\nx build twenty-server
```

**使用時機**：執行第三方工具套件的指令。

### 三者的關係圖

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   安裝 Node.js                                                             │
│        │                                                                   │
│        ▼                                                                   │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐                              │
│   │  node   │     │   npm   │     │   npx   │                              │
│   └────┬────┘     └────┬────┘     └────┬────┘                              │
│        │               │               │                                   │
│        ▼               ▼               ▼                                   │
│   執行 JS 檔案     管理套件         執行套件指令                            │
│                        │               │                                   │
│   node app.js     npm install     npx nx build                             │
│        │               │               │                                   │
│        ▼               ▼               ▼                                   │
│   ┌─────────┐     ┌─────────────┐ ┌─────────────┐                          │
│   │ app.js  │     │node_modules/│ │node_modules/│                          │
│   │ 你的程式 │     │  lodash/    │ │  .bin/nx    │ ← 執行這裡的指令          │
│   └─────────┘     │  react/     │ └─────────────┘                          │
│                   └─────────────┘                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### npm run 的運作原理

當執行 `npm run xxx` 時，npm 會去 `package.json` 的 `scripts` 區塊找對應的指令：

```
你輸入的指令              package.json 裡的定義                實際執行的指令
─────────────────────────────────────────────────────────────────────────────

npm run start      →    "start": "node dist/main.js"      →    node dist/main.js
npm run build      →    "build": "npx nx build"           →    npx nx build
```

```json
// package.json
{
  "scripts": {
    "start": "node dist/main.js",
    "build": "npx nx build",
    "test": "jest"
  }
}
```

**重點**：`npm run` 只是一個「快捷方式」，實際執行的是 scripts 裡定義的指令。

---

## 3. 專案結構：package.json 與 node_modules

### 3.1 package.json - 專案定義檔

`package.json` 是 Node.js 專案的核心設定檔，定義了：

```json
{
  "name": "my-project",           // 專案名稱
  "version": "1.0.0",             // 版本號
  "scripts": {                    // 可執行的指令
    "start": "node dist/main.js",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {               // 正式環境需要的套件
    "express": "^4.18.0",
    "lodash": "^4.17.0"
  },
  "devDependencies": {            // 開發環境需要的套件
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  }
}
```

### 3.2 node_modules - 套件安裝目錄

`node_modules` 是執行 `npm install` 後產生的資料夾，存放所有下載的套件。

```
npm install 的流程：

┌──────────────┐                           ┌──────────────────┐
│ package.json │  ───── npm install ─────► │ node_modules/    │
│ (依賴清單)    │                           │ ├── express/     │
└──────────────┘                           │ ├── lodash/      │
                                           │ ├── typescript/  │
                                           │ └── .bin/        │
                                           │     ├── tsc      │
                                           │     └── jest     │
                                           └──────────────────┘
```

### 3.3 獨立專案 vs Monorepo 的 node_modules

**獨立專案模式**：每個專案各自有 node_modules

```
D:\projects\
├── frontend-app\              ← 前端專案
│   ├── package.json
│   ├── node_modules\          ← 這個專案的依賴
│   │   ├── react\
│   │   └── vite\
│   └── src\
│
└── backend-api\               ← 後端專案
    ├── package.json
    ├── node_modules\          ← 這個專案的依賴（獨立）
    │   ├── express\
    │   └── typescript\
    └── src\
```

**Monorepo 模式**：所有專案共用根目錄的 node_modules

```
D:\project\y-crm\              ← Monorepo 根目錄
├── package.json
├── node_modules\              ← 所有套件都在這（共用）
│   ├── react\
│   ├── @nestjs\
│   └── typescript\
│
└── packages\
    ├── twenty-front\          ← 沒有自己的 node_modules
    │   └── package.json
    └── twenty-server\         ← 沒有自己的 node_modules
        └── package.json
```

| 模式 | node_modules 數量 | 優點 | 缺點 |
|------|------------------|------|------|
| 獨立專案 | 每個專案一個 | 專案獨立，互不影響 | 重複下載，佔用空間 |
| Monorepo | 只有根目錄一個 | 共用依賴，節省空間 | 版本必須統一 |

---

## 4. 建置產物：dist 資料夾

### 4.1 為什麼需要建置？

TypeScript 無法直接被 Node.js 執行，必須先編譯成 JavaScript：

```
┌──────────────┐                        ┌──────────────┐
│   src/       │                        │   dist/      │
│ (TypeScript) │  ───── 建置 ─────►     │ (JavaScript) │
│              │       tsc / vite       │              │
│ main.ts      │                        │ main.js      │
└──────────────┘                        └──────────────┘
                                               │
                                               ▼
                                        node dist/main.js
                                        （可以執行了）
```

### 4.2 建置指令

```powershell
# NestJS 後端建置
npx nx build twenty-server    # 使用 nx
npm run build                 # 使用 npm run

# React + Vite 前端建置
npx nx build twenty-front
npm run build
```

### 4.3 dist 的特性

| 特性 | 說明 |
|------|------|
| **每個專案各自產生** | 不能共用，內容完全不同 |
| **不加入 git** | .gitignore 會排除 |
| **可刪除重建** | 執行 build 就會重新產生 |

```
D:\project\y-crm\
├── node_modules\              ← 共用
│
└── packages\
    ├── twenty-front\
    │   ├── src\               ← 原始碼
    │   └── dist\              ← 建置產物（前端專屬）
    │       ├── index.html
    │       └── assets/
    │
    └── twenty-server\
        ├── src\               ← 原始碼
        └── dist\              ← 建置產物（後端專屬）
            └── src/
                └── main.js
```

---

## 5. Monorepo 架構：Nx 工具鏈

### 5.1 什麼是 Nx？

Nx 是一個 **Monorepo 管理工具**，用來管理多個專案的建置、測試、執行。

### 5.2 與 .NET 的類比

| 概念 | .NET | Node.js + Nx |
|------|------|--------------|
| 運行環境 | .NET Runtime | Node.js |
| 套件管理器 | NuGet | npm / yarn |
| 工作區定義檔 | `.sln` | `nx.json` + `package.json` |
| 專案定義檔 | `.csproj` | `project.json` |
| 執行指令 | `dotnet build` | `npx nx build` |

### 5.3 Nx 的檔案結構

```
D:\project\y-crm\
├── package.json          ← 依賴定義 + 工作區設定
├── nx.json               ← Nx 工作區配置（類似 .sln）
├── yarn.lock             ← 鎖定依賴版本
├── node_modules/         ← 安裝的套件
│
└── packages/
    ├── twenty-front/
    │   └── project.json  ← 專案配置（類似 .csproj）
    │
    └── twenty-server/
        └── project.json  ← 專案配置（類似 .csproj）
```

### 5.4 project.json - 定義可執行的任務

```json
// packages/twenty-server/project.json
{
  "name": "twenty-server",
  "targets": {
    "build": {                          // npx nx build twenty-server
      "commands": ["nest build"]
    },
    "start": {                          // npx nx start twenty-server
      "command": "nest start --watch"
    },
    "start:prod": {                     // npx nx run twenty-server:start:prod
      "command": "node dist/src/main"
    },
    "test": {                           // npx nx test twenty-server
      "command": "jest"
    }
  }
}
```

### 5.5 npx nx 指令格式

```
npx nx <任務> <專案名>
npx nx run <專案名>:<任務>

# 範例
npx nx build twenty-server           # 建置後端
npx nx start twenty-front            # 啟動前端
npx nx run twenty-server:start:prod  # 執行特定任務
npx nx test twenty-server            # 測試後端
```

### 5.6 Nx 的優勢

| 功能 | npm run | npx nx |
|------|---------|--------|
| 指定專案 | 需要 cd 到子目錄 | `nx build twenty-server` |
| 建置快取 | 每次重建 | 跳過沒變更的專案 |
| 依賴順序 | 手動處理 | 自動先建置依賴的專案 |
| 平行執行 | 需要額外工具 | 內建支援 |

---

## 6. 前端 vs 後端：React + Vite 與 NestJS 對比

### 6.1 檔案結構對比

> **注意**：以下是「典型入門級專案」的結構，用於說明基本概念。
> 實際的企業級專案（如 Twenty）會有更複雜的模組化結構，
> 詳見 [Twenty_專案結構指南.md](./Twenty_專案結構指南.md)。

```
React + Vite 專案（典型入門）          NestJS 專案（典型入門）
────────────────────────              ──────────────────────
├── package.json                     ├── package.json
├── vite.config.ts    ← 建置設定     ├── nest-cli.json   ← 建置設定
├── tsconfig.json                    ├── tsconfig.json
├── index.html        ← 入口頁面     │
├── src/                             ├── src/
│   ├── main.tsx      ← 程式入口     │   ├── main.ts     ← 程式入口
│   ├── App.tsx                      │   ├── app.module.ts
│   └── components/                  │   └── controllers/
└── dist/             ← 建置產物     └── dist/           ← 建置產物
    ├── index.html                       └── main.js
    └── assets/
```

#### 關於入口檔案

入口檔案的名稱**沒有強制規定**，是由 `index.html` 中的 `<script>` 標籤決定：

```html
<!-- index.html -->
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>  <!-- 這裡決定入口 -->
</body>
```

| 專案類型 | 常見入口設定 | 入口檔案 |
|----------|--------------|----------|
| 典型 Vite 專案 | `src="/src/main.tsx"` | `src/main.tsx` |
| Twenty 前端 | `src="/src/index.tsx"` | `src/index.tsx` |

### 6.2 開發流程對比

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           開 發 流 程 對 比                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   階段        React + Vite                    NestJS                        │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   安裝依賴    npm install                     npm install                   │
│              (產生 node_modules)              (產生 node_modules)            │
│                                                                             │
│               ↓                                ↓                            │
│                                                                             │
│   開發模式    npm run dev                     npm run start:dev             │
│              (vite 啟動開發伺服器)             (nest start --watch)          │
│               http://localhost:5173            http://localhost:3000        │
│               有熱更新 (HMR)                   有熱更新 (Hot Reload)         │
│                                                                             │
│               ↓                                ↓                            │
│                                                                             │
│   建置        npm run build                   npm run build                 │
│              (vite build)                     (nest build)                  │
│               產生 dist/                       產生 dist/                   │
│               - 壓縮的 JS/CSS                  - 編譯後的 JS                 │
│               - 優化的靜態檔案                                               │
│                                                                             │
│               ↓                                ↓                            │
│                                                                             │
│   執行        npm run preview                 node dist/main.js             │
│   建置結果   (本地預覽 dist)                  (直接執行編譯結果)              │
│                                                                             │
│               ↓                                ↓                            │
│                                                                             │
│   部署        上傳 dist/ 到                   在伺服器執行                   │
│              - Nginx                          node dist/main.js             │
│              - Vercel / CDN                   或用 PM2 / Docker             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 常用指令對照表

| 階段 | React + Vite | NestJS |
|------|--------------|--------|
| 安裝依賴 | `npm install` | `npm install` |
| 開發模式 | `npm run dev` | `npm run start:dev` |
| 建置 | `npm run build` | `npm run build` |
| 執行建置結果 | `npm run preview` | `node dist/main.js` |
| 語法檢查 | `npm run lint` | `npm run lint` |
| 執行測試 | `npm run test` | `npm run test` |

### 6.4 建置產物的差異

| | React + Vite | NestJS |
|---|---|---|
| **建置前 (src)** | TypeScript + JSX | TypeScript |
| **建置後 (dist)** | 壓縮的 JS + CSS + HTML | 編譯後的 JS |
| **執行方式** | 瀏覽器載入 | Node.js 執行 |
| **部署目標** | 靜態伺服器 (Nginx/CDN) | 應用伺服器 (Node.js) |

---

## 7. 總結對照表

### 7.1 指令總結

| 指令 | 用途 | 範例 |
|------|------|------|
| `node` | 執行 JavaScript 檔案 | `node dist/main.js` |
| `npm` | 管理套件 + 執行 scripts | `npm install`, `npm run start` |
| `npx` | 執行 node_modules 裡的套件 | `npx nx build`, `npx typeorm` |

### 7.2 檔案與資料夾總結

| 檔案/資料夾 | 用途 | 如何產生 | 可否刪除 |
|-------------|------|----------|----------|
| `package.json` | 定義依賴與 scripts | 手動建立 | 不可 |
| `node_modules/` | 存放下載的套件 | `npm install` | 可，重新 install 即可 |
| `dist/` | 存放建置產物 | `npm run build` | 可，重新 build 即可 |
| `nx.json` | Nx 工作區配置 | 手動建立 | 不可 |
| `project.json` | Nx 專案配置 | 手動建立 | 不可 |

### 7.3 與 .NET 的完整對照

| 概念 | .NET | Node.js / Nx |
|------|------|--------------|
| 運行環境 | .NET Runtime | Node.js |
| 程式語言 | C# | JavaScript / TypeScript |
| 套件管理器 | NuGet | npm / yarn |
| 套件倉庫 | nuget.org | npmjs.com |
| 工作區定義 | `.sln` | `nx.json` + `package.json` |
| 專案定義 | `.csproj` | `project.json` |
| 依賴還原 | `dotnet restore` | `npm install` |
| 建置 | `dotnet build` | `npx nx build` / `npm run build` |
| 執行 | `dotnet run` | `node dist/main.js` |
| 套件資料夾 | `~/.nuget/packages` | `node_modules/` |
| 建置產物 | `bin/`, `obj/` | `dist/` |

---

## 附錄：快速參考

### 日常開發指令

```powershell
# 安裝依賴（首次或 package.json 變更後）
npm install
# 或
yarn install

# 開發模式（有熱更新）
npm run start               # 一鍵啟動全部
npx nx start twenty-front   # 只啟動前端
npx nx start twenty-server  # 只啟動後端

# 建置
npx nx build twenty-server
npx nx build twenty-front

# 執行建置後的程式
node dist/src/main.js

# 測試
npx nx test twenty-server
npx nx test twenty-front
```

### 記憶口訣

```
node  = 跑程式（你寫的 JS）
npm   = 管套件（install/uninstall）+ 跑 scripts（npm run xxx）
npx   = 跑工具（別人寫的套件指令）
```

---

## 更新日誌

| 日期 | 更新內容 |
|------|----------|
| 2025-01-07 | 初版建立 |
