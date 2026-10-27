import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import type { ApiErrorBody, PaginatedResponse } from '@/types/api';

const baseURL = '/api';

export const TOKEN_STORAGE_KEY = 'the_read_access_token';

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

const publicRequests = new Map<string, Promise<AxiosResponse<unknown>>>();

// Share simultaneous public reads (including Strict Mode's development replay).
// Settled results are removed, so navigating back still fetches fresh content.
export function publicGet<T = unknown>(url: string, config?: Pick<AxiosRequestConfig, 'params'>) {
  const key = api.getUri({ url, ...config });
  const existing = publicRequests.get(key);
  if (existing) return existing as Promise<AxiosResponse<T>>;
  const request = api.get<T>(url, config).finally(() => publicRequests.delete(key));
  publicRequests.set(key, request);
  return request;
}

export const getAccessToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const setAccessToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearAccessToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      clearAccessToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function apiMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const axiosError = error as AxiosError<ApiErrorBody>;
  if (axiosError.code === 'ERR_NETWORK') return 'Backend is offline or unreachable. Please try again later.';
  if (axiosError.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  const message = axiosError.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (message) return message;
  if (axiosError.response?.status === 403) return axiosError.response.data?.error || 'You are not allowed to perform this action.';
  if (axiosError.response?.status === 404) return axiosError.response.data?.error || 'Requested item was not found.';
  if (axiosError.response?.status === 409) return axiosError.response.data?.error || 'This item changed or is no longer available.';
  return axiosError.response?.data?.error || axiosError.message || fallback;
}

export function showApiError(error: unknown, fallback?: string) {
  toast.error(apiMessage(error, fallback));
}

export function unwrapList<T>(payload: T[] | PaginatedResponse<T>) {
  const data = (payload as { data?: unknown })?.data;
  const source = data && !Array.isArray(payload) && !Array.isArray(data)
    ? (payload as { data: T[] | PaginatedResponse<T> }).data
    : payload;
  if (Array.isArray(source)) {
    return { items: source, total: source.length, totalPages: 1 };
  }
  return {
    items: source.data ?? [],
    total: source.meta?.total ?? source.total ?? source.data?.length ?? 0,
    totalPages: source.meta?.totalPages ?? source.totalPages ?? 1,
  };
}

export function unwrapData<T>(payload: T | { data?: T; blog?: T; post?: T; item?: T; user?: T }) {
  const wrapper = payload as { data?: T | { blog?: T; post?: T; item?: T; user?: T }; blog?: T; post?: T; item?: T; user?: T };
  const nested = wrapper.data as { blog?: T; post?: T; item?: T; user?: T } | undefined;
  return (nested?.blog ?? nested?.post ?? nested?.item ?? nested?.user ?? wrapper.data ?? wrapper.blog ?? wrapper.post ?? wrapper.item ?? wrapper.user ?? payload) as T;
}
