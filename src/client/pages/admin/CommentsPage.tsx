import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EyeOff, RefreshCw, RotateCcw, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { apiMessage } from '@/lib/api';
import { commentService } from '@/services/comment.service';
import type { BlogComment } from '@/types/blog';

type Action = 'hide' | 'restore' | 'delete';

const statuses = ['', 'VISIBLE', 'HIDDEN', 'PENDING', 'DELETED'];

export default function CommentsPage() {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState('');
  const [confirm, setConfirm] = useState<{ action: Action; comment: BlogComment } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebounced(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  function load() {
    setLoading(true);
    setError('');
    commentService.getAdminComments({ page, limit: 10, search: debounced, ...(status && { status }) })
      .then((result) => {
        setComments(result.items);
        setTotalPages(result.totalPages);
      })
      .catch((loadError) => setError(apiMessage(loadError, 'Could not load comments.')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [debounced, page, status]);

  async function runAction() {
    if (!confirm) return;
    const { action, comment } = confirm;
    setProcessingId(comment.id);
    try {
      if (action === 'hide') await commentService.hideComment(comment.id);
      if (action === 'restore') await commentService.restoreComment(comment.id);
      if (action === 'delete') await commentService.deleteComment(comment.id);
      toast.success(action === 'hide' ? 'Comment hidden.' : action === 'restore' ? 'Comment restored.' : 'Comment deleted.');
      setConfirm(null);
      load();
    } catch (actionError) {
      toast.error(apiMessage(actionError, 'Could not update comment.'));
    } finally {
      setProcessingId('');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9793d]">Admin desk</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold text-[#231b17]">Comments</h2>
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-[1fr_160px] md:max-w-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#a19184]" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search comments" />
          </div>
          <Select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
            {statuses.map((item) => <option key={item || 'all'} value={item}>{item ? item.toLowerCase() : 'All status'}</option>)}
          </Select>
        </div>
      </div>
      <Card>
        <CardContent>
          {error && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fff4f2] p-3 text-sm text-[#8c2f2f]">
              <span>{error}</span>
              <Button type="button" size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-[#eee6da]" />)}</div>
          ) : comments.length ? (
            <div className="space-y-3">
              {comments.map((comment) => {
                const normalizedStatus = String(comment.status).toUpperCase();
                return (
                  <article key={comment.id} className="rounded-xl border border-[#ded3c4] bg-[#f4efe6] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#231b17]">{comment.user?.name ?? 'Unknown user'}</p>
                          <span className="rounded-full bg-[#eee6da] px-2 py-0.5 text-xs font-semibold text-[#74685f]">{normalizedStatus.toLowerCase()}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#a19184]">{comment.blogTitle ?? comment.blogSlug ?? 'Blog'} · {new Date(comment.createdAt).toLocaleString()}</p>
                        <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#5c4b3d]">{comment.content}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {normalizedStatus !== 'HIDDEN' && <Button type="button" size="sm" variant="outline" disabled={processingId === comment.id} onClick={() => setConfirm({ action: 'hide', comment })}><EyeOff className="h-4 w-4" /> Hide</Button>}
                        {normalizedStatus === 'HIDDEN' && <Button type="button" size="sm" variant="outline" disabled={processingId === comment.id} onClick={() => setConfirm({ action: 'restore', comment })}><RotateCcw className="h-4 w-4" /> Restore</Button>}
                        <Button type="button" size="sm" variant="destructive" disabled={processingId === comment.id} onClick={() => setConfirm({ action: 'delete', comment })}><Trash2 className="h-4 w-4" /> Delete</Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-[#74685f]">No comments match these filters.</p>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmDialog
        open={!!confirm}
        title={confirmTitle(confirm?.action)}
        message={confirmMessage(confirm)}
        confirmLabel={processingId ? 'Working...' : confirmActionLabel(confirm?.action)}
        onConfirm={() => void runAction()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function confirmTitle(action?: Action) {
  if (action === 'hide') return 'Hide comment';
  if (action === 'restore') return 'Restore comment';
  return 'Delete comment';
}

function confirmActionLabel(action?: Action) {
  if (action === 'hide') return 'Hide';
  if (action === 'restore') return 'Restore';
  return 'Delete';
}

function confirmMessage(confirm?: { action: Action; comment: BlogComment } | null) {
  if (!confirm) return '';
  if (confirm.action === 'hide') return 'Hide this comment from the public blog page?';
  if (confirm.action === 'restore') return 'Restore this comment to the public blog page?';
  return 'Delete this comment? This may be permanent depending on backend behavior.';
}
