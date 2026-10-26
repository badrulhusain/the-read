import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Eye, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import { apiMessage } from '@/lib/api';
import { editorialService } from '@/services/editorial.service';
import type { Blog } from '@/types/blog';

export default function MyWorkPage() {
  const [articles, setArticles] = useState<Blog[]>([]); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); editorialService.myWork({ page }).then((result) => { setArticles(result.items); setTotalPages(result.totalPages); }).catch((error) => toast.error(apiMessage(error, 'Could not load your articles.'))).finally(() => setLoading(false)); }, [page]);
  return <div className="space-y-5 p-4 md:p-6"><header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#a9793d]">Editorial desk</p><h1 className="font-serif text-3xl font-semibold">My work</h1></div><Button asChild><Link to="/editor/articles/new"><Plus className="h-4 w-4" /> New article</Link></Button></header>{loading ? <div className="h-52 animate-pulse rounded-2xl bg-[#fbf7ef]" /> : articles.length ? <div className="grid gap-3">{articles.map((article) => <Card key={article.id}><CardContent className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-serif text-xl font-semibold">{article.title || 'Untitled article'}</h2><StatusBadge status={article.status} /></div><p className="mt-1 text-sm text-[#74685f]">Updated {article.updatedAt ? new Date(article.updatedAt).toLocaleString() : 'recently'}</p></div><div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link to={`/editor/articles/${article.id}/review`}><Eye className="h-4 w-4" /> Review</Link></Button><Button asChild size="sm"><Link to={`/editor/articles/${article.id}/edit`}><Edit3 className="h-4 w-4" /> Edit</Link></Button></div></CardContent></Card>)}</div> : <Card><CardContent><p className="text-[#74685f]">No articles assigned to you yet.</p></CardContent></Card>}<Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>;
}
