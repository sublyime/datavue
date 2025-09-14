// src/lib/api-client.ts
import { DataSourceConfig } from './data-sources/types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
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
    return this.request<DataSourceConfig[]>('/data-sources');
  }

  async getDataSource(id: string): Promise<{ data: DataSourceConfig; status: number }> {
    return this.request<DataSourceConfig>(`/data-sources/${id}`);
  }

  async createDataSource(config: DataSourceConfig): Promise<{ data: DataSourceConfig; status: number }> {
    return this.request<DataSourceConfig>('/data-sources', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async updateDataSource(id: string, config: DataSourceConfig): Promise<{ data: DataSourceConfig; status: number }> {
    return this.request<DataSourceConfig>(`/data-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async deleteDataSource(id: string): Promise<{ data: { success: boolean }; status: number }> {
    return this.request<{ success: boolean }>(`/data-sources/${id}`, {
      method: 'DELETE',
    });
  }

  // Test data source connection
  async testDataSourceConnection(config: DataSourceConfig): Promise<{ data: { connected: boolean; message?: string }; status: number }> {
    return this.request<{ connected: boolean; message?: string }>('/data-sources/test-connection', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Query methods
  async executeQuery(dataSourceId: string, query: string): Promise<{ data: any[]; status: number }> {
    return this.request<any[]>(`/data-sources/${dataSourceId}/query`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // Schema methods
  async getDataSourceSchema(dataSourceId: string): Promise<{ data: { tables: any[] }; status: number }> {
    return this.request<{ tables: any[] }>(`/data-sources/${dataSourceId}/schema`);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Also export the class for testing or other use cases
export { ApiClient };