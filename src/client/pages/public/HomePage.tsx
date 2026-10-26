import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/components/blog/BlogCard';
import { excerptFromContent, readingTime } from '@/lib/blog-content';
import { blogService, taxonomyService } from '@/services/blog.service';
import { useAuth } from '@/store/authStore';
import type { ArticleSeries, Blog, BlogCategory, Contributor } from '@/types/blog';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [trending, setTrending] = useState<Blog[]>([]);
  const [series, setSeries] = useState<ArticleSeries[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogService.listPublished({ page: 1, limit: 6 })
      .then((result) => setBlogs(result.items))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
    taxonomyService.categories().then(setCategories).catch(() => setCategories([]));
    blogService.trending().then(setTrending).catch(() => setTrending([]));
    blogService.series().then(setSeries).catch(() => setSeries([]));
    blogService.contributors().then(setContributors).catch(() => setContributors([]));
  }, []);

  useEffect(() => {
    if (!search.trim()) return;
    const timer = window.setTimeout(() => {
      navigate(`/blogs?search=${encodeURIComponent(search.trim())}`);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [navigate, search]);

  const featured = blogs[0];
  const latest = useMemo(() => blogs.slice(1, 6), [blogs]);
  const secondary = secondaryCta(user?.role);

  return (
    <main className="pb-24 md:pb-0">
      <section className="border-b border-white/40 bg-[#eef0e9] shadow-[inset_0_-10px_22px_rgba(97,85,68,0.07)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9793d]">The Read</p>
              <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight text-[#231b17] md:text-5xl">Start reading</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74685f]">Freshly published stories, essays, and reflections from The Read community.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild><Link to="/blogs">Start reading</Link></Button>
              <Button asChild variant="outline"><Link to={secondary.to}>{secondary.label}</Link></Button>
            </div>
          </div>
          <div className="flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#a19184]" />
              <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search blogs..." />
            </div>
          </div>
        </div>
      </section>
      <section id="latest-blogs" className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9793d]">Newest first</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-[#231b17]">Start with the latest</h2>
          </div>
          <Button asChild variant="ghost"><Link to="/blogs">View all</Link></Button>
        </div>
        {loading ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]"><div className="h-[420px] animate-pulse rounded-2xl border border-white/60 bg-[#eef0e9] shadow-[inset_8px_8px_16px_rgba(97,85,68,0.12),inset_-8px_-8px_16px_rgba(255,255,250,0.82)]" /><div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-white/60 bg-[#eef0e9] shadow-[inset_6px_6px_12px_rgba(97,85,68,0.1),inset_-6px_-6px_12px_rgba(255,255,250,0.82)]" />)}</div></div>
        ) : featured ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
            <LatestBlog blog={featured} />
            <div className="space-y-3">
              <h3 className="font-serif text-2xl font-semibold text-[#231b17]">More to read</h3>
              {latest.length ? latest.map((blog) => <BlogListItem key={blog.id} blog={blog} />) : <p className="rounded-2xl border border-white/60 bg-[#eef0e9] p-4 text-sm text-[#74685f] shadow-[inset_5px_5px_10px_rgba(97,85,68,0.1),inset_-5px_-5px_10px_rgba(255,255,250,0.8)]">No more blogs yet.</p>}
            </div>
          </div>
        ) : (
          <Card><CardContent className="space-y-3 text-[#74685f]"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> No published blogs yet.</div><p>Once editors approve and admins publish articles, they will appear here.</p><Button asChild><Link to="/blogs">Browse blogs</Link></Button></CardContent></Card>
        )}
      </section>
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
          <h2 className="mb-3 font-serif text-2xl font-semibold text-[#231b17]">Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => <Link key={category.id} to={`/blogs?categoryId=${category.id}`} className="shrink-0 rounded-full border border-white/60 bg-[#eef0e9] px-4 py-2 text-sm font-semibold text-[#7b2d32] shadow-[5px_5px_12px_rgba(97,85,68,0.14),-4px_-4px_10px_rgba(255,255,250,0.8)] hover:bg-[#f5f6f1]">{category.name}</Link>)}
          </div>
        </section>
      )}
      {trending.length > 0 && <PublicationSection eyebrow="Popular now" title="Trending articles"><div className="grid gap-4 md:grid-cols-3">{trending.slice(0, 3).map((blog, index) => <div key={blog.id} className="flex gap-4 rounded-2xl border border-white/60 p-4 shadow-[7px_7px_16px_rgba(97,85,68,.13)]"><span className="font-serif text-4xl text-[#a9793d]">{index + 1}</span><BlogListItem blog={blog} /></div>)}</div></PublicationSection>}
      {series.length > 0 && <PublicationSection eyebrow="Read deeper" title="Article series"><div className="grid gap-4 md:grid-cols-3">{series.slice(0, 3).map((item) => <Link key={item.id} to={`/series/${item.slug}`} className="rounded-2xl border border-white/60 p-5 shadow-[8px_8px_18px_rgba(97,85,68,.14)]"><p className="font-serif text-2xl font-semibold">{item.name}</p><p className="mt-2 line-clamp-3 text-sm leading-6 text-[#74685f]">{item.description}</p></Link>)}</div></PublicationSection>}
      {contributors.length > 0 && <PublicationSection eyebrow="Our voices" title="Contributors"><div className="flex gap-4 overflow-x-auto pb-3">{contributors.slice(0, 8).map((person) => <Link key={person.id} to={`/contributors/${person.slug ?? person.id}`} className="min-w-52 rounded-2xl border border-white/60 p-4 text-center shadow-[7px_7px_16px_rgba(97,85,68,.13)]">{person.avatarUrl ? <img src={person.avatarUrl} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" /> : <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#53693a] font-serif text-xl text-white">{person.name[0]}</span>}<p className="mt-3 font-serif text-xl font-semibold">{person.name}</p></Link>)}</div></PublicationSection>}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8"><div className="rounded-3xl bg-[#53693a] p-7 text-[#fffaf1] md:flex md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.24em] text-[#e8c98e]">The weekly edit</p><h2 className="mt-2 font-serif text-3xl font-semibold">The best of The Read, in your inbox.</h2></div><form className="mt-5 flex max-w-md gap-2 md:mt-0" onSubmit={(e) => { e.preventDefault(); void blogService.newsletter(newsletterEmail).then(() => setNewsletterEmail('')); }}><Input required type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="you@example.com" /><Button type="submit">Subscribe</Button></form></div></section>
    </main>
  );
}

function PublicationSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <section className="mx-auto max-w-7xl px-4 pb-12 md:px-8"><p className="text-xs font-semibold uppercase tracking-[.24em] text-[#a9793d]">{eyebrow}</p><h2 className="mb-5 mt-1 font-serif text-3xl font-semibold">{title}</h2>{children}</section>; }

function secondaryCta(role?: string) {
  if (role === 'EDITOR' || role === 'ADMIN') return { to: '/editor/submissions', label: 'Open editor desk' };
  if (role === 'USER') return { to: '/profile', label: 'View your profile' };
  return { to: '/register', label: 'Join The Read' };
}

function LatestBlog({ blog }: { blog: Blog }) {
  const target = blog.slug ? `/blogs/${blog.slug}` : `/blogs`;
  const excerpt = blog.excerpt || excerptFromContent(blog.content ?? '', 240);
  return (
    <article className="overflow-hidden rounded-2xl border border-white/60 bg-[#eef0e9] shadow-[15px_15px_32px_rgba(97,85,68,0.18),-10px_-10px_24px_rgba(255,255,250,0.86)]">
      <BlogCoverImage blog={blog} eager className="aspect-[16/8] w-full" />
      <div className="space-y-4 p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#a19184]">
          <span>{blog.author?.name ?? 'The Read'}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(blog.publishedAt ?? blog.createdAt)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readingTime(blog.content ?? blog.excerpt ?? '')}</span>
        </div>
        <Link to={target} className="block font-serif text-4xl font-semibold leading-tight tracking-tight text-[#231b17] hover:text-[#7b2d32] md:text-5xl">{blog.title}</Link>
        {excerpt && <p className="max-w-3xl text-base leading-7 text-[#5c4b3d]">{excerpt}</p>}
        <Button asChild><Link to={target}>Read latest</Link></Button>
      </div>
    </article>
  );
}

function BlogListItem({ blog }: { blog: Blog }) {
  const target = blog.slug ? `/blogs/${blog.slug}` : `/blogs`;
  const excerpt = blog.excerpt || excerptFromContent(blog.content ?? '', 120);
  return (
    <article className="rounded-2xl border border-white/60 bg-[#eef0e9] p-4 shadow-[8px_8px_18px_rgba(97,85,68,0.14),-6px_-6px_14px_rgba(255,255,250,0.82)] transition hover:-translate-y-0.5 hover:bg-[#f5f6f1] hover:shadow-[11px_11px_24px_rgba(97,85,68,0.16),-7px_-7px_16px_rgba(255,255,250,0.88)]">
      <div className="flex items-start gap-3">
        <BlogCoverImage blog={blog} className="h-20 w-24 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <Link to={target} className="line-clamp-2 font-serif text-xl font-semibold leading-tight text-[#231b17] hover:text-[#7b2d32]">{blog.title}</Link>
          {excerpt && <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#74685f]">{excerpt}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-[#a19184]">
            <span>{formatDate(blog.publishedAt ?? blog.createdAt)}</span>
            <span>{readingTime(blog.content ?? blog.excerpt ?? '')}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
