import DOMPurify from 'dompurify';
import type { Blog, BlogCoverImage } from '@/types/blog';

export function sanitizeHtml(value = '') {
  if (!value) return '';
  return DOMPurify.sanitize(value);
}

export function stripHtml(value = '') {
  if (!value) return '';
  if (typeof window === 'undefined') return value.replace(/<[^>]+>/g, ' ');
  const element = window.document.createElement('div');
  element.innerHTML = value;
  return element.textContent || element.innerText || '';
}

export function wordCount(value = '') {
  return stripHtml(value).trim().split(/\s+/).filter(Boolean).length;
}

export function readingTime(value = '') {
  const minutes = Math.max(1, Math.ceil(wordCount(value) / 220));
  return `${minutes} min read`;
}

export function excerptFromContent(value = '', maxLength = 180) {
  const text = stripHtml(value).replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export function isValidOptionalUrl(value?: string | null) {
  if (!value?.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeTagName(tag: unknown) {
  if (typeof tag === 'string') return tag;
  return (tag as { name?: string })?.name ?? '';
}

export function normalizeCategoryName(category: unknown) {
  if (!category) return '';
  if (typeof category === 'string') return category;
  return (category as { name?: string })?.name ?? '';
}

export function coverImageUrl(blog: Pick<Blog, 'coverImage' | 'imageUrl'>) {
  if (blog.coverImage && typeof blog.coverImage === 'object') return blog.coverImage.url;
  return blog.coverImage || blog.imageUrl || '';
}

export function coverImageAlt(blog: Pick<Blog, 'coverImage' | 'altText' | 'coverImageAltText' | 'title'>) {
  if (blog.coverImage && typeof blog.coverImage === 'object') return blog.coverImage.altText || blog.title;
  return blog.altText || blog.coverImageAltText || blog.title;
}

export function toApiCoverImage(coverImage: BlogCoverImage | null) {
  if (!coverImage) return null;
  return {
    url: coverImage.url,
    publicId: coverImage.publicId,
    altText: coverImage.altText,
    crop: coverImage.crop,
  };
}
