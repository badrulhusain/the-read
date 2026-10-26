import { useEffect, useState } from 'react';
import { Bookmark, History } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import { Card, CardContent } from '@/components/ui/card';
import { blogService } from '@/services/blog.service';
import type { Blog } from '@/types/blog';

export default function ReaderLibraryPage({ mode }: { mode: 'saved' | 'history' }) {
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (mode === 'saved' ? blogService.saved() : blogService.history()).then(setItems).catch(() => setItems([])).finally(() => setLoading(false)); }, [mode]);
  const Icon = mode === 'saved' ? Bookmark : History;
  return <main className="mx-auto max-w-7xl px-4 py-10 pb-28 md:px-8"><header className="mb-7"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-[#a9793d]"><Icon className="h-4 w-4" /> Reader library</p><h1 className="mt-2 font-serif text-4xl font-semibold">{mode === 'saved' ? 'Saved articles' : 'Reading history'}</h1></header>{loading ? <p>Loading…</p> : items.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((blog) => <BlogCard key={blog.id} blog={blog} />)}</div> : <Card><CardContent className="text-[#74685f]">{mode === 'saved' ? 'Articles you save will appear here.' : 'Articles you read will appear here.'}</CardContent></Card>}</main>;
}
