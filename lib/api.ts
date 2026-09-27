import { Store } from '@/context/AuthContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cc_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An unexpected API error occurred.');
    }

    return data as T;
  }

  // --- MENU ENDPOINTS ---
  async getMenuItems(storeId: string) {
    return this.request<{ items: any[]; activeSelections: string[]; prices: Record<string, number> }>(
      `/api/menu?storeId=${storeId}`
    );
  }

  async saveSelections(storeId: string, selections: string[], prices: Record<string, number>) {
    return this.request<{ success: boolean }>('/api/menu/save', {
      method: 'POST',
      body: JSON.stringify({ storeId, selections, prices }),
    });
  }

  // --- ADMIN & USER MANAGEMENT ENDPOINTS ---
  async getUsers() {
    return this.request<{ users: any[] }>('/api/admin/users');
  }

  async createUser(userData: { email: string; role: 'superadmin' | 'admin' | 'user'; storeIds: string[] }) {
    return this.request<{ message: string; user: any }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async resetUserPassword(userId: string, newPassword: string) {
    return this.request<{ message: string }>('/api/admin/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword }),
    });
  }

  async updateUserRole(userId: string, role: 'superadmin' | 'admin' | 'user') {
    return this.request<{ message: string }>('/api/admin/update-role', {
      method: 'PATCH',
      body: JSON.stringify({ userId, role }),
    });
  }
}

export const api = new ApiClient();