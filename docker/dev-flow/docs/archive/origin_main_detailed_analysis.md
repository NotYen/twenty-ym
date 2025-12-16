# Origin/Main 分支 Commit 详细分析报告
**生成时间**: 2024-12-19
**当前分支**: `merge_dev_singleuser_docker`
**当前分支最新 PR**: #15966

## 📊 总体统计

- **总 commit 数**: 259
- **已 cherry-pick**: 65 (25.1%)
- **未 cherry-pick**: 194 (74.9%)

## 📈 未 cherry-pick 的 commit 按类型统计

- **I18N**: 56 个
- **OTHER**: 53 个
- **BUGFIX**: 49 个
- **FEATURE**: 23 个
- **REFACTOR**: 5 个
- **MIGRATION**: 4 个
- **RELEASE**: 3 个
- **SECURITY**: 1 个

## 🔴 高优先级 Commit（建议优先处理）

### 1. PR #16009 - MIGRATION

- **Hash**: `ea3c5d2d45`
- **标题**: Migrate role and role target to v2 (#16009)
- **文件数**: 131
- **优先级**: 🔴 高

### 2. PR #16018 - MIGRATION

- **Hash**: `ca5bd76c6a`
- **标题**: Null equivalence - migration command (#16018)
- **文件数**: 4
- **优先级**: 🔴 高

### 3. PR #16030 - MIGRATION

- **Hash**: `04562b11fb`
- **标题**: Migrate metadata cache (#16030)
- **文件数**: 49
- **优先级**: 🔴 高

### 4. PR #16047 - SECURITY

- **Hash**: `71724de7dd`
- **标题**: Security - disable gql introspection for non-auth user (#16047)
- **文件数**: 3
- **优先级**: 🔴 高

### 5. PR #16206 - MIGRATION

- **Hash**: `77409b6eb2`
- **标题**: [Requires "warm" cache flush (no immediate downtime before flush)] Migrate viewGroup.fieldMetadataId -> view.mainGroupByFieldMetadataId (1/3) (#16206)
- **文件数**: 71
- **优先级**: 🔴 高


## 🟡 中优先级 Commit（Bug 修复）

### 1. PR #15971

- **Hash**: `7109abc311`
- **标题**: fix: Invisible content after closing the settings on mobile  (#15971)
- **文件数**: 1
- **主要文件**: .../navigation/components/MobileNavigationBar.tsx
- **优先级**: 🟡 中

### 2. PR #15986

- **Hash**: `44c0dcde5b`
- **标题**: Message channel change 3 fix (#15986)
- **文件数**: 10
- **主要文件**: .../services/create-message-channel.service.ts, .../services/imap-smtp-caldav-apis.service.spec.ts, .../services/imap-smtp-caldav-apis.service.ts
- **优先级**: 🟡 中

### 3. PR #15991

- **Hash**: `1fa9c45879`
- **标题**: Fix twenty sdk (#15991)
- **文件数**: 3
- **主要文件**: packages/twenty-apps/hello-world/package.json, .../twenty-cli/src/constants/base-application-project/package.json, packages/twenty-sdk/package.json
- **优先级**: 🟡 中

### 4. PR #15992

- **Hash**: `28b8a4f7ec`
- **标题**: Fix yarn lock (#15992)
- **文件数**: 1
- **主要文件**: yarn.lock
- **优先级**: 🟡 中

### 5. PR #15997

- **Hash**: `aa5d30a911`
- **标题**: Fix twenty cli (#15997)
- **文件数**: 22
- **主要文件**: packages/twenty-cli/package.json, packages/twenty-cli/project.json, .../twenty-cli/src/commands/app-add.command.ts
- **优先级**: 🟡 中

### 6. PR #16006

- **Hash**: `f2a0b0517a`
- **标题**: fix ci (#16006)
- **文件数**: 2
- **主要文件**: .../connected-account/services/imap-smtp-caldav-apis.service.spec.ts, .../modules/connected-account/services/imap-smtp-caldav-apis.service.ts
- **优先级**: 🟡 中

### 7. PR #16016

- **Hash**: `8299488f21`
- **标题**: Fix front data model edition + non nullable workspaceCustom application migration (#16016)
- **文件数**: 33
- **主要文件**: .../twenty-front/src/generated-metadata/graphql.ts, packages/twenty-front/src/generated/graphql.ts, .../services/__tests__/apollo.factory.test.ts
- **优先级**: 🟡 中

### 8. PR #16024

- **Hash**: `a735e3dfef`
- **标题**: Dirty fix twenty cli ci build order issue (#16024)
- **文件数**: 14
- **主要文件**: .../hello-world/src/objects/postCard.ts, packages/twenty-apps/hello-world/yarn.lock, packages/twenty-cli/project.json
- **优先级**: 🟡 中

### 9. PR #16033

- **Hash**: `86aff36035`
- **标题**: Fix and improve chart type selection (#16033)
- **文件数**: 5
- **主要文件**: .../components/ChartTypeSelectionSection.tsx, .../page-layout/constants/GraphTypeInformation.ts, .../components/SidePanelInformationBanner.tsx
- **优先级**: 🟡 中

### 10. PR #16035

- **Hash**: `26e2fe349f`
- **标题**: Fix page layout widget deletion (#16035)
- **文件数**: 4
- **主要文件**: .../constants/CommandMenuPagesConfig.tsx, ....tsx => CommandMenuPageLayoutChartSettings.tsx}, .../CommandMenuPageLayoutGraphFilter.tsx
- **优先级**: 🟡 中

### 11. PR #16037

- **Hash**: `b2472b30c4`
- **标题**: Add logs to debug user being disconnected randomly (#16037)
- **文件数**: 3
- **主要文件**: .../src/modules/apollo/hooks/useApolloFactory.ts, .../src/modules/apollo/services/apollo.factory.ts, .../src/modules/apollo/utils/getTokenPair.ts
- **优先级**: 🟡 中

### 12. PR #16038

- **Hash**: `316aec3c40`
- **标题**: fix: prevent NUMERIC field type creation via API (#16038)
- **文件数**: 5
- **主要文件**: .../SettingsNonCompositeFieldTypeConfigs.ts, .../data-model/types/SettingsExcludedFieldType.ts, .../flat-field-metadata-type-validator.service.ts
- **优先级**: 🟡 中

### 13. PR #16050

- **Hash**: `2028a8f9be`
- **标题**: Null equivalence - Fix (#16050)
- **文件数**: 5
- **主要文件**: .../src/engine/twenty-orm/utils/format-result.util.ts, .../common/standard-objects/workflow.workspace-entity.ts, .../workflow/workflow-trigger/jobs/workflow-trigger.job.ts
- **优先级**: 🟡 中

### 14. PR #16056

- **Hash**: `42bba3de52`
- **标题**: Fix chart limits for two-dimensional group by (#16056)
- **文件数**: 12
- **主要文件**: .../ExtraItemToDetectTooManyGroups.constant.ts, ...BarChartMaximumNumberOfGroupsPerBar.constant.ts, .../hooks/useGraphBarChartWidgetData.ts
- **优先级**: 🟡 中

### 15. PR #16057

- **Hash**: `6c1c78ea3d`
- **标题**: [fix] User have no firstName nor lastName (#16057)
- **文件数**: 7
- **主要文件**: .../modules/auth/sign-in-up/hooks/useSignInUpForm.ts, .../created-by-from-auth-context.service.spec.ts, .../services/created-by-from-auth-context.service.ts
- **优先级**: 🟡 中

### 16. PR #16067

- **Hash**: `b1c03b533f`
- **标题**: Fix upgrade command messaging (#16067)
- **文件数**: 2
- **主要文件**: ...r-events-import-scheduled-sync-stage.command.ts, ...messages-import-scheduled-sync-stage.command.ts
- **优先级**: 🟡 中

### 17. PR #16071

- **Hash**: `4d0c469157`
- **标题**: Fix message import scheduled (#16071)
- **文件数**: 2
- **主要文件**: .../services/messaging-messages-import.service.spec.ts, .../services/messaging-messages-import.service.ts
- **优先级**: 🟡 中

### 18. PR #16087

- **Hash**: `dc2c2c413c`
- **标题**: [Workflows] Fix filtering on relative date (#16087)
- **文件数**: 16
- **主要文件**: .../components/AdvancedFilterDropdownFilterInput.tsx, .../components/ObjectFilterDropdownDateInput.tsx, .../components/ObjectFilterDropdownDateTimeInput.tsx
- **优先级**: 🟡 中

### 19. PR #16088

- **Hash**: `7bf68e5f31`
- **标题**: fixed the horizontal padding on Navbar (#16088)
- **文件数**: 1
- **主要文件**: .../src/modules/command-menu/constants/CommandMenuSearchBarPadding.ts
- **优先级**: 🟡 中

### 20. PR #16091

- **Hash**: `996ccd8353`
- **标题**: Non composite and non morph or relation field update fix (#16091)
- **文件数**: 1
- **主要文件**: .../update-field-action-handler.service.ts
- **优先级**: 🟡 中

### 21. PR #16095

- **Hash**: `e712eb01fb`
- **标题**: fix: update side panel header title to base font size with baseline alignment (#16095)
- **文件数**: 1
- **主要文件**: .../components/CommandMenuPageInfoLayout.tsx
- **优先级**: 🟡 中

### 22. PR #16097

- **Hash**: `4120c191f8`
- **标题**: fix scheduling after folder actions are processed (#16097)
- **文件数**: 2
- **主要文件**: .../messaging-message-list-fetch.service.ts, ...essaging-process-group-email-actions.service.ts
- **优先级**: 🟡 中

### 23. PR #16107

- **Hash**: `35f81805b8`
- **标题**: Fix options menu button height in side panel footer (#16107)
- **文件数**: 1
- **主要文件**: .../modules/ui/layout/dropdown/components/OptionsDropdownMenu.tsx
- **优先级**: 🟡 中

### 24. PR #16112

- **Hash**: `b1d1bcb712`
- **标题**: Fix messaging import (#16112)
- **文件数**: 3
- **主要文件**: .../gmail-messages-import-error-handler.service.ts, .../__tests__/parse-gmail-messages-import-error.spec.ts, .../gmail/utils/parse-gmail-api-batch-error.util.ts
- **优先级**: 🟡 中

### 25. PR #16120

- **Hash**: `db6456b1af`
- **标题**: fix legend toggle for line and bar charts (#16120)
- **文件数**: 1
- **主要文件**: .../command-menu/pages/page-layout/hooks/useChartSettingsValues.ts
- **优先级**: 🟡 中

### 26. PR #16122

- **Hash**: `978c0acb90`
- **标题**: fix: sentry's sensitive headers are leaked when `sendDefaultPii` is set to `true` (#16122)
- **文件数**: 4
- **主要文件**: package.json, packages/twenty-front/package.json, packages/twenty-server/package.json
- **优先级**: 🟡 中

### 27. PR #16124

- **Hash**: `46ce9eca3f`
- **标题**: fix: node-forge is vulnerable to ASN.1 OID integer truncation (#16124)
- **文件数**: 1
- **主要文件**: yarn.lock
- **优先级**: 🟡 中

### 28. PR #16126

- **Hash**: `afd5ccc775`
- **标题**: fix: body-parser is vulnerable to denial of service when url encoding is used (#16126)
- **文件数**: 1
- **主要文件**: yarn.lock
- **优先级**: 🟡 中

### 29. PR #16134

- **Hash**: `1fcb8b464c`
- **标题**: fix: move vite plugins into the packages that use them (#16134)
- **文件数**: 5
- **主要文件**: package.json, packages/twenty-emails/package.json, packages/twenty-front/package.json
- **优先级**: 🟡 中

### 30. PR #16135

- **Hash**: `fd9ea2f5ee`
- **标题**: [groupBy] Fix order by nested date field (#16135)
- **文件数**: 5
- **主要文件**: .../prepare-for-order-by-relation-field-parsing.util.ts, .../resolvers/utils/parse-group-by-relation-field.util.ts, .../object-metadata-order-by-base.generator.ts
- **优先级**: 🟡 中


## 🟢 功能增强 Commit

### 1. PR #16019

- **Hash**: `d526b07078`
- **标题**: Add ability to discard Information Banner (#16019)
- **文件数**: 19

### 2. PR #16022

- **Hash**: `42fef6e09b`
- **标题**: add is operand on number field (#16022)
- **文件数**: 7

### 3. PR #16027

- **Hash**: `1a45576990`
- **标题**: Morph-add-new-object-destination (#16027)
- **文件数**: 36

### 4. PR #16058

- **Hash**: `8455ecc3e8`
- **标题**: Add import scheduled status to messaging sync (#16058)
- **文件数**: 6

### 5. PR #16069

- **Hash**: `70f48ba445`
- **标题**: Security - Add complexity max on gql queries (#16069)
- **文件数**: 7

### 6. PR #16070

- **Hash**: `63afed6400`
- **标题**: Security - add throttle in message resend (#16070)
- **文件数**: 5

### 7. PR #16075

- **Hash**: `6fcb05d9b3`
- **标题**: part 3 of on click bar to filters: add sort plus some normalizations (#16075)
- **文件数**: 25

### 8. PR #16092

- **Hash**: `a343bc1aee`
- **标题**: feat: workflow agent node permissions tab (#16092)
- **文件数**: 32

### 9. PR #16098

- **Hash**: `8dc182d659`
- **标题**: Add New Widget page layout header information (#16098)
- **文件数**: 1

### 10. PR #16099

- **Hash**: `9c9a01d55a`
- **标题**: [groupBy][Requires cache flush] Add WEEK date granularity (#16099)
- **文件数**: 25

### 11. PR #16100

- **Hash**: `60e69f92d9`
- **标题**: [DASHBOARDS] Add pie chart empty state (#16100)
- **文件数**: 1

### 12. PR #16111

- **Hash**: `4f20fd35c5`
- **标题**: feat: Add Agent Evaluation System and Refactor AI Modules (#16111)
- **文件数**: 158

### 13. PR #16121

- **Hash**: `20e6f130d1`
- **标题**: Update pie chart inner padding (#16121)
- **文件数**: 1

### 14. PR #16143

- **Hash**: `accd55d7cb`
- **标题**: [DASHBOARDS] Add default order by and date granularity when choosing field (#16143)
- **文件数**: 3

### 15. PR #16183

- **Hash**: `79e2602790`
- **标题**: Remove `IS_MESSAGE_FOLDER_CONTROL_ENABLED` feature flag (#16183)
- **文件数**: 9

### 16. PR #16184

- **Hash**: `4d7965c058`
- **标题**: Augment chart limits and improve padding on bar chart (#16184)
- **文件数**: 8

### 17. PR #16193

- **Hash**: `425a3814e9`
- **标题**: feat: Add prominent "Download sample" button to CSV import upload step (#16193)
- **文件数**: 1

### 18. PR #16222

- **Hash**: `68c429a54a`
- **标题**: Null equivalence - remove feature flag (#16222)
- **文件数**: 23

### 19. PR #16235

- **Hash**: `2922a1ee5a`
- **标题**: Add community Sealos template in self-hosted cloud provider docs (#16235)
- **文件数**: 1

### 20. PR #16238

- **Hash**: `6ea817dd6c`
- **标题**: Add base application project yarn release file (#16238)
- **文件数**: 12


## 📝 翻译/i18n Commit（可以批量处理）

**总数**: 56 个

这些 commit 主要更新翻译文件，可以批量 cherry-pick，风险较低。

| PR | Hash | 标题 |
|----|------|------|
| #15967 | `c737042209` | i18n - translations (#15967) |
| #15980 | `31ca2a46c5` | i18n - translations (#15980) |
| #15981 | `a95fff82cc` | i18n - docs translations (#15981) |
| #15993 | `a87263e88a` | i18n - translations (#15993) |
| #15994 | `3b5949ec3c` | i18n - translations (#15994) |
| #16001 | `e209793e2d` | i18n - translations (#16001) |
| #16002 | `4d55fef874` | i18n - docs translations (#16002) |
| #16008 | `6203b7b3e6` | i18n - translations (#16008) |
| #16010 | `0e16b939c5` | i18n - translations (#16010) |
| #16014 | `607dc283d2` | i18n - translations (#16014) |
| #16017 | `85b17a5059` | i18n - translations (#16017) |
| #16020 | `b9355ea5a7` | i18n - translations (#16020) |
| #16021 | `8923d2fa0a` | i18n - docs translations (#16021) |
| #16026 | `338e5cf74b` | i18n - docs translations (#16026) |
| #16034 | `3ed6d2a16b` | i18n - translations (#16034) |
| #16036 | `30b6907c44` | i18n - docs translations (#16036) |
| #16041 | `a47b7dfed0` | i18n - translations (#16041) |
| #16044 | `3e584c3d5f` | i18n - docs translations (#16044) |
| #16052 | `26169a2136` | i18n - translations (#16052) |
| #16053 | `53509360ff` | i18n - docs translations (#16053) |
| #16059 | `825728b1c4` | i18n - translations (#16059) |
| #16101 | `c82c4a4507` | i18n - translations (#16101) |
| #16106 | `3c658b209d` | i18n - translations (#16106) |
| #16109 | `ee6ac6bb4c` | i18n - docs translations (#16109) |
| #16113 | `9f939eb4c3` | i18n - translations (#16113) |
| #16114 | `7e90dd888c` | i18n - docs translations (#16114) |
| #16119 | `7001c91a7d` | i18n - translations (#16119) |
| #16125 | `44f4203d58` | i18n - translations (#16125) |
| #16127 | `f3a796e17e` | i18n - docs translations (#16127) |
| #16130 | `76ed82b598` | i18n - translations (#16130) |

## ✅ 已 Cherry-pick 的 Commit

**总数**: 65 个

| PR | 类型 | 标题 |
|----|------|------|
| #160 | bugfix | Fix layout behavior with Right panel open (#160) |
| #161 | other | Update company logo fetch api (#161) |
| #162 | feature | Add comments to Prisma Schema and GraphQL server (#162) |
| #163 | other | Lucas/t 352 i dont want another input cell to open when i cl |
| #164 | other | CLI to install project (#164) |
| #165 | other | Update Readme title (#165) |
| #166 | other | Reorganize icons for doc and manigest.json (#166) |
| #167 | other | Lucas/t 353 checkbox should change state when clicking on th |
| #168 | bugfix | Two minor fixes on be (#168) |
| #169 | bugfix | Apply a few frontend fixes on dropdown (#169) |
| #1599 | bugfix | Fix: Bug with auto scroll (#1599) |
| #1602 | refactor | Refactor/context and scopes (#1602) |
| #1603 | other | Change to using arrow functions (#1603) |
| #1604 | feature | feat: improve table options dropdown view name input (#1604) |
| #1605 | feature | feat: Added closeDropdownButton to the handleCompanySelected |
| #1606 | other | Reorder options menu board (#1606) |
| #1608 | refactor | Refactor action bar entries and context menu entries (#1608) |
| #1609 | bugfix | fix: Removed margin-top on Member page (#1609) |
| #1612 | feature | Add company relation for person table (#1612) |
| #1613 | bugfix | Fix teleporting board cards on drag drop (#1613) |
| #1616 | feature | feat: Column title menus (#1616) |
| #1617 | bugfix | fix: Command bar is broken (#1617) |
| #1618 | bugfix | fix: Migrate all rules from eslint-plugin-twenty to eslint-p |
| #1621 | feature | feat: added a dropDownCloseEffect component (#1621) |
| #1622 | feature | Add 'Esc' hotkey behavior on Filter and Sorts dropdown (#162 |
| #1625 | refactor | Refactor NavCollapse button (#1625) |
| #1628 | bugfix | fix: Update company picker keyboard navigation (#1628) |
| #1629 | other | Introduce useOptimisticEvict (#1629) |
| #1631 | feature | Add a hover on Show Person Avatar  (#1631) |
| #1632 | other | Write Storybook test for @/ui/navbar (#1632) |
| #1636 | feature | feat: reorder columns from table options (#1636) |
| #1640 | bugfix | Fix eslint-plugin-twenty (#1640) |
| #1643 | other | Boost CI (#1643) |
| #1646 | bugfix | Update local-setup.mdx: Fix typo (#1646) |
| #1648 | bugfix | fix: fix some views dropdown design issues (#1648) |
| #1649 | other | change tabler-icons (#1649) |
| #1650 | refactor | Refactor tenant ORM integration (#1650) |
| #1658 | other | Create consistent ui/input and ui/display for Cell and Field |
| #1664 | bugfix | Fix bug company update (#1664) |
| #1665 | feature | Refactor fast follow on column move feature (#1665) |
| #1666 | other | Speed up CI (#1666) |
| #1667 | other | Fast follow on draggable column re-order (#1667) |
| #1670 | other | Chore: Use Fragments as types (#1670) |
| #1673 | feature | Feat/disable flexible backend (#1673) |
| #1674 | feature | Add metadata migration setup (#1674) |
| #1675 | feature | feat: reset Recoil state on logout (#1675) |
| #1676 | bugfix | Fix tasks filters (#1676) |
| #1678 | bugfix | Fix front end (#1678) |
| #1680 | feature | feat: add DropdownMenuInput and use as view name input in bo |
| #1681 | bugfix | fix: dark mode for MainButton (#1681) |

... (还有 15 个已 cherry-pick 的 commit)
