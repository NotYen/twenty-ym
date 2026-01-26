# 2026-01-27 Bugfix 修復記錄

本文件記錄了 2026-01-27 修復的三個 Y-CRM 問題：

## 修復內容概覽

| # | 問題 | 影響範圍 | 修復方式 |
|---|------|----------|----------|
| 1 | Slide Panel 重複名稱建議失效 | 側邊面板 | 程式碼修改 |
| 2 | LINKS 欄位顯示問題 | 所有 Workspace | 程式碼 + SQL |
| 3 | Person/Company 關聯欄位標籤 | 所有 Workspace | 程式碼 + SQL |

---

## 1. Slide Panel 重複名稱建議功能失效

### 問題描述
在表格視圖中編輯標題欄位時，重複名稱建議功能正常運作，但在側邊滑動面板（Slide Panel / Command Menu）中編輯標題時，重複建議不會顯示。

### 根本原因
`CommandMenuRecordInfo.tsx` 中的 `FieldContext.Provider` 設定了 `isLabelIdentifier: false`，導致 `useDuplicateNameSuggestion` hook 被禁用。

### 修復方案

**檔案：** `packages/twenty-front/src/modules/command-menu/components/CommandMenuRecordInfo.tsx`

**修改：** 第 82 行
```diff
<FieldContext.Provider
  value={{
    recordId: objectRecordId,
-   isLabelIdentifier: false,
+   isLabelIdentifier: true,
    fieldDefinition,
    useUpdateRecord: useUpdateOneObjectRecordMutation,
    isCentered: false,
    isDisplayModeFixHeight: true,
    isRecordFieldReadOnly: isTitleReadOnly,
  }}
>
```

### 驗證步驟
1. 開啟任一 Person 或 Company 記錄的側邊面板
2. 點擊標題欄位進入編輯模式
3. 輸入與現有記錄相似的名稱
4. 確認重複建議下拉選單正常顯示

---

## 2. LINKS 欄位顯示問題（linkedinLink, xLink）

### 問題描述
Person 和 Company 物件中的 `linkedinLink` 和 `xLink` 欄位在 UI 中可能顯示異常，因為缺少 `maxNumberOfValues` 設定。

### 根本原因
LINKS 類型欄位需要在 `settings` 中設定 `maxNumberOfValues: 1` 才能正確顯示單一連結。

### 修復方案

#### A. 程式碼修改（新 Workspace）

**檔案：** `packages/twenty-server/src/modules/company/standard-objects/company.workspace-entity.ts`

```typescript
@WorkspaceField({
  standardId: COMPANY_STANDARD_FIELD_IDS.linkedinLink,
  type: FieldMetadataType.LINKS,
  label: 'Linkedin',
  icon: 'IconBrandLinkedin',
  settings: { maxNumberOfValues: 1 },
})
linkedinLink: LinksMetadata | null;

@WorkspaceField({
  standardId: COMPANY_STANDARD_FIELD_IDS.xLink,
  type: FieldMetadataType.LINKS,
  label: 'X',
  icon: 'IconBrandX',
  settings: { maxNumberOfValues: 1 },
})
xLink: LinksMetadata | null;
```

**檔案：** `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`

```typescript
@WorkspaceField({
  standardId: PERSON_STANDARD_FIELD_IDS.linkedinLink,
  type: FieldMetadataType.LINKS,
  label: 'Linkedin',
  icon: 'IconBrandLinkedin',
  settings: { maxNumberOfValues: 1 },
})
linkedinLink: LinksMetadata | null;

@WorkspaceField({
  standardId: PERSON_STANDARD_FIELD_IDS.xLink,
  type: FieldMetadataType.LINKS,
  label: 'X',
  icon: 'IconBrandX',
  settings: { maxNumberOfValues: 1 },
})
xLink: LinksMetadata | null;
```

#### B. SQL 修復（現有 AWS Workspace）

```sql
-- 更新所有 workspace 的 linkedinLink 和 xLink 欄位設定
UPDATE core."fieldMetadata"
SET settings = jsonb_set(
  COALESCE(settings, '{}')::jsonb,
  '{maxNumberOfValues}',
  '1'
)
WHERE name IN ('linkedinLink', 'xLink');

-- 驗證更新結果
SELECT "workspaceId", name, settings
FROM core."fieldMetadata"
WHERE name IN ('linkedinLink', 'xLink')
ORDER BY "workspaceId", name;
```

**執行結果：** 36 rows affected（18 個 Workspace × 2 個欄位）

---

## 3. Person/Company 關聯欄位標籤修正

### 問題描述
Person 物件的 `company` 關聯欄位標籤應為「所屬公司」，Company 物件的 `people` 關聯欄位標籤應為「聯絡人員」。

### 修復方案

#### A. 程式碼修改（新 Workspace）

**檔案：** `packages/twenty-server/src/modules/company/standard-objects/company.workspace-entity.ts`

```typescript
@WorkspaceRelation({
  standardId: COMPANY_STANDARD_FIELD_IDS.people,
  type: RelationType.ONE_TO_MANY,
  label: msg`聯絡人員`,  // 原本是 msg`People`
  description: msg`People linked to the company.`,
  icon: 'IconUsers',
  inverseSideTarget: () => PersonWorkspaceEntity,
  inverseSideFieldKey: 'company',
})
@WorkspaceIsNullable()
people: Relation<PersonWorkspaceEntity[]>;
```

**檔案：** `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`

```typescript
@WorkspaceRelation({
  standardId: PERSON_STANDARD_FIELD_IDS.company,
  type: RelationType.MANY_TO_ONE,
  label: msg`所屬公司`,  // 原本是 msg`Company`
  description: msg`Contact's company`,
  icon: 'IconBuildingSkyscraper',
  joinColumn: 'companyId',
  inverseSideTarget: () => CompanyWorkspaceEntity,
  inverseSideFieldKey: 'people',
})
@WorkspaceIsNullable()
company: Relation<CompanyWorkspaceEntity> | null;
```

#### B. SQL 修復（現有 AWS Workspace）

```sql
-- 更新 Company 物件的 people 欄位標籤
UPDATE core."fieldMetadata" fm
SET label = '聯絡人員'
FROM core."objectMetadata" om
WHERE fm."objectMetadataId" = om.id
  AND om."nameSingular" = 'company'
  AND fm.name = 'people';

-- 更新 Person 物件的 company 欄位標籤
UPDATE core."fieldMetadata" fm
SET label = '所屬公司'
FROM core."objectMetadata" om
WHERE fm."objectMetadataId" = om.id
  AND om."nameSingular" = 'person'
  AND fm.name = 'company';

-- 驗證更新結果
SELECT om."workspaceId", om."nameSingular", fm.name, fm.label
FROM core."fieldMetadata" fm
JOIN core."objectMetadata" om ON fm."objectMetadataId" = om.id
WHERE (om."nameSingular" = 'company' AND fm.name = 'people')
   OR (om."nameSingular" = 'person' AND fm.name = 'company')
ORDER BY om."workspaceId", om."nameSingular";
```

**執行結果：** 16 rows affected（每個 Workspace 有 2 個欄位需要更新）

---

## 部署說明

### 本地開發環境
1. 執行 `yarn start` 或 `./scripts/run-local.sh` 重新啟動服務
2. 修改會自動生效

### AWS 環境
1. 重新 build Docker image：
   ```bash
   docker compose build --no-cache backend frontend
   ```
2. 推送並部署新 image
3. **現有 Workspace** 已透過 SQL 手動修復完成
4. **新建 Workspace** 會自動使用正確的設定

### 驗證清單
- [ ] Slide Panel 重複名稱建議正常顯示
- [ ] linkedinLink / xLink 欄位正確顯示
- [ ] Person 的「所屬公司」標籤正確
- [ ] Company 的「聯絡人員」標籤正確

---

## 相關檔案

| 檔案 | 修改類型 |
|------|----------|
| `CommandMenuRecordInfo.tsx` | isLabelIdentifier: false → true |
| `company.workspace-entity.ts` | LINKS settings + label |
| `person.workspace-entity.ts` | LINKS settings + label |

## 參考文件

- [DUPLICATE_NAME_SUGGESTION.md](../features/DUPLICATE_NAME_SUGGESTION.md) - 重複名稱建議功能完整說明
- [Y-CRM_METADATA_SYNC_GUIDE.md](./Y-CRM_METADATA_SYNC_GUIDE.md) - Metadata 同步指南
