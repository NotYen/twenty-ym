# Y-CRM 授權合規分析

> 建立日期：2026-01-06
> 目的：確認 Y-CRM 商用的法律合規性

---

## 結論：✅ Y-CRM 商用完全合規

只要遵守以下條件，Y-CRM 可以合法部署到 AWS 並以訂閱制收費。

---

## Twenty 的授權模式

Twenty 採用**雙授權模式**：

| 授權類型 | 適用範圍 | 商用條件 |
|---------|---------|---------|
| **AGPL-3.0** | 大部分程式碼 | ✅ 可商用，需開源修改 |
| **Enterprise License** | `/* @license Enterprise */` 標記的檔案 | ❌ 需購買授權 |

---

## Y-CRM 的 Enterprise 功能使用狀態

### 檢查結果：❌ 未使用任何 Enterprise 功能

| Enterprise 功能 | 環境變數 | Y-CRM 設定 | 狀態 |
|----------------|---------|-----------|------|
| Billing/Stripe | `IS_BILLING_ENABLED` | `false` | ❌ 未啟用 |
| SSO (SAML/OIDC) | `ENTERPRISE_KEY` | 未設定 | ❌ 未啟用 |
| Custom Domain | `ENTERPRISE_KEY` | 未設定 | ❌ 未啟用 |

### 程式碼保護機制

Twenty 的 Enterprise 功能有多層保護：

```typescript
// SSO 功能會檢查 Enterprise Key
skip: currentWorkspace?.hasValidEnterpriseKey === false

// Billing 功能會檢查環境變數
if (!this.twentyConfigService.get('IS_BILLING_ENABLED')) {
  return;
}
```

**結論**：Enterprise 程式碼存在於 repo 中是正常的（fork 自 Twenty），但因為沒有設定相關環境變數，這些功能不會被啟用，不構成違規。

---

## AGPL-3.0 商用合規 Checklist

### ✅ 必須遵守的義務

| 項目 | 說明 | 建議做法 |
|------|------|---------|
| **原始碼公開** | 所有使用者都能取得完整原始碼 | GitHub repo 設為 public |
| **原始碼連結** | 網站上要有明顯的連結 | 在 footer 或 About 頁面加上 GitHub 連結 |
| **保留版權聲明** | LICENSE 檔案、程式碼中的版權註解 | 不要刪除任何 copyright 聲明 |
| **修改標示** | 標明這是修改版本 | README 說明這是基於 Twenty 的 fork |
| **相同授權** | 修改後的程式碼也必須用 AGPL-3.0 | 保持 LICENSE 檔案不變 |

### ✅ 可以做的事

- ✅ 部署到 AWS 商用
- ✅ 以 SaaS 訂閱制收費
- ✅ 收取技術支援費
- ✅ 收取客製化開發費
- ✅ 收取託管/維運費
- ✅ 修改程式碼（需開源）
- ✅ 加入新功能（需開源）

### ❌ 不可以做的事

- ❌ 閉源商用（不公開原始碼）
- ❌ 使用 Enterprise 功能而不購買授權
- ❌ 移除 Twenty 的版權聲明
- ❌ 用其他授權發布修改後的程式碼

---

## 商用前的準備事項

### 1. 公開原始碼

```bash
# 將 GitHub repo 設為 public
# 或提供原始碼下載連結
```

### 2. 在產品中加入原始碼連結

建議在以下位置加入：
- Footer
- About 頁面
- 設定頁面

範例文字：
```
Y-CRM 基於 Twenty CRM 開發
原始碼：https://github.com/your-org/y-crm
授權：AGPL-3.0
```

### 3. 保留版權聲明

確保以下檔案存在且未被修改：
- `LICENSE`
- 所有檔案中的 copyright 註解

---

## 風險提醒

### AGPL 的特性（不是 bug）

因為原始碼公開，客戶理論上可以：
1. 下載 Y-CRM 原始碼
2. 自己部署
3. 不付訂閱費

**這是合法的**，你的商業價值在於：
- 持續維護更新
- 技術支援
- LINE 整合等差異化功能
- 省去客戶自己架設的麻煩

---

## 與 Odoo 授權比較

| 項目 | Y-CRM (AGPL-3.0) | Odoo Community (LGPL) |
|------|-----------------|----------------------|
| 商用 | ✅ 可以 | ✅ 可以 |
| 修改後需開源 | ✅ 是（網路使用也算） | ⚠️ 只有修改 Odoo 本身才需要 |
| SaaS 收費 | ✅ 可以 | ✅ 可以 |
| 閉源商用 | ❌ 需購買 Enterprise License | ⚠️ 較寬鬆但有限制 |

**注意**：Odoo 不是完全免費，Enterprise 版需要付費（~$24.90/user/月起）。

---

## 總結

| 問題 | 答案 |
|------|------|
| Y-CRM 有違反 Enterprise License 嗎？ | ❌ 沒有，未使用任何 Enterprise 功能 |
| 可以部署到 AWS 嗎？ | ✅ 可以 |
| 可以商用收費嗎？ | ✅ 可以，遵守 AGPL-3.0 |
| 需要開源嗎？ | ✅ 是，這是 AGPL 的要求 |
| 需要購買 Twenty Enterprise License 嗎？ | ❌ 不需要（除非要用 SSO、Custom Domain 等功能） |

---

## 參考資料

- Twenty License: https://github.com/twentyhq/twenty/blob/main/LICENSE
- AGPL-3.0: https://www.gnu.org/licenses/agpl-3.0.html
- Twenty Pricing: https://twenty.com/pricing
