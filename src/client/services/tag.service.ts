import { api, unwrapData, unwrapList } from '@/lib/api';
import type { QueryParams } from '@/types/api';
import type { BlogTag } from '@/types/blog';

export interface TagPayload {
  name: string;
  isActive?: boolean;
}

export const tagService = {
  async getTags(params: QueryParams = {}) {
    const { data } = await api.get('/tags', { params });
    return unwrapList<BlogTag>(data).items;
  },

  async getAdminTags(params: QueryParams = {}) {
    const { data } = await api.get('/admin/tags', { params: { page: 1, limit: 10, ...params } });
    return unwrapList<BlogTag>(data);
  },

  async createTag(payload: TagPayload) {
    const { data } = await api.post<BlogTag>('/tags', payload);
    return unwrapData<BlogTag>(data);
  },

  async updateTag(id: string, payload: TagPayload) {
    const { data } = await api.patch<BlogTag>(`/tags/${id}`, payload);
    return unwrapData<BlogTag>(data);
  },

  async deleteTag(id: string) {
    await api.delete(`/tags/${id}`);
  },
};
