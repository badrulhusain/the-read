import { api, unwrapData, unwrapList } from '@/lib/api';
import { toApiCoverImage } from '@/lib/blog-content';
import { normalizeBlog } from '@/lib/blog-status';
import { categoryService } from '@/services/category.service';
import { tagService } from '@/services/tag.service';
import type { QueryParams } from '@/types/api';
import type { ArticleSeries, Blog, BlogCategory, BlogFormPayload, BlogTag, Contributor, DashboardSummary, ReactionType } from '@/types/blog';

function normalizeSummary(payload: DashboardSummary) {
  return {
    stats: (payload.stats ?? payload) as NonNullable<DashboardSummary['stats']>,
    recentItems: (payload.recentBlogs ?? payload.recentItems ?? payload.items ?? payload.blogs ?? []).map(normalizeBlog),
  };
}

export const blogService = {
  async getPublishedBlogs(params: QueryParams) {
    return this.listPublished(params);
  },

  async listPublished(params: QueryParams) {
    const { data } = await api.get('/blogs', { params: { limit: 10, ...params } });
    const result = unwrapList<Blog>(data);
    return { ...result, items: result.items.map(normalizeBlog) };
  },

  async getPublishedBySlug(slug: string) {
    const { data } = await api.get<Blog>(`/blogs/${slug}`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async getBlogBySlug(slug: string) {
    return this.getPublishedBySlug(slug);
  },

  async getDashboardStats() {
    const { data } = await api.get('/blogs/me/stats');
    return unwrapData(data);
  },

  async userDashboard() {
    const { data } = await api.get('/dashboard/user');
    return normalizeSummary(unwrapData<DashboardSummary>(data));
  },

  async listMine(params: QueryParams = {}) {
    const { data } = await api.get('/blogs/me', { params: { limit: 10, ...params } });
    const result = unwrapList<Blog>(data);
    return { ...result, items: result.items.map(normalizeBlog) };
  },

  async getMine(id: string) {
    const { data } = await api.get<Blog>(`/blogs/me/${id}`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async createDraft(payload: BlogFormPayload) {
    const { data } = await api.post<Blog>('/blogs', toApiBlogPayload(payload));
    const created = normalizeBlog(unwrapData<Blog>(data));
    if (payload.coverImage !== undefined) {
      const { data: updated } = await api.patch<Blog>(`/blogs/${created.id}/cover-image`, { coverImage: toApiCoverImage(payload.coverImage ?? null) });
      return normalizeBlog(unwrapData<Blog>(updated));
    }
    return created;
  },

  async createBlog(payload: BlogFormPayload) {
    return this.createDraft(payload);
  },

  async updateMine(id: string, payload: BlogFormPayload) {
    const { data } = await api.patch<Blog>(`/blogs/${id}`, toApiBlogPayload(payload));
    const updated = normalizeBlog(unwrapData<Blog>(data));
    if (payload.coverImage !== undefined) {
      const { data: withCover } = await api.patch<Blog>(`/blogs/${id}/cover-image`, { coverImage: toApiCoverImage(payload.coverImage ?? null) });
      return normalizeBlog(unwrapData<Blog>(withCover));
    }
    return updated;
  },

  async updateBlog(id: string, payload: BlogFormPayload) {
    return this.updateMine(id, payload);
  },

  async submit(id: string) {
    const { data } = await api.post<Blog>(`/blogs/${id}/submit`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async featured() { const { data } = await api.get('/blogs/featured'); return unwrapList<Blog>(data).items.map(normalizeBlog); },
  async trending() { const { data } = await api.get('/blogs/trending'); return unwrapList<Blog>(data).items.map(normalizeBlog); },
  async series() { const { data } = await api.get('/series'); return unwrapList<ArticleSeries>(data).items; },
  async getSeries(slug: string) { const { data } = await api.get(`/series/${slug}`); return unwrapData<ArticleSeries>(data); },
  async contributors() { const { data } = await api.get('/contributors'); return unwrapList<Contributor>(data).items; },
  async getContributor(slug: string) { const { data } = await api.get(`/contributors/${slug}`); return unwrapData<Contributor & { articles?: Blog[] }>(data); },
  async saved() { const { data } = await api.get('/me/saved-blogs'); return unwrapList<Blog | { blog: Blog }>(data).items.map((item) => normalizeBlog('blog' in item ? item.blog : item)); },
  async history() { const { data } = await api.get('/me/history'); return unwrapList<Blog>(data).items.map(normalizeBlog); },
  async save(id: string) { const { data } = await api.post(`/me/saved-blogs/${id}`); return unwrapData<{ saved: boolean }>(data); },
  async unsave(id: string) { await api.delete(`/me/saved-blogs/${id}`); return { saved: false }; },
  async react(id: string, reaction: ReactionType) { const { data } = await api.post(`/blogs/${id}/reactions`, { reaction }); return unwrapData<Partial<Record<ReactionType, number>>>(data); },
  async recordHistory(id: string) { await api.post(`/me/history/${id}`); },
  async newsletter(email: string) { const { data } = await api.post('/newsletter/subscribe', { email }); return unwrapData<{ subscribed: boolean }>(data); },
};

function toApiBlogPayload(payload: Partial<BlogFormPayload>) {
  return {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.excerpt !== undefined ? { excerpt: payload.excerpt } : {}),
    ...(payload.content !== undefined ? { content: payload.content } : {}),
    ...(payload.categoryId !== undefined
      ? { categoryId: payload.categoryId?.trim() || null }
      : {}),
    ...(payload.tagIds !== undefined || payload.tags !== undefined ? { tagIds: payload.tagIds ?? payload.tags ?? [] } : {}),
    ...(payload.seoTitle !== undefined ? { seoTitle: payload.seoTitle } : {}),
    ...(payload.seoDescription !== undefined ? { seoDescription: payload.seoDescription } : {}),
  };
}

export const taxonomyService = {
  async categories() {
    return categoryService.getCategories();
  },

  async tags() {
    return tagService.getTags();
  },

  async createCategory(payload: Pick<BlogCategory, 'name' | 'description'>) {
    return categoryService.createCategory(payload);
  },

  async updateCategory(id: string, payload: Pick<BlogCategory, 'name' | 'description' | 'isActive'>) {
    return categoryService.updateCategory(id, payload);
  },

  async deleteCategory(id: string) {
    await categoryService.deleteCategory(id);
  },

  async createTag(payload: Pick<BlogTag, 'name'>) {
    return tagService.createTag(payload);
  },

  async updateTag(id: string, payload: Pick<BlogTag, 'name' | 'isActive'>) {
    return tagService.updateTag(id, payload);
  },

  async deleteTag(id: string) {
    await tagService.deleteTag(id);
  },
};
