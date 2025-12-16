import { FeatureFlagKey } from 'src/engine/core-modules/feature-flag/enums/feature-flag-key.enum';

/**
 * 預設開啟所有功能
 * 這個列表會在以下情況被使用：
 * 1. 新 workspace 建立並 activate 時 (activateWorkspace)
 * 2. 同步 feature flags 命令 (workspace:sync-feature-flags)
 *
 * 確保所有 FeatureFlagKey enum 中的值都在這裡！
 */
export const DEFAULT_FEATURE_FLAGS = [
  // === 核心功能 ===
  FeatureFlagKey.IS_PAGE_LAYOUT_ENABLED, // Dashboard 儀表板
  FeatureFlagKey.IS_DASHBOARD_V2_ENABLED, // Dashboard V2 (Pie/Line/Gauge 圖表)
  FeatureFlagKey.IS_RECORD_PAGE_LAYOUT_ENABLED, // 記錄頁面佈局
  FeatureFlagKey.IS_AI_ENABLED, // AI 功能
  FeatureFlagKey.IS_APPLICATION_ENABLED, // 應用程式功能

  // === 整合功能 ===
  FeatureFlagKey.IS_AIRTABLE_INTEGRATION_ENABLED, // Airtable 整合
  FeatureFlagKey.IS_POSTGRESQL_INTEGRATION_ENABLED, // PostgreSQL 整合
  FeatureFlagKey.IS_STRIPE_INTEGRATION_ENABLED, // Stripe 支付整合

  // === 郵件/日曆 ===
  FeatureFlagKey.IS_IMAP_SMTP_CALDAV_ENABLED, // IMAP/SMTP/CalDAV 郵件

  // === 資料庫功能 ===
  FeatureFlagKey.IS_UNIQUE_INDEXES_ENABLED, // 唯一索引
  FeatureFlagKey.IS_JSON_FILTER_ENABLED, // JSON 篩選
  FeatureFlagKey.IS_MORPH_RELATION_ENABLED, // 多態關聯

  // === 系統功能 ===
  FeatureFlagKey.IS_WORKSPACE_MIGRATION_V2_ENABLED, // Workspace 遷移 V2
  FeatureFlagKey.IS_PUBLIC_DOMAIN_ENABLED, // 公開域名
  FeatureFlagKey.IS_EMAILING_DOMAIN_ENABLED, // 郵件域名
  FeatureFlagKey.IS_WORKFLOW_RUN_STOPPAGE_ENABLED, // Workflow 停止功能
] as const satisfies FeatureFlagKey[];
