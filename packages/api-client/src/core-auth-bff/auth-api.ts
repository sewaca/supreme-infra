import { BaseApi } from '../base-api';
import type { AuthResponse, LoginData, RegisterData, User } from '../types';

export class AuthApi extends BaseApi {
  public async register(data: RegisterData): Promise<AuthResponse> {
    const url = `${this.baseUrl}/auth/register`;

    const response = await this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(error.message || 'Registration failed');
    }

    return response.json() as Promise<AuthResponse>;
  }

  public async login(data: LoginData): Promise<AuthResponse> {
    const url = `${this.baseUrl}/auth/login`;

    const response = await this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    return response.json() as Promise<AuthResponse>;
  }

  public async getCurrentUser(token: string): Promise<User> {
    const url = `${this.baseUrl}/auth/me`;

    const response = await this.fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed to fetch current user: ${response.statusText}`);
    }

    return response.json() as Promise<User>;
  }

  public async getUserById(id: number, token: string): Promise<User> {
    const url = `${this.baseUrl}/auth/users/${id}`;

    const response = await this.fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return response.json() as Promise<User>;
  }

  public async deleteUser(id: number, token: string): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/auth/users/${id}`;

    const response = await this.fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }

    return response.json() as Promise<{ success: boolean }>;
  }
}
