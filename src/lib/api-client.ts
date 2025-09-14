// src/lib/api-client.ts

import { DataSourceConfig } from './data-sources/types';

// Form data interface for create/update operations
interface DataSourceFormData {
  name: string;
  description?: string;
  interface: {
    type: string;
    config: Record<string, any>;
  };
  protocol: {
    type: string;
    config: Record<string, any>;
  };
  dataSource: {
    type: string;
    templateId?: string;
    customConfig?: Record<string, any>;
  };
  isActive?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; status: number }> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data: data.data || data, status: response.status };
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request<{ user: any; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Data Source methods
  async getDataSources(): Promise<{ data: DataSourceConfig[]; status: number }> {
    return this.request('/data-sources');
  }

  async getDataSource(id: number): Promise<{ data: DataSourceConfig; status: number }> {
    return this.request(`/data-sources/${id}`);
  }

  async createDataSource(data: DataSourceFormData): Promise<{ data: DataSourceConfig; status: number }> {
    return this.request('/data-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDataSource(id: number, data: DataSourceFormData): Promise<{ data: DataSourceConfig; status: number }> {
    return this.request(`/data-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDataSource(id: number): Promise<{ data: { success: boolean }; status: number }> {
    return this.request<{ success: boolean }>(`/data-sources/${id}`, {
      method: 'DELETE',
    });
  }

  // Data source control methods
  async startDataSource(id: number): Promise<{ data: { message: string }; status: number }> {
    return this.request<{ message: string }>(`/data-sources/${id}/start`, {
      method: 'POST',
    });
  }

  async stopDataSource(id: number): Promise<{ data: { message: string }; status: number }> {
    return this.request<{ message: string }>(`/data-sources/${id}/stop`, {
      method: 'POST',
    });
  }

  async restartDataSource(id: number): Promise<{ data: { message: string }; status: number }> {
    return this.request<{ message: string }>(`/data-sources/${id}/restart`, {
      method: 'POST',
    });
  }

  // Test data source connection
  async testDataSourceConnection(config: DataSourceFormData): Promise<{ data: { connected: boolean; message?: string }; status: number }> {
    return this.request<{ connected: boolean; message?: string }>('/data-sources/test-connection', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Data source status
  async getDataSourceStatus(id: number): Promise<{ data: { isRunning: boolean; connectionStatus: string; lastError?: string }; status: number }> {
    return this.request<{ isRunning: boolean; connectionStatus: string; lastError?: string }>(`/data-sources/${id}/status`);
  }

  // Data source templates
  async getDataSourceTemplates(params?: { interface?: string; protocol?: string; type?: string }): Promise<{ data: any[]; status: number }> {
    const searchParams = new URLSearchParams();
    if (params?.interface) searchParams.append('interface', params.interface);
    if (params?.protocol) searchParams.append('protocol', params.protocol);
    if (params?.type) searchParams.append('type', params.type);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/data-source-templates?${queryString}` : '/data-source-templates';
    
    return this.request(endpoint);
  }

  async getDataSourceTemplate(id: string): Promise<{ data: any; status: number }> {
    return this.request(`/data-source-templates/${id}`);
  }

  async createDataSourceTemplate(template: any): Promise<{ data: any; status: number }> {
    return this.request('/data-source-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateDataSourceTemplate(id: string, template: any): Promise<{ data: any; status: number }> {
    return this.request(`/data-source-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  }

  async deleteDataSourceTemplate(id: string): Promise<{ data: { success: boolean }; status: number }> {
    return this.request<{ success: boolean }>(`/data-source-templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Query methods
  async executeQuery(dataSourceId: number, query: string): Promise<{ data: any[]; status: number }> {
    return this.request(`/data-sources/${dataSourceId}/query`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // Schema methods
  async getDataSourceSchema(dataSourceId: number): Promise<{ data: { tables: any[] }; status: number }> {
    return this.request<{ tables: any[] }>(`/data-sources/${dataSourceId}/schema`);
  }

  // Data points methods
  async getDataPoints(dataSourceId: number, params?: { 
    startTime?: string; 
    endTime?: string; 
    tagName?: string; 
    limit?: number; 
  }): Promise<{ data: any[]; status: number }> {
    const searchParams = new URLSearchParams();
    if (params?.startTime) searchParams.append('startTime', params.startTime);
    if (params?.endTime) searchParams.append('endTime', params.endTime);
    if (params?.tagName) searchParams.append('tagName', params.tagName);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/data-sources/${dataSourceId}/data-points?${queryString}` : `/data-sources/${dataSourceId}/data-points`;
    
    return this.request(endpoint);
  }

  // System health methods
  async getSystemHealth(): Promise<{ data: { status: string; checks: any[] }; status: number }> {
    return this.request<{ status: string; checks: any[] }>('/system/health');
  }

  async getSystemMetrics(): Promise<{ data: any; status: number }> {
    return this.request('/system/metrics');
  }

  // User management methods
  async getUsers(): Promise<{ data: any[]; status: number }> {
    return this.request('/users');
  }

  async getUser(id: number): Promise<{ data: any; status: number }> {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: any): Promise<{ data: any; status: number }> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: any): Promise<{ data: any; status: number }> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<{ data: { success: boolean }; status: number }> {
    return this.request<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Also export the class for testing or other use cases
export { ApiClient };
export type { DataSourceFormData };
