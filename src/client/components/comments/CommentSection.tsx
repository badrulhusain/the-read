import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { apiMessage } from '@/lib/api';
import { commentService } from '@/services/comment.service';
import { useAuth } from '@/store/authStore';
import type { BlogComment } from '@/types/blog';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';

interface CommentSectionProps {
  slug: string;
  initialCount?: number;
}

export function CommentSection({ slug, initialCount }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BlogComment | null>(null);
  const [deletingId, setDeletingId] = useState('');

  function load() {
    setLoading(true);
    setError('');
    commentService.getBlogComments(slug, { page, limit: 10 })
      .then((result) => {
        setComments(result.items);
        setTotalPages(result.totalPages);
      })
      .catch((loadError) => setError(apiMessage(loadError, 'Could not load comments.')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, slug]);

  async function deleteComment() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await commentService.deleteComment(deleteTarget.id);
      setComments((current) => current.filter((comment) => comment.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Comment removed.');
    } catch (deleteError) {
      toast.error(apiMessage(deleteError, 'Could not remove comment.'));
    } finally {
      setDeletingId('');
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a9793d]">Conversation</p>
          <h2 className="mt-1 flex items-center gap-2 font-serif text-3xl font-semibold text-[#231b17]">
            <MessageSquare className="h-6 w-6" /> Comments{typeof initialCount === 'number' ? ` (${initialCount})` : ''}
          </h2>
        </div>
        {error && (
          <Button type="button" size="sm" variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        )}
      </div>
      <div className="space-y-4">
        <CommentForm
          slug={slug}
          user={user}
          onCreated={(comment) => {
            setComments((current) => [comment, ...current]);
            setPage(1);
          }}
        />
        {error && <p className="rounded-xl border border-[#ded3c4] bg-[#fffaf1] p-4 text-sm font-medium text-[#8c2f2f]">{error}</p>}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl border border-[#ded3c4] bg-[#fbf7ef]" />)}</div>
        ) : (
          <CommentList comments={comments} user={user} deletingId={deletingId} onDelete={setDeleteTarget} />
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete comment"
        message="Remove this comment from the conversation?"
        confirmLabel={deletingId ? 'Deleting...' : 'Delete'}
        onConfirm={() => void deleteComment()}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
