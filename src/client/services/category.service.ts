import { api, unwrapData, unwrapList } from '@/lib/api';
import type { QueryParams } from '@/types/api';
import type { BlogCategory } from '@/types/blog';

export interface CategoryPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export const categoryService = {
  async getCategories(params: QueryParams = {}) {
    const { data } = await api.get('/categories', { params });
    return unwrapList<BlogCategory>(data).items;
  },

  async getAdminCategories(params: QueryParams = {}) {
    const { data } = await api.get('/admin/categories', { params: { page: 1, limit: 10, ...params } });
    return unwrapList<BlogCategory>(data);
  },

  async createCategory(payload: CategoryPayload) {
    const { data } = await api.post<BlogCategory>('/categories', payload);
    return unwrapData<BlogCategory>(data);
  },

  async updateCategory(id: string, payload: CategoryPayload) {
    const { data } = await api.patch<BlogCategory>(`/categories/${id}`, payload);
    return unwrapData<BlogCategory>(data);
  },

  async deleteCategory(id: string) {
    await api.delete(`/categories/${id}`);
  },
};
