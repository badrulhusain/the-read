import { api, unwrapData, unwrapList } from '@/lib/api';
import type { QueryParams } from '@/types/api';
import type { BlogComment } from '@/types/blog';

interface CreateCommentPayload {
  content: string;
}

interface RawComment extends Partial<BlogComment> {
  author?: BlogComment['user'];
  commenter?: BlogComment['user'];
  createdBy?: BlogComment['user'];
  userId?: string;
  userName?: string;
  authorName?: string;
  avatarUrl?: string | null;
  blog?: {
    title?: string;
    slug?: string;
  };
}

export const commentService = {
  async getBlogComments(slug: string, params: QueryParams = {}) {
    const { data } = await api.get(`/blogs/${slug}/comments`, { params: { page: 1, limit: 10, ...params } });
    const result = unwrapList<RawComment>(data);
    return { ...result, items: result.items.map(normalizeComment) };
  },

  async createBlogComment(slug: string, payload: CreateCommentPayload) {
    const { data } = await api.post<RawComment>(`/blogs/${slug}/comments`, payload);
    return normalizeComment(unwrapData<RawComment>(data));
  },

  async getAdminComments(params: QueryParams = {}) {
    const { data } = await api.get('/admin/comments', { params: { page: 1, limit: 10, ...params } });
    const result = unwrapList<RawComment>(data);
    return { ...result, items: result.items.map(normalizeComment) };
  },

  async hideComment(id: string) {
    const { data } = await api.patch<RawComment>(`/admin/comments/${id}/hide`);
    return normalizeComment(unwrapData<RawComment>(data));
  },

  async restoreComment(id: string) {
    const { data } = await api.patch<RawComment>(`/admin/comments/${id}/restore`);
    return normalizeComment(unwrapData<RawComment>(data));
  },

  async deleteComment(id: string) {
    await api.delete(`/admin/comments/${id}`);
  },
};

function normalizeComment(comment: RawComment): BlogComment {
  const user = comment.user ?? comment.author ?? comment.commenter ?? comment.createdBy;
  return {
    id: String(comment.id ?? crypto.randomUUID()),
    content: String(comment.content ?? ''),
    status: comment.status ?? 'VISIBLE',
    createdAt: comment.createdAt ?? new Date().toISOString(),
    updatedAt: comment.updatedAt,
    blogId: comment.blogId,
    blogTitle: comment.blogTitle ?? comment.blog?.title,
    blogSlug: comment.blogSlug ?? comment.blog?.slug,
    user: {
      id: String(user?.id ?? comment.userId ?? ''),
      name: user?.name ?? comment.userName ?? comment.authorName ?? 'Reader',
      avatarUrl: user?.avatarUrl ?? comment.avatarUrl ?? null,
    },
  };
}
