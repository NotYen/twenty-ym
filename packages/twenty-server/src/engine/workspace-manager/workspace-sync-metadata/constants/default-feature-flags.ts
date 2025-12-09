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
  FeatureFlagKey.IS_WORKSPACE_MIGRATION_V2_ENABLED, // Workspace 遷移 V2
  FeatureFlagKey.IS_PUBLIC_DOMAIN_ENABLED, // 公開域名
  FeatureFlagKey.IS_EMAILING_DOMAIN_ENABLED, // 郵件域名
  FeatureFlagKey.IS_RECORD_PAGE_LAYOUT_ENABLED, // 記錄頁面佈局
  FeatureFlagKey.IS_DASHBOARD_V2_ENABLED, // Dashboard V2
  // 以下 feature flags 在當前版本的 enum 中不存在，已移除：
  // - IS_RELATION_CONNECT_ENABLED
  // - IS_CORE_VIEW_ENABLED
  // - IS_CORE_VIEW_SYNCING_ENABLED
  // - IS_MESSAGE_FOLDER_CONTROL_ENABLED
  // - IS_CALENDAR_VIEW_ENABLED
  // - IS_DYNAMIC_SEARCH_FIELDS_ENABLED
] as const satisfies FeatureFlagKey[];
