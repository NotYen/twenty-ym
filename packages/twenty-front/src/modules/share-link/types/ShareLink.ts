export interface ShareLinkData {
  id: string;
  token: string;
  resourceType: 'COMPANY' | 'PERSON' | 'SALES_QUOTE' | 'DASHBOARD_CHART';
  resourceId: string;
  accessMode: 'PUBLIC' | 'LOGIN_REQUIRED';
  isActive: boolean;
  expiresAt?: Date;
  inactivityExpirationDays?: number;
  accessCount: number;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
}

export interface CreateShareLinkInput {
  resourceType: 'COMPANY' | 'PERSON' | 'SALES_QUOTE' | 'DASHBOARD_CHART';
  resourceId: string;
  accessMode: 'PUBLIC' | 'LOGIN_REQUIRED';
  expiresAt?: Date;
  inactivityExpirationDays?: number;
}

export interface UpdateShareLinkInput {
  token: string;
  isActive?: boolean;
  expiresAt?: Date;
  inactivityExpirationDays?: number;
}

export interface SharedContentData {
  resourceType: string;
  resourceId: string;
  title: string;
  data: any;
  metadata: string; // JSON string
}

export interface SharedContentMetadata {
  workspaceName: string;
  workspaceLogo?: string;
  sharedAt: Date;
  expiresAt?: Date;
}
