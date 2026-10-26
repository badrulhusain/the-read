import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import { apiMessage } from '@/lib/api';
import { editorialService } from '@/services/editorial.service';
import type { Blog } from '@/types/blog';

export default function SubmittedBlogsPage() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState('');

  function load() {
    setLoading(true);
    editorialService.submissions({ page, limit: 10 })
      .then((result) => {
        setBlogs(result.items);
        setTotalPages(result.totalPages);
      })
      .catch((error) => toast.error(apiMessage(error, 'Could not load submissions.')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function pick(id: string) {
    setPicking(id);
    try {
      const blog = await editorialService.pick(id);
      toast.success('Blog picked for review.');
      navigate(`/editor/blogs/${blog.id ?? id}/review`);
    } catch (error) {
      toast.error(apiMessage(error, 'Already picked or not available.'));
    } finally {
      setPicking('');
    }
  }

  if (loading) return <p className="text-[#74685f]">Loading submissions...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Submitted blogs</h2>
      {blogs.length ? blogs.map((blog) => (
        <Card key={blog.id}>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{blog.title}</h3><StatusBadge status={blog.status} /></div><p className="mt-1 text-sm text-[#74685f]">{blog.author?.name ?? 'Unknown author'}</p></div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={picking === blog.id} onClick={() => void pick(blog.id)}>{picking === blog.id ? 'Picking...' : 'Pick for review'}</Button>
              <Button asChild size="sm" variant="outline"><Link to={`/editor/blogs/${blog.id}/review`}>Open</Link></Button>
            </div>
          </CardContent>
        </Card>
      )) : <Card><CardContent className="text-[#74685f]">No submitted blogs are waiting.</CardContent></Card>}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
