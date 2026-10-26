import { api, unwrapData, unwrapList } from '@/lib/api';
import { normalizeBlog } from '@/lib/blog-status';
import type { QueryParams } from '@/types/api';
import type { Blog, DashboardSummary } from '@/types/blog';
import type { RegisterPayload } from '@/types/auth';
import type { User } from '@/types/user';

export const adminService = {
  async dashboard() {
    const { data } = await api.get('/dashboard/admin');
    const summary = unwrapData<DashboardSummary>(data);
    return {
      stats: summary.stats ?? summary,
      recentItems: (summary.recentBlogs ?? summary.recentItems ?? summary.items ?? summary.blogs ?? []).map(normalizeBlog),
    };
  },

  async stats() {
    const { data } = await api.get('/admin/stats');
    return unwrapData(data);
  },

  async users(params: QueryParams = {}) {
    const { data } = await api.get('/admin/users', { params: { limit: 10, ...params } });
    return unwrapList<User>(data);
  },

  async blockUser(id: string) {
    const { data } = await api.patch<User>(`/admin/users/${id}/block`);
    return unwrapData<User>(data);
  },

  async unblockUser(id: string) {
    const { data } = await api.patch<User>(`/admin/users/${id}/unblock`);
    return unwrapData<User>(data);
  },

  async deleteUser(id: string) {
    const { data } = await api.delete<User | { user?: User }>(`/admin/users/${id}`);
    return data ? unwrapData<User>(data) : ({ id, status: 'DELETED' } as User);
  },

  async createEditor(payload: RegisterPayload) {
    const { data } = await api.post<User>('/admin/editors', payload);
    return unwrapData<User>(data);
  },

  async createAdmin(payload: RegisterPayload) {
    const { data } = await api.post<User>('/admin/admins', payload);
    return unwrapData<User>(data);
  },

  async blogs(params: QueryParams = {}) {
    const { data } = await api.get('/admin/blogs', { params: { limit: 10, ...params } });
    const result = unwrapList<Blog>(data);
    return { ...result, items: result.items.map(normalizeBlog) };
  },

  async publicationQueue(params: QueryParams = {}) {
    const { data } = await api.get('/admin/publication-queue', { params: { limit: 10, ...params } });
    const result = unwrapList<Blog>(data);
    return { ...result, items: result.items.map(normalizeBlog) };
  },

  async getArticle(id: string) {
    const { data } = await api.get<Blog>(`/admin/articles/${id}`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async publishBlog(id: string) {
    const { data } = await api.post<Blog>(`/admin/blogs/${id}/publish`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async approveBlog(id: string) { const { data } = await api.post<Blog>(`/admin/blogs/${id}/approve`); return normalizeBlog(unwrapData<Blog>(data)); },
  async scheduleBlog(id: string, scheduledAt: string) { const { data } = await api.post<Blog>(`/admin/blogs/${id}/schedule`, { publishAt: scheduledAt }); return normalizeBlog(unwrapData<Blog>(data)); },
  async returnToEditor(id: string, note: string) { const { data } = await api.post<Blog>(`/admin/blogs/${id}/return-to-editor`, { note }); return normalizeBlog(unwrapData<Blog>(data)); },
  async rejectBlog(id: string, note: string) { const { data } = await api.post<Blog>(`/admin/blogs/${id}/reject`, { reason: note }); return normalizeBlog(unwrapData<Blog>(data)); },
  async archiveBlog(id: string) { const { data } = await api.post<Blog>(`/admin/blogs/${id}/archive`); return normalizeBlog(unwrapData<Blog>(data)); },

  async unpublishBlog(id: string) {
    const { data } = await api.post<Blog>(`/admin/blogs/${id}/unpublish`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async deleteBlog(id: string) {
    await api.delete(`/admin/blogs/${id}`);
  },
};
