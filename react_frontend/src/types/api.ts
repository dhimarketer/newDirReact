// 2025-01-27: Creating API type definitions for Phase 2 React frontend

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: ApiRequestConfig;
}

export interface ApiError {
  message: string;
  status: number;
  statusText: string;
  data?: any;
  config: ApiRequestConfig;
}

export interface PaginationParams {
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
}

export interface ApiEndpoints {
  auth: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    profile: string;
    passwordReset: string;
    passwordResetConfirm: string;
  };
  directory: {
    entries: string;
    entry: (id: number) => string;
    search: string;
    stats: string;
  };
  family: {
    groups: string;
    group: (id: number) => string;
    members: (groupId: number) => string;
    member: (groupId: number, memberId: number) => string;
    invitations: string;
    invitation: (id: number) => string;
    tree: (groupId: number) => string;
    stats: string;
  };
  users: {
    users: string;
    user: (id: number) => string;
    profile: string;
    avatar: string;
  };
}
