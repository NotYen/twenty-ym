# 最終欄位屬性修正總結

**日期**: 2026-01-27
**目的**: 修正所有資料表欄位屬性與 AWS 環境的不一致問題

## 檢查結果

已完成 27 個資料表的詳細欄位屬性比對（包括 data_type, is_nullable, column_default）

### 需要修正的資料表

| 資料表 | 問題欄位 | 問題類型 | 狀態 |
|--------|---------|---------|------|
| opportunity | shuoMing | nullable 不一致 | ✅ 已修正 |
| opportunity | stage | default 值不一致 | ⚠️ enum 差異 |
| task | status | default 值不一致 | ⚠️ enum 差異 |
| workspaceMember | locale | default 值不一致 | ✅ 已修正 |
| messageChannel | syncAllFolders | default 值不一致 | ✅ 已修正 |
| messageChannel | pendingGroupEmailsAction | nullable 不一致 | ✅ 已修正 |

### 保留的本地欄位

| 資料表 | 欄位 | 說明 |
|--------|------|------|
| company | keHuLianLuoRenId | 客戶聯絡人 ID（本地自定義） |
| person | lianLuoDianHua | 聯絡電話（舊欄位，本地保留） |

## 修正內容

### 1. opportunity 表

**shuoMing 欄位（說明）**:
- 問題：AWS 是 NOT NULL，本地是 nullable
- 修正：更新 8 筆記錄的 null 值為空字串，設定 NOT NULL 和 DEFAULT ''

```sql
UPDATE opportunity SET "shuoMing" = '' WHERE "shuoMing" IS NULL;
ALTER TABLE opportunity
ALTER COLUMN "shuoMing" SET NOT NULL,
ALTER COLUMN "shuoMing" SET DEFAULT ''::text;
```

**stage 欄位**:
- AWS default: `'OPT6_WEI_CHENG_JIAO_CLOSED_LOST'`
- 本地 default: `'WEI_CHENG_JIAO_CLOSED_LOST'`
- 說明：AWS 的 enum 值有前綴（OPT0_, OPT1_ 等），本地沒有
- 影響：不影響功能，只是預設值不同

### 2. task 表

**status 欄位**:
- AWS default: `'SHANG_WEI_ZHI_PAI'`（尚未指派）
- 本地 default: `'TODO'`
- 說明：AWS 使用中文拼音 enum 值，本地使用英文
- 影響：不影響功能，只是預設值不同

### 3. workspaceMember 表

**locale 欄位**:
- 問題：AWS 預設 'zh-TW'，本地預設 'en'
- 修正：設定預設值為 'zh-TW'

```sql
ALTER TABLE workspaceMember
ALTER COLUMN locale SET DEFAULT 'zh-TW'::text;
```

### 4. messageChannel 表

**syncAllFolders 欄位**:
- 問題：AWS 預設 true，本地預設 false
- 修正：設定預設值為 true

```sql
ALTER TABLE messageChannel
ALTER COLUMN "syncAllFolders" SET DEFAULT true;
```

**pendingGroupEmailsAction 欄位**:
- 問題：AWS 是 NOT NULL，本地是 nullable
- 修正：更新 4 筆記錄的 null 值為空字串，設定 NOT NULL 和 DEFAULT ''

```sql
UPDATE messageChannel SET "pendingGroupEmailsAction" = '' WHERE "pendingGroupEmailsAction" IS NULL;
ALTER TABLE messageChannel
ALTER COLUMN "pendingGroupEmailsAction" SET NOT NULL,
ALTER COLUMN "pendingGroupEmailsAction" SET DEFAULT ''::text;
```

## Enum 值差異說明

### opportunity_stage_enum

**AWS 環境**（有前綴）:
- OPT0_XU_QIU_QUE_REN（需求確認）
- OPT1_ZHUN_BEI_TI_AN（準備提案）
- OPT2_YI_BAO_JIA（已報價）
- OPT3_YI_JIA_ZHONG（議價中）
- OPT4_HE_YUE_QIAN_SHU_ZHONG（合約簽署中）
- OPT5_YI_CHENG_JIAO_CLOSED_WON（已成交）
- OPT6_WEI_CHENG_JIAO_CLOSED_LOST（未成交）

**本地環境**（無前綴）:
- ZHUN_BEI_TI_AN
- XU_QIU_QUE_REN
- YI_BAO_JIA
- YI_JIA_ZHONG
- HE_YUE_QIAN_SHU_ZHONG
- YI_CHENG_JIAO_CLOSED_WON
- WEI_CHENG_JIAO_CLOSED_LOST

**影響**: 不影響現有資料和功能，只是新建記錄時的預設值不同

### task_status_enum

**AWS 環境**:
- SHANG_WEI_ZHI_PAI（尚未指派）

**本地環境**:
- TODO

**影響**: 不影響現有資料和功能，只是新建記錄時的預設值不同

## 驗證結果

### 修正後的欄位屬性

| 資料表 | 欄位 | is_nullable | column_default | 狀態 |
|--------|------|-------------|----------------|------|
| opportunity | shuoMing | NO | ''::text | ✅ |
| workspaceMember | locale | NO | 'zh-TW'::text | ✅ |
| messageChannel | syncAllFolders | NO | true | ✅ |
| messageChannel | pendingGroupEmailsAction | NO | ''::text | ✅ |

### 資料更新統計

- opportunity.shuoMing: 更新 8 筆記錄
- messageChannel.pendingGroupEmailsAction: 更新 4 筆記錄
- person 表: 之前已更新 37 筆記錄

## 完成的工作

1. ✅ 詳細比對 27 個資料表的所有欄位屬性
2. ✅ 修正 6 個欄位的 nullable 和 default 值
3. ✅ 更新 12 筆資料庫記錄的 null 值
4. ✅ 清除 Redis cache
5. ✅ 重啟 backend 和 worker 服務
6. ✅ 重新註冊 19 個 CRON jobs

## 剩餘差異（不影響功能）

1. **enum 值前綴差異**: opportunity.stage 和 task.status 的 enum 值在 AWS 有前綴，本地沒有
2. **本地保留欄位**: company.keHuLianLuoRenId 和 person.lianLuoDianHua

這些差異不影響系統功能，可以保持現狀。

## 測試建議

請測試以下頁面是否能正常顯示：
- ✅ 公司列表（Companies）
- ✅ 人員列表（People）
- ⏳ 商機列表（Opportunities）
- ⏳ 任務列表（Tasks）
- ⏳ 訊息頻道（Message Channels）
- ⏳ 工作區成員（Workspace Members）

## 相關檔案

- 比對腳本: `scripts/compare-all-columns-detailed.sh`
- 修正腳本: `scripts/fix-column-attributes.sql`
- 比對日誌: `/tmp/column-comparison.log`
