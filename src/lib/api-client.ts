// src/lib/api-client.ts
class ApiClient {
    private baseURL = '/api';
    
    private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `${this.baseURL}${endpoint}`;
        
        const token = this.getAuthToken();
        
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            credentials: 'include',
            ...options,
        };

        const response = await fetch(url, config);
        
        if (response.status === 401) {
            this.handleUnauthorized();
            throw new Error('Unauthorized');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }
    
    private getAuthToken(): string | null {
        return localStorage.getItem('session-token');
    }
    
    private handleUnauthorized() {
        localStorage.removeItem('session-token');
        window.location.href = '/login';
    }
    
    async login(email: string, password: string) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async getDataSources() {
        return this.request('/data-sources');
    }
    
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }
    
    // Add other methods...
}

export const apiClient = new ApiClient();