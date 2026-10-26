import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/components/blog/BlogCard';
import type { BlogComment } from '@/types/blog';
import type { AuthUser } from '@/types/auth';

interface CommentItemProps {
  comment: BlogComment;
  user: AuthUser | null;
  deleting?: boolean;
  onDelete?: (comment: BlogComment) => void;
}

export function CommentItem({ comment, user, deleting = false, onDelete }: CommentItemProps) {
  const commenter = comment.user ?? { id: '', name: 'Reader', avatarUrl: null };
  const canDelete = !!user && (!!commenter.id && user.id === commenter.id || user.role === 'ADMIN' || user.role === 'EDITOR');
  const avatar = commenter.avatarUrl;

  return (
    <article className="rounded-xl border border-[#ded3c4] bg-[#fffaf1] p-4">
      <div className="flex items-start gap-3">
        {avatar ? (
          <img src={avatar} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#53693a] font-serif font-semibold text-[#fffaf1]">
            {initials(commenter.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-[#231b17]">{commenter.name}</p>
              <p className="text-xs text-[#a19184]">{formatDate(comment.createdAt)}</p>
            </div>
            {canDelete && onDelete && (
              <Button type="button" size="sm" variant="ghost" disabled={deleting} onClick={() => onDelete(comment)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#5c4b3d]">{comment.content}</p>
        </div>
      </div>
    </article>
  );
}

function initials(name?: string) {
  return (name ?? 'TR').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
