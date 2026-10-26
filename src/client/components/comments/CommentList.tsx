import { CommentItem } from '@/components/comments/CommentItem';
import type { BlogComment } from '@/types/blog';
import type { AuthUser } from '@/types/auth';

interface CommentListProps {
  comments: BlogComment[];
  user: AuthUser | null;
  deletingId?: string;
  onDelete: (comment: BlogComment) => void;
}

export function CommentList({ comments, user, deletingId, onDelete }: CommentListProps) {
  const visibleComments = comments.filter((comment) => !['HIDDEN', 'DELETED'].includes(String(comment.status).toUpperCase()));

  if (!visibleComments.length) {
    return <p className="rounded-xl border border-[#ded3c4] bg-[#fffaf1] p-4 text-sm text-[#74685f]">No comments yet. Start the conversation.</p>;
  }

  return (
    <div className="space-y-3">
      {visibleComments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} user={user} deleting={deletingId === comment.id} onDelete={onDelete} />
      ))}
    </div>
  );
}
