// vCard 資料類型定義
export type VCardData = {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  phone: string;
  email: string;
  avatarUrl?: string | null;
};

// vCard 表單資料類型（用於 localStorage）
export type VCardFormData = {
  company: string;
  jobTitle: string;
  phone: string;
};

// vCard 本地儲存 key
export const VCARD_STORAGE_KEY = 'twenty-vcard-form-data';
