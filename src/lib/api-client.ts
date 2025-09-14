// lib/api-client.ts
import { DataSourceConfig } from './data-sources/types';

// This is a placeholder function. You must implement this to retrieve your authentication token.
const getAuthToken = (): string | null => {
  // Check for the 'document' object to ensure this code is running in a browser environment
  if (typeof document !== 'undefined') {
    const name = 'authToken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        return c.substring(name.length);
      }
    }
  }
  return null;
};

export class ApiClient {
  private baseUrl = '/api';

  async request(endpoint: string, options: RequestInit = {}) {
    // Get the auth token before making the request
    const authToken = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (authToken) {
      // Add the Authorization header if a token exists
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: options.method,
      headers,
      credentials: 'include',
      body: options.body,
    });

    if (!response.ok) {
      let errorData: { error?: string } = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
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

  async getDataSourceStatus(id: number) {
    return this.request(`/data-sources/${id}/status`);
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();