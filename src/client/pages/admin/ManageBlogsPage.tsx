import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Archive, CalendarClock, CheckCircle, Eye, Pencil, RotateCcw, Send, Trash2, Undo2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiMessage } from '@/lib/api';
import { adminService } from '@/services/admin.service';
import type { Blog, BlogStatus } from '@/types/blog';

const statuses: Array<'' | BlogStatus> = ['', 'DRAFT', 'EDITING', 'QUALITY_REVIEW', 'NEEDS_CORRECTION', 'READY_FOR_ADMIN', 'SCHEDULED', 'REJECTED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'];

export default function ManageBlogsPage() {
  const [searchParams] = useSearchParams();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebounced(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  function load() {
    adminService.blogs({ page, limit: 10, search: debounced, ...(status && { status }) }).then((result) => {
      setBlogs(result.items);
      setTotalPages(result.totalPages);
    }).catch(() => {});
  }

  useEffect(load, [debounced, page, status]);

  async function publish(blog: Blog) {
    if (!canPublishStatus(blog.status)) return toast.error('Only submitted, approved, or unpublished blogs can be published.');
    if (processing.has(blog.id)) return;
    setProcessing((prev) => new Set(prev).add(blog.id));
    try {
      await adminService.publishBlog(blog.id);
      toast.success('Blog published.');
      load();
    } catch (error) {
      toast.error(apiMessage(error, 'Could not publish blog.'));
    } finally {
      setProcessing((prev) => { const next = new Set(prev); next.delete(blog.id); return next; });
    }
  }

  async function unpublish(blog: Blog) {
    if (blog.status !== 'PUBLISHED') return toast.error('Only published blogs can be unpublished.');
    if (processing.has(blog.id)) return;
    setProcessing((prev) => new Set(prev).add(blog.id));
    try {
      await adminService.unpublishBlog(blog.id);
      toast.success('Blog unpublished.');
      load();
    } catch (error) {
      toast.error(apiMessage(error, 'Could not unpublish blog.'));
    } finally {
      setProcessing((prev) => { const next = new Set(prev); next.delete(blog.id); return next; });
    }
  }

  async function deleteBlog() {
    if (!deleteTarget || processing.has(deleteTarget.id)) return;
    const target = deleteTarget;
    setProcessing((prev) => new Set(prev).add(target.id));
    try {
      await adminService.deleteBlog(target.id);
      toast.success('Blog deleted.');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(apiMessage(error, 'Could not delete blog.'));
    } finally {
      setProcessing((prev) => { const next = new Set(prev); next.delete(target.id); return next; });
    }
  }

  async function workflow(blog: Blog, action: 'approve' | 'schedule' | 'return' | 'reject' | 'archive') {
    if (processing.has(blog.id)) return;
    let note = '';
    let scheduledAt = '';
    if (action === 'return' || action === 'reject') { note = window.prompt(`Reason to ${action} this article:`) ?? ''; if (note.trim().length < 10) return toast.error('Please provide at least 10 characters.'); }
    if (action === 'schedule') { scheduledAt = window.prompt('Publication date and time (ISO or local date-time):') ?? ''; if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt))) return toast.error('Enter a valid publication date.'); }
    setProcessing((prev) => new Set(prev).add(blog.id));
    try {
      if (action === 'approve') await adminService.approveBlog(blog.id);
      if (action === 'schedule') await adminService.scheduleBlog(blog.id, new Date(scheduledAt).toISOString());
      if (action === 'return') await adminService.returnToEditor(blog.id, note);
      if (action === 'reject') await adminService.rejectBlog(blog.id, note);
      if (action === 'archive') await adminService.archiveBlog(blog.id);
      toast.success(`Article ${action === 'return' ? 'returned to editor' : `${action}d`}.`); load();
    } catch (error) { toast.error(apiMessage(error, 'Could not update the publication workflow.')); }
    finally { setProcessing((prev) => { const next = new Set(prev); next.delete(blog.id); return next; }); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#a9793d]">Admin only</p><h2 className="font-serif text-3xl font-semibold">Publication queue</h2></div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search blogs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((item) => <option key={item || 'all'} value={item}>{item ? item.replaceAll('_', ' ') : 'All statuses'}</option>)}
          </Select>
        </div>
      </div>
      <Card>
        <CardContent>
          {blogs.length ? (
            <Table>
              <thead><tr className="border-b text-[#74685f]"><th className="py-2">Title</th><th>Author</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{blogs.map((blog) => (
                <tr key={blog.id} className="border-b last:border-0">
                  <td className="max-w-[280px] py-3 font-medium"><span className="line-clamp-1">{blog.title}</span></td>
                  <td>{blog.author?.name ?? 'Unknown'}</td>
                  <td><StatusBadge status={blog.status} /></td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline"><Link to={`/editor/blogs/${blog.id}/review`}><Eye className="h-4 w-4" /> View</Link></Button>
                      <Button asChild size="sm" variant="outline"><Link to={`/editor/blogs/${blog.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
                      {blog.status === 'READY_FOR_ADMIN' && <Button size="sm" variant="outline" disabled={processing.has(blog.id)} onClick={() => void workflow(blog, 'approve')}><CheckCircle className="h-4 w-4" /> Final approval</Button>}
                      {blog.status === 'READY_FOR_ADMIN' && <Button size="sm" variant="outline" disabled={processing.has(blog.id)} onClick={() => void workflow(blog, 'schedule')}><CalendarClock className="h-4 w-4" /> Schedule</Button>}
                      {blog.status === 'PUBLISHED' ? (
                        <Button size="sm" variant="outline" disabled={processing.has(blog.id)} onClick={() => void unpublish(blog)}><Undo2 className="h-4 w-4" /> Unpublish</Button>
                      ) : blog.status === 'UNPUBLISHED' ? (
                        <Button size="sm" disabled={processing.has(blog.id)} onClick={() => void publish(blog)}><Send className="h-4 w-4" /> Republish</Button>
                      ) : (
                        <Button size="sm" disabled={!canPublishStatus(blog.status) || processing.has(blog.id)} onClick={() => void publish(blog)}><Send className="h-4 w-4" /> Publish</Button>
                      )}
                      {['READY_FOR_ADMIN', 'REJECTED'].includes(blog.status) && <Button size="sm" variant="outline" disabled={processing.has(blog.id)} onClick={() => void workflow(blog, 'return')}><RotateCcw className="h-4 w-4" /> Return to editor</Button>}
                      {!['PUBLISHED', 'ARCHIVED'].includes(blog.status) && <Button size="sm" variant="outline" disabled={processing.has(blog.id)} onClick={() => void workflow(blog, 'reject')}><XCircle className="h-4 w-4" /> Reject</Button>}
                      {blog.status !== 'ARCHIVED' && <Button size="sm" variant="outline" disabled={processing.has(blog.id)} onClick={() => void workflow(blog, 'archive')}><Archive className="h-4 w-4" /> Archive</Button>}
                      <Button size="sm" variant="destructive" disabled={processing.has(blog.id)} onClick={() => setDeleteTarget(blog)}><Trash2 className="h-4 w-4" /> Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </Table>
          ) : <p className="text-[#74685f]">No blogs found.</p>}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete blog"
        message={`Delete "${deleteTarget?.title ?? 'this blog'}"? This cannot be undone.`}
        confirmLabel={deleteTarget && processing.has(deleteTarget.id) ? 'Deleting...' : 'Delete'}
        onConfirm={() => void deleteBlog()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function canPublishStatus(status: BlogStatus) {
  return status === 'READY_FOR_ADMIN' || status === 'UNPUBLISHED';
}
