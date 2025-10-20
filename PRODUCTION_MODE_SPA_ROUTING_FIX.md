# Production Mode SPA Routing Fix

## 🚨 問題描述
在 production 模式下，前端路由出現 404 錯誤：
```
GET http://118.168.188.27.nip.io:8866/objects/people?viewId=xxx 404 (Not Found)
```

## 🔍 根本原因
- **不是 Twenty CRM 開源項目的問題**
- **是系統配置問題**：SPA (Single Page Application) 路由配置不正確
- `serve` 命令缺少 `-s` (single) 參數，導致所有非根路由都返回 404

## ✅ 解決方案
在 `start_all_service_start.sh` 中修改前端啟動命令：

**修改前：**
```bash
npx serve packages/twenty-front/build -l ${FRONTEND_PORT}
```

**修改後：**
```bash
npx serve packages/twenty-front/build -l ${FRONTEND_PORT} -s
```

## 📋 關鍵參數說明
- `-s` 或 `--single`: 啟用 SPA 模式，所有路由都 fallback 到 index.html
- 讓 React Router 處理前端路由，而不是讓 serve 返回 404

## 🎯 驗證方法
```bash
# 測試根路由
curl -I http://118.168.188.27.nip.io:8866/

# 測試 SPA 路由
curl -I http://118.168.188.27.nip.io:8866/objects/people
# 應該都返回 200 OK 和 index.html
```

## 📝 注意事項
- 這是 **配置問題**，不是 Twenty CRM 的 bug
- 所有 SPA 應用都需要正確的 fallback 配置
- 在 development 模式下不會出現此問題（因為 Vite dev server 自動處理）
- 在 production 模式下必須手動配置

## 🔧 相關文件
- `start_all_service_start.sh`: 啟動腳本
- `packages/twenty-front/build/`: 前端構建輸出目錄

---
**修復日期**: 2025-10-20
**修復人員**: AI Assistant
**狀態**: ✅ 已修復並記錄
