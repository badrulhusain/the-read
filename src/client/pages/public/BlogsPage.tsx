import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { blogService, taxonomyService } from '@/services/blog.service';
import type { Blog, BlogCategory, BlogTag } from '@/types/blog';

export default function BlogsPage() {
  const [searchParams] = useSearchParams();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [debounced, setDebounced] = useState(searchParams.get('search') ?? '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') ?? '');
  const [tagId, setTagId] = useState(searchParams.get('tagId') ?? '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      taxonomyService.categories().catch(() => []),
      taxonomyService.tags().catch(() => []),
    ]).then(([nextCategories, nextTags]) => {
      setCategories(nextCategories);
      setTags(nextTags);
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebounced(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    blogService.listPublished({ page, limit: 10, search: debounced, ...(categoryId && { categoryId }), ...(tagId && { tagId }) })
      .then((result) => {
        if (!active) return;
        setBlogs(result.items);
        setTotalPages(result.totalPages);
      })
      .catch(() => active && setError('Could not load blogs. The backend may be offline.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [categoryId, debounced, page, tagId]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-24 md:px-8 md:pb-10">
      <div className="mb-7 flex flex-col gap-5">
        <div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#a9793d]">Magazine archive</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#231b17] md:text-5xl">Published blogs</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#74685f]">Browse essays, dispatches, and reflections from The Read community.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#a19184]" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search blogs..." />
          </div>
          <Select value={categoryId} onChange={(event) => { setPage(1); setCategoryId(event.target.value); }}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select value={tagId} onChange={(event) => { setPage(1); setTagId(event.target.value); }}>
            <option value="">All tags</option>
            {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </Select>
        </div>
      </div>
      {error && <Card className="mb-4"><CardContent className="text-[#7b2d32]">{error}</CardContent></Card>}
      {loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-white/60 bg-[#eef0e9] shadow-[inset_8px_8px_16px_rgba(97,85,68,0.12),inset_-8px_-8px_16px_rgba(255,255,250,0.82)]" />)}</div> : blogs.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{blogs.map((blog, index) => <BlogCard key={blog.id} blog={blog} featured={index === 0} />)}</div>
      ) : (
        <Card><CardContent className="text-[#74685f]">No published blogs match these filters.</CardContent></Card>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </main>
  );
}
