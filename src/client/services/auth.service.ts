import { api } from '@/lib/api';
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload, UserRole } from '@/types/auth';

export function normalizeRole(role: unknown): UserRole {
  const value = String(role || 'USER').toUpperCase();
  if (value === 'EDITOR' || value === 'ADMIN') return value;
  return 'USER';
}

export function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    role: normalizeRole(user.role),
    status: user.status ? String(user.status).toUpperCase() : user.status,
  };
}

export function isBlockedUser(user: AuthUser | null | undefined) {
  return !!user && (user.isBlocked || String(user.status || '').toUpperCase() === 'BLOCKED');
}

function normalizeAuthResponse(data: any): AuthResponse {
  const user = data.user ?? data.data?.user ?? data;
  return {
    user: normalizeUser(user),
    accessToken: data.accessToken ?? data.access_token ?? data.token ?? data.data?.accessToken ?? data.data?.access_token,
  };
}

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post('/auth/login', payload);
    return normalizeAuthResponse(data);
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post('/auth/register', payload);
    return normalizeAuthResponse(data);
  },

  async me() {
    const { data } = await api.get<AuthUser | { user: AuthUser }>('/auth/me');
    const nested = (data as { user?: AuthUser; data?: AuthUser | { user?: AuthUser } }).data;
    const user = (data as { user?: AuthUser }).user ?? (nested as { user?: AuthUser } | undefined)?.user ?? nested ?? data;
    return normalizeUser(user as AuthUser);
  },

  async updateProfile(payload: Partial<Pick<AuthUser, 'name' | 'avatarUrl' | 'avatarPublicId'>>) {
    const { data } = await api.patch<AuthUser | { user: AuthUser }>('/users/me', payload);
    const nested = (data as { user?: AuthUser; data?: AuthUser | { user?: AuthUser } }).data;
    const user = (data as { user?: AuthUser }).user ?? (nested as { user?: AuthUser } | undefined)?.user ?? nested ?? data;
    return normalizeUser(user as AuthUser);
  },
};
