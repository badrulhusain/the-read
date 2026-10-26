import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/api';
import { authService, isBlockedUser, normalizeRole } from '@/services/auth.service';
import type { AuthUser, LoginPayload, RegisterPayload, UserRole } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  fetchMe: () => Promise<AuthUser | null>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getAccessToken());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearAccessToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    if (!getAccessToken()) {
      setLoading(false);
      return null;
    }
    try {
      const currentUser = await authService.me();
      if (isBlockedUser(currentUser)) {
        logout();
        toast.error('This account is blocked. Please contact an admin.');
        return null;
      }
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 401) {
        logout();
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void fetchMe();
    const onUnauthorized = () => {
      logout();
      toast.error('Your session expired. Please log in again.');
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [fetchMe, logout]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    const nextToken = response.accessToken ?? response.access_token ?? response.token;
    if (!nextToken) throw new Error('Login succeeded but no access token was returned.');
    if (isBlockedUser(response.user)) throw new Error('This account is blocked. Please contact an admin.');
    setAccessToken(nextToken);
    setTokenState(nextToken);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    const nextToken = response.accessToken ?? response.access_token ?? response.token;
    if (!nextToken) throw new Error('Registration succeeded but no access token was returned.');
    if (isBlockedUser(response.user)) throw new Error('This account is blocked. Please contact an admin.');
    setAccessToken(nextToken);
    setTokenState(nextToken);
    setUser(response.user);
    return response.user;
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => !!user && roles.includes(normalizeRole(user.role)), [user]);

  const value = useMemo<AuthState>(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    fetchMe,
    hasRole,
  }), [fetchMe, hasRole, loading, login, logout, register, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export function roleHome(role: UserRole) {
  const normalized = normalizeRole(role);
  if (normalized === 'ADMIN') return '/admin';
  if (normalized === 'EDITOR') return '/editor';
  return '/blogs';
}
