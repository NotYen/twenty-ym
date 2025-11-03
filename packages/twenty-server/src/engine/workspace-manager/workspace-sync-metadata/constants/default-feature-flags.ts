import { FeatureFlagKey } from 'src/engine/core-modules/feature-flag/enums/feature-flag-key.enum';

// 預設開啟所有功能，適合測試和完整功能體驗
// 生產環境可根據需求調整為基礎功能套餐
export const DEFAULT_FEATURE_FLAGS = [
  FeatureFlagKey.IS_PAGE_LAYOUT_ENABLED, // Dashboard 儀表板
  FeatureFlagKey.IS_AI_ENABLED, // AI 功能
  FeatureFlagKey.IS_AIRTABLE_INTEGRATION_ENABLED, // Airtable 整合
  FeatureFlagKey.IS_POSTGRESQL_INTEGRATION_ENABLED, // PostgreSQL 整合
  FeatureFlagKey.IS_STRIPE_INTEGRATION_ENABLED, // Stripe 支付整合
  FeatureFlagKey.IS_UNIQUE_INDEXES_ENABLED, // 唯一索引
  FeatureFlagKey.IS_JSON_FILTER_ENABLED, // JSON 篩選
  FeatureFlagKey.IS_IMAP_SMTP_CALDAV_ENABLED, // IMAP/SMTP/CalDAV 郵件
  FeatureFlagKey.IS_MORPH_RELATION_ENABLED, // 多態關聯
  FeatureFlagKey.IS_RELATION_CONNECT_ENABLED, // 關聯連接
  FeatureFlagKey.IS_CORE_VIEW_ENABLED, // 核心視圖
  FeatureFlagKey.IS_CORE_VIEW_SYNCING_ENABLED, // 核心視圖同步
  FeatureFlagKey.IS_WORKSPACE_MIGRATION_V2_ENABLED, // Workspace 遷移 V2
  FeatureFlagKey.IS_MESSAGE_FOLDER_CONTROL_ENABLED, // 郵件資料夾控制
  // FeatureFlagKey.IS_WORKFLOW_ITERATOR_ENABLED, // Workflow 迭代器 - enum 中不存在，已移除
  FeatureFlagKey.IS_CALENDAR_VIEW_ENABLED, // 日曆視圖
  // FeatureFlagKey.IS_GROUP_BY_ENABLED, // 分組功能 - enum 中不存在，已移除
  FeatureFlagKey.IS_PUBLIC_DOMAIN_ENABLED, // 公開域名
  FeatureFlagKey.IS_EMAILING_DOMAIN_ENABLED, // 郵件域名
  FeatureFlagKey.IS_DYNAMIC_SEARCH_FIELDS_ENABLED, // 動態搜索欄位
] as const satisfies FeatureFlagKey[];
