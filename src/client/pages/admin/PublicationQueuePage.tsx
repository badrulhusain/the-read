import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import { apiMessage } from '@/lib/api';
import { adminService } from '@/services/admin.service';
import type { Blog } from '@/types/blog';

export default function PublicationQueuePage() {
  const [articles, setArticles] = useState<Blog[]>([]); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); adminService.publicationQueue({ page }).then((result) => { setArticles(result.items); setTotalPages(result.totalPages); }).catch((error) => toast.error(apiMessage(error, 'Could not load publication queue.'))).finally(() => setLoading(false)); }, [page]);
  return <div className="space-y-5 p-4 md:p-6"><header><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#a9793d]">Admin only</p><h1 className="font-serif text-3xl font-semibold">Publication queue</h1><p className="mt-1 text-sm text-[#74685f]">Final review, scheduling, and publishing decisions.</p></header>{loading ? <div className="h-52 animate-pulse rounded-2xl bg-[#fbf7ef]" /> : articles.length ? <div className="grid gap-3">{articles.map((article) => <Card key={article.id}><CardContent className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-serif text-xl font-semibold">{article.title}</h2><StatusBadge status={article.status} /></div><p className="mt-1 text-sm text-[#74685f]">Editor: {article.editor?.name ?? 'Unassigned'} · Contributor: {article.contributor?.name ?? article.author?.name ?? 'Unknown'}</p></div><Button asChild><Link to={`/admin/articles/${article.id}/approval`}><Eye className="h-4 w-4" /> Open approval</Link></Button></CardContent></Card>)}</div> : <Card><CardContent><p className="text-[#74685f]">No articles are waiting for admin approval.</p></CardContent></Card>}<Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>;
}
