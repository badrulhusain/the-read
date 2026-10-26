import type { AuthUser } from './auth';

export type BlogStatus =
  | 'DRAFT'
  | 'EDITING'
  | 'QUALITY_REVIEW'
  | 'NEEDS_CORRECTION'
  | 'READY_FOR_ADMIN'
  | 'SCHEDULED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'ARCHIVED';

export type EditorialRecommendation = 'APPROVE' | 'RETURN' | 'REJECT';
export type ReviewStatus = 'NOT_REVIEWED' | 'IN_PROGRESS' | 'PASSED' | 'NEEDS_WORK';
export type QualityRating = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
export type ContentType = 'ARTICLE' | 'OPINION' | 'INTERVIEW' | 'FEATURE' | 'NEWS' | 'GUIDE';
export type ReactionType = 'INSIGHTFUL' | 'INSPIRING' | 'THOUGHT_PROVOKING';

export interface Contributor {
  id: string;
  name: string;
  slug?: string;
  email?: string;
  avatarUrl?: string | null;
  biography?: string;
  expertise?: string[];
  articleCount?: number;
}

export interface ArticleSeries {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string | null;
  articleCount?: number;
  articles?: Blog[];
}

export interface SourceReference { id?: string; title: string; url?: string; publisher?: string }
export interface CorrectionEntry { id?: string; note: string; correctedAt: string }
export interface EditorialChecklist {
  structure: boolean;
  style: boolean;
  sources: boolean;
  rights: boolean;
  seo: boolean;
}

export interface EditorialEvaluation {
  grammarStatus: ReviewStatus;
  readabilityScore: number | null;
  plagiarismScore: number | null;
  factCheckStatus: ReviewStatus;
  sourceVerificationStatus: ReviewStatus;
  headlineQuality: QualityRating | '';
  introductionQuality: QualityRating | '';
  structureQuality: QualityRating | '';
  conclusionQuality: QualityRating | '';
  seoReadiness: ReviewStatus;
  thumbnailQuality: QualityRating | '';
  copyrightConfirmed: boolean;
  requiredCorrections: string;
  recommendation: EditorialRecommendation | '';
  contentQualityScore: number | null;
  internalNotes?: string;
  finalChecklist?: Record<string, boolean>;
}

export interface ReviewComment {
  id: string;
  comment: string;
  createdAt: string;
  editor?: Pick<AuthUser, 'id' | 'name' | 'email'>;
  type?: 'REJECT' | 'REVISION' | 'APPROVAL' | string;
}

export interface BlogAuthor {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface Blog {
  id: string;
  slug?: string;
  title: string;
  excerpt?: string;
  subtitle?: string;
  content?: string;
  coverImage?: string | BlogCoverImage | null;
  coverImagePublicId?: string | null;
  imageUrl?: string | null;
  altText?: string | null;
  coverImageAltText?: string | null;
  crop?: BlogImageCrop | null;
  coverImageCrop?: BlogImageCrop | null;
  seoTitle?: string;
  seoDescription?: string;
  contentType?: ContentType;
  contributorName?: string;
  contributorBiography?: string;
  suggestedPublicationDate?: string | null;
  wordCount?: number;
  readingTimeMinutes?: number;
  category?: BlogCategory | string | null;
  categoryId?: string | null;
  tags?: Array<BlogTag | string>;
  commentsCount?: number;
  status: BlogStatus;
  author?: BlogAuthor;
  contributor?: Contributor | null;
  contributorId?: string | null;
  series?: ArticleSeries | null;
  seriesId?: string | null;
  isEditorsPick?: boolean;
  trendingScore?: number;
  reactionCounts?: Partial<Record<ReactionType, number>>;
  isSaved?: boolean;
  sources?: SourceReference[];
  factChecker?: Pick<AuthUser, 'id' | 'name'> | null;
  factCheckedAt?: string | null;
  corrections?: CorrectionEntry[];
  relatedArticles?: Blog[];
  scheduledAt?: string | null;
  internalNotes?: string;
  plagiarismScore?: number | null;
  plagiarismReviewed?: boolean;
  factCheckComplete?: boolean;
  editorialChecklist?: EditorialChecklist;
  recommendation?: EditorialRecommendation | null;
  editor?: Pick<AuthUser, 'id' | 'name' | 'email'> | null;
  editorId?: string | null;
  assignedEditorId?: string | null;
  reviewerId?: string | null;
  assignedToId?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  reviewComments?: ReviewComment[];
  editorialReview?: EditorialEvaluation | null;
}

export interface BlogImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface BlogCoverImage {
  url: string;
  publicId?: string | null;
  altText?: string | null;
  crop?: BlogImageCrop | null;
}

export interface BlogFormPayload {
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: BlogCoverImage | null;
  seoTitle?: string;
  seoDescription?: string;
  categoryId?: string | null;
  tags?: string[];
  tagIds?: string[];
  contributorName?: string;
  contributorBiography?: string;
  contentType?: ContentType;
  seriesId?: string | null;
  suggestedPublicationDate?: string | null;
  internalNotes?: string;
  sources?: SourceReference[];
}

export interface BlogStats {
  totalSubmitted?: number;
  draftCount?: number;
  drafts?: number;
  submittedCount?: number;
  submitted?: number;
  underReviewCount?: number;
  underReview?: number;
  revisionRequestedCount?: number;
  revisionRequested?: number;
  approvedCount?: number;
  publishedCount?: number;
  published?: number;
  rejectedCount?: number;
  rejected?: number;
  submittedBlogs?: number;
  submittedQueue?: number;
  underReviewByMe?: number;
  assignedToMe?: number;
  approved?: number;
  approvedByMe?: number;
  rejectedByMe?: number;
  revisionRequestedByMe?: number;
  rejectedOrRevisionRequested?: number;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  blogCount?: number;
  blogsCount?: number;
  count?: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
  usageCount?: number;
  blogCount?: number;
  blogsCount?: number;
  count?: number;
}

export interface DashboardSummary {
  stats?: BlogStats & Record<string, number | undefined>;
  recentBlogs?: Blog[];
  recentItems?: Blog[];
  items?: Blog[];
  blogs?: Blog[];
}

export type UploadImageType = 'BLOG_COVER' | 'PROFILE_IMAGE';

export interface UploadImageResponse {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export type CommentStatus = 'VISIBLE' | 'HIDDEN' | 'DELETED' | 'PENDING' | string;

export interface BlogComment {
  id: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt?: string;
  blogId?: string;
  blogTitle?: string;
  blogSlug?: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}
