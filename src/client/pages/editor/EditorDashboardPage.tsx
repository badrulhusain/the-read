import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { showApiError } from '@/lib/api';
import { editorialService } from '@/services/editorial.service';
import type { Blog, BlogStats } from '@/types/blog';

export default function EditorDashboardPage() {
  const [stats, setStats] = useState<BlogStats>({});
  const [activeReviews, setActiveReviews] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadDashboard() {
    setLoading(true);
    setError('');
    editorialService.dashboard()
      .then((summary) => {
        setStats(summary.stats);
        setActiveReviews(summary.recentItems);
      })
      .catch((err) => {
        setError('Could not load the editorial dashboard summary.');
        showApiError(err, 'Could not load the editorial dashboard summary.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadDashboard, []);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9793d]">Editor's desk</p>
          <h2 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-[#231b17]">Editor dashboard</h2>
        </div>
        <Button asChild><Link to="/editor/submissions">Review queue</Link></Button>
      </div>
      {error && <RetryMessage message={error} onRetry={loadDashboard} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Submitted queue" value={count(stats.submittedQueue, stats.submittedBlogs, stats.submitted)} loading={loading} />
        <Stat label="Assigned to me" value={count(stats.assignedToMe, stats.underReviewByMe)} loading={loading} />
        <Stat label="Approved by me" value={count(stats.approvedByMe, stats.approved)} loading={loading} />
        <Stat label="Rejected by me" value={count(stats.rejectedByMe)} loading={loading} />
        <Stat label="Revision requested by me" value={count(stats.revisionRequestedByMe, stats.rejectedOrRevisionRequested)} loading={loading} />
      </div>
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-[#231b17]">My under-review blogs</h3>
              <p className="text-sm text-[#74685f]">Continue editing, reviewing, and making decisions on picked blogs.</p>
            </div>
            <Button asChild variant="outline"><Link to="/editor/submissions">Pick another</Link></Button>
          </div>
          {loading ? (
            <SkeletonRows />
          ) : activeReviews.length ? (
            <div className="space-y-3">
              {activeReviews.map((blog) => (
                <div key={blog.id} className="flex flex-col gap-3 rounded-2xl border border-[#ded3c4] bg-[#f4efe6] p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="line-clamp-1 font-serif text-lg font-semibold text-[#231b17]">{blog.title}</h4>
                      <StatusBadge status={blog.status} />
                    </div>
                    <p className="mt-1 text-sm text-[#74685f]">By {blog.author?.name ?? 'Unknown author'}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button asChild size="sm"><Link to={`/editor/blogs/${blog.id}/review`}>Open review</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link to={`/editor/blogs/${blog.id}/edit`}>Edit</Link></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#eee6da] p-4 text-sm text-[#74685f]">
              No recent editorial items found. Use the review queue to pick a submitted blog.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function count(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === 'number') ?? 0;
}

function Stat({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return <Card><CardContent>{loading ? <div className="h-10 w-16 animate-pulse rounded bg-[#eee6da]" /> : <div className="font-serif text-4xl font-semibold text-[#7b2d32]">{value}</div>}<div className="mt-1 text-sm font-medium text-[#74685f]">{label}</div></CardContent></Card>;
}

function SkeletonRows() {
  return <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl border border-[#ded3c4] bg-[#f4efe6]" />)}</div>;
}

function RetryMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 text-[#74685f]"><span>{message}</span><Button variant="outline" onClick={onRetry}>Retry</Button></CardContent></Card>;
}
