import { api, unwrapData, unwrapList } from '@/lib/api';
import { toApiCoverImage } from '@/lib/blog-content';
import { normalizeBlog, normalizeBlogStatus } from '@/lib/blog-status';
import type { QueryParams } from '@/types/api';
import type {
  Blog,
  BlogCoverImage,
  BlogFormPayload,
  DashboardSummary,
  EditorialEvaluation,
} from '@/types/blog';
import type { AuthUser } from '@/types/auth';

export function isAssignedToEditor(blog: Blog | null | undefined, user: AuthUser | null | undefined) {
  if (!blog || !user) return false;
  if (user.role === 'ADMIN') return true;
  return [
    blog.editorId,
    blog.editor?.id,
    blog.assignedEditorId,
    blog.reviewerId,
    blog.assignedToId,
  ].includes(user.id);
}

export const editorialService = {
  async dashboard() {
    const { data } = await api.get('/dashboard/editor');
    const summary = unwrapData<DashboardSummary>(data);
    return {
      stats: (summary.stats ?? summary) as NonNullable<DashboardSummary['stats']>,
      recentItems: (summary.recentBlogs ?? summary.recentItems ?? summary.items ?? summary.blogs ?? []).map(normalizeBlog),
    };
  },

  async stats() {
    const { data } = await api.get('/editorial/stats');
    return unwrapData(data);
  },

  async submissions(params: QueryParams = {}) {
    const { data } = await api.get('/editorial/submissions', { params: { limit: 10, ...params } });
    const result = unwrapList<Blog>(data);
    return { ...result, items: result.items.map(normalizeBlog) };
  },

  async activeReviews(params: QueryParams = {}) {
    const reviewParams = { limit: 10, status: 'QUALITY_REVIEW', ...params };
    const paths = ['/editorial/blogs', '/editorial/my-reviews', '/editorial/reviews', '/editorial/submissions'];
    let lastError: unknown;

    for (const path of paths) {
      try {
        const { data } = await api.get(path, { params: reviewParams });
        const result = unwrapList<Blog>(data);
        return { ...result, items: result.items.map(normalizeBlog).filter((blog) => normalizeBlogStatus(blog.status) === 'QUALITY_REVIEW') };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  },

  async getBlog(id: string) {
    const { data } = await api.get<Blog>(`/editorial/blogs/${id}`);
    return normalizeEditorialBlog(unwrapData<Blog>(data));
  },

  async createDraft(payload: BlogFormPayload) {
    const { data } = await api.post<Blog>('/blogs/drafts', toApiArticlePayload(payload));
    const created = normalizeBlog(unwrapData<Blog>(data));
    if (payload.coverImage !== undefined) return this.updateCoverImage(created.id, payload.coverImage ?? null);
    return created;
  },

  async autosave(id: string, payload: Partial<BlogFormPayload>) {
    const { data } = await api.patch<Blog>(`/blogs/${id}/autosave`, toApiArticlePayload(payload));
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async myWork(params: QueryParams = {}) {
    const { data } = await api.get('/editorial/articles/my-work', { params: { limit: 10, ...params } });
    const result = unwrapList<Blog>(data);
    return { ...result, items: result.items.map(normalizeBlog) };
  },

  async pick(id: string) {
    const { data } = await api.post<Blog>(`/editorial/blogs/${id}/pick`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async assign(id: string, editorId: string) { const { data } = await api.post<Blog>(`/editorial/blogs/${id}/assign`, { editorId }); return normalizeBlog(unwrapData<Blog>(data)); },
  async saveReview(id: string, payload: Pick<Blog, 'internalNotes' | 'plagiarismScore' | 'plagiarismReviewed' | 'factCheckComplete' | 'editorialChecklist' | 'recommendation'>) { const { data } = await api.patch<Blog>(`/editorial/blogs/${id}/review`, payload); return normalizeEditorialBlog(unwrapData<Blog>(data)); },

  async saveEvaluation(id: string, payload: EditorialEvaluation) {
    const { data } = await api.post<Blog>(`/editorial/blogs/${id}/evaluation`, toApiEvaluation(payload));
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async submitForQualityReview(id: string) {
    const { data } = await api.post<Blog>(`/blogs/${id}/submit`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async markQualityReviewComplete(id: string) {
    const { data } = await api.post<Blog>(`/editorial/articles/${id}/quality-review/complete`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async sendToAdmin(id: string) {
    const { data } = await api.post<Blog>(`/editorial/blogs/${id}/send-to-admin`);
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async update(id: string, payload: BlogFormPayload) {
    const { data } = await api.patch<Blog>(`/blogs/${id}`, toApiArticlePayload(payload));
    const updated = normalizeBlog(unwrapData<Blog>(data));
    if (payload.coverImage !== undefined) return this.updateCoverImage(id, payload.coverImage ?? null);
    return updated;
  },

  async updateCoverImage(id: string, coverImage: BlogCoverImage | null) {
    const { data } = await api.patch<Blog>(`/blogs/${id}/cover-image`, { coverImage: toApiCoverImage(coverImage) });
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async approve(id: string, comment?: string) {
    const { data } = await api.post<Blog>(`/editorial/blogs/${id}/approve`, { comment });
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async reject(id: string, comment: string) {
    const { data } = await api.post<Blog>(`/editorial/blogs/${id}/reject`, { comment });
    return normalizeBlog(unwrapData<Blog>(data));
  },

  async requestRevision(id: string, comment: string) {
    const { data } = await api.post<Blog>(`/editorial/blogs/${id}/request-revision`, { comment });
    return normalizeBlog(unwrapData<Blog>(data));
  },

};

function toApiArticlePayload(payload: Partial<BlogFormPayload>) {
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

function toApiEvaluation(payload: EditorialEvaluation) {
  const ratingScore = { POOR: 25, FAIR: 50, GOOD: 75, EXCELLENT: 100 } as const;
  const reviewScore = { NOT_REVIEWED: 0, IN_PROGRESS: 50, PASSED: 100, NEEDS_WORK: 25 } as const;
  return {
    contentQualityScore: payload.contentQualityScore ?? 0,
    grammarStatus: payload.grammarStatus === 'PASSED' ? 'PASSED' : payload.grammarStatus === 'NOT_REVIEWED' ? 'NOT_REVIEWED' : 'NEEDS_CORRECTION',
    readabilityScore: payload.readabilityScore ?? 0,
    plagiarismScore: payload.plagiarismScore ?? 0,
    factCheckStatus: payload.factCheckStatus === 'PASSED' ? 'PASSED' : payload.factCheckStatus === 'IN_PROGRESS' ? 'IN_PROGRESS' : payload.factCheckStatus === 'NEEDS_WORK' ? 'NEEDS_CHANGES' : 'NOT_STARTED',
    sourceVerificationStatus: payload.sourceVerificationStatus === 'PASSED' ? 'VERIFIED' : payload.sourceVerificationStatus === 'IN_PROGRESS' ? 'IN_PROGRESS' : payload.sourceVerificationStatus === 'NEEDS_WORK' ? 'NEEDS_CORRECTION' : 'NOT_REVIEWED',
    headlineQuality: payload.headlineQuality ? ratingScore[payload.headlineQuality] : 0,
    introductionQuality: payload.introductionQuality ? ratingScore[payload.introductionQuality] : 0,
    structureQuality: payload.structureQuality ? ratingScore[payload.structureQuality] : 0,
    conclusionQuality: payload.conclusionQuality ? ratingScore[payload.conclusionQuality] : 0,
    seoReadiness: reviewScore[payload.seoReadiness],
    thumbnailQuality: payload.thumbnailQuality ? ratingScore[payload.thumbnailQuality] : 0,
    copyrightConfirmed: payload.copyrightConfirmed,
    recommendation: payload.recommendation === 'APPROVE' ? 'READY_FOR_ADMIN' : payload.recommendation === 'RETURN' ? 'NEEDS_CORRECTION' : 'REJECT',
    internalNotes: payload.internalNotes,
    requiredCorrections: payload.requiredCorrections.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    finalChecklist: payload.finalChecklist ?? {},
  };
}

function normalizeEditorialBlog(blog: Blog): Blog {
  const raw = blog as Blog & { editorialReviews?: Array<Record<string, unknown>> };
  const review = (blog.editorialReview ?? raw.editorialReviews?.[0]) as Record<string, any> | undefined;
  if (!review) return normalizeBlog(blog);
  const rating = (score: unknown) => Number(score) >= 88 ? 'EXCELLENT' as const : Number(score) >= 63 ? 'GOOD' as const : Number(score) >= 38 ? 'FAIR' as const : 'POOR' as const;
  const checklist = (review.checklist ?? {}) as Record<string, any>;
  return normalizeBlog({
    ...blog,
    internalNotes: review.internalNotes ?? blog.internalNotes,
    plagiarismScore: review.plagiarismScore == null ? blog.plagiarismScore : Number(review.plagiarismScore),
    plagiarismReviewed: checklist.plagiarismReviewed ?? blog.plagiarismReviewed,
    factCheckComplete: review.factCheckStatus === 'PASSED' || checklist.factCheckComplete || blog.factCheckComplete,
    recommendation: review.recommendation === 'READY_FOR_ADMIN' ? 'APPROVE' : review.recommendation === 'NEEDS_CORRECTION' ? 'RETURN' : review.recommendation === 'REJECT' ? 'REJECT' : blog.recommendation,
    editorialChecklist: (review.checklist ?? blog.editorialChecklist) as Blog['editorialChecklist'],
    editorialReview: {
      grammarStatus: review.grammarStatus === 'NEEDS_CORRECTION' ? 'NEEDS_WORK' : review.grammarStatus ?? 'NOT_REVIEWED',
      readabilityScore: review.readabilityScore == null ? null : Number(review.readabilityScore),
      plagiarismScore: review.plagiarismScore == null ? null : Number(review.plagiarismScore),
      factCheckStatus: review.factCheckStatus === 'NOT_STARTED' ? 'NOT_REVIEWED' : review.factCheckStatus === 'NEEDS_CHANGES' || review.factCheckStatus === 'FAILED' ? 'NEEDS_WORK' : review.factCheckStatus ?? 'NOT_REVIEWED',
      sourceVerificationStatus: review.sourceVerificationStatus === 'VERIFIED' ? 'PASSED' : review.sourceVerificationStatus === 'NEEDS_CORRECTION' || review.sourceVerificationStatus === 'FAILED' ? 'NEEDS_WORK' : review.sourceVerificationStatus ?? 'NOT_REVIEWED',
      headlineQuality: review.headlineQuality == null ? '' : rating(review.headlineQuality),
      introductionQuality: review.introductionQuality == null ? '' : rating(review.introductionQuality),
      structureQuality: review.structureQuality == null ? '' : rating(review.structureQuality),
      conclusionQuality: review.conclusionQuality == null ? '' : rating(review.conclusionQuality),
      seoReadiness: review.seoReadiness == null ? 'NOT_REVIEWED' : Number(review.seoReadiness) >= 80 ? 'PASSED' : Number(review.seoReadiness) >= 40 ? 'IN_PROGRESS' : 'NEEDS_WORK',
      thumbnailQuality: review.thumbnailQuality == null ? '' : rating(review.thumbnailQuality),
      copyrightConfirmed: Boolean(review.copyrightConfirmed),
      requiredCorrections: Array.isArray(review.requiredCorrections) ? review.requiredCorrections.join('\n') : String(review.requiredCorrections ?? ''),
      recommendation: review.recommendation === 'READY_FOR_ADMIN' ? 'APPROVE' : review.recommendation === 'NEEDS_CORRECTION' ? 'RETURN' : review.recommendation === 'REJECT' ? 'REJECT' : '',
      contentQualityScore: review.contentQualityScore == null ? null : Number(review.contentQualityScore),
      internalNotes: review.internalNotes,
      finalChecklist: (review.checklist ?? {}) as Record<string, boolean>,
    },
  });
}

export function canEditorWorkOn(blog: Blog | null | undefined, user: AuthUser | null | undefined) {
  if (!blog || !user) return false;
  return ['EDITING', 'QUALITY_REVIEW', 'NEEDS_CORRECTION'].includes(normalizeBlogStatus(blog.status)) && (user.role === 'EDITOR' || user.role === 'ADMIN');
}

export function canManageEditorialBlog(user: AuthUser | null | undefined) {
  return user?.role === 'EDITOR' || user?.role === 'ADMIN';
}
