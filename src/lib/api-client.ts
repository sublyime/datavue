// lib/api-client.ts
import { DataSourceConfig } from './data-sources/types';

export class ApiClient {
  private baseUrl = '/api';

  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Data Sources API
  async getDataSources() {
    return this.request('/data-sources');
  }

  async getDataSource(id: number) {
    return this.request(`/data-sources/${id}`);
  }

  async createDataSource(data: Partial<DataSourceConfig>) {
    return this.request('/data-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDataSource(id: number, data: Partial<DataSourceConfig>) {
    return this.request(`/data-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDataSource(id: number) {
    return this.request(`/data-sources/${id}`, {
      method: 'DELETE',
    });
  }

  async startDataSource(id: number) {
    return this.request(`/data-sources/${id}/start`, {
      method: 'POST',
    });
  }

  async stopDataSource(id: number) {
    return this.request(`/data-sources/${id}/stop`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();