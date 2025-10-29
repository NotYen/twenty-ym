// 這是一個範例文件，展示如何在組件中使用 Firebase Analytics
// 不會被實際使用，僅供參考

import {
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  trackButtonClick,
  trackEvent,
  trackFormSubmit,
  trackSearch,
} from '@/analytics/firebase';
import { useState } from 'react';

// 範例 1: 按鈕點擊追蹤
export const ButtonTrackingExample = () => {
  const handleCreateClick = () => {
    // 追蹤按鈕點擊
    trackButtonClick('create_record', 'main_toolbar');

    // 執行實際操作
    console.log('Creating record...');
  };

  return <button onClick={handleCreateClick}>創建記錄</button>;
};

// 範例 2: 表單提交追蹤
export const FormTrackingExample = () => {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 模擬表單提交
      await submitForm(formData);

      // 追蹤成功提交
      trackFormSubmit('contact_form', true);
    } catch (error) {
      // 追蹤失敗提交
      trackFormSubmit('contact_form', false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表單欄位 */}
      <button type="submit">提交</button>
    </form>
  );
};

// 範例 3: 搜尋追蹤
export const SearchTrackingExample = () => {
  const handleSearch = (searchTerm: string) => {
    // 追蹤搜尋行為
    trackSearch(searchTerm);

    // 執行搜尋邏輯
    console.log('Searching for:', searchTerm);
  };

  return (
    <input
      type="search"
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="搜尋..."
    />
  );
};

// 範例 4: 自定義事件追蹤
export const CustomEventExample = () => {
  const handleExport = (format: string, recordCount: number) => {
    // 追蹤導出事件
    trackEvent('data_exported', {
      format: format,
      record_count: recordCount,
      export_source: 'contacts_list',
      timestamp: new Date().toISOString(),
    });

    // 執行導出邏輯
    console.log(`Exporting ${recordCount} records as ${format}`);
  };

  return (
    <div>
      <button onClick={() => handleExport('csv', 100)}>導出為 CSV</button>
      <button onClick={() => handleExport('xlsx', 100)}>導出為 Excel</button>
    </div>
  );
};

// 範例 5: 用戶登入時設置屬性
export const UserLoginExample = () => {
  const handleLogin = async (credentials: {
    email: string;
    password: string;
  }) => {
    try {
      // 模擬登入
      const user = await login(credentials);

      // 設置用戶 ID
      setAnalyticsUserId(user.id);

      // 設置用戶屬性
      setAnalyticsUserProperties({
        workspace: user.workspaceId,
        role: user.role,
        plan: user.subscriptionPlan,
        signup_date: user.createdAt,
      });

      // 追蹤登入事件
      trackEvent('user_login', {
        method: 'email',
        workspace: user.workspaceId,
      });
    } catch (error) {
      // 追蹤登入失敗
      trackEvent('login_failed', {
        error_message: (error as Error).message,
      });
    }
  };

  return (
    <button onClick={() => handleLogin({ email: '', password: '' })}>
      登入
    </button>
  );
};

// 範例 6: 頁面功能使用追蹤
export const FeatureUsageExample = () => {
  const handleFeatureUse = (featureName: string) => {
    // 追蹤功能使用
    trackEvent('feature_used', {
      feature_name: featureName,
      page: window.location.pathname,
      timestamp: Date.now(),
    });
  };

  return (
    <div>
      <button onClick={() => handleFeatureUse('bulk_edit')}>批量編輯</button>
      <button onClick={() => handleFeatureUse('filters')}>應用篩選器</button>
      <button onClick={() => handleFeatureUse('sort')}>排序</button>
    </div>
  );
};

// 輔助函數（僅為示例）
const submitForm = async (data: any): Promise<void> => {
  // 模擬 API 調用
  return Promise.resolve();
};

const login = async (credentials: any): Promise<any> => {
  // 模擬登入
  return Promise.resolve({
    id: 'user123',
    workspaceId: 'ws456',
    role: 'admin',
    subscriptionPlan: 'premium',
    createdAt: '2024-01-01',
  });
};
