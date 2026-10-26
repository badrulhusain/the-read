import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { normalizeBlogStatus } from '@/lib/blog-status';
import type { BlogStatus } from '@/types/blog';

const statusClasses: Record<BlogStatus, string> = {
  DRAFT: 'bg-[#eee6da] text-[#74685f]',
  EDITING: 'bg-[#efe3cd] text-[#8a5a3c]',
  QUALITY_REVIEW: 'bg-[#f1e6c9] text-[#8a5a3c]',
  NEEDS_CORRECTION: 'bg-[#ead6c7] text-[#7b2d32]',
  READY_FOR_ADMIN: 'bg-[#e3ead6] text-[#53693a]',
  SCHEDULED: 'bg-[#dce7ec] text-[#365b68]',
  REJECTED: 'bg-[#ead6d6] text-[#7b2d32]',
  PUBLISHED: 'bg-[#dde8d3] text-[#53693a]',
  UNPUBLISHED: 'bg-[#eee6da] text-[#74685f]',
  ARCHIVED: 'bg-[#231b17] text-[#fffaf1]',
};

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center rounded-full border border-black/5 px-2.5 py-1 text-xs font-semibold tracking-wide', className)} {...props} />;
}

export function StatusBadge({ status }: { status: BlogStatus | string }) {
  const normalized = normalizeBlogStatus(status);
  return <Badge className={statusClasses[normalized] ?? 'bg-[#eee6da] text-[#74685f]'}>{normalized.replaceAll('_', ' ')}</Badge>;
}
